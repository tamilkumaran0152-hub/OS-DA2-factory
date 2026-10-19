import { SimulationEngine } from './src/simulation/simulationEngine.js';
import { runAlgorithmBenchmark } from './src/simulation/comparisonLab.js';
import { SCENARIO_TYPES, SCENARIO_METADATA } from './src/simulation/scenarios.js';
import { SchedulingAlgorithm, ResourceType, ResourceState, ProcessState } from './src/simulation/types.js';
import { DEFAULT_MACHINE_COUNTS, normalizeMachineConfig } from './src/simulation/resources.js';

let passedChecks = 0;
let totalChecks = 0;

function assert(condition, message) {
  totalChecks++;
  if (!condition) {
    console.error(`  FAIL [Check ${totalChecks}]: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedChecks++;
  console.log(`  ✓ [Check ${totalChecks}]: ${message}`);
}

console.log('====================================================');
console.log('       SMART FACTORY OS - PHASE 1 AUTOMATED TESTS   ');
console.log('====================================================\n');

// ---------------------------------------------------------
// TEST GROUP 1: Machine Configuration & Dynamic Capacity Derivation
// ---------------------------------------------------------
console.log('TEST GROUP 1: Machine Configuration & Capacity Derivation');

// 1.1 Default configuration creates exactly 9 machines
{
  const sim = new SimulationEngine();
  const snap = sim.getSnapshot();
  const machineIds = Object.keys(snap.machineInstances);

  assert(machineIds.length === 9, `Default config creates exactly 9 machines (actual: ${machineIds.length})`);

  const expectedDefaults = {
    [ResourceType.CNC]: 2,
    [ResourceType.WELDING]: 2,
    [ResourceType.ASSEMBLY]: 2,
    [ResourceType.PAINTING]: 1,
    [ResourceType.PACKAGING]: 2,
  };

  for (const [resType, cap] of Object.entries(expectedDefaults)) {
    assert(snap.resourceTypes[resType].capacity === cap, `Resource ${resType} capacity is ${cap}`);
    assert(snap.semaphores[resType].capacity === cap, `Semaphore ${resType} capacity is ${cap}`);
    assert(snap.semaphores[resType].value === cap, `Semaphore ${resType} initial value is ${cap}`);
    assert(snap.resourceTypes[resType].available === cap, `Resource ${resType} initial available is ${cap}`);
    assert(snap.resourceTypes[resType].allocated === 0, `Resource ${resType} initial allocated is 0`);
  }

  assert(
    machineIds.includes('CNC-01') && machineIds.includes('CNC-02'),
    'Contains default CNC instances CNC-01 and CNC-02'
  );
  assert(
    machineIds.includes('WELD-01') && machineIds.includes('WELD-02'),
    'Contains default WELD instances WELD-01 and WELD-02'
  );
  assert(
    machineIds.includes('PAINT-01') && !machineIds.includes('PAINT-02'),
    'Contains single Painting instance PAINT-01'
  );
}

// 1.2 Custom configuration with CNC=3 and Welding=1
{
  const sim = new SimulationEngine({
    machineConfig: { CNC: 3, Welding: 1 },
  });
  const snap = sim.getSnapshot();
  const machineIds = Object.keys(snap.machineInstances);

  assert(machineIds.length === 9, `CNC=3 and Welding=1 retains total 9 machines (3+1+2+1+2=9)`);
  assert(snap.resourceTypes[ResourceType.CNC].capacity === 3, 'CNC capacity is 3');
  assert(snap.resourceTypes[ResourceType.CNC].available === 3, 'CNC available is 3');
  assert(snap.semaphores[ResourceType.CNC].capacity === 3, 'CNC semaphore capacity is 3');
  assert(snap.semaphores[ResourceType.CNC].value === 3, 'CNC semaphore value is 3');

  const cncInstances = Object.values(snap.machineInstances).filter((m) => m.type === ResourceType.CNC);
  assert(cncInstances.length === 3, `CNC machine instance count is 3 (actual: ${cncInstances.length})`);
  assert(
    cncInstances.map((m) => m.id).sort().join(',') === 'CNC-01,CNC-02,CNC-03',
    'CNC instances dynamically generated as CNC-01, CNC-02, CNC-03'
  );

  assert(snap.resourceTypes[ResourceType.WELDING].capacity === 1, 'Welding capacity is 1');
  assert(snap.resourceTypes[ResourceType.WELDING].available === 1, 'Welding available is 1');
  assert(snap.semaphores[ResourceType.WELDING].capacity === 1, 'Welding semaphore capacity is 1');
  assert(snap.semaphores[ResourceType.WELDING].value === 1, 'Welding semaphore value is 1');

  const weldInstances = Object.values(snap.machineInstances).filter((m) => m.type === ResourceType.WELDING);
  assert(weldInstances.length === 1 && weldInstances[0].id === 'WELD-01', 'Welding instance dynamically generated as WELD-01');

  // Verify snapshots reflect machineConfig
  assert(snap.machineConfig !== null && snap.machineConfig.CNC === 3 && snap.machineConfig.WELDING === 1, 'Snapshot includes machineConfig');
}

// 1.3 Custom configuration with case-insensitivity & aliases
{
  const sim = new SimulationEngine({
    machineConfig: { cnc: 4, weld: 3, assembly: 1, paint: 2, packaging: 1 },
  });
  const snap = sim.getSnapshot();
  const machineCount = Object.keys(snap.machineInstances).length;
  assert(machineCount === 11, `Custom 4+3+1+2+1 creates 11 machines (actual: ${machineCount})`);
  assert(snap.resourceTypes.CNC.capacity === 4, 'CNC capacity is 4');
  assert(snap.resourceTypes.WELDING.capacity === 3, 'Welding capacity is 3');
  assert(snap.resourceTypes.ASSEMBLY.capacity === 1, 'Assembly capacity is 1');
  assert(snap.resourceTypes.PAINTING.capacity === 2, 'Painting capacity is 2');
  assert(snap.resourceTypes.PACKAGING.capacity === 1, 'Packaging capacity is 1');
}

// 1.4 Invalid machine counts are rejected safely
{
  const invalidCases = [
    { config: { CNC: 0 }, desc: 'zero count' },
    { config: { CNC: -2 }, desc: 'negative count' },
    { config: { CNC: 1.5 }, desc: 'non-integer count' },
    { config: { CNC: 'two' }, desc: 'string count' },
    { config: { CNC: NaN }, desc: 'NaN count' },
    { config: { INVALID_TYPE: 2 }, desc: 'unknown workstation type' },
    { config: 'not-an-object', desc: 'primitive string config' },
    { config: [1, 2, 3], desc: 'array config' },
  ];

  for (const { config, desc } of invalidCases) {
    let threw = false;
    try {
      new SimulationEngine({ machineConfig: config });
    } catch {
      threw = true;
    }
    assert(threw, `Safely rejected invalid machine configuration: ${desc}`);
  }
}

// ---------------------------------------------------------
// TEST GROUP 2: Algorithm Selection & Preservation
// ---------------------------------------------------------
console.log('\nTEST GROUP 2: Algorithm Selection & Preservation');

// 2.1 Constructor explicitly selected algorithm is preserved
{
  const algos = [
    SchedulingAlgorithm.FCFS,
    SchedulingAlgorithm.SJF,
    SchedulingAlgorithm.PRIORITY,
    SchedulingAlgorithm.ROUND_ROBIN,
  ];

  for (const algo of algos) {
    const sim = new SimulationEngine({ algorithm: algo });
    assert(sim.algorithm === algo, `Constructor preserves explicit algorithm ${algo}`);
    assert(sim.userExplicitAlgorithm === true, `userExplicitAlgorithm flag set for ${algo}`);
    const snap = sim.getSnapshot();
    assert(snap.algorithm === algo, `Snapshot reports selected algorithm ${algo}`);
  }
}

// 2.2 Algorithm preserved through reset()
{
  const sim = new SimulationEngine({
    scenario: SCENARIO_TYPES.NORMAL_PRODUCTION,
    algorithm: SchedulingAlgorithm.PRIORITY,
  });
  assert(sim.algorithm === SchedulingAlgorithm.PRIORITY, 'Initial algorithm is PRIORITY');
  sim.reset();
  assert(
    sim.algorithm === SchedulingAlgorithm.PRIORITY,
    'Algorithm remained PRIORITY after reset() (not overwritten by FCFS scenario default)'
  );
}

// 2.3 Algorithm preserved through setScenario() unless user explicitly chooses default
{
  const sim = new SimulationEngine({
    scenario: SCENARIO_TYPES.NORMAL_PRODUCTION,
    algorithm: SchedulingAlgorithm.PRIORITY,
  });

  // Switch to RESOURCE_CONTENTION (which recommends SJF)
  sim.setScenario(SCENARIO_TYPES.RESOURCE_CONTENTION);
  assert(
    sim.algorithm === SchedulingAlgorithm.PRIORITY,
    'Explicit algorithm PRIORITY preserved across setScenario() without useRecommended flag'
  );

  // Switch to HEAVY_LOAD (which recommends ROUND_ROBIN)
  sim.setScenario(SCENARIO_TYPES.HEAVY_LOAD);
  assert(
    sim.algorithm === SchedulingAlgorithm.PRIORITY,
    'Explicit algorithm PRIORITY preserved across setScenario(HEAVY_LOAD)'
  );

  // User explicitly opts to use scenario recommended default
  sim.setScenario(SCENARIO_TYPES.RESOURCE_CONTENTION, { useRecommendedAlgorithm: true });
  assert(
    sim.algorithm === SchedulingAlgorithm.SJF,
    'setScenario with useRecommendedAlgorithm: true switches algorithm to scenario default (SJF)'
  );

  // When sim was initialized without explicit algorithm, scenario changes update default
  const defaultSim = new SimulationEngine({ scenario: SCENARIO_TYPES.NORMAL_PRODUCTION });
  assert(defaultSim.algorithm === SchedulingAlgorithm.FCFS, 'Default sim uses FCFS');
  defaultSim.setScenario(SCENARIO_TYPES.RESOURCE_CONTENTION);
  assert(defaultSim.algorithm === SchedulingAlgorithm.SJF, 'Unconfigured sim switches to scenario default SJF');
  defaultSim.setScenario(SCENARIO_TYPES.HEAVY_LOAD);
  assert(defaultSim.algorithm === SchedulingAlgorithm.ROUND_ROBIN, 'Unconfigured sim switches to scenario default ROUND_ROBIN');
}

// 2.4 setAlgorithm and useScenarioRecommendedAlgorithm helper
{
  const sim = new SimulationEngine({ scenario: SCENARIO_TYPES.NORMAL_PRODUCTION });
  sim.setAlgorithm(SchedulingAlgorithm.ROUND_ROBIN);
  assert(sim.algorithm === SchedulingAlgorithm.ROUND_ROBIN, 'setAlgorithm changes algorithm to ROUND_ROBIN');
  assert(sim.userExplicitAlgorithm === true, 'userExplicitAlgorithm is true after setAlgorithm');

  sim.useScenarioRecommendedAlgorithm();
  assert(
    sim.algorithm === SchedulingAlgorithm.FCFS,
    'useScenarioRecommendedAlgorithm resets algorithm to scenario default FCFS'
  );
  assert(sim.userExplicitAlgorithm === false, 'userExplicitAlgorithm cleared after useScenarioRecommendedAlgorithm');
}

// ---------------------------------------------------------
// TEST GROUP 3: Comparison Lab Benchmark Propagation
// ---------------------------------------------------------
console.log('\nTEST GROUP 3: Comparison Lab Benchmark Propagation');

{
  const bench = runAlgorithmBenchmark(SCENARIO_TYPES.RESOURCE_CONTENTION, 35);
  assert(bench.results.length === 5, 'Benchmark runs all 5 scheduling policies');

  const policies = bench.results.map((r) => r.algorithm);
  assert(
    policies.includes(SchedulingAlgorithm.FCFS) &&
      policies.includes(SchedulingAlgorithm.SJF) &&
      policies.includes(SchedulingAlgorithm.PRIORITY) &&
      policies.includes(SchedulingAlgorithm.ROUND_ROBIN),
    'Benchmark accurately tests FCFS, SJF, Priority, and Round Robin'
  );

  for (const r of bench.results) {
    assert(r.algo === r.algorithm, `Result row ${r.name} exposes matching algo (${r.algo}) and algorithm (${r.algorithm})`);
    assert(r.completedCount === 6, `Result row ${r.name} completed all 6 jobs`);
    assert(typeof r.avgWaitingTime === 'number' && !isNaN(r.avgWaitingTime), `Valid avgWaitingTime for ${r.name}`);
    assert(typeof r.avgResponseTime === 'number' && !isNaN(r.avgResponseTime), `Valid avgResponseTime for ${r.name}`);
  }

  // Verify that metrics differ genuinely based on real algorithm decisions
  const wtValues = bench.results.map((r) => r.avgWaitingTime);
  const rtValues = bench.results.map((r) => r.avgResponseTime);
  const distinctRT = new Set(rtValues);
  assert(
    distinctRT.size > 1,
    `Genuinely computed metrics across different algorithms under contention (distinct RT counts: ${distinctRT.size})`
  );

  assert(
    typeof bench.analysis.bestForWaitingTime === 'string' && bench.analysis.bestForWaitingTime.length > 0,
    `Best for WT analyzed: ${bench.analysis.bestForWaitingTime}`
  );
  assert(
    typeof bench.analysis.bestForResponseTime === 'string' && bench.analysis.bestForResponseTime.length > 0,
    `Best for RT analyzed: ${bench.analysis.bestForResponseTime}`
  );
  assert(
    bench.analysis.commentary.includes('initial machine response'),
    'Commentary generated correctly without undefined algo token'
  );

  // Custom machine config benchmark
  const customBench = runAlgorithmBenchmark(SCENARIO_TYPES.NORMAL_PRODUCTION, 35, { CNC: 3, Welding: 1 });
  assert(customBench.machineConfig !== null && customBench.machineConfig.CNC === 3, 'Comparison lab supports custom machineConfig');
}

// ---------------------------------------------------------
// TEST GROUP 4: Resource Allocation, Handover & Invariant Consistency
// ---------------------------------------------------------
console.log('\nTEST GROUP 4: Resource Allocation, Handover & Invariant Integrity');

{
  const sim = new SimulationEngine({
    scenario: SCENARIO_TYPES.RESOURCE_CONTENTION,
    algorithm: SchedulingAlgorithm.FCFS,
  });

  // Verify initial invariants
  const inv0 = sim.verifyInvariants();
  assert(inv0.valid, 'Initial invariants valid');

  // Step into full contention: CNC saturated
  for (let s = 0; s < 10; s++) {
    sim.step();
    const inv = sim.verifyInvariants();
    assert(inv.valid, `Invariants hold at step ${s + 1}`);
  }

  const snapContention = sim.getSnapshot();
  const cnc = snapContention.resourceTypes.CNC;
  const sem = snapContention.semaphores.CNC;

  assert(cnc.allocated === 2, `CNC fully allocated (allocated=2)`);
  assert(cnc.available === 0, `CNC available=0`);
  assert(sem.value === 0, `CNC semaphore value=0`);
  assert(sem.waitingQueue.length > 0, `CNC semaphore queue has blocked jobs`);
  assert(sem.allocatedJobs.length === 2, `Semaphore allocatedJobs has exactly 2 jobs`);

  // Ensure semaphore allocatedJobs strictly matches physical machine assignments
  const assignedJobs = Object.values(snapContention.machineInstances)
    .filter((m) => m.type === ResourceType.CNC && m.state === ResourceState.RUNNING)
    .map((m) => m.currentJobId)
    .sort();
  const semJobs = [...sem.allocatedJobs].sort();
  assert(
    JSON.stringify(assignedJobs) === JSON.stringify(semJobs),
    `Physical machine owners [${assignedJobs.join(',')}] strictly match semaphore.allocatedJobs [${semJobs.join(',')}]`
  );

  // Advance simulation to completion and verify invariants at every single step
  let steps = 0;
  let maxSteps = 250;
  while (steps < maxSteps) {
    steps++;
    const res = sim.step();
    const inv = sim.verifyInvariants();
    if (!inv.valid) {
      assert(false, `Invariant violation at step ${steps}: ${inv.violations.join('; ')}`);
    }
    if (res.completed) break;
  }

  assert(steps < maxSteps, `Simulation reached completion without stalling (step count: ${steps})`);
  const finalSnap = sim.getSnapshot();
  for (const [rt, res] of Object.entries(finalSnap.resourceTypes)) {
    assert(res.allocated === 0, `Final allocated for ${rt} is 0`);
    assert(res.available === res.capacity, `Final available for ${rt} equals capacity (${res.capacity})`);
    assert(finalSnap.semaphores[rt].value === res.capacity, `Final semaphore value for ${rt} equals capacity`);
    assert(finalSnap.semaphores[rt].allocatedJobs.length === 0, `Final allocatedJobs for ${rt} is empty`);
    assert(finalSnap.semaphores[rt].waitingQueue.length === 0, `Final waitingQueue for ${rt} is empty`);
  }
}

// ---------------------------------------------------------
// TEST GROUP 5: All 7 Scenarios Baseline Integrity
// ---------------------------------------------------------
console.log('\nTEST GROUP 5: All 7 Scenarios Baseline Integrity');

const scenarios = [
  SCENARIO_TYPES.NORMAL_PRODUCTION,
  SCENARIO_TYPES.RESOURCE_CONTENTION,
  SCENARIO_TYPES.BANKER_SAFE_REQUEST,
  SCENARIO_TYPES.BANKER_UNSAFE_REQUEST,
  SCENARIO_TYPES.DEADLOCK_SCENARIO,
  SCENARIO_TYPES.DEADLOCK_RECOVERY,
  SCENARIO_TYPES.HEAVY_LOAD,
];

for (const sc of scenarios) {
  const meta = SCENARIO_METADATA[sc];
  const sim = new SimulationEngine({ scenario: sc });

  let steps = 0;
  let maxSteps = 250;
  let finished = false;
  let deadlocked = false;

  while (steps < maxSteps) {
    steps++;
    const res = sim.step();
    const inv = sim.verifyInvariants();
    if (!inv.valid) {
      assert(false, `Scenario ${sc} invariant violation at step ${steps}: ${inv.violations.join('; ')}`);
    }

    if (res.deadlocked) {
      deadlocked = true;
      break;
    }
    if (res.completed) {
      finished = true;
      break;
    }
  }

  if (sc === SCENARIO_TYPES.DEADLOCK_SCENARIO) {
    assert(deadlocked || sim.deadlockInfo.hasDeadlock, `Scenario ${meta.title} detected deadlock as expected`);
  } else if (sc === SCENARIO_TYPES.DEADLOCK_RECOVERY) {
    assert(deadlocked || sim.deadlockInfo.hasDeadlock, `Scenario ${meta.title} reached deadlock before recovery`);
    // Execute recovery
    const victim = sim.deadlockInfo.involvedJobIds?.[0] || 'J101';
    const recRes = sim.recoverFromDeadlock(victim);
    assert(recRes.unblockedJobs.length > 0, `Recovery on ${victim} unblocked waiting jobs`);
    assert(!sim.deadlockInfo.hasDeadlock, 'Deadlock cleared after recovery');

    // Finish simulation
    let postSteps = 0;
    while (postSteps < 200) {
      postSteps++;
      const res = sim.step();
      const inv = sim.verifyInvariants();
      assert(inv.valid, `Post-recovery invariants valid at step ${postSteps}`);
      if (res.completed || res.stalled) break;
    }
  } else {
    assert(finished, `Scenario ${meta.title} completed successfully in ${steps} steps`);
  }
}

console.log('\n====================================================');
console.log(`  ALL ${passedChecks}/${totalChecks} AUTOMATED CHECKS PASSED PERFECTLY!`);
console.log('====================================================\n');
