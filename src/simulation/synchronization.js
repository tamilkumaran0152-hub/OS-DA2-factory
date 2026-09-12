/**
 * Counting Semaphore Synchronization Engine
 * Implements classic Dijkstra Counting Semaphore with atomic wait(P) and signal(V)
 */
export class CountingSemaphore {
  constructor(resourceType, capacity) {
    this.resourceType = resourceType;
    this.capacity = capacity;
    this.value = capacity; // Available units
    this.waitingQueue = []; // FIFO queue of blocked job IDs: [jobId1, jobId2, ...]
    this.allocatedJobs = []; // Array of job IDs currently holding an instance
    this.history = []; // Log of semaphore state changes
  }

  /**
   * wait(P) operation: Decrements semaphore or blocks requesting job
   * @param {string} jobId - ID of requesting job
   * @param {number} timestamp - Current simulation time
   * @returns {Object} { granted: boolean, value: number, reason: string }
   */
  wait(jobId, timestamp = 0) {
    if (this.value > 0) {
      this.value -= 1;
      this.allocatedJobs.push(jobId);
      
      const record = {
        time: timestamp,
        action: 'ACQUIRE',
        jobId,
        semaphoreValueAfter: this.value,
        reason: `Semaphore decrement: value was > 0. Job granted access to ${this.resourceType}.`,
      };
      this.history.push(record);

      return {
        granted: true,
        value: this.value,
        reason: `Semaphore wait(P) succeeded: ${this.resourceType} capacity available. Allocated to ${jobId}. Remaining semaphore = ${this.value}.`,
      };
    } else {
      // Resource unavailable -> block job into FIFO waiting queue
      if (!this.waitingQueue.includes(jobId)) {
        this.waitingQueue.push(jobId);
      }

      const record = {
        time: timestamp,
        action: 'BLOCK',
        jobId,
        semaphoreValueAfter: this.value,
        queueLengthAfter: this.waitingQueue.length,
        reason: `Semaphore wait(P) blocked: value is 0. Job enqueued to waiting queue (Position ${this.waitingQueue.length}).`,
      };
      this.history.push(record);

      return {
        granted: false,
        value: this.value,
        waitingQueueLength: this.waitingQueue.length,
        reason: `Semaphore wait(P) blocked: 0 instances of ${this.resourceType} available (all ${this.capacity} held by [${this.allocatedJobs.join(', ')}]). ${jobId} placed in waiting queue.`,
      };
    }
  }

  /**
   * signal(V) operation: Increments semaphore or unblocks head of waiting queue
   * @param {string} jobId - ID of job releasing resource
   * @param {number} timestamp - Current simulation time
   * @returns {Object} { unblockedJobId: string|null, value: number, reason: string }
   */
  signal(jobId, timestamp = 0) {
    // Remove releasing job from allocation list
    const allocIdx = this.allocatedJobs.indexOf(jobId);
    if (allocIdx !== -1) {
      this.allocatedJobs.splice(allocIdx, 1);
    }

    if (this.waitingQueue.length > 0) {
      // FIFO unblock: give resource immediately to the first waiting process
      const unblockedJobId = this.waitingQueue.shift();
      this.allocatedJobs.push(unblockedJobId);
      // Value remains 0 because the released instance is immediately transferred to unblocked process

      const record = {
        time: timestamp,
        action: 'SIGNAL_TRANSFER',
        releasedBy: jobId,
        unblockedJobId,
        semaphoreValueAfter: this.value,
        reason: `Semaphore signal(V): 1 instance released by ${jobId} immediately transferred to waiting queue head ${unblockedJobId}.`,
      };
      this.history.push(record);

      return {
        unblockedJobId,
        value: this.value,
        reason: `Semaphore signal(V): ${jobId} released ${this.resourceType}. Queued process ${unblockedJobId} unblocked and granted resource.`,
      };
    } else {
      // No waiting jobs -> increment available semaphore count
      this.value = Math.min(this.capacity, this.value + 1);

      const record = {
        time: timestamp,
        action: 'SIGNAL_INCREMENT',
        releasedBy: jobId,
        semaphoreValueAfter: this.value,
        reason: `Semaphore signal(V): 1 instance released by ${jobId}. No waiting queue -> semaphore incremented to ${this.value}.`,
      };
      this.history.push(record);

      return {
        unblockedJobId: null,
        value: this.value,
        reason: `Semaphore signal(V): ${jobId} released ${this.resourceType}. Semaphore value incremented to ${this.value}/${this.capacity}.`,
      };
    }
  }

  /**
   * Remove a job from waiting queue or allocation (e.g. during deadlock recovery)
   */
  forceRelease(jobId, timestamp = 0) {
    const qIdx = this.waitingQueue.indexOf(jobId);
    if (qIdx !== -1) {
      this.waitingQueue.splice(qIdx, 1);
    }
    return this.signal(jobId, timestamp);
  }
}

/**
 * Creates and initializes semaphores for all resource types
 */
export function createSemaphores(resourceDefs) {
  const semaphores = {};
  Object.values(resourceDefs).forEach((def) => {
    semaphores[def.type] = new CountingSemaphore(def.type, def.capacity);
  });
  return semaphores;
}
