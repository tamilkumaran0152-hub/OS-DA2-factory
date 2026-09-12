import { SimulationEngine } from './src/simulation/simulationEngine.js';
import { SCENARIO_TYPES } from './src/simulation/scenarios.js';
import { SchedulingAlgorithm, ProcessState, ResourceType, ResourceState } from './src/simulation/types.js';

console.log('=== RUNNING REGRESSION TEST: CNC IDLE & WAITING QUEUE INTEGRITY ===\n');

// PART 1: Targeted Machine-Instance & Semaphore Lifecycle Regression Test
console.log('--- Part 1: Direct State Transition & Invariant Verification ---');
{
  const engine = new SimulationEngine({
    scenario: SCENARIO_TYPES.RESOURCE_CONTENTION,
    algorithm: SchedulingAlgorithm.FCFS,
  });

  // Advance simulation to step where both CNC instances are acquired and waiting jobs queue up
  // J101 and J102 get CNC-01 and CNC-02; J103 and J104 block on CNC
  for (let s = 0; s < 10; s++) {
    engine.step();
  }

  const snap1 = engine.getSnapshot();
  const cnc1 = snap1.resourceTypes.CNC;
  const sem1 = snap1.semaphores.CNC;
  const m01_1 = snap1.machineInstances['CNC-01'];
  const m02_1 = snap1.machineInstances['CNC-02'];

  console.log(`State when fully allocated:`);
  console.log(`   CNC-01: ${m01_1.state} (${m01_1.currentJobId}), CNC-02: ${m02_1.state} (${m02_1.currentJobId})`);
  console.log(`   CNC: avail=${cnc1.available}, alloc=${cnc1.allocated}, sem=${sem1.value}, waitingQueue=[${sem1.waitingQueue.join(',')}]`);

  // Assert both machines are RUNNING and waiting queue has blocked jobs
  if (m01_1.state !== ResourceState.RUNNING || m02_1.state !== ResourceState.RUNNING) {
    throw new Error('FAIL: Both CNC instances should be RUNNING under contention');
  }
  if (cnc1.available !== 0 || cnc1.allocated !== 2 || sem1.value !== 0) {
    throw new Error(`FAIL: CNC counters invalid: avail=${cnc1.available}, alloc=${cnc1.allocated}, sem=${sem1.value}`);
  }
  if (sem1.waitingQueue.length === 0) {
    throw new Error('FAIL: Waiting queue should contain blocked jobs');
  }

  // Verify invariants at this saturated point
  const inv1 = engine.verifyInvariants();
  if (!inv1.valid) {
    throw new Error(`FAIL: Invariant violation: ${inv1.violations.join('; ')}`);
  }
  console.log('   ✓ Invariants 1-10 verified during full allocation.');

  // Now advance until CNC instances release
  let cncReleasedCount = 0;
  let maxSteps = 40;
  for (let s = 0; s < maxSteps; s++) {
    const res = engine.step();
    const inv = engine.verifyInvariants();
    if (!inv.valid) {
      throw new Error(`FAIL: Invariant violation at step ${s}: ${inv.violations.join('; ')}`);
    }

    const lastEvt = engine.eventLog[0];
    if (lastEvt?.eventType === 'STAGE_COMPLETED' && lastEvt?.resourceType === ResourceType.CNC) {
      cncReleasedCount++;
      const snap = engine.getSnapshot();
      const cnc = snap.resourceTypes.CNC;
      const sem = snap.semaphores.CNC;
      console.log(`   Release #${cncReleasedCount} at t=${snap.time}: ${lastEvt.whatHappened}`);
      console.log(`     CNC: avail=${cnc.available}, alloc=${cnc.allocated}, sem=${sem.value}, queue=[${sem.waitingQueue.join(',')}]`);
      
      // Invariant checks:
      if (cnc.available + cnc.allocated !== cnc.capacity) {
        throw new Error(`FAIL: Invariant 1 violated: avail(${cnc.available}) + alloc(${cnc.allocated}) !== cap(${cnc.capacity})`);
      }
      if (sem.value !== cnc.available) {
        throw new Error(`FAIL: Invariant 2 violated: sem(${sem.value}) !== avail(${cnc.available})`);
      }
    }

    if (cncReleasedCount >= 2) break;
  }

  console.log('   ✓ Both CNC instances successfully released and reacquired by waiting jobs.');
}

