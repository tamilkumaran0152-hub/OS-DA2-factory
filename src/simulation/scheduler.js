import { SchedulingAlgorithm } from './types.js';

/**
 * Pure CPU / Process Scheduling Engine for Manufacturing Jobs
 * Returns a structured decision object explaining WHY a job was selected.
 *
 * @param {Array} readyJobs - Array of job objects in the READY state
 * @param {string} algorithm - FCFS | SJF | PRIORITY | ROUND_ROBIN
 * @param {Object} options - { quantum: number, lastSelectedJobId: string }
 * @returns {Object} Structured scheduling decision
 */
export function scheduleNextJob(readyJobs, algorithm = SchedulingAlgorithm.FCFS, options = {}) {
  if (!readyJobs || readyJobs.length === 0) {
    return {
      selectedJob: null,
      algorithm,
      candidates: [],
      decision: null,
      reason: 'Ready queue is empty. CPU / Workstation Scheduler is idle.',
    };
  }

  // If only one job is ready, selection is trivial
  if (readyJobs.length === 1) {
    const job = readyJobs[0];
    return {
      selectedJob: job,
      algorithm,
      candidates: [{ id: job.id, name: job.name, metric: 'Only candidate' }],
      decision: job.id,
      reason: `${job.id} (${job.name}) is the only process in the READY queue.`,
    };
  }

  switch (algorithm) {
    case SchedulingAlgorithm.FCFS: {
      // First-Come, First-Served: sorted by arrival time
      const candidates = readyJobs.map((j) => ({
        id: j.id,
        name: j.name,
        arrivalTime: j.arrivalTime,
        metric: `Arrival: t=${j.arrivalTime}`,
      }));

      // Sort by arrivalTime ascending, tie-break by ID
      const sorted = [...readyJobs].sort((a, b) => {
        if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
        return a.id.localeCompare(b.id);
      });

      const chosen = sorted[0];
      return {
        selectedJob: chosen,
        algorithm: SchedulingAlgorithm.FCFS,
        candidates,
        decision: chosen.id,
        reason: `${chosen.id} (${chosen.name}) selected via FCFS: arrived earliest at t=${chosen.arrivalTime}.`,
      };
    }

    case SchedulingAlgorithm.SJF: {
      // Shortest Job First: based on current stage remaining burst
      const candidates = readyJobs.map((j) => ({
        id: j.id,
        name: j.name,
        burst: j.currentStageBurstRemaining,
        totalRemaining: j.remainingBurstTotal,
        metric: `Stage Burst: ${j.currentStageBurstRemaining}s (Total: ${j.remainingBurstTotal}s)`,
      }));

      // Sort by currentStageBurstRemaining ascending, tie-break by arrivalTime
      const sorted = [...readyJobs].sort((a, b) => {
        if (a.currentStageBurstRemaining !== b.currentStageBurstRemaining) {
          return a.currentStageBurstRemaining - b.currentStageBurstRemaining;
        }
        return a.arrivalTime - b.arrivalTime;
      });

      const chosen = sorted[0];
      return {
        selectedJob: chosen,
        algorithm: SchedulingAlgorithm.SJF,
        candidates,
        decision: chosen.id,
        reason: `${chosen.id} (${chosen.name}) selected via SJF: shortest active operation burst (${chosen.currentStageBurstRemaining}s) among ready candidates.`,
      };
    }

    case SchedulingAlgorithm.PRIORITY: {
      // Priority Scheduling: Lower number = Higher priority (1 = Highest)
      const candidates = readyJobs.map((j) => ({
        id: j.id,
        name: j.name,
        priority: j.priority,
        metric: `Priority: P${j.priority} (${j.priority === 1 ? 'Critical' : j.priority === 2 ? 'High' : 'Normal'})`,
      }));

      // Sort by priority ascending (1 before 2), tie-break by arrivalTime
      const sorted = [...readyJobs].sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.arrivalTime - b.arrivalTime;
      });

      const chosen = sorted[0];
      return {
        selectedJob: chosen,
        algorithm: SchedulingAlgorithm.PRIORITY,
        candidates,
        decision: chosen.id,
        reason: `${chosen.id} (${chosen.name}) selected via Priority: highest priority level (P${chosen.priority}) in ready queue.`,
      };
    }

    case SchedulingAlgorithm.ROUND_ROBIN: {
      const quantum = options.quantum || 2;
      const candidates = readyJobs.map((j) => ({
        id: j.id,
        name: j.name,
        quantumRemaining: j.quantumRemaining || quantum,
        metric: `Time Quantum: ${quantum}s`,
      }));

      // Pick the head of the ready queue (FIFO queue rotation)
      const chosen = readyJobs[0];
      return {
        selectedJob: chosen,
        algorithm: SchedulingAlgorithm.ROUND_ROBIN,
        candidates,
        decision: chosen.id,
        quantum,
        reason: `${chosen.id} (${chosen.name}) allocated time slice of ${quantum}s via Round Robin (Queue head).`,
      };
    }

    default:
      return scheduleNextJob(readyJobs, SchedulingAlgorithm.FCFS, options);
  }
}
