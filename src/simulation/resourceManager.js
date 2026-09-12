import { ResourceState } from './types.js';

/**
 * Resource Manager for Smart Factory OS
 * Manages Resource Types (capacities, available, allocated)
 * and concrete Machine Instances (CNC-01, WELD-01, etc.)
 */
export class ResourceManager {
  constructor(resourceTypes, machineInstances, semaphores) {
    this.resourceTypes = resourceTypes; // Map of type -> ResourceType state
    this.machineInstances = machineInstances; // Map of machine ID -> Machine state
    this.semaphores = semaphores; // Map of type -> CountingSemaphore instance
  }

  /**
   * Checks if an instance of the requested resource type is available
   * @param {string} resourceType 
   * @returns {boolean}
   */
  isResourceAvailable(resourceType) {
    const sem = this.semaphores[resourceType];
    return sem ? sem.value > 0 : false;
  }

  /**
   * Finds the first available IDLE machine instance for a resource type
   * @param {string} resourceType 
   * @returns {Object|null}
   */
  findFreeInstance(resourceType) {
    const instances = Object.values(this.machineInstances).filter(
      (m) => m.type === resourceType && m.state === ResourceState.IDLE
    );
    return instances.length > 0 ? instances[0] : null;
  }

  /**
   * Synchronizes resource counters and semaphore values with concrete machine states
   * Guarantees all simulation invariants:
   * 1. resource.available + resource.allocated === resource.capacity
   * 2. semaphore.value === resource.available
   * 3. resource.allocated === number of physical machine instances currently assigned to jobs
   * 4. Every IDLE machine is NOT counted as allocated
   * 5. Every allocated machine has an actual assigned job
   */
  syncResourceType(resourceType) {
    const sem = this.semaphores[resourceType];
    const rt = this.resourceTypes[resourceType];
    if (!sem || !rt) return;

    // Count physical machine instances currently active with an assigned job
    const assignedMachines = Object.values(this.machineInstances).filter(
      (m) => m.type === resourceType && m.state === ResourceState.RUNNING && m.currentJobId !== null
    );

    rt.allocated = assignedMachines.length;
    // Semaphore value and available count directly reflect free physical instances
    sem.value = Math.max(0, rt.capacity - rt.allocated);
    rt.available = sem.value;
    rt.waitingQueue = [...sem.waitingQueue];
  }

  syncAll() {
    Object.keys(this.resourceTypes).forEach((rt) => this.syncResourceType(rt));
  }

  /**
   * Job requests an instance of a Resource Type
   * Uses Counting Semaphore for concurrency control
   * 
   * @param {string} resourceType - e.g. ResourceType.CNC
   * @param {Object} job - The requesting job object
   * @param {number} timestamp - Current simulation time
   * @returns {Object} Allocation result
   */
  allocate(resourceType, job, timestamp = 0) {
    const sem = this.semaphores[resourceType];
    if (!sem) {
      throw new Error(`Unknown resource type: ${resourceType}`);
    }

    const waitResult = sem.wait(job.id, timestamp);

    if (waitResult.granted) {
      // Find a free physical machine of this type
      const machine = this.findFreeInstance(resourceType);
      if (!machine) {
        // Fallback: This should not happen if semaphore > 0, but safeguard and rollback
        sem.value = Math.min(sem.capacity, sem.value + 1);
        const idx = sem.allocatedJobs.indexOf(job.id);
        if (idx !== -1) sem.allocatedJobs.splice(idx, 1);
        throw new Error(`Inconsistency: Semaphore granted for ${resourceType} but no free machine instance found!`);
      }

      // Bind machine to job
      machine.state = ResourceState.RUNNING;
      machine.currentJobId = job.id;
      machine.currentJobName = job.name;
      machine.stageIndex = job.currentStageIndex;
      machine.progress = 0;
      machine.currentBurstTotal = job.currentStageBurstTotal;
      machine.currentBurstRemaining = job.currentStageBurstRemaining;

      // Update Job allocation state
      job.assignedInstanceId = machine.id;
      job.waitingForResourceType = null;
      job.currentAllocations[resourceType] = (job.currentAllocations[resourceType] || 0) + 1;

      // Synchronize counters
      this.syncResourceType(resourceType);

      return {
        granted: true,
        machineId: machine.id,
        semaphoreValue: sem.value,
        reason: `Allocated physical machine ${machine.id} to ${job.id}. Semaphore value is now ${sem.value}.`,
      };
    } else {
      // Resource not available -> job must wait
      this.syncResourceType(resourceType);
      job.waitingForResourceType = resourceType;
      job.assignedInstanceId = null;

      return {
        granted: false,
        machineId: null,
        semaphoreValue: sem.value,
        waitingQueueLength: sem.waitingQueue.length,
        reason: waitResult.reason,
      };
    }
  }

  /**
   * Release an instance of a Resource Type held by a job
   * Signals the Counting Semaphore and unblocks the next waiting job if any
   * 
   * @param {string} resourceType 
   * @param {string} jobId 
   * @param {string} machineId 
   * @param {number} timestamp 
   * @returns {Object} Release result with unblocked job info
   */
  release(resourceType, jobId, machineId, timestamp = 0) {
    const sem = this.semaphores[resourceType];
    const machine = machineId ? this.machineInstances[machineId] : null;

    if (machine) {
      machine.state = ResourceState.IDLE;
      machine.currentJobId = null;
      machine.currentJobName = null;
      machine.progress = 0;
      machine.currentBurstRemaining = 0;
      machine.currentBurstTotal = 0;
    }

    const signalResult = sem.signal(jobId, timestamp);

    // Synchronize counters
    this.syncResourceType(resourceType);

    return {
      releasedMachineId: machineId,
      semaphoreValue: sem.value,
      unblockedJobId: signalResult.unblockedJobId,
      reason: signalResult.reason,
    };
  }

  /**
   * Snapshot of current allocations for UI & Banker's Algorithm
   */
  getAllocationVector(resourceTypesList) {
    const alloc = {};
    resourceTypesList.forEach((rt) => {
      alloc[rt] = this.resourceTypes[rt]?.allocated || 0;
    });
    return alloc;
  }

  getAvailableVector(resourceTypesList) {
    const avail = {};
    resourceTypesList.forEach((rt) => {
      avail[rt] = this.resourceTypes[rt]?.available ?? this.semaphores[rt]?.value ?? 0;
    });
    return avail;
  }
}
