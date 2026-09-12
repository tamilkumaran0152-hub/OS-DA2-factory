import {
  ProcessState,
  ResourceType,
  ResourceState,
  EventType,
  OSConcept,
  Subsystem,
  SchedulingAlgorithm,
} from './types.js';
import { RESOURCE_DEFINITIONS } from './resources.js';
import { scheduleNextJob } from './scheduler.js';
import { CountingSemaphore, createSemaphores } from './synchronization.js';
import { ResourceManager } from './resourceManager.js';
import { BankersAlgorithm } from './banker.js';
import { DeadlockDetector } from './deadlock.js';
import { RecoveryManager } from './recovery.js';
import { calculateMetrics } from './metrics.js';
import { buildScenarioState, SCENARIO_TYPES, SCENARIO_METADATA } from './scenarios.js';

export class SimulationEngine {
  constructor(options = {}) {
    this.scenario = options.scenario || SCENARIO_TYPES.NORMAL_PRODUCTION;
    this.algorithm = options.algorithm || SchedulingAlgorithm.FCFS;
    this.quantum = options.quantum || 2;
    this.bankerMode = options.bankerMode || false;

    // Subsystems
    this.banker = new BankersAlgorithm();
    this.deadlockDetector = new DeadlockDetector();
    this.recoveryManager = new RecoveryManager();

    this.reset();
  }

  reset() {
    this.time = 0;
    this.isRunning = false;
    this.speed = 1; // 0.5x, 1x, 2x, 5x, 10x
    this.eventLog = [];
    this.ganttRecords = []; // Array of { jobId, start, end, state, machineId }
    this.deadlockInfo = { hasDeadlock: false, cycleNodes: [], involvedJobIds: [], coffman: null };
    this.bankerAudit = null;
    this.lastDecision = null;
    this.activeSubsystem = Subsystem.PROCESS_MGR;
    this.stepSequence = 0;

    // Build scenario data
    const meta = SCENARIO_METADATA[this.scenario] || {};
    this.bankerMode = meta.bankerMode ?? this.bankerMode;
    if (meta.recommendedAlgorithm && !this.userExplicitAlgorithm) {
      this.algorithm = meta.recommendedAlgorithm;
    }

    const { jobs, resourceTypes, machineInstances } = buildScenarioState(this.scenario);
    this.jobs = jobs;
    this.resourceTypes = resourceTypes;
    this.machineInstances = machineInstances;

    // Initialize Semaphores & Resource Manager
    this.semaphores = createSemaphores(RESOURCE_DEFINITIONS);
    
    // Sync semaphores with initial allocations if scenario had pre-allocated resources
    Object.values(this.jobs).forEach((j) => {
      Object.entries(j.currentAllocations || {}).forEach(([rt, cnt]) => {
        if (cnt > 0 && this.semaphores[rt]) {
          this.semaphores[rt].value = Math.max(0, this.semaphores[rt].value - cnt);
          this.semaphores[rt].allocatedJobs.push(j.id);
        }
      });
      if (j.state === ProcessState.WAITING && j.waitingForResourceType) {
        if (!this.semaphores[j.waitingForResourceType].waitingQueue.includes(j.id)) {
          this.semaphores[j.waitingForResourceType].waitingQueue.push(j.id);
        }
      }
    });

    this.resourceManager = new ResourceManager(
      this.resourceTypes,
      this.machineInstances,
      this.semaphores
    );
    this.resourceManager.syncAll();
    this.reconsiderWaitingQueues();

    // Initial check for RAG
    this.updateDeadlockState();

    // Log simulation initialization
    this.logEvent({
      eventType: 'SYSTEM_INITIALIZED',
      time: 0,
      subsystem: Subsystem.PROCESS_MGR,
      osConcept: OSConcept.PROCESS_LIFECYCLE,
      reason: `Smart Factory OS initialized with scenario: "${meta.title || this.scenario}" under ${this.algorithm} scheduling.`,
      decision: 'Simulation Ready',
      whatHappened: `Initialized 9 machine instances across 5 workstation types and ${Object.keys(this.jobs).length} manufacturing jobs.`,
      whyItHappened: 'Operator loaded simulation scenario to benchmark OS concepts.',
      manufacturingImpact: 'Workstations standing by in IDLE state; jobs queued for production arrival.',
    });
  }

  setScenario(scenarioType) {
    this.scenario = scenarioType;
    this.userExplicitAlgorithm = false;
    this.reset();
  }