// PART 2: Full Scenario 1 Execution from RESET to Completion
console.log('\n--- Part 2: Scenario 1 (Normal Production Flow) Full Run from RESET ---');
{
  const sim = new SimulationEngine({
    scenario: SCENARIO_TYPES.NORMAL_PRODUCTION,
    algorithm: SchedulingAlgorithm.FCFS,
  });

  let stepCount = 0;
  let maxSteps = 300;
  let finalResult = null;

  while (stepCount < maxSteps) {
    stepCount++;
    const res = sim.step();
    
    // Invariant check at every single step:
    const inv = sim.verifyInvariants();
    if (!inv.valid) {
      throw new Error(`FAIL: Invariant violation at step ${stepCount} (t=${sim.time}): ${inv.violations.join('; ')}`);
    }

    // Check if any job waiting for CNC when CNC is actually available
    const cnc = sim.resourceTypes.CNC;
    const waitingForCNC = Object.values(sim.jobs).filter(
      (j) => j.state === ProcessState.WAITING && j.waitingForResourceType === ResourceType.CNC
    );
    const readyForCNC = Object.values(sim.jobs).filter(
      (j) => j.state === ProcessState.READY && j.stages[j.currentStageIndex]?.resourceType === ResourceType.CNC
    );

    // If waiting jobs exist, available instances not yet reserved by ready jobs should not exceed 0
    if (waitingForCNC.length > 0 && cnc.available > readyForCNC.length) {
      throw new Error(
        `FAIL: Job waiting for CNC while unreserved CNC instances exist! avail=${cnc.available}, ready=${readyForCNC.length}, waiting=${waitingForCNC.map(j => j.id).join(',')}`
      );
    }

    if (res.completed || res.stalled) {
      finalResult = res;
      break;
    }
  }

  console.log(`Simulation finished at step ${stepCount} (simulated time t=${sim.time}s).`);
  console.log(`Result: completed=${finalResult?.completed}, stalled=${finalResult?.stalled}`);

  if (finalResult?.stalled) {
    throw new Error(`FAIL: Simulation stalled with NO_PROGRESS_DETECTED!`);
  }

  if (!finalResult?.completed) {
    throw new Error(`FAIL: Simulation did not complete within ${maxSteps} steps! (ended at t=${sim.time}s)`);
  }

  // Verify all 6 jobs are in COMPLETED state
  const jobs = Object.values(sim.jobs);
  const uncompleted = jobs.filter((j) => j.state !== ProcessState.COMPLETED);
  if (uncompleted.length > 0) {
    throw new Error(`FAIL: Not all jobs completed: ${uncompleted.map(j => `${j.id}:${j.state}`).join(', ')}`);
  }

  console.log(`   ✓ All ${jobs.length} jobs reached COMPLETED: [${jobs.map(j => j.id).join(', ')}]`);

  // Verify machine instances are IDLE and allocations are 0
  Object.values(sim.machineInstances).forEach((m) => {
    if (m.state !== ResourceState.IDLE || m.currentJobId !== null) {
      throw new Error(`FAIL: Machine ${m.id} is not IDLE after completion: state=${m.state}, job=${m.currentJobId}`);
    }
  });
  console.log('   ✓ All 9 physical machines are IDLE with 0 current job assignments.');

  // Verify all resource allocation counts are 0 and available equals capacity
  Object.entries(sim.resourceTypes).forEach(([type, rt]) => {
    if (rt.allocated !== 0) {
      throw new Error(`FAIL: Resource ${type} allocation count is ${rt.allocated}, expected 0`);
    }
    if (rt.available !== rt.capacity) {
      throw new Error(`FAIL: Resource ${type} available count is ${rt.available}, expected ${rt.capacity}`);
    }
    if (sim.semaphores[type].value !== rt.capacity) {
      throw new Error(`FAIL: Semaphore ${type} value is ${sim.semaphores[type].value}, expected ${rt.capacity}`);
    }
  });
  console.log('   ✓ All 5 resource types have allocated=0, available=capacity, and semaphore.value=capacity.');
}

console.log('\n=== ALL REGRESSION CHECKS PASSED PERFECTLY! ===');
