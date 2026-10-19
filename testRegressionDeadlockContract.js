import { readFileSync, existsSync } from 'node:fs';
import { SimulationEngine } from './src/simulation/simulationEngine.js';
import { SCENARIO_TYPES } from './src/simulation/scenarios.js';

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
console.log('  DEADLOCK LAB & RAG DATA-CONTRACT REGRESSION TEST');
console.log('====================================================\n');

// ---------------------------------------------------------
// TEST GROUP 1: NORMAL_PRODUCTION Baseline at t=0
// ---------------------------------------------------------
console.log('TEST GROUP 1: NORMAL_PRODUCTION Snapshot & Data Contract at t=0');
{
  const engine = new SimulationEngine({
    scenario: SCENARIO_TYPES.NORMAL_PRODUCTION,
  });

  const snap = engine.getSnapshot();

  // 1. deadlockInfo must be defined and valid
  assert(snap.deadlockInfo !== undefined && snap.deadlockInfo !== null, 'snapshot.deadlockInfo is defined at t=0');
  assert(snap.deadlockInfo.hasDeadlock === false, 'hasDeadlock is false at t=0');
  assert(Array.isArray(snap.deadlockInfo.cycleNodes), 'cycleNodes is an array');
  assert(snap.deadlockInfo.cycleNodes.length === 0, 'cycleNodes is empty in NORMAL_PRODUCTION');
  assert(Array.isArray(snap.deadlockInfo.involvedJobIds), 'involvedJobIds is an array');
  assert(snap.deadlockInfo.involvedJobIds.length === 0, 'involvedJobIds is empty');
  assert(Array.isArray(snap.deadlockInfo.involvedResourceTypes), 'involvedResourceTypes is an array');
  assert(snap.deadlockInfo.involvedResourceTypes.length === 0, 'involvedResourceTypes is empty');
  assert(typeof snap.deadlockInfo.cycleString === 'string', 'cycleString is a string');
  assert(snap.deadlockInfo.cycleString === '', 'cycleString is empty string when no deadlock');

  // 2. RAG structure check
  assert(snap.deadlockInfo.rag !== undefined && snap.deadlockInfo.rag !== null, 'RAG object is defined');
  assert(Array.isArray(snap.deadlockInfo.rag.nodes), 'rag.nodes is an array');
  assert(snap.deadlockInfo.rag.nodes.length > 0, `rag.nodes has nodes (${snap.deadlockInfo.rag.nodes.length})`);
  assert(Array.isArray(snap.deadlockInfo.rag.edges), 'rag.edges is an array');
  assert(typeof snap.deadlockInfo.rag.adjacencyList === 'object', 'rag.adjacencyList is an object');

  // 3. Coffman conditions check
  assert(snap.deadlockInfo.coffman !== undefined && snap.deadlockInfo.coffman !== null, 'coffman is defined');
  assert(Array.isArray(snap.deadlockInfo.coffman.conditions), 'coffman.conditions is an array');
  assert(snap.deadlockInfo.coffman.conditions.length === 4, 'All 4 Coffman conditions present');
  assert(snap.deadlockInfo.coffman.allConditionsMet === false, 'allConditionsMet is false');
  assert(snap.deadlockInfo.coffman.isDeadlocked === false, 'isDeadlocked is false');
}

// ---------------------------------------------------------
// TEST GROUP 2: DEADLOCK_SCENARIO Cycle Detection & Coffman Evaluation
// ---------------------------------------------------------
console.log('\nTEST GROUP 2: DEADLOCK_SCENARIO Cycle Detection & Coffman Evaluation');
{
  const engine = new SimulationEngine({
    scenario: SCENARIO_TYPES.DEADLOCK_SCENARIO,
  });

  // Step until deadlock
  let deadlocked = false;
  for (let s = 0; s < 50; s++) {
    const res = engine.step();
    if (res.deadlocked || engine.deadlockInfo.hasDeadlock) {
      deadlocked = true;
      break;
    }
  }

  assert(deadlocked === true, 'Deadlock scenario successfully triggered deadlock');
  const snap = engine.getSnapshot();

  assert(snap.deadlockInfo.hasDeadlock === true, 'snapshot.deadlockInfo.hasDeadlock is true');
  assert(snap.deadlockInfo.cycleNodes.length > 0, `cycleNodes populated: [${snap.deadlockInfo.cycleNodes.join(', ')}]`);
  assert(
    snap.deadlockInfo.cycleString.includes('Job J101') && snap.deadlockInfo.cycleString.includes('Job J102'),
    'cycleString identifies circular wait between J101 and J102'
  );
  assert(snap.deadlockInfo.involvedJobIds.includes('J101'), 'involvedJobIds contains J101');
  assert(snap.deadlockInfo.involvedJobIds.includes('J102'), 'involvedJobIds contains J102');
  assert(snap.deadlockInfo.coffman.allConditionsMet === true, 'All 4 Coffman conditions satisfied');
}