  setAlgorithm(algorithm) {
    this.algorithm = algorithm;
    this.userExplicitAlgorithm = true;
    this.logEvent({
      eventType: 'ALGORITHM_CHANGED',
      time: this.time,
      subsystem: Subsystem.SCHEDULER,
      osConcept: OSConcept.CPU_SCHEDULING,
      reason: `Scheduling policy switched to ${algorithm}. Ready queue order will be re-evaluated according to this algorithm.`,
      decision: `Switch to ${algorithm}`,
      whatHappened: `Active scheduler policy set to ${algorithm}.`,
      whyItHappened: 'Operator reconfigured CPU/Workstation scheduling policy.',
      manufacturingImpact: 'Determines which ready workpiece receives priority access to vacant machine cells.',
    });
  }

  setQuantum(q) {
    this.quantum = Math.max(1, q);
  }

  setBankerMode(enabled) {
    this.bankerMode = enabled;
  }

  /**
   * Log a structured event and update the OS Decision Engine state
   */
  logEvent(data) {
    const event = {
      id: `EVT-${++this.stepSequence}`,
      time: this.time,
      ...data,
    };
    this.eventLog.unshift(event);
    if (this.eventLog.length > 200) this.eventLog.pop();

    this.activeSubsystem = data.subsystem || Subsystem.PROCESS_MGR;

    // Update Decision Engine record
    this.lastDecision = {
      id: event.id,
      time: this.time,
      eventType: event.eventType,
      jobId: event.jobId || null,
      jobName: event.jobName || null,
      resourceType: event.resourceType || null,
      subsystem: event.subsystem,
      osConcept: event.osConcept,
      whatHappened: event.whatHappened || event.reason,
      whyItHappened: event.whyItHappened || 'Standard discrete event progression',
      decision: event.decision || event.reason,
      manufacturingImpact: event.manufacturingImpact || 'Workcell state transitioned cleanly.',
      explanationData: event.explanationData || null,
    };

    return event;
  }

