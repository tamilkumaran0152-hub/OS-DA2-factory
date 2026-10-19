import { SimulationEngine } from './src/simulation/simulationEngine.js';
import { SCENARIO_TYPES } from './src/simulation/scenarios.js';
import { EventType, ProcessState } from './src/simulation/types.js';

console.log('====================================================');
console.log('  FACTORY SIMULATOR REGRESSION & CORRECTNESS SUITE');
console.log('====================================================\n');

let checkCount = 0;
function assert(condition, message) {
  checkCount++;
  if (!condition) {
    console.error(`FAIL [Check ${checkCount}]: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ [Check ${checkCount}]: ${message}`);
}

// ---------------------------------------------------------
// TEST GROUP 1: Job Count Parity for Selectable Scenarios
// ---------------------------------------------------------
console.log('TEST GROUP 1: Factory Scenario Job Count Parity');

const selectableScenarios = [
  { type: SCENARIO_TYPES.NORMAL_PRODUCTION, expectedCount: 6, name: 'Normal Production Flow' },
  { type: SCENARIO_TYPES.RESOURCE_CONTENTION, expectedCount: 6, name: 'Resource Contention & Bottlenecks' },
  { type: SCENARIO_TYPES.BANKER_SAFE_REQUEST, expectedCount: 6, name: "Banker's Safe Request Flow" },
  { type: SCENARIO_TYPES.DEADLOCK_SCENARIO, expectedCount: 6, name: 'Deadlock Detection Scenario' },
  { type: SCENARIO_TYPES.HEAVY_LOAD, expectedCount: 10, name: 'Heavy Load (High volume workpieces)' },
];

for (const sc of selectableScenarios) {
  const engine = new SimulationEngine({ scenario: sc.type });
  const snapshot = engine.getSnapshot();

  const engineJobCount = Object.keys(engine.jobs).length;
  const snapshotJobCount = Object.keys(snapshot.jobs).length;

  assert(
    engineJobCount === sc.expectedCount,
    `Scenario '${sc.name}' SimulationEngine initialized with ${engineJobCount} jobs (expected: ${sc.expectedCount})`
  );
  assert(
    snapshotJobCount === sc.expectedCount,
    `Scenario '${sc.name}' Snapshot exposes ${snapshotJobCount} jobs (matches engine: ${engineJobCount})`
  );

  if (sc.type === SCENARIO_TYPES.HEAVY_LOAD) {
    const jobIds = Object.keys(engine.jobs);
    assert(jobIds.length === 10, 'HEAVY_LOAD has exactly 10 jobs');
    for (let i = 101; i <= 110; i++) {
      assert(jobIds.includes(`J${i}`), `HEAVY_LOAD contains workpiece J${i}`);
    }

    // Run heavy load through to completion and verify Completed count = 10
    let stepCount = 0;
    while (stepCount < 300) {
      stepCount++;
      const res = engine.step();
      if (res.completed) break;
    }

    const finalSnapshot = engine.getSnapshot();
    const completedCount = Object.values(finalSnapshot.jobs).filter((j) => j.state === ProcessState.COMPLETED).length;
    assert(
      completedCount === 10,
      `HEAVY_LOAD simulation runs to completion with all 10 workpieces completed (actual: ${completedCount})`
    );
  }
}

// ---------------------------------------------------------
// TEST GROUP 2: Deadlock Auto-Pause & State Handling
// ---------------------------------------------------------
console.log('\nTEST GROUP 2: Deadlock Detection Auto-Pause & Status');

{
  const engine = new SimulationEngine({ scenario: SCENARIO_TYPES.DEADLOCK_SCENARIO });
  engine.isRunning = true;

  // Initial step in deadlock scenario
  const res = engine.step();
  const snapshot = engine.getSnapshot();

  assert(res.deadlocked === true, 'SimulationEngine.step() returns deadlocked: true on circular wait');
  assert(engine.isRunning === false, 'SimulationEngine.isRunning is set to false (paused) on deadlock');
  assert(snapshot.deadlockInfo.hasDeadlock === true, 'Snapshot flags deadlockInfo.hasDeadlock: true');
  assert(
    snapshot.deadlockInfo.cycleNodes.length >= 2,
    `Cycle detected with nodes: ${snapshot.deadlockInfo.cycleNodes.join(', ')}`
  );
  assert(
    snapshot.deadlockInfo.involvedJobIds.includes('J101') && snapshot.deadlockInfo.involvedJobIds.includes('J102'),
    'Deadlock cycle involves jobs J101 and J102'
  );

  // Check waiting resource explanation data
  const j101 = snapshot.jobs.J101;
  const j102 = snapshot.jobs.J102;

  assert(j101.state === ProcessState.WAITING, 'J101 state is WAITING');
  assert(j101.waitingForResourceType === 'WELDING', 'J101 waiting for WELDING');
  assert(j101.assignedInstanceId === 'CNC-01', 'J101 holding CNC-01');

  assert(j102.state === ProcessState.WAITING, 'J102 state is WAITING');
  assert(j102.waitingForResourceType === 'CNC', 'J102 waiting for CNC');
  assert(j102.assignedInstanceId === 'WELD-01', 'J102 holding WELD-01');
}

// ---------------------------------------------------------
// TEST GROUP 3: No Duplicate Deadlock Log Spam
// ---------------------------------------------------------
console.log('\nTEST GROUP 3: No Duplicate Deadlock Log Spam');

{
  const engine = new SimulationEngine({ scenario: SCENARIO_TYPES.DEADLOCK_SCENARIO });
  engine.isRunning = true;

  // Step 1: Detects deadlock
  engine.step();

  const countDeadlockEvents = () =>
    engine.eventLog.filter((evt) => evt.eventType === EventType.DEADLOCK_DETECTED).length;

  assert(countDeadlockEvents() === 1, 'Exactly 1 DEADLOCK_DETECTED event logged on initial encounter');

  // Step repeatedly 15 more times in deadlocked state
  for (let s = 1; s <= 15; s++) {
    const r = engine.step();
    assert(r.deadlocked === true, `Repeated step ${s} returns deadlocked: true`);
    assert(engine.isRunning === false, `Repeated step ${s} keeps isRunning = false`);
  }

  assert(
    countDeadlockEvents() === 1,
    `After 15 additional steps, DEADLOCK_DETECTED event count is STILL exactly 1 (no log spam)`
  );
}

// ---------------------------------------------------------
// TEST GROUP 4: OS State Summary Exact Parity
// ---------------------------------------------------------
console.log('\nTEST GROUP 4: OS State Summary Consistency Across Simulation');

{
  const engine = new SimulationEngine({ scenario: SCENARIO_TYPES.HEAVY_LOAD });
  let step = 0;

  while (step < 200) {
    step++;
    const res = engine.step();
    const snapshot = engine.getSnapshot();
    const jobs = Object.values(snapshot.jobs);

    const created = jobs.filter((j) => j.state === ProcessState.CREATED).length;
    const ready = jobs.filter((j) => j.state === ProcessState.READY).length;
    const running = jobs.filter((j) => j.state === ProcessState.RUNNING).length;
    const waiting = jobs.filter((j) => j.state === ProcessState.WAITING).length;
    const completed = jobs.filter((j) => j.state === ProcessState.COMPLETED).length;
    const terminated = jobs.filter((j) => j.state === ProcessState.TERMINATED).length;

    const sum = created + ready + running + waiting + completed + terminated;
    if (sum !== 10) {
      assert(false, `At step ${step}, sum of process states (${sum}) does not equal total jobs (10)`);
    }

    if (res.completed) break;
  }

  assert(true, `All ${step} steps maintained exact state sum equality (Created + Ready + Running + Waiting + Completed + Terminated == 10)`);
}

console.log(`\n====================================================`);
console.log(`  ALL ${checkCount}/${checkCount} FACTORY REGRESSION CHECKS PASSED!`);
console.log(`====================================================\n`);
