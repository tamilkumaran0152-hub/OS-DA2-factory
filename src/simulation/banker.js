import { ResourceType } from './types.js';

/**
 * Classic Dijkstra's Banker's Algorithm for Deadlock Avoidance
 * Maintains Available, Max, Allocation, Need matrices and calculates safety state.
 */
export class BankersAlgorithm {
  constructor(resourceTypesList = Object.values(ResourceType)) {
    this.resourceTypes = resourceTypesList;
  }

  /**
   * Constructs the Banker's state from active jobs and resource inventory
   * 
   * @param {Object} jobs - Map of jobId -> Job object
   * @param {Object} resourceTypes - Map of type -> ResourceType state
   * @returns {Object} { available, max, allocation, need, jobIds }
   */
  buildMatrices(jobs, resourceTypes) {
    const jobList = Object.values(jobs).filter(
      (j) => j.state !== 'COMPLETED' && j.state !== 'TERMINATED'
    );
    const jobIds = jobList.map((j) => j.id);

    // Available vector
    const available = {};
    this.resourceTypes.forEach((rt) => {
      available[rt] = resourceTypes[rt]?.available ?? 0;
    });

    // Max, Allocation, Need matrices
    const max = {};
    const allocation = {};
    const need = {};

    jobList.forEach((j) => {
      max[j.id] = {};
      allocation[j.id] = {};
      need[j.id] = {};

      this.resourceTypes.forEach((rt) => {
        const m = j.maxClaims?.[rt] || 0;
        const a = j.currentAllocations?.[rt] || 0;
        max[j.id][rt] = m;
        allocation[j.id][rt] = a;
        need[j.id][rt] = Math.max(0, m - a);
      });
    });

    return { available, max, allocation, need, jobIds, jobs: jobList };
  }

  /**
   * Safety Algorithm
   * Determines whether the current system state is safe,
   * producing a detailed step-by-step trace and safe sequence.
   * 
   * @param {Object} state - { available, max, allocation, need, jobIds }
   * @returns {Object} { isSafe: boolean, safeSequence: Array, trace: Array, finalWork: Object }
   */
  runSafetyAlgorithm(state) {
    const { available, allocation, need, jobIds } = state;
    const work = { ...available };
    const finish = {};
    jobIds.forEach((id) => {
      finish[id] = false;
    });

    const safeSequence = [];
    const trace = [];

    trace.push({
      step: 0,
      description: `Initialized Work = [${this.formatVector(work)}]. All Finish flags set to false.`,
      workState: { ...work },
      finishState: { ...finish },
      action: 'INIT',
    });

    let foundCandidate = true;
    let stepCount = 1;

    while (foundCandidate && safeSequence.length < jobIds.length) {
      foundCandidate = false;

      for (const id of jobIds) {
        if (!finish[id]) {
          // Check if Need_i <= Work
          const canProceed = this.resourceTypes.every(
            (rt) => (need[id]?.[rt] || 0) <= work[rt]
          );

          if (canProceed) {
            // Process can finish, will return its allocated resources
            const workBefore = { ...work };
            this.resourceTypes.forEach((rt) => {
              work[rt] += allocation[id]?.[rt] || 0;
            });
            finish[id] = true;
            safeSequence.push(id);
            foundCandidate = true;

            trace.push({
              step: stepCount++,
              jobId: id,
              description: `Process ${id} satisfies condition Need <= Work. After completion, releases [${this.formatVector(allocation[id])}]. New Work = [${this.formatVector(work)}].`,
              workBefore,
              workAfter: { ...work },
              allocated: { ...allocation[id] },
              needed: { ...need[id] },
              finishState: { ...finish },
              action: 'PROCESS_CAN_FINISH',
            });
            break; // Restart search loop to maintain deterministic evaluation
          }
        }
      }
    }

    const isSafe = safeSequence.length === jobIds.length;

    if (isSafe) {
      trace.push({
        step: stepCount,
        description: `SAFE STATE: All ${jobIds.length} active processes can terminate safely. Safe sequence: < ${safeSequence.join(' → ')} >.`,
        action: 'SYSTEM_SAFE',
        safeSequence: [...safeSequence],
      });
    } else {
      const unfinished = jobIds.filter((id) => !finish[id]);
      trace.push({
        step: stepCount,
        description: `UNSAFE STATE: Deadlock risk detected! Processes [${unfinished.join(', ')}] cannot be guaranteed to complete with available resources.`,
        action: 'SYSTEM_UNSAFE',
        unfinished,
      });
    }

    return {
      isSafe,
      safeSequence,
      trace,
      finalWork: work,
      finish,
    };
  }