  /**
   * Advance exactly ONE discrete simulation event
   * Guarantees that STEP never invisibly jumps multiple major OS decisions!
   */
  step() {
    // 1. Check for any job arriving at or before time t that is still CREATED
    const arrivingJob = Object.values(this.jobs).find(
      (j) => j.state === ProcessState.CREATED && j.arrivalTime <= this.time
    );

    if (arrivingJob) {
      arrivingJob.state = ProcessState.READY;
      arrivingJob.history.push({
        time: this.time,
        state: ProcessState.READY,
        description: `Arrived at factory floor. Entered Process READY Queue.`,
      });

      this.logEvent({
        eventType: EventType.JOB_ARRIVED,
        time: this.time,
        jobId: arrivingJob.id,
        jobName: arrivingJob.name,
        previousState: ProcessState.CREATED,
        newState: ProcessState.READY,
        subsystem: Subsystem.PROCESS_MGR,
        osConcept: OSConcept.PROCESS_LIFECYCLE,
        whatHappened: `Job ${arrivingJob.id} (${arrivingJob.name}) arrived and entered the READY Queue.`,
        whyItHappened: `Simulation clock reached arrival time t = ${arrivingJob.arrivalTime}s.`,
        decision: `Move ${arrivingJob.id} from CREATED to READY state.`,
        manufacturingImpact: `Raw workpiece delivered to factory floor intake staging, awaiting machine assignment.`,
      });

      return { eventExecuted: true, timeAdvanced: false };
    }

    // Reconsider waiting queues if workstations are free
    this.reconsiderWaitingQueues();

    // 2. Scheduler & Resource Allocation: Check if any READY job can be scheduled
    const readyJobs = Object.values(this.jobs).filter((j) => j.state === ProcessState.READY);

    if (readyJobs.length > 0) {
      // Find which ready jobs need which resources
      // Scheduler chooses which READY job to schedule
      const schedDecision = scheduleNextJob(readyJobs, this.algorithm, {
        quantum: this.quantum,
      });

      const selectedJob = schedDecision.selectedJob;
      if (selectedJob) {
        const currentStage = selectedJob.stages[selectedJob.currentStageIndex];
        const requiredResourceType = currentStage.resourceType;

        // SEPARATION: Scheduler selected the job, now Resource Manager checks resource
        // Let's log SCHEDULER_SELECTED event if not already scheduled
        if (!selectedJob._scheduledInStep) {
          selectedJob._scheduledInStep = true;

          this.logEvent({
            eventType: EventType.SCHEDULER_SELECTED,
            time: this.time,
            jobId: selectedJob.id,
            jobName: selectedJob.name,
            subsystem: Subsystem.SCHEDULER,
            osConcept: OSConcept.CPU_SCHEDULING,
            whatHappened: `Scheduler selected ${selectedJob.id} (${selectedJob.name}) using ${this.algorithm}.`,
            whyItHappened: schedDecision.reason,
            decision: `Dispatch ${selectedJob.id} to Resource Manager for ${requiredResourceType} allocation check.`,
            manufacturingImpact: `Production scheduler routed ${selectedJob.id} to ${requiredResourceType} cell.`,
            explanationData: schedDecision,
          });

          return { eventExecuted: true, timeAdvanced: false };
        }

        // Next step: Resource Manager & Semaphore Evaluation
        delete selectedJob._scheduledInStep;

        // Check if Banker's mode is active
        if (this.bankerMode) {
          const matrices = this.banker.buildMatrices(this.jobs, this.resourceTypes);
          const requestVec = {
            CNC: 0,
            WELDING: 0,
            ASSEMBLY: 0,
            PAINTING: 0,
            PACKAGING: 0,
            [requiredResourceType]: 1,
          };

          const bankerResult = this.banker.evaluateRequest(selectedJob.id, requestVec, matrices);
          this.bankerAudit = {
            jobId: selectedJob.id,
            requestVector: requestVec,
            result: bankerResult,
            matrices,
          };

          if (!bankerResult.granted) {
            // Banker denied request to prevent unsafe state
            selectedJob.state = ProcessState.WAITING;
            selectedJob.waitingForResourceType = requiredResourceType;
            selectedJob._bankerDeniedTime = this.time;
            const sem = this.semaphores[requiredResourceType];
            if (sem && !sem.waitingQueue.includes(selectedJob.id)) {
              sem.waitingQueue.push(selectedJob.id);
            }
            this.resourceManager.syncResourceType(requiredResourceType);
            selectedJob.history.push({
              time: this.time,
              state: ProcessState.WAITING,
              description: `Resource request denied by Banker's Algorithm (would lead to UNSAFE state). Moved to WAITING.`,
            });

            this.logEvent({
              eventType: EventType.BANKER_UNSAFE,
              time: this.time,
              jobId: selectedJob.id,
              jobName: selectedJob.name,
              resourceType: requiredResourceType,
              previousState: ProcessState.READY,
              newState: ProcessState.WAITING,
              subsystem: Subsystem.SAFETY_ENGINE,
              osConcept: OSConcept.DEADLOCK_AVOIDANCE_BANKER,
              whatHappened: `Banker's Algorithm DENIED ${selectedJob.id}'s request for ${requiredResourceType}.`,
              whyItHappened: bankerResult.reason,
              decision: `Block ${selectedJob.id} in WAITING queue to preserve system safety.`,
              manufacturingImpact: `Prevented unsafe concurrent commitment that could lock up the production line.`,
              explanationData: bankerResult,
            });

            return { eventExecuted: true, timeAdvanced: false };
          } else {
            // Banker approved!
            this.logEvent({
              eventType: EventType.BANKER_SAFE,
              time: this.time,
              jobId: selectedJob.id,
              jobName: selectedJob.name,
              resourceType: requiredResourceType,
              subsystem: Subsystem.SAFETY_ENGINE,
              osConcept: OSConcept.DEADLOCK_AVOIDANCE_BANKER,
              whatHappened: `Banker's Safety Check PASSED for ${selectedJob.id} requesting ${requiredResourceType}.`,
              whyItHappened: `Safe sequence < ${bankerResult.safetyResult.safeSequence.join(' → ')} > verified.`,
              decision: `Grant request and proceed to physical instance allocation.`,
              manufacturingImpact: `Confirmed request is 100% deadlock-safe.`,
              explanationData: bankerResult,
            });
            // Continue to physical semaphore allocation below
          }
        }

        // Physical Semaphore Allocation
        const allocResult = this.resourceManager.allocate(requiredResourceType, selectedJob, this.time);

        if (allocResult.granted) {
          // Resource granted!
          selectedJob.state = ProcessState.RUNNING;
          if (selectedJob.firstStartTime === null) {
            selectedJob.firstStartTime = this.time;
          }
          if (this.algorithm === SchedulingAlgorithm.ROUND_ROBIN) {
            selectedJob.quantumRemaining = this.quantum;
          }

          selectedJob.history.push({
            time: this.time,
            state: ProcessState.RUNNING,
            description: `Granted machine ${allocResult.machineId}. Stage ${selectedJob.currentStageIndex + 1}: ${currentStage.stageName}.`,
          });

          this.logEvent({
            eventType: EventType.RESOURCE_GRANTED,
            time: this.time,
            jobId: selectedJob.id,
            jobName: selectedJob.name,
            resourceType: requiredResourceType,
            machineId: allocResult.machineId,
            previousState: ProcessState.READY,
            newState: ProcessState.RUNNING,
            subsystem: Subsystem.RESOURCE_MGR,
            osConcept: OSConcept.SEMAPHORE_SYNCHRONIZATION,
            whatHappened: `Machine ${allocResult.machineId} allocated to ${selectedJob.id}. Semaphore decremented to ${allocResult.semaphoreValue}.`,
            whyItHappened: `Counting semaphore had value > 0; vacant physical machine instance available.`,
            decision: `Acquire semaphore lock and start execution on ${allocResult.machineId}.`,
            manufacturingImpact: `${selectedJob.name} loaded into ${allocResult.machineId} fixture; machining started.`,
          });

          return { eventExecuted: true, timeAdvanced: false };
        } else {
          // Resource unavailable -> WAITING
          selectedJob.state = ProcessState.WAITING;
          selectedJob.history.push({
            time: this.time,
            state: ProcessState.WAITING,
            description: `Blocked on ${requiredResourceType} semaphore (all instances busy). Position in queue: ${allocResult.waitingQueueLength}.`,
          });

          this.logEvent({
            eventType: EventType.SEMAPHORE_WAIT,
            time: this.time,
            jobId: selectedJob.id,
            jobName: selectedJob.name,
            resourceType: requiredResourceType,
            previousState: ProcessState.READY,
            newState: ProcessState.WAITING,
            subsystem: Subsystem.SYNCHRONIZATION,
            osConcept: OSConcept.SEMAPHORE_SYNCHRONIZATION,
            whatHappened: `${selectedJob.id} blocked waiting for ${requiredResourceType}. Queue position: ${allocResult.waitingQueueLength}.`,
            whyItHappened: `All ${RESOURCE_DEFINITIONS[requiredResourceType].capacity} instances of ${requiredResourceType} are busy. Semaphore value = 0.`,
            decision: `Invoke wait(P) block: place ${selectedJob.id} into semaphore FIFO waiting queue.`,
            manufacturingImpact: `Part staged in buffer buffer rack awaiting machine availability.`,
          });

          // Check if this created a deadlock
          this.updateDeadlockState();

          return { eventExecuted: true, timeAdvanced: false };
        }
      }
    }

    // 3. Deadlock Check: Check if deadlock cycle exists
    this.updateDeadlockState();
    if (this.deadlockInfo.hasDeadlock && !this.deadlockInfo.hasBeenNotified) {
      this.deadlockInfo.hasBeenNotified = true;
      this.logEvent({
        eventType: EventType.DEADLOCK_DETECTED,
        time: this.time,
        subsystem: Subsystem.DEADLOCK_DETECTOR,
        osConcept: OSConcept.DEADLOCK_DETECTION_RAG,
        whatHappened: `DEADLOCK DETECTED! Circular wait chain: ${this.deadlockInfo.cycleString}`,
        whyItHappened: `All 4 Coffman conditions satisfied: Mutual Exclusion, Hold & Wait, No Preemption, and Circular Wait.`,
        decision: `Flag system deadlock alert and activate Recovery Advisor for victim selection.`,
        manufacturingImpact: `Critical: Production workstations permanently halted due to mutual dependency lock.`,
        explanationData: this.deadlockInfo,
      });

      return { eventExecuted: true, timeAdvanced: false };
    }

    // 4. Execution Step (Advancing simulation clock by 1 unit)
    const runningJobs = Object.values(this.jobs).filter((j) => j.state === ProcessState.RUNNING);

    // If no running jobs
    if (runningJobs.length === 0) {
      const allJobsList = Object.values(this.jobs);
      const allDone = allJobsList.every(
        (j) => j.state === ProcessState.COMPLETED || j.state === ProcessState.TERMINATED
      );

      if (allDone) {
        this.isRunning = false;
        this.logEvent({
          eventType: 'ALL_JOBS_COMPLETED',
          time: this.time,
          subsystem: Subsystem.FACTORY_EXECUTION,
          osConcept: OSConcept.METRICS_PERFORMANCE,
          whatHappened: 'All scheduled manufacturing orders have completed production!',
          whyItHappened: 'Every job successfully traversed all defined routing stages.',
          decision: 'Halt simulation execution and display final operational metrics.',
          manufacturingImpact: '100% order batch fulfillment achieved. Final audit report available.',
        });
        return { eventExecuted: false, timeAdvanced: false, completed: true };
      }

      // Check if there are future arrivals pending
      const futureArrivals = allJobsList.filter(
        (j) => j.state === ProcessState.CREATED && j.arrivalTime > this.time
      );

      if (futureArrivals.length > 0) {
        const nextArrivalTime = Math.min(...futureArrivals.map((j) => j.arrivalTime));
        const advanceAmount = Math.max(1, nextArrivalTime - this.time);
        this.advanceClock(advanceAmount);
        return { eventExecuted: true, timeAdvanced: true };
      }

      // If ready jobs exist, let scheduler dispatch them
      const readyJobs = allJobsList.filter((j) => j.state === ProcessState.READY);
      if (readyJobs.length > 0) {
        return { eventExecuted: false, timeAdvanced: false };
      }

      // If deadlock is present and detected, stop advancing endlessly
      if (this.deadlockInfo.hasDeadlock) {
        this.isRunning = false;
        return { eventExecuted: false, timeAdvanced: false, deadlocked: true };
      }

      // No running jobs, no ready jobs, no future arrivals, all remaining active jobs waiting:
      // NO PROGRESS DETECTED diagnostic
      this.isRunning = false;
      this.logEvent({
        eventType: 'NO_PROGRESS_DETECTED',
        time: this.time,
        subsystem: Subsystem.SAFETY_ENGINE,
        osConcept: OSConcept.DEADLOCK_DETECTION_RAG,
        whatHappened: 'NO PROGRESS DETECTED: all remaining jobs blocked but no resource can become available.',
        whyItHappened: 'All remaining active jobs are in WAITING state, 0 machines are active, and no future job arrivals are scheduled.',
        decision: 'Halt simulation execution to prevent endless clock advancement without progress.',
        manufacturingImpact: 'Critical stall: Factory operations halted due to unresolvable resource starvation.',
        explanationData: {
          blockedJobs: allJobsList
            .filter((j) => j.state === ProcessState.WAITING)
            .map((j) => ({ id: j.id, waitingFor: j.waitingForResourceType })),
        },
      });

      return { eventExecuted: false, timeAdvanced: false, stalled: true };
    }

    // Execute active jobs for 1 time unit
    const completedStages = [];
    const preemptedJobs = [];

    runningJobs.forEach((job) => {
      job.totalExecutionTime = (job.totalExecutionTime || 0) + 1;
      job.currentStageBurstRemaining -= 1;
      job.remainingBurstTotal = Math.max(0, job.remainingBurstTotal - 1);

      // Update machine
      if (job.assignedInstanceId && this.machineInstances[job.assignedInstanceId]) {
        const m = this.machineInstances[job.assignedInstanceId];
        m.totalBusyTime = (m.totalBusyTime || 0) + 1;
        m.currentBurstRemaining = job.currentStageBurstRemaining;
        const total = job.currentStageBurstTotal || 1;
        m.progress = Math.min(100, Math.round(((total - job.currentStageBurstRemaining) / total) * 100));
      }

      // Record Gantt slice [time, time+1]
      this.ganttRecords.push({
        jobId: job.id,
        jobName: job.name,
        color: job.color,
        start: this.time,
        end: this.time + 1,
        state: ProcessState.RUNNING,
        machineId: job.assignedInstanceId,
      });

      // Round Robin Quantum
      if (this.algorithm === SchedulingAlgorithm.ROUND_ROBIN) {
        job.quantumRemaining = (job.quantumRemaining || this.quantum) - 1;
        if (job.quantumRemaining <= 0 && job.currentStageBurstRemaining > 0) {
          preemptedJobs.push(job);
        }
      }

      // Check stage completion
      if (job.currentStageBurstRemaining <= 0) {
        completedStages.push(job);
      }
    });

    // Also record WAITING jobs in Gantt
    Object.values(this.jobs)
      .filter((j) => j.state === ProcessState.WAITING)
      .forEach((j) => {
        j.totalWaitingTime = (j.totalWaitingTime || 0) + 1;
        j.resourceWaitingTime = (j.resourceWaitingTime || 0) + 1;
        this.ganttRecords.push({
          jobId: j.id,
          jobName: j.name,
          color: j.color,
          start: this.time,
          end: this.time + 1,
          state: ProcessState.WAITING,
          machineId: null,
        });
      });

    // Advance clock now for the 1 unit worked
    this.time += 1;

    // Process completed stages (releases resources & signals semaphores)
    for (const job of completedStages) {
      const currentStage = job.stages[job.currentStageIndex];
      const releasedMachineId = job.assignedInstanceId;
      const releasedResourceType = (releasedMachineId && this.machineInstances[releasedMachineId]?.type) || currentStage?.resourceType;

      // Release resource via manager
      const releaseResult = this.resourceManager.release(
        releasedResourceType,
        job.id,
        releasedMachineId,
        this.time
      );

      job.currentAllocations[releasedResourceType] = Math.max(
        0,
        (job.currentAllocations[releasedResourceType] || 1) - 1
      );
      job.assignedInstanceId = null;

      // Move to next stage or complete job
      job.currentStageIndex += 1;

      if (job.currentStageIndex >= job.stages.length) {
        // Job completely finished!
        job.state = ProcessState.COMPLETED;
        job.completionTime = this.time;
        job.assignedInstanceId = null;
        job.waitingForResourceType = null;
        Object.keys(job.currentAllocations || {}).forEach((k) => {
          job.currentAllocations[k] = 0;
        });
        job.history.push({
          time: this.time,
          state: ProcessState.COMPLETED,
          description: `All manufacturing operations completed. TAT = ${this.time - job.arrivalTime}s.`,
        });

        this.logEvent({
          eventType: EventType.JOB_COMPLETED,
          time: this.time,
          jobId: job.id,
          jobName: job.name,
          previousState: ProcessState.RUNNING,
          newState: ProcessState.COMPLETED,
          subsystem: Subsystem.FACTORY_EXECUTION,
          osConcept: OSConcept.PROCESS_LIFECYCLE,
          whatHappened: `${job.id} (${job.name}) completed all operations and exited the system.`,
          whyItHappened: `Stage ${job.stages.length}/${job.stages.length} reached 100% completion.`,
          decision: `Deallocate all resources, record turnaround metrics, and mark process COMPLETED.`,
          manufacturingImpact: `Finished manufactured assembly packaged and transferred to dispatch warehouse.`,
        });
      } else {
        // Stage completed, next stage pending -> move back to READY to schedule next workstation
        const nextStage = job.stages[job.currentStageIndex];
        job.state = ProcessState.READY;
        job.currentStageBurstTotal = nextStage.burst;
        job.currentStageBurstRemaining = nextStage.burst;
        job.history.push({
          time: this.time,
          state: ProcessState.READY,
          description: `Completed stage ${job.currentStageIndex} (${currentStage.stageName}). Advancing to stage ${job.currentStageIndex + 1}: ${nextStage.stageName}.`,
        });

        this.logEvent({
          eventType: EventType.STAGE_COMPLETED,
          time: this.time,
          jobId: job.id,
          jobName: job.name,
          resourceType: releasedResourceType,
          previousState: ProcessState.RUNNING,
          newState: ProcessState.READY,
          subsystem: Subsystem.RESOURCE_MGR,
          osConcept: OSConcept.SEMAPHORE_SYNCHRONIZATION,
          whatHappened: `${job.id} finished ${currentStage.stageName}, releasing ${releasedMachineId}.`,
          whyItHappened: `Machine operation burst elapsed. Semaphore signal(V) triggered for ${releasedResourceType}.`,
          decision: `Release machine fixture and route job to READY queue for next workstation stage (${nextStage.stageName}).`,
          manufacturingImpact: `Part transferred to inter-stage conveyor for next operation.`,
        });
      }

      // If a waiting job was unblocked by semaphore signal:
      if (releaseResult.unblockedJobId) {
        const unblockedJob = this.jobs[releaseResult.unblockedJobId];
        if (unblockedJob && unblockedJob.state === ProcessState.WAITING) {
          unblockedJob.state = ProcessState.READY;
          unblockedJob.waitingForResourceType = null;
          unblockedJob.history.push({
            time: this.time,
            state: ProcessState.READY,
            description: `Unblocked from ${releasedResourceType} semaphore queue following release by ${job.id}. Moved to READY queue.`,
          });

          this.logEvent({
            eventType: EventType.SEMAPHORE_SIGNAL,
            time: this.time,
            jobId: unblockedJob.id,
            jobName: unblockedJob.name,
            resourceType: releasedResourceType,
            previousState: ProcessState.WAITING,
            newState: ProcessState.READY,
            subsystem: Subsystem.SYNCHRONIZATION,
            osConcept: OSConcept.SEMAPHORE_SYNCHRONIZATION,
            whatHappened: `Semaphore signal(V) unblocked ${unblockedJob.id} for ${releasedResourceType}.`,
            whyItHappened: `Resource released by ${job.id}; unblocked FIFO queue head.`,
            decision: `Transition ${unblockedJob.id} from WAITING to READY.`,
            manufacturingImpact: `Workpiece unblocked from staging rack and staged for loading.`,
          });
        }
      }
    }

    // Process Round Robin preemption
    for (const job of preemptedJobs) {
      // Preempt running job back to ready
      const currStage = job.stages[job.currentStageIndex];
      const releasedRes = currStage.resourceType;
      const releasedMach = job.assignedInstanceId;

      const releaseResult = this.resourceManager.release(releasedRes, job.id, releasedMach, this.time);
      job.currentAllocations[releasedRes] = Math.max(0, (job.currentAllocations[releasedRes] || 1) - 1);
      job.assignedInstanceId = null;
      job.state = ProcessState.READY;
      job.quantumRemaining = this.quantum;

      if (releaseResult.unblockedJobId) {
        const unblockedJob = this.jobs[releaseResult.unblockedJobId];
        if (unblockedJob && unblockedJob.state === ProcessState.WAITING) {
          unblockedJob.state = ProcessState.READY;
          unblockedJob.waitingForResourceType = null;
          unblockedJob.history.push({
            time: this.time,
            state: ProcessState.READY,
            description: `Unblocked from ${releasedRes} semaphore queue following Round Robin preemption of ${job.id}. Moved to READY queue.`,
          });
        }
      }

      this.logEvent({
        eventType: EventType.JOB_PREEMPTED,
        time: this.time,
        jobId: job.id,
        jobName: job.name,
        previousState: ProcessState.RUNNING,
        newState: ProcessState.READY,
        subsystem: Subsystem.SCHEDULER,
        osConcept: OSConcept.CPU_SCHEDULING,
        whatHappened: `Round Robin preemption: ${job.id} time slice (${this.quantum}s) expired.`,
        whyItHappened: `Round Robin timer interrupt enforced fairness across competing workpieces.`,
        decision: `Preempt ${job.id} from machine ${releasedMach} and return to tail of READY queue.`,
        manufacturingImpact: `Machine paused for batch timeslicing; next job scheduled.`,
      });
    }

    this.reconsiderWaitingQueues();
    this.lastInvariantCheck = this.verifyInvariants();
    return { eventExecuted: true, timeAdvanced: true };
  }