// ---------------------------------------------------------
// TEST GROUP 3: Recovery & Reset Safety
// ---------------------------------------------------------
console.log('\nTEST GROUP 3: Deadlock Recovery & Reset State Restoration');
{
  const engine = new SimulationEngine({
    scenario: SCENARIO_TYPES.DEADLOCK_SCENARIO,
  });

  // Step into deadlock
  for (let s = 0; s < 10; s++) {
    const res = engine.step();
    if (res.deadlocked) break;
  }
  assert(engine.deadlockInfo.hasDeadlock === true, 'Engine entered deadlock');

  // Recover by terminating J101
  const recResult = engine.recoverFromDeadlock('J101');
  assert(recResult.victimJobId === 'J101', 'Victim J101 was terminated');
  assert(engine.deadlockInfo.hasDeadlock === false, 'deadlockInfo.hasDeadlock is false after recovery');

  const snapRecovered = engine.getSnapshot();
  assert(snapRecovered.deadlockInfo.hasDeadlock === false, 'snapshot.deadlockInfo.hasDeadlock is false after recovery');
  assert(snapRecovered.deadlockInfo.cycleNodes.length === 0, 'cycleNodes empty after recovery');

  // Reset / switch back to NORMAL_PRODUCTION
  engine.setScenario(SCENARIO_TYPES.NORMAL_PRODUCTION);
  const snapReset = engine.getSnapshot();
  assert(snapReset.deadlockInfo.hasDeadlock === false, 'hasDeadlock is false after reset to NORMAL_PRODUCTION');
  assert(snapReset.deadlockInfo.rag !== null && snapReset.deadlockInfo.rag !== undefined, 'RAG defined after reset');
  assert(snapReset.deadlockInfo.coffman !== null && snapReset.deadlockInfo.coffman !== undefined, 'Coffman defined after reset');
}

// ---------------------------------------------------------
// TEST GROUP 4: Component Prop Contracts & Static Analysis
// ---------------------------------------------------------
console.log('\nTEST GROUP 4: Component Prop Contracts & Defensive Guards');
{
  // 1. Verify ResourceAllocationGraph.jsx
  const ragPath = './src/components/ResourceAllocationGraph.jsx';
  assert(existsSync(ragPath), 'ResourceAllocationGraph.jsx exists');
  const ragContent = readFileSync(ragPath, 'utf-8');

  // Must accept deadlockInfo and fallbacks safely without bare un-guarded destructuring
  assert(!ragContent.includes('const { hasDeadlock, cycleNodes = [], cycleString, coffman, rag } = deadlockInfo;'),
    'ResourceAllocationGraph no longer has bare un-guarded destructuring of deadlockInfo');
  assert(ragContent.includes('effectiveInfo = deadlockInfo ||'),
    'ResourceAllocationGraph normalizes effectiveInfo with fallback');
  assert(ragContent.includes('No deadlock detected — current Resource Allocation Graph is acyclic'),
    'ResourceAllocationGraph renders clean acyclic empty state message');
  assert(ragContent.includes('defaultConditions'),
    'ResourceAllocationGraph provides default fallback Coffman conditions');

  // 2. Verify DeadlockWorkspace.jsx
  const dwPath = './src/components/workspaces/DeadlockWorkspace.jsx';
  assert(existsSync(dwPath), 'DeadlockWorkspace.jsx exists');
  const dwContent = readFileSync(dwPath, 'utf-8');
  assert(dwContent.includes('deadlockInfo={dInfo}'),
    'DeadlockWorkspace passes deadlockInfo={dInfo} to ResourceAllocationGraph');
  assert(dwContent.includes('onOpenRecoveryModal={handleRunRecovery}'),
    'DeadlockWorkspace passes onOpenRecoveryModal to ResourceAllocationGraph');

  // 3. Verify ErrorBoundary.jsx
  const ebPath = './src/components/common/ErrorBoundary.jsx';
  assert(existsSync(ebPath), 'ErrorBoundary.jsx exists');
  const ebContent = readFileSync(ebPath, 'utf-8');
  assert(ebContent.includes('class ErrorBoundary extends React.Component'),
    'ErrorBoundary is implemented as React class component with componentDidCatch');

  // 4. Verify WorkspaceLayout.jsx integrates ErrorBoundary
  const wlPath = './src/components/workspaces/WorkspaceLayout.jsx';
  assert(existsSync(wlPath), 'WorkspaceLayout.jsx exists');
  const wlContent = readFileSync(wlPath, 'utf-8');
  assert(wlContent.includes("import ErrorBoundary from '../common/ErrorBoundary.jsx'"),
    'WorkspaceLayout imports ErrorBoundary');
  assert(wlContent.includes('<ErrorBoundary onGoHome={onGoHome} onReset={onReset}>'),
    'WorkspaceLayout wraps workspace children in ErrorBoundary');
}

console.log('\n====================================================');
console.log(`  ALL ${checkCount}/${checkCount} DEADLOCK DATA-CONTRACT CHECKS PASSED!`);
console.log('====================================================\n');
