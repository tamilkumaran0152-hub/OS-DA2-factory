import { SimulationEngine } from './src/simulation/simulationEngine.js';
import { SCENARIO_TYPES } from './src/simulation/scenarios.js';
import {
  SchedulingAlgorithm,
  ProcessState,
  ResourceType,
  ResourceState,
} from './src/simulation/types.js';

let checkCount = 0;
function assert(condition, message) {
  checkCount++;
  if (!condition) {
    console.error(`❌ Check ${checkCount} FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ [Check ${checkCount}]: ${message}`);
}

console.log('====================================================');
console.log('  RESOURCE MANAGER CONSISTENCY & AUDIT REGRESSION SUITE');
console.log('====================================================\n');

// ---------------------------------------------------------
// TEST GROUP 1: Invariant Audit with CNC Capacity = 1
// Verifies no stable idle+available machine with eligible waiting jobs
// ---------------------------------------------------------
console.log('TEST GROUP 1: Invariant Audit under Heavy Contention (CNC Capacity = 1)');
{
  const engine = new SimulationEngine({
    scenario: SCENARIO_TYPES.RESOURCE_CONTENTION,
    algorithm: SchedulingAlgorithm.FCFS,
    machineConfig: { CNC: 1, WELDING: 2, ASSEMBLY: 2, PAINTING: 2, PACKAGING: 2 },
  });

  assert(engine.resourceTypes.CNC.capacity === 1, 'CNC capacity is set to 1');
  assert(engine.resourceTypes.CNC.available === 1, 'Initial CNC available is 1');
  assert(engine.semaphores.CNC.value === 1, 'Initial CNC semaphore S is 1');

  let steps = 0;
  const maxSteps = 200;
  let finalResult = null;

  while (steps < maxSteps) {
    steps++;
    const res = engine.step();
    finalResult = res;

    // Check invariants at every discrete step
    const inv = engine.verifyInvariants();
    assert(inv.valid, `Step ${steps} invariants valid: ${inv.violations.join('; ')}`);

    const snap = engine.getSnapshot();

    // Specific check for CNC and all other resource types:
    for (const [resType, rt] of Object.entries(snap.resourceTypes)) {
      const sem = snap.semaphores[resType];
      const machs = Object.values(snap.machineInstances).filter((m) => m.type === resType);
      const idleMachs = machs.filter((m) => m.state === ResourceState.IDLE);

      // Invariant: No stable available > 0 when eligible waiting jobs exist
      if (rt.available > 0 && sem.waitingQueue.length > 0) {
        const eligible = sem.waitingQueue.filter((jId) => {
          const j = snap.jobs[jId];
          return j && (!engine.bankerMode || j._bankerDeniedTime !== snap.time);
        });
        assert(
          eligible.length === 0,
          `At t=${snap.time}s step ${steps}, ${resType} available=${rt.available} but eligible jobs [${eligible.join(', ')}] remain in waiting queue`
        );
      }

      // Invariant: No physical machine IDLE when eligible waiting jobs exist for that type
      if (idleMachs.length > 0 && sem.waitingQueue.length > 0) {
        const eligible = sem.waitingQueue.filter((jId) => {
          const j = snap.jobs[jId];
          return j && (!engine.bankerMode || j._bankerDeniedTime !== snap.time);
        });
        assert(
          eligible.length === 0,
          `At t=${snap.time}s step ${steps}, ${resType} has ${idleMachs.length} IDLE machine(s) while eligible jobs [${eligible.join(', ')}] are in waiting queue`
        );
      }
    }

    if (res.completed) break;
  }

  assert(finalResult?.completed === true, `Simulation completed successfully in ${steps} steps`);
}

// ---------------------------------------------------------
// TEST GROUP 2: Correct FIFO Semaphore Handover Order
// ---------------------------------------------------------
console.log('\nTEST GROUP 2: Correct FIFO Semaphore Handover Order (CNC Capacity = 1)');
{
  const engine = new SimulationEngine({
    scenario: SCENARIO_TYPES.RESOURCE_CONTENTION,
    algorithm: SchedulingAlgorithm.FCFS,
    machineConfig: { CNC: 1, WELDING: 2, ASSEMBLY: 2, PAINTING: 2, PACKAGING: 2 },
  });

  const cncAcquisitionOrder = [];
  let steps = 0;
  const maxSteps = 200;

  while (steps < maxSteps) {
    steps++;
    const prevCncJob = engine.machineInstances['CNC-01']?.currentJobId;
    const res = engine.step();
    const currCncJob = engine.machineInstances['CNC-01']?.currentJobId;

    if (currCncJob && currCncJob !== prevCncJob && !cncAcquisitionOrder.includes(currCncJob)) {
      cncAcquisitionOrder.push(currCncJob);
    }

    if (res.completed) break;
  }

  console.log(`  Observed CNC-01 acquisition sequence: [${cncAcquisitionOrder.join(' → ')}]`);
  // J101 arrives at t=0 and claims CNC-01 first;
  // J102, J103, J104 block and enqueue in exact FIFO queue order [J102, J103, J104].
  assert(cncAcquisitionOrder.length >= 4, `All 4 contending jobs acquired CNC-01: ${cncAcquisitionOrder.join(', ')}`);
  assert(cncAcquisitionOrder[0] === 'J101', `First job to acquire CNC-01 is J101 (actual: ${cncAcquisitionOrder[0]})`);
  assert(cncAcquisitionOrder[1] === 'J102', `Second job to acquire CNC-01 is J102 (actual: ${cncAcquisitionOrder[1]})`);
  assert(cncAcquisitionOrder[2] === 'J103', `Third job to acquire CNC-01 is J103 (actual: ${cncAcquisitionOrder[2]})`);
  assert(cncAcquisitionOrder[3] === 'J104', `Fourth job to acquire CNC-01 is J104 (actual: ${cncAcquisitionOrder[3]})`);
}

// ---------------------------------------------------------
// TEST GROUP 3: Semaphore Value == Resource Availability
// ---------------------------------------------------------
console.log('\nTEST GROUP 3: Semaphore Value == Resource Availability Parity');
{
  const scenariosToTest = [
    SCENARIO_TYPES.NORMAL_PRODUCTION,
    SCENARIO_TYPES.RESOURCE_CONTENTION,
    SCENARIO_TYPES.BANKER_SAFE,
    SCENARIO_TYPES.HEAVY_LOAD,
  ];

  for (const scen of scenariosToTest) {
    const engine = new SimulationEngine({
      scenario: scen,
      algorithm: SchedulingAlgorithm.FCFS,
    });

    let steps = 0;
    while (steps < 100) {
      steps++;
      const res = engine.step();
      const snap = engine.getSnapshot();

      for (const [type, rt] of Object.entries(snap.resourceTypes)) {
        const sem = snap.semaphores[type];
        if (sem.value !== rt.available) {
          throw new Error(
            `Scenario ${scen} at t=${snap.time}s: Semaphore ${type} value (${sem.value}) !== resource available (${rt.available})`
          );
        }
      }

      if (res.completed || res.deadlocked || res.stalled) break;
    }
    assert(true, `Scenario ${scen}: Semaphore value == available for all resource types across all ${steps} steps`);
  }
}

// ---------------------------------------------------------
// TEST GROUP 4: Physical Machine Ownership == Allocated Count
// ---------------------------------------------------------
console.log('\nTEST GROUP 4: Physical Machine Ownership == Allocated Count');
{
  const engine = new SimulationEngine({
    scenario: SCENARIO_TYPES.RESOURCE_CONTENTION,
    algorithm: SchedulingAlgorithm.ROUND_ROBIN,
    quantum: 2,
  });

  let steps = 0;
  while (steps < 150) {
    steps++;
    const res = engine.step();
    const snap = engine.getSnapshot();

    for (const [type, rt] of Object.entries(snap.resourceTypes)) {
      const machinesOfType = Object.values(snap.machineInstances).filter((m) => m.type === type);
      const runningMachines = machinesOfType.filter(
        (m) => m.state === ResourceState.RUNNING && m.currentJobId !== null
      );
      const idleMachines = machinesOfType.filter(
        (m) => m.state === ResourceState.IDLE && m.currentJobId === null
      );

      // Allocated count matches running physical machines exactly
      assert(
        rt.allocated === runningMachines.length,
        `At step ${steps} t=${snap.time}s: ${type} allocated (${rt.allocated}) === running machines (${runningMachines.length})`
      );

      // Available count matches idle physical machines exactly
      assert(
        rt.available === idleMachines.length,
        `At step ${steps} t=${snap.time}s: ${type} available (${rt.available}) === idle machines (${idleMachines.length})`
      );

      // Sum equals capacity
      assert(
        runningMachines.length + idleMachines.length === rt.capacity,
        `At step ${steps} t=${snap.time}s: ${type} running + idle === capacity (${rt.capacity})`
      );

      // Semaphore allocatedJobs list matches assigned job IDs
      const assignedJobIds = runningMachines.map((m) => m.currentJobId).sort();
      const semJobIds = [...(snap.semaphores[type]?.allocatedJobs || [])].sort();
      assert(
        JSON.stringify(assignedJobIds) === JSON.stringify(semJobIds),
        `At step ${steps}: ${type} machine currentJobIds [${assignedJobIds.join(',')}] === sem.allocatedJobs [${semJobIds.join(',')}]`
      );
    }

    if (res.completed) break;
  }
}

// ---------------------------------------------------------
// TEST GROUP 5: Full Release Back to Capacity After Workload Completion
// ---------------------------------------------------------
console.log('\nTEST GROUP 5: Full Release Back to Capacity After Workload Completion');
{
  const engine = new SimulationEngine({
    scenario: SCENARIO_TYPES.RESOURCE_CONTENTION,
    algorithm: SchedulingAlgorithm.FCFS,
  });

  let steps = 0;
  let finalResult = null;
  while (steps < 200) {
    steps++;
    finalResult = engine.step();
    if (finalResult.completed) break;
  }

  assert(finalResult?.completed === true, 'Simulation reached completed state');
  const snap = engine.getSnapshot();

  for (const [type, rt] of Object.entries(snap.resourceTypes)) {
    const sem = snap.semaphores[type];
    const machs = Object.values(snap.machineInstances).filter((m) => m.type === type);

    assert(rt.allocated === 0, `${type} final allocated is 0`);
    assert(rt.available === rt.capacity, `${type} final available (${rt.available}) === capacity (${rt.capacity})`);
    assert(sem.value === rt.capacity, `${type} semaphore S (${sem.value}) === capacity (${rt.capacity})`);
    assert(sem.waitingQueue.length === 0, `${type} semaphore waitingQueue is empty`);
    assert(sem.allocatedJobs.length === 0, `${type} semaphore allocatedJobs is empty`);

    machs.forEach((m) => {
      assert(m.state === ResourceState.IDLE, `Machine ${m.id} is IDLE`);
      assert(m.currentJobId === null, `Machine ${m.id} currentJobId is null`);
    });
  }

  Object.values(snap.jobs).forEach((j) => {
    assert(j.state === ProcessState.COMPLETED, `Job ${j.id} is COMPLETED`);
    assert(j.assignedInstanceId === null, `Job ${j.id} assignedInstanceId is null`);
    assert(j.waitingForResourceType === null, `Job ${j.id} waitingForResourceType is null`);
  });
}

// ---------------------------------------------------------
// TEST GROUP 6: Machine Reconfiguration Safety
// ---------------------------------------------------------
console.log('\nTEST GROUP 6: Machine Reconfiguration Safety & Reset Logging');
{
  const engine = new SimulationEngine({
    scenario: SCENARIO_TYPES.NORMAL_PRODUCTION,
    algorithm: SchedulingAlgorithm.FCFS,
  });

  // Run a few steps to advance past t=0
  for (let s = 0; s < 5; s++) {
    engine.step();
  }
  assert(engine.time > 0, `Simulation time has advanced (time = ${engine.time}s)`);

  // Apply new machine config
  engine.setMachineConfig({ CNC: 3, WELDING: 2, ASSEMBLY: 2, PAINTING: 2, PACKAGING: 2 });

  assert(engine.time === 0, 'Applying machine config resets engine time to 0s');
  assert(engine.isRunning === false, 'Applying machine config halts running flag');
  assert(engine.resourceTypes.CNC.capacity === 3, 'New CNC capacity is 3');
  assert(engine.resourceTypes.CNC.available === 3, 'New CNC available is 3');
  assert(engine.semaphores.CNC.value === 3, 'New CNC semaphore value is 3');

  const reconfigEvt = engine.eventLog.find((e) => e.eventType === 'INFRASTRUCTURE_RECONFIGURED');
  assert(reconfigEvt !== undefined, 'INFRASTRUCTURE_RECONFIGURED event was logged');
}

console.log('\n====================================================');
console.log(`  ALL ${checkCount}/${checkCount} RESOURCE MANAGER AUDIT CHECKS PASSED!`);
console.log('====================================================\n');
