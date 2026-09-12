import { ProcessState } from './types.js';

/**
 * Deadlock Recovery Engine
 * Analyzes deadlocked processes, computes termination costs,
 * recommends the optimal victim, and executes true state recovery.
 */
export class RecoveryManager {
  /**
   * Evaluates victim candidates among the deadlocked jobs
   * 
   * @param {Array<string>} involvedJobIds - Array of job IDs in the deadlock cycle
   * @param {Object} jobs - Map of jobId -> Job
   * @param {Object} resourceTypes - Map of type -> ResourceType
   * @returns {Array} Array of candidate analysis objects sorted by recommendation rank
   */
  analyzeRecoveryOptions(involvedJobIds, jobs, resourceTypes) {
    if (!involvedJobIds || involvedJobIds.length === 0) return [];

    const candidates = involvedJobIds.map((jobId) => {
      const job = jobs[jobId];
      if (!job) return null;

      // Sunk execution time
      const sunkTime = job.totalExecutionTime || 0;
      
      // Held resources
      const heldResources = [];
      Object.entries(job.currentAllocations || {}).forEach(([rt, count]) => {
        if (count > 0) {
          heldResources.push({ resourceType: rt, count, instanceId: job.assignedInstanceId });
        }
      });

      // Which other jobs in the waiting queue would be unblocked?
      const unblockedJobs = [];
      heldResources.forEach((held) => {
        const q = resourceTypes[held.resourceType]?.waitingQueue || [];
        q.forEach((waitingId) => {
          if (waitingId !== jobId && !unblockedJobs.includes(waitingId)) {
            unblockedJobs.push(waitingId);
          }
        });
      });

      // Cost calculation: Higher numerical priority = lower importance (P1 is critical, P4 is low)
      // Cost formula: Priority penalty (P1=100, P2=50, P3=20, P4=10) + Sunk time * 5
      const priorityWeights = { 1: 100, 2: 50, 3: 25, 4: 10, 5: 5 };
      const terminationCost = (priorityWeights[job.priority] || 25) + sunkTime * 5;

      return {
        jobId: job.id,
        jobName: job.name,
        priority: job.priority,
        sunkExecutionTime: sunkTime,
        heldResources,
        unblockedJobs,
        terminationCost,
        recommendationScore: 1000 - terminationCost + unblockedJobs.length * 50,
      };
    }).filter(Boolean);

    // Sort by recommendation score descending (highest score = best victim to terminate)
    candidates.sort((a, b) => b.recommendationScore - a.recommendationScore);

    return candidates;
  }

  /**
   * Executes Deadlock Recovery by terminating the selected victim job
   * Reclaims all held resources, signals semaphores, and unblocks waiting processes.
   * 
   * @param {string} victimJobId - The process selected to be terminated
   * @param {Object} jobs - Current jobs map
   * @param {Object} resourceManager - ResourceManager instance
   * @param {number} timestamp - Current simulation time
   * @returns {Object} Structured recovery report
   */
  executeRecovery(victimJobId, jobs, resourceManager, timestamp = 0) {
    const victim = jobs[victimJobId];
    if (!victim) {
      throw new Error(`Victim job ${victimJobId} not found!`);
    }

    const releasedResources = [];
    const unblockedJobs = [];

    // 1. Release all physical machine instances held by the victim
    Object.entries(victim.currentAllocations || {}).forEach(([resType, count]) => {
      if (count > 0) {
        // Release from resource manager
        const machineId = victim.assignedInstanceId;
        const releaseResult = resourceManager.release(resType, victimJobId, machineId, timestamp);
        
        releasedResources.push({
          resourceType: resType,
          machineId,
          count,
        });

        if (releaseResult.unblockedJobId) {
          unblockedJobs.push({
            jobId: releaseResult.unblockedJobId,
            resourceType: resType,
          });
        }
      }
    });

    // 2. Remove victim from any waiting semaphore queues
    Object.values(resourceManager.semaphores).forEach((sem) => {
      const qIdx = sem.waitingQueue.indexOf(victimJobId);
      if (qIdx !== -1) {
        sem.waitingQueue.splice(qIdx, 1);
      }
    });

    // 3. Update victim process PCB
    const prevAllocations = { ...victim.currentAllocations };
    victim.state = ProcessState.TERMINATED;
    victim.assignedInstanceId = null;
    victim.waitingForResourceType = null;
    victim.currentAllocations = {
      CNC: 0,
      WELDING: 0,
      ASSEMBLY: 0,
      PAINTING: 0,
      PACKAGING: 0,
    };

    victim.history.push({
      time: timestamp,
      state: ProcessState.TERMINATED,
      description: `Process terminated by Deadlock Recovery Manager to break circular wait. Released resources: ${releasedResources.map((r) => r.resourceType).join(', ')}.`,
    });

    // 4. Update unblocked processes to READY
    unblockedJobs.forEach(({ jobId, resourceType }) => {
      const j = jobs[jobId];
      if (j && j.state === ProcessState.WAITING) {
        j.state = ProcessState.READY;
        j.waitingForResourceType = null;
        j.history.push({
          time: timestamp,
          state: ProcessState.READY,
          description: `Unblocked from ${resourceType} waiting queue following victim termination of ${victimJobId}. Moved to READY queue for scheduling.`,
        });
      }
    });

    return {
      victimJobId,
      victimJobName: victim.name,
      releasedResources,
      unblockedJobs,
      previousAllocations: prevAllocations,
      recoveryTimestamp: timestamp,
      reason: `Victim process ${victimJobId} terminated. Reclaimed ${releasedResources.length} machine resources, unblocking [${unblockedJobs.map((u) => u.jobId).join(', ')}] and breaking circular wait cycle.`,
    };
  }
}