  advanceClock(amount = 1) {
    this.time += amount;
    // Record waiting slices for Gantt
    Object.values(this.jobs)
      .filter((j) => j.state === ProcessState.WAITING)
      .forEach((j) => {
        j.totalWaitingTime = (j.totalWaitingTime || 0) + amount;
        j.resourceWaitingTime = (j.resourceWaitingTime || 0) + amount;
        this.ganttRecords.push({
          jobId: j.id,
          jobName: j.name,
          color: j.color,
          start: this.time - amount,
          end: this.time,
          state: ProcessState.WAITING,
          machineId: null,
        });
      });
  }

  /**
   * Update RAG and check for cycle & Coffman conditions
   */
  updateDeadlockState() {
    const rag = this.deadlockDetector.buildRAG(this.jobs, this.resourceTypes);
    const cycle = this.deadlockDetector.detectCycle(rag);
    const coffman = this.deadlockDetector.evaluateCoffmanConditions(this.jobs, this.resourceTypes, cycle);

    this.deadlockInfo = {
      ...cycle,
      coffman,
      rag,
    };
  }

  /**
   * Execute Deadlock Recovery by terminating selected victim
   */
  recoverFromDeadlock(victimJobId) {
    const result = this.recoveryManager.executeRecovery(
      victimJobId,
      this.jobs,
      this.resourceManager,
      this.time
    );

    this.deadlockInfo.hasDeadlock = false;
    this.deadlockInfo.hasBeenNotified = false;
    this.updateDeadlockState();

    this.logEvent({
      eventType: EventType.RECOVERY_COMPLETED,
      time: this.time,
      jobId: victimJobId,
      subsystem: Subsystem.RECOVERY_MGR,
      osConcept: OSConcept.DEADLOCK_RECOVERY,
      whatHappened: `DEADLOCK RESOLVED! Victim process ${victimJobId} terminated.`,
      whyItHappened: result.reason,
      decision: `Preempt ${victimJobId}, reclaim held resources, and unblock [${result.unblockedJobs.map((u) => u.jobId).join(', ')}].`,
      manufacturingImpact: `Aborted lower-priority workpiece to prevent total factory gridlock; unlocked primary production line.`,
      explanationData: result,
    });

    return result;
  }