  /**
   * Resource-Request Algorithm
   * Tests whether granting a resource request to process Pi leaves the system in a safe state.
   * 
   * @param {string} jobId - Requesting job ID
   * @param {Object} requestVector - { CNC: 1, ... }
   * @param {Object} currentState - Current { available, max, allocation, need, jobIds }
   * @returns {Object} Result { granted: boolean, reason: string, safetyResult: Object, restoredState: Object }
   */
  evaluateRequest(jobId, requestVector, currentState) {
    const { available, max, allocation, need, jobIds } = currentState;

    // Step 1: Check if Request <= Need
    for (const rt of this.resourceTypes) {
      const reqVal = requestVector[rt] || 0;
      const needVal = need[jobId]?.[rt] || 0;
      if (reqVal > needVal) {
        return {
          granted: false,
          errorType: 'EXCEEDS_MAX_CLAIM',
          reason: `Request denied: ${jobId} requested ${reqVal} of ${rt}, which exceeds its remaining Need (${needVal}). Maximum claim violated!`,
          safetyResult: null,
        };
      }
    }

    // Step 2: Check if Request <= Available
    for (const rt of this.resourceTypes) {
      const reqVal = requestVector[rt] || 0;
      const availVal = available[rt] || 0;
      if (reqVal > availVal) {
        return {
          granted: false,
          errorType: 'INSUFFICIENT_AVAILABLE',
          reason: `Request denied: ${jobId} requested ${reqVal} of ${rt}, but only ${availVal} instances are currently available. Job must wait.`,
          safetyResult: null,
        };
      }
    }

    // Step 3: Pretend to allocate (Tentative State)
    const tentAvailable = { ...available };
    const tentAllocation = {};
    const tentNeed = {};

    jobIds.forEach((id) => {
      tentAllocation[id] = { ...allocation[id] };
      tentNeed[id] = { ...need[id] };
    });

    this.resourceTypes.forEach((rt) => {
      const reqVal = requestVector[rt] || 0;
      tentAvailable[rt] -= reqVal;
      tentAllocation[jobId][rt] = (tentAllocation[jobId][rt] || 0) + reqVal;
      tentNeed[jobId][rt] = Math.max(0, (tentNeed[jobId][rt] || 0) - reqVal);
    });

    const tentativeState = {
      available: tentAvailable,
      max,
      allocation: tentAllocation,
      need: tentNeed,
      jobIds,
    };

    // Step 4: Run Safety Algorithm on tentative state
    const safetyResult = this.runSafetyAlgorithm(tentativeState);

    if (safetyResult.isSafe) {
      return {
        granted: true,
        reason: `Banker's Safety Check PASSED: Safe sequence < ${safetyResult.safeSequence.join(' → ')} > exists. Request granted without risk of deadlock.`,
        safetyResult,
        tentativeState,
      };
    } else {
      return {
        granted: false,
        errorType: 'UNSAFE_STATE',
        reason: `Banker's Safety Check FAILED: Granting this request would transition the factory to an UNSAFE state. No safe execution sequence exists. Request denied!`,
        safetyResult,
        tentativeState,
      };
    }
  }

  formatVector(vec) {
    if (!vec) return '';
    return this.resourceTypes
      .map((rt) => `${rt.substring(0, 3)}:${vec[rt] || 0}`)
      .join(', ');
  }
}
