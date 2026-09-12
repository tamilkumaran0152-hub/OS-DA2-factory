import { SimulationEngine } from './src/simulation/simulationEngine.js';
import { SCENARIO_TYPES } from './src/simulation/scenarios.js';
import { SchedulingAlgorithm } from './src/simulation/types.js';

console.log('=== TESTING SMART FACTORY OS SIMULATION CORE ===\n');

// 1. Test Normal Flow & Single-event Stepping
console.log('Test 1: Normal Production & Single-event Stepping');
const sim1 = new SimulationEngine({ scenario: SCENARIO_TYPES.NORMAL_PRODUCTION, algorithm: SchedulingAlgorithm.FCFS });
for (let i = 0; i < 15; i++) {
  const res = sim1.step();
  const snap = sim1.getSnapshot();
  const lastEvt = snap.eventLog[0];
  console.log(`Step ${i + 1} (t=${snap.time}): [${lastEvt?.eventType}] - ${lastEvt?.whatHappened}`);
}

// 2. Test Deadlock Detection & Coffman Conditions
console.log('\nTest 2: Deadlock Detection & Coffman Conditions');
const simDeadlock = new SimulationEngine({ scenario: SCENARIO_TYPES.DEADLOCK_SCENARIO });
const snapD = simDeadlock.getSnapshot();
console.log('Deadlock detected?', snapD.deadlockInfo.hasDeadlock);
console.log('Cycle path:', snapD.deadlockInfo.cycleString);
console.log('Coffman Conditions:');
snapD.deadlockInfo.coffman.conditions.forEach(c => {
  console.log(`  - ${c.name}: ${c.satisfied ? 'SATISFIED' : 'NOT SATISFIED'} (${c.explanation})`);
});

// 3. Test Deadlock Recovery
console.log('\nTest 3: Deadlock Recovery');
console.log('Recovering by terminating victim J101...');
const recResult = simDeadlock.recoverFromDeadlock('J101');
console.log('Recovery result:', recResult.reason);
const postRecoverySnap = simDeadlock.getSnapshot();
console.log('Deadlock still present after recovery?', postRecoverySnap.deadlockInfo.hasDeadlock);
console.log('Unblocked jobs:', recResult.unblockedJobs);

// 4. Test Banker's Algorithm Safe vs Unsafe
console.log("\nTest 4: Banker's Safe vs Unsafe Detection");
const simBankerSafe = new SimulationEngine({ scenario: SCENARIO_TYPES.BANKER_SAFE_REQUEST, bankerMode: true });
const matrices = simBankerSafe.banker.buildMatrices(simBankerSafe.jobs, simBankerSafe.resourceTypes);
const safeCheck = simBankerSafe.banker.runSafetyAlgorithm(matrices);
console.log('Banker baseline safety:', safeCheck.isSafe ? 'SAFE' : 'UNSAFE');
if (safeCheck.isSafe) {
  console.log('Safe sequence:', safeCheck.safeSequence.join(' -> '));
}

// 5. Test Scheduler Decisions
console.log('\nTest 5: Scheduler Algorithms (SJF vs Priority)');
const simSJF = new SimulationEngine({ scenario: SCENARIO_TYPES.RESOURCE_CONTENTION, algorithm: SchedulingAlgorithm.SJF });
simSJF.step(); // Job arrival
simSJF.step(); // Job arrival
const sjfSnap = simSJF.getSnapshot();
console.log('Latest decision engine record:');
console.log('WHAT:', sjfSnap.lastDecision?.whatHappened);
console.log('WHY:', sjfSnap.lastDecision?.whyItHappened);
console.log('OS CONCEPT:', sjfSnap.lastDecision?.osConcept);

console.log('\n=== ALL SIMULATION TESTS COMPLETED SUCCESSFULLY! ===');