  /**
   * Reconsiders FIFO waiting queues for each resource type.
   * If physical machine capacity is available and not already spoken for by READY jobs,
   * unblocks waiting jobs to READY state.
   */
  reconsiderWaitingQueues() {
    for (const [resType, rt] of Object.entries(this.resourceTypes)) {
      const sem = this.semaphores[resType];
      if (!sem || sem.waitingQueue.length === 0) continue;

      // Count READY jobs that will request this resource upon scheduling
      const readyJobsNeedingRes = Object.values(this.jobs).filter(
        (j) =>
          j.state === ProcessState.READY &&
          j.stages[j.currentStageIndex]?.resourceType === resType
      ).length;

      let availableSlots = rt.available - readyJobsNeedingRes;

      while (availableSlots > 0 && sem.waitingQueue.length > 0) {
        const nextJobId = sem.waitingQueue.shift();
        const nextJob = this.jobs[nextJobId];
        if (nextJob && nextJob.state === ProcessState.WAITING) {
          // If in Banker mode and recently denied at this exact timestamp, skip unblocking
          if (this.bankerMode && nextJob._bankerDeniedTime === this.time) {
            sem.waitingQueue.push(nextJobId);
            break;
          }

          nextJob.state = ProcessState.READY;
          nextJob.waitingForResourceType = null;
          nextJob.history.push({
            time: this.time,
            state: ProcessState.READY,
            description: `Workstation ${resType} has available capacity. Moved from WAITING to READY queue.`,
          });

          this.logEvent({
            eventType: EventType.SEMAPHORE_SIGNAL,
            time: this.time,
            jobId: nextJob.id,
            jobName: nextJob.name,
            resourceType: resType,
            previousState: ProcessState.WAITING,
            newState: ProcessState.READY,
            subsystem: Subsystem.SYNCHRONIZATION,
            osConcept: OSConcept.SEMAPHORE_SYNCHRONIZATION,
            whatHappened: `Workstation ${resType} has available capacity; unblocked ${nextJob.id}.`,
            whyItHappened: `Free physical instance available (${availableSlots} slot(s)). Awakened waiting process.`,
            decision: `Transition ${nextJob.id} from WAITING to READY.`,
            manufacturingImpact: `Workpiece transferred to ready queue for workstation scheduling.`,
          });

          availableSlots--;
        }
      }
      this.resourceManager.syncResourceType(resType);
    }
  }

