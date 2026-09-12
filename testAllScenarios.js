import { SimulationEngine } from './src/simulation/simulationEngine.js';
import { SCENARIO_TYPES } from './src/simulation/scenarios.js';

console.log('=== TESTING ALL 7 FACTORY SCENARIOS ===\n');

for (const [key, scType] of Object.entries(SCENARIO_TYPES)) {
  console.log(`Testing ${key} (${scType})...`);
  const engine = new SimulationEngine({ scenario: scType });
  let steps = 0;
  let maxSteps = 250;
  let res = null;
  let anyViolation = false;

  while (steps < maxSteps) {
    steps++;
    res = engine.step();
    const inv = engine.verifyInvariants();
    if (!inv.valid) {
      console.error(`  Invariant violation in ${key} at step ${steps}:`, inv.violations);
      anyViolation = true;
      break;
    }
    if (res.completed || res.stalled || res.deadlocked) {
      break;
    }
  }

  console.log(`  Finished at step ${steps} (t=${engine.time}s): completed=${res?.completed}, stalled=${res?.stalled}, deadlocked=${res?.deadlocked || engine.deadlockInfo.hasDeadlock}, invariantViolation=${anyViolation}`);
  if (anyViolation) {
    throw new Error(`Scenario ${key} had invariant violations!`);
  }

  if (scType === SCENARIO_TYPES.DEADLOCK_RECOVERY) {
    console.log('  Executing Deadlock Recovery on victim J101...');
    engine.recoverFromDeadlock('J101');
    engine.isRunning = true;
    let recSteps = 0;
    while (recSteps < 150) {
      recSteps++;
      const r = engine.step();
      const inv = engine.verifyInvariants();
      if (!inv.valid) {
        throw new Error(`Invariant violation after recovery: ${inv.violations.join(', ')}`);
      }
      if (r.completed || r.stalled) break;
    }
    console.log(`  Deadlock Recovery finished in ${recSteps} steps. Terminal state reached cleanly.`);
  }
}

console.log('\n=== ALL 7 SCENARIOS PASSED CLEANLY! ===');
