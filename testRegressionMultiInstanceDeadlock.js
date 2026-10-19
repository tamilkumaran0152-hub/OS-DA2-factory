import { readFileSync, existsSync } from 'node:fs';
import { SimulationEngine } from './src/simulation/simulationEngine.js';
import { SCENARIO_TYPES, buildScenarioState } from './src/simulation/scenarios.js';
import { ResourceType, ProcessState } from './src/simulation/types.js';
import { DeadlockDetector } from './src/simulation/deadlock.js';
import { BankersAlgorithm } from './src/simulation/banker.js';

let checkCount = 0;
function assert(condition, message) {
  checkCount++;
  if (!condition) {
    console.error(`❌ Check ${checkCount} FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ [Check ${checkCount}]: ${message}`);
}

console.log('================================================================');
console.log('  MULTI-INSTANCE DEADLOCK DETECTION & OS CORRECTNESS REGRESSION');
console.log('================================================================\n');

const detector = new DeadlockDetector();
const banker = new BankersAlgorithm();

// ---------------------------------------------------------------------------
// TEST 1: Single-Instance True Deadlock
// J101 holds CNC (cap 1), requests WELDING
// J102 holds WELDING (cap 1), requests CNC
// available CNC=0, WELDING=0 => Confirmed Deadlock
// ---------------------------------------------------------------------------
console.log('TEST 1: Single-instance true deadlock (CNC=1, WELDING=1)');
{
  const { jobs, resourceTypes } = buildScenarioState(SCENARIO_TYPES.DEADLOCK_SCENARIO);

  assert(resourceTypes[ResourceType.CNC].capacity === 1, 'CNC capacity is 1 in controlled scenario');
  assert(resourceTypes[ResourceType.WELDING].capacity === 1, 'WELDING capacity is 1 in controlled scenario');
  assert(resourceTypes[ResourceType.CNC].available === 0, 'CNC available is 0');
  assert(resourceTypes[ResourceType.WELDING].available === 0, 'WELDING available is 0');
  assert(jobs.J101.currentAllocations[ResourceType.CNC] === 1, 'J101 holds CNC');
  assert(jobs.J101.waitingForResourceType === ResourceType.WELDING, 'J101 requests WELDING');
  assert(jobs.J102.currentAllocations[ResourceType.WELDING] === 1, 'J102 holds WELDING');
  assert(jobs.J102.waitingForResourceType === ResourceType.CNC, 'J102 requests CNC');

  const rag = detector.buildRAG(jobs, resourceTypes);
  const cycleResult = detector.detectCycle(rag);
  const deadlockResult = detector.detectDeadlock(jobs, resourceTypes);
  const coffman = detector.evaluateCoffmanConditions(jobs, resourceTypes, cycleResult, deadlockResult);

  assert(cycleResult.hasCycle === true, 'RAG contains directed cycle');
  assert(deadlockResult.hasDeadlock === true, 'Multi-instance detection confirms DEADLOCK');
  assert(deadlockResult.deadlockedJobIds.includes('J101'), 'deadlockedJobIds contains J101');
  assert(deadlockResult.deadlockedJobIds.includes('J102'), 'deadlockedJobIds contains J102');
  assert(coffman.conditions.find(c => c.name === 'Mutual Exclusion').satisfied === true, 'Mutual Exclusion satisfied (fixtures are non-shareable)');
  assert(coffman.conditions.find(c => c.name === 'No Preemption').satisfied === true, 'No Preemption satisfied (workpieces cannot be seized)');
  assert(coffman.conditions.find(c => c.name === 'Hold and Wait').satisfied === true, 'Hold and Wait satisfied (J101/J102 hold and wait)');
  assert(coffman.conditions.find(c => c.name === 'Circular Wait').satisfied === true, 'Circular Wait satisfied (directed cycle)');
  assert(coffman.allConditionsMet === true, 'All 4 Coffman conditions satisfied');
  assert(coffman.isDeadlocked === true, 'Coffman evaluates isDeadlocked as true');
}

// ---------------------------------------------------------------------------
// TEST 2: Multi-Instance Cycle but NO Deadlock
// CNC capacity=2, WELDING capacity=2
// J101 holds CNC-01 and requests WELDING
// J102 holds WELD-01 and requests CNC
// BUT J103 holds CNC-02 and J105 holds WELD-02 without waiting requests
// J103 and J105 can finish and release instances => cycle detected but deadlock=false!
// ---------------------------------------------------------------------------
console.log('\nTEST 2: Multi-instance cycle but no deadlock (CNC=2, WELDING=2 with outside workers)');
{
  const { jobs, resourceTypes } = buildScenarioState(SCENARIO_TYPES.NORMAL_PRODUCTION, {
    [ResourceType.CNC]: 2,
    [ResourceType.WELDING]: 2,
  });

  // Setup the exact observed state from the problem statement:
  // CNC = 2, WELDING = 2
  // CNC-01 -> J101, CNC-02 -> J103
  // WELD-01 -> J102, WELD-02 -> J105
  // J101 requests WELDING, J102 requests CNC
  jobs.J101.state = ProcessState.WAITING;
  jobs.J101.currentAllocations[ResourceType.CNC] = 1;
  jobs.J101.assignedInstanceId = 'CNC-01';
  jobs.J101.waitingForResourceType = ResourceType.WELDING;

  jobs.J102.state = ProcessState.WAITING;
  jobs.J102.currentAllocations[ResourceType.WELDING] = 1;
  jobs.J102.assignedInstanceId = 'WELD-01';
  jobs.J102.waitingForResourceType = ResourceType.CNC;

  jobs.J103.state = ProcessState.RUNNING;
  jobs.J103.currentAllocations[ResourceType.CNC] = 1;
  jobs.J103.assignedInstanceId = 'CNC-02';
  jobs.J103.waitingForResourceType = null;

  jobs.J105.state = ProcessState.RUNNING;
  jobs.J105.currentAllocations[ResourceType.WELDING] = 1;
  jobs.J105.assignedInstanceId = 'WELD-02';
  jobs.J105.waitingForResourceType = null;

  resourceTypes[ResourceType.CNC].capacity = 2;
  resourceTypes[ResourceType.CNC].allocated = 2;
  resourceTypes[ResourceType.CNC].available = 0;
  resourceTypes[ResourceType.CNC].waitingQueue = ['J102'];

  resourceTypes[ResourceType.WELDING].capacity = 2;
  resourceTypes[ResourceType.WELDING].allocated = 2;
  resourceTypes[ResourceType.WELDING].available = 0;
  resourceTypes[ResourceType.WELDING].waitingQueue = ['J101'];

  const rag = detector.buildRAG(jobs, resourceTypes);
  const cycleResult = detector.detectCycle(rag);
  const deadlockResult = detector.detectDeadlock(jobs, resourceTypes);

  // RAG contains cycle: J101 -> WELDING -> J102 -> CNC -> J101
  assert(cycleResult.hasCycle === true, 'RAG correctly detects cycle between J101 and J102');
  assert(cycleResult.involvedJobIds.includes('J101') && cycleResult.involvedJobIds.includes('J102'), 'Cycle involves J101 and J102');

  // BUT Multi-Instance detection algorithm proves system can make progress
  assert(deadlockResult.hasDeadlock === false, 'CRITICAL FIX: deadlockResult.hasDeadlock is FALSE because J103/J105 can release instances');
  assert(deadlockResult.deadlockedJobIds.length === 0, 'deadlockedJobIds is empty');
  assert(deadlockResult.unblockedSequence.length > 0, `Unblocked reduction sequence found: < ${deadlockResult.unblockedSequence.join(' → ')} >`);
  assert(deadlockResult.unblockedSequence.includes('J103'), 'Reduction sequence successfully unblocks J103');
  assert(deadlockResult.unblockedSequence.includes('J105'), 'Reduction sequence successfully unblocks J105');
  assert(deadlockResult.unblockedSequence.includes('J101'), 'Reduction sequence subsequently unblocks J101');
  assert(deadlockResult.unblockedSequence.includes('J102'), 'Reduction sequence subsequently unblocks J102');
}

// ---------------------------------------------------------------------------
// TEST 3: Multi-Instance Confirmed Deadlock
// All instances needed for progress are trapped in cross-waits
// CNC=2, WELDING=2
// J101 holds CNC-01, requests WELDING
// J103 holds CNC-02, requests WELDING
// J102 holds WELD-01, requests CNC
// J105 holds WELD-02, requests CNC
// No outside process holds CNC or WELDING => Confirmed Multi-Instance Deadlock
// ---------------------------------------------------------------------------
console.log('\nTEST 3: Multi-instance confirmed deadlock (all instances trapped)');
{
  const { jobs, resourceTypes } = buildScenarioState(SCENARIO_TYPES.NORMAL_PRODUCTION, {
    [ResourceType.CNC]: 2,
    [ResourceType.WELDING]: 2,
  });

  jobs.J101.state = ProcessState.WAITING;
  jobs.J101.currentAllocations[ResourceType.CNC] = 1;
  jobs.J101.waitingForResourceType = ResourceType.WELDING;

  jobs.J103.state = ProcessState.WAITING;
  jobs.J103.currentAllocations[ResourceType.CNC] = 1;
  jobs.J103.waitingForResourceType = ResourceType.WELDING;

  jobs.J102.state = ProcessState.WAITING;
  jobs.J102.currentAllocations[ResourceType.WELDING] = 1;
  jobs.J102.waitingForResourceType = ResourceType.CNC;

  jobs.J105.state = ProcessState.WAITING;
  jobs.J105.currentAllocations[ResourceType.WELDING] = 1;
  jobs.J105.waitingForResourceType = ResourceType.CNC;

  resourceTypes[ResourceType.CNC].capacity = 2;
  resourceTypes[ResourceType.CNC].allocated = 2;
  resourceTypes[ResourceType.CNC].available = 0;
  resourceTypes[ResourceType.CNC].waitingQueue = ['J102', 'J105'];

  resourceTypes[ResourceType.WELDING].capacity = 2;
  resourceTypes[ResourceType.WELDING].allocated = 2;
  resourceTypes[ResourceType.WELDING].available = 0;
  resourceTypes[ResourceType.WELDING].waitingQueue = ['J101', 'J103'];

  const deadlockResult = detector.detectDeadlock(jobs, resourceTypes);

  assert(deadlockResult.hasDeadlock === true, 'Multi-instance detection confirms deadlock when all instances are trapped');
  assert(deadlockResult.deadlockedJobIds.length === 4, 'All 4 processes trapped in cross-hold are deadlocked');
  assert(deadlockResult.deadlockedJobIds.includes('J101'), 'Trapped includes J101');
  assert(deadlockResult.deadlockedJobIds.includes('J102'), 'Trapped includes J102');
  assert(deadlockResult.deadlockedJobIds.includes('J103'), 'Trapped includes J103');
  assert(deadlockResult.deadlockedJobIds.includes('J105'), 'Trapped includes J105');
}

// ---------------------------------------------------------------------------
// TEST 4: Banker / Deadlock Consistency Test
// For the same snapshot, Banker and Deadlock analysis must NEVER contradict each other:
// If Banker says state is SAFE => Deadlock Lab must NOT mark state as confirmed deadlock!
// ---------------------------------------------------------------------------
console.log('\nTEST 4: Banker / Deadlock cross-subsystem consistency');
{
  const scenariosToAudit = [
    SCENARIO_TYPES.NORMAL_PRODUCTION,
    SCENARIO_TYPES.RESOURCE_CONTENTION,
    SCENARIO_TYPES.BANKER_SAFE_REQUEST,
    SCENARIO_TYPES.DEADLOCK_SCENARIO,
  ];

  for (const scen of scenariosToAudit) {
    const engine = new SimulationEngine({ scenario: scen });
    const snap = engine.getSnapshot();

    const bankerState = banker.buildMatrices(engine.jobs, engine.resourceTypes);
    const safetyResult = banker.runSafetyAlgorithm(bankerState);
    const deadlockResult = detector.detectDeadlock(engine.jobs, engine.resourceTypes);

    if (safetyResult.isSafe) {
      assert(
        deadlockResult.hasDeadlock === false,
        `Consistency in ${scen}: Banker is SAFE => Deadlock detection MUST be false (got hasDeadlock=${deadlockResult.hasDeadlock})`
      );
    }

    if (deadlockResult.hasDeadlock) {
      assert(
        safetyResult.isSafe === false,
        `Consistency in ${scen}: Deadlock is CONFIRMED => Banker MUST be UNSAFE (got isSafe=${safetyResult.isSafe})`
      );
    }
  }

  // Cross-audit the Test 2 state (cycle exists, but safe sequence exists)
  {
    const { jobs, resourceTypes } = buildScenarioState(SCENARIO_TYPES.NORMAL_PRODUCTION, {
      [ResourceType.CNC]: 2,
      [ResourceType.WELDING]: 2,
    });
    jobs.J101.state = ProcessState.WAITING;
    jobs.J101.currentAllocations[ResourceType.CNC] = 1;
    jobs.J101.waitingForResourceType = ResourceType.WELDING;

    jobs.J102.state = ProcessState.WAITING;
    jobs.J102.currentAllocations[ResourceType.WELDING] = 1;
    jobs.J102.waitingForResourceType = ResourceType.CNC;

    jobs.J103.state = ProcessState.RUNNING;
    jobs.J103.currentAllocations[ResourceType.CNC] = 1;

    jobs.J105.state = ProcessState.RUNNING;
    jobs.J105.currentAllocations[ResourceType.WELDING] = 1;

    resourceTypes[ResourceType.CNC].capacity = 2;
    resourceTypes[ResourceType.CNC].allocated = 2;
    resourceTypes[ResourceType.CNC].available = 0;
    resourceTypes[ResourceType.CNC].waitingQueue = ['J102'];

    resourceTypes[ResourceType.WELDING].capacity = 2;
    resourceTypes[ResourceType.WELDING].allocated = 2;
    resourceTypes[ResourceType.WELDING].available = 0;
    resourceTypes[ResourceType.WELDING].waitingQueue = ['J101'];

    const bankerState = banker.buildMatrices(jobs, resourceTypes);
    const safetyResult = banker.runSafetyAlgorithm(bankerState);
    const deadlockResult = detector.detectDeadlock(jobs, resourceTypes);

    assert(safetyResult.isSafe === true, "Banker evaluates state as SAFE via unblocked workers J105/J103");
    assert(deadlockResult.hasDeadlock === false, "Deadlock detection agrees: hasDeadlock is FALSE");
    assert(
      !(safetyResult.isSafe && deadlockResult.hasDeadlock),
      "ZERO CONTRADICTION: Banker and Deadlock Lab never disagree on safety of progress"
    );
  }
}

// ---------------------------------------------------------------------------
// TEST 5: Recovery Controls and UI Labels
// Recovery controls only become enabled for confirmed deadlock
// Scenario name has no "5." prefix
// ---------------------------------------------------------------------------
console.log('\nTEST 5: Recovery controls and UI labels');
{
  const dwPath = './src/components/workspaces/DeadlockWorkspace.jsx';
  const ragPath = './src/components/ResourceAllocationGraph.jsx';
  const scnPath = './src/simulation/scenarios.js';

  assert(existsSync(dwPath), 'DeadlockWorkspace.jsx exists');
  assert(existsSync(ragPath), 'ResourceAllocationGraph.jsx exists');
  assert(existsSync(scnPath), 'scenarios.js exists');

  const dwContent = readFileSync(dwPath, 'utf-8');
  const ragContent = readFileSync(ragPath, 'utf-8');
  const scnContent = readFileSync(scnPath, 'utf-8');

  // Verify prefix removed
  assert(!scnContent.includes("'5. Deadlock Detection Scenario'"), 'scenarios.js: "5." prefix removed from title');
  assert(scnContent.includes("'Deadlock Detection Scenario'"), 'scenarios.js: title is "Deadlock Detection Scenario"');
  assert(!dwContent.includes('5. Deadlock Detection Scenario'), 'DeadlockWorkspace: "5." prefix removed from dropdown option');

  // Verify UI label for cycle without deadlock
  assert(
    dwContent.includes('Circular dependency detected — progress still possible'),
    'DeadlockWorkspace displays "Circular dependency detected — progress still possible" when cycle exists without confirmed deadlock'
  );
  assert(
    dwContent.includes('DEADLOCK CONFIRMED'),
    'DeadlockWorkspace displays "DEADLOCK CONFIRMED" when multi-instance deadlock is confirmed'
  );

  // Verify recovery panel is guarded by hasDeadlock (not mere hasCycle)
  assert(
    dwContent.includes('{hasDeadlock && ('),
    'Deadlock recovery victim panel strictly guarded by hasDeadlock === true'
  );
  assert(
    ragContent.includes('hasDeadlock ? ('),
    'ResourceAllocationGraph strictly differentiates hasDeadlock from hasCycle'
  );
  assert(
    ragContent.includes('Circular dependency detected — progress still possible'),
    'ResourceAllocationGraph displays progress still possible badge when cycle is unconfirmed deadlock'
  );
}

console.log('\n================================================================');
console.log(`  ALL ${checkCount}/${checkCount} MULTI-INSTANCE DEADLOCK AUDIT CHECKS PASSED!`);
console.log('================================================================\n');