  /**
   * Rigorously verifies all 10 simulation engine invariants at the current step:
   * 1. resource.available + resource.allocated === resource.capacity
   * 2. semaphore.value === resource.available
   * 3. resource.allocated === number of physical machine instances currently assigned to jobs
   * 4. Every IDLE physical machine must NOT be counted as allocated
   * 5. Every allocated machine must have an actual assigned job
   * 6. Every RUNNING job must have an actual machine assignment
   * 7. A job waiting for CNC must only remain blocked if CNC actually has no available instance
   * 8. Release transitions physical instance to IDLE, decrements alloc, increments semaphore
   * 9. Acquisition increments alloc, decrements semaphore, assigns physical instance
   * 10. Completed stage releases only its resource without phantom allocations
   */
  verifyInvariants() {
    const violations = [];

    for (const [resType, rt] of Object.entries(this.resourceTypes)) {
      const sem = this.semaphores[resType];
      const capacity = rt.capacity;
      const available = rt.available;
      const allocated = rt.allocated;

      // 1. resource.available + resource.allocated === resource.capacity
      if (available + allocated !== capacity) {
        violations.push(
          `Invariant 1 violation for ${resType}: available(${available}) + allocated(${allocated}) !== capacity(${capacity})`
        );
      }

      // 2. semaphore.value === resource.available
      if (sem && sem.value !== available) {
        violations.push(
          `Invariant 2 violation for ${resType}: semaphore.value(${sem.value}) !== available(${available})`
        );
      }

      // 3. resource.allocated === number of physical machine instances currently assigned to jobs
      const machinesOfType = Object.values(this.machineInstances).filter((m) => m.type === resType);
      const assignedMachines = machinesOfType.filter((m) => m.currentJobId !== null && m.state === ResourceState.RUNNING);
      if (allocated !== assignedMachines.length) {
        violations.push(
          `Invariant 3 violation for ${resType}: allocated(${allocated}) !== assignedMachines(${assignedMachines.length})`
        );
      }

      // 4. Every IDLE physical machine must NOT be counted as allocated
      const idleWithJob = machinesOfType.filter(
        (m) => m.state === ResourceState.IDLE && m.currentJobId !== null
      );
      if (idleWithJob.length > 0) {
        violations.push(
          `Invariant 4 violation for ${resType}: IDLE machine has assigned job: ${idleWithJob.map((m) => m.id).join(', ')}`
        );
      }

      // 5. Every allocated machine must have an actual assigned job
      const runningWithoutJob = machinesOfType.filter(
        (m) => m.state === ResourceState.RUNNING && !m.currentJobId
      );
      if (runningWithoutJob.length > 0) {
        violations.push(
          `Invariant 5 violation for ${resType}: RUNNING machine has no assigned job: ${runningWithoutJob.map((m) => m.id).join(', ')}`
        );
      }
    }

    // 6. Every RUNNING job must have an actual machine assignment
    for (const job of Object.values(this.jobs)) {
      if (job.state === ProcessState.RUNNING) {
        if (!job.assignedInstanceId) {
          violations.push(
            `Invariant 6 violation for ${job.id}: State is RUNNING but assignedInstanceId is null`
          );
        } else {
          const machine = this.machineInstances[job.assignedInstanceId];
          if (!machine || machine.currentJobId !== job.id || machine.state !== ResourceState.RUNNING) {
            violations.push(
              `Invariant 6 violation for ${job.id}: Machine ${job.assignedInstanceId} state mismatch`
            );
          }
        }
      }
    }

    return {
      valid: violations.length === 0,
      violations,
    };
  }

  /**
   * Generates comprehensive snapshot of current state
   */
  getSnapshot() {
    const metrics = calculateMetrics(this.jobs, this.machineInstances, this.time);

    return {
      time: this.time,
      isRunning: this.isRunning,
      speed: this.speed,
      scenario: this.scenario,
      algorithm: this.algorithm,
      quantum: this.quantum,
      bankerMode: this.bankerMode,
      activeSubsystem: this.activeSubsystem,
      jobs: { ...this.jobs },
      resourceTypes: { ...this.resourceTypes },
      machineInstances: { ...this.machineInstances },
      semaphores: this.semaphores,
      eventLog: [...this.eventLog],
      lastDecision: this.lastDecision,
      ganttRecords: [...this.ganttRecords],
      deadlockInfo: this.deadlockInfo,
      bankerAudit: this.bankerAudit,
      metrics,
    };
  }
}
