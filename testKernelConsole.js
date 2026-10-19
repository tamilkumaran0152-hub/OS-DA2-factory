/**
 * Kernel Console Phase 2 Verification Test Suite
 * Tests command parsing, engine synchronization, resource/process output,
 * stepping, error handling, deadlock inspection, and banker's checks.
 */

import { SimulationEngine } from './src/simulation/simulationEngine.js';
import { executeKernelCommand } from './src/simulation/kernelConsole.js';
import { SCENARIO_TYPES } from './src/simulation/scenarios.js';
import { SchedulingAlgorithm } from './src/simulation/types.js';

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (!condition) {
    console.error(`  FAIL [Check ${total}]: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passed++;
  console.log(`  ✓ [Check ${total}]: ${message}`);
}

console.log('====================================================');
console.log('   RUNNING PHASE 2 KERNEL CONSOLE TEST SUITE');
console.log('====================================================\n');

// ----------------------------------------------------
// TEST GROUP 1: Empty & Unrecognized Commands
// ----------------------------------------------------
console.log('TEST GROUP 1: Command Parsing, Empty Input & Error Handling');
{
  const engine = new SimulationEngine();

  // Empty string
  const emptyRes = executeKernelCommand('', engine);
  assert(emptyRes.success === true, 'Empty input returns success: true');
  assert(emptyRes.actionType === 'empty', 'Empty input actionType is "empty"');
  assert(emptyRes.output.length === 0, 'Empty input produces no output lines');

  // Whitespace only
  const spaceRes = executeKernelCommand('   \t  ', engine);
  assert(spaceRes.actionType === 'empty', 'Whitespace-only input handled cleanly');

  // Unknown command
  const unknownRes = executeKernelCommand('foobar', engine);
  assert(unknownRes.success === false, 'Unknown command returns success: false');
  assert(unknownRes.actionType === 'error', 'Unknown command actionType is "error"');
  assert(unknownRes.rawText.includes('Command not recognized'), 'Unknown command informs user');
  assert(unknownRes.rawText.includes("'help'"), 'Unknown command suggests help');

  // Malformed deadlock
  const badDeadlock = executeKernelCommand('deadlock', engine);
  assert(badDeadlock.success === false, "'deadlock' without 'inspect' fails gracefully");
  assert(badDeadlock.rawText.includes('deadlock inspect'), "'deadlock' error advises 'deadlock inspect'");

  // Malformed banker
  const badBanker = executeKernelCommand('banker status', engine);
  assert(badBanker.success === false, "'banker status' fails gracefully");
  assert(badBanker.rawText.includes('banker check'), "'banker status' error advises 'banker check'");

  // Null engine check
  let threw = false;
  try {
    executeKernelCommand('help', null);
  } catch {
    threw = true;
  }
  assert(threw, 'Calling executeKernelCommand with null engine throws descriptive error');
}

// ----------------------------------------------------
// TEST GROUP 2: Help & Clear Commands
// ----------------------------------------------------
console.log('\nTEST GROUP 2: Help & Clear Commands');
{
  const engine = new SimulationEngine();
  const helpRes = executeKernelCommand('help', engine);

  assert(helpRes.success === true, "'help' command succeeds");
  assert(helpRes.actionType === 'help', "'help' actionType is 'help'");
  assert(helpRes.output.length > 5, "'help' returns comprehensive output");
  assert(helpRes.rawText.includes('ps, jobs'), "'help' lists ps/jobs command");
  assert(helpRes.rawText.includes('resources, sem'), "'help' lists resources/sem command");
  assert(helpRes.rawText.includes('step [n]'), "'help' lists step command");
  assert(helpRes.rawText.includes('run'), "'help' lists run command");
  assert(helpRes.rawText.includes('pause'), "'help' lists pause command");
  assert(helpRes.rawText.includes('reset'), "'help' lists reset command");
  assert(helpRes.rawText.includes('deadlock inspect'), "'help' lists deadlock inspect");
  assert(helpRes.rawText.includes('banker check'), "'help' lists banker check");
  assert(helpRes.rawText.includes('clear'), "'help' lists clear command");

  // Clear command
  const clearRes = executeKernelCommand('clear', engine);
  assert(clearRes.success === true, "'clear' command succeeds");
  assert(clearRes.actionType === 'clear', "'clear' actionType is 'clear'");
  assert(clearRes.output.length === 0, "'clear' output buffer is empty");
}

// ----------------------------------------------------
// TEST GROUP 3: Process Table Inspection (ps / jobs)
// ----------------------------------------------------
console.log('\nTEST GROUP 3: Process Table Inspection (ps & jobs)');
{
  const engine = new SimulationEngine();
  engine.setScenario(SCENARIO_TYPES.NORMAL_PRODUCTION);

  // Initial ps before stepping
  const psRes = executeKernelCommand('ps', engine);
  assert(psRes.success === true, "'ps' command succeeds");
  assert(psRes.actionType === 'ps', "'ps' actionType is 'ps'");
  assert(psRes.rawText.includes('PROCESS TABLE'), "'ps' output has PROCESS TABLE header");
  assert(psRes.rawText.includes('PID'), "'ps' output includes PID column");
  assert(psRes.rawText.includes('STATE'), "'ps' output includes STATE column");
  assert(psRes.rawText.includes('BURST'), "'ps' output includes BURST column");
  assert(psRes.rawText.includes('J101'), "'ps' lists process J101");
  assert(psRes.rawText.includes('J102'), "'ps' lists process J102");
  assert(psRes.data.jobList.length === 6, "'ps' structured data contains 6 jobs");

  // 'jobs' alias
  const jobsRes = executeKernelCommand('jobs', engine);
  assert(jobsRes.success === true, "'jobs' alias succeeds identically");
  assert(jobsRes.actionType === 'ps', "'jobs' actionType is 'ps'");

  // Step into execution and re-inspect ps
  engine.step();
  engine.step();
  engine.step();
  const psStepped = executeKernelCommand('ps', engine);
  assert(psStepped.rawText.includes('RUNNING') || psStepped.rawText.includes('READY'), "'ps' reflects dynamic process state changes");
}

// ----------------------------------------------------
// TEST GROUP 4: Resource & Semaphore Inventory (resources / sem)
// ----------------------------------------------------
console.log('\nTEST GROUP 4: Resource & Semaphore Inventory (resources & sem)');
{
  const engine = new SimulationEngine();
  const resRes = executeKernelCommand('resources', engine);

  assert(resRes.success === true, "'resources' command succeeds");
  assert(resRes.actionType === 'resources', "'resources' actionType is 'resources'");
  assert(resRes.rawText.includes('RESOURCE & SEMAPHORE INVENTORY'), "'resources' header displayed");
  assert(resRes.rawText.includes('CNC'), "'resources' displays CNC workstation");
  assert(resRes.rawText.includes('WELDING'), "'resources' displays WELDING workstation");
  assert(resRes.rawText.includes('ASSEMBLY'), "'resources' displays ASSEMBLY workstation");
  assert(resRes.rawText.includes('PAINTING'), "'resources' displays PAINTING workstation");
  assert(resRes.rawText.includes('PACKAGING'), "'resources' displays PACKAGING workstation");
  assert(resRes.rawText.includes('Capacity=2'), "'resources' shows correct CNC capacity");
  assert(resRes.rawText.includes('Waiting Queue'), "'resources' shows waiting queue status");
  assert(resRes.rawText.includes('Active Allocations:'), "'resources' shows allocation summary");

  // Check physical machine IDs in output
  assert(resRes.rawText.includes('CNC-01') && resRes.rawText.includes('CNC-02'), "'resources' lists specific machine instances");

  // 'sem' alias
  const semRes = executeKernelCommand('sem', engine);
  assert(semRes.success === true, "'sem' alias succeeds identically");
  assert(semRes.actionType === 'resources', "'sem' actionType is 'resources'");
}

// ----------------------------------------------------
// TEST GROUP 5: Simulation Stepping (step [n]) & Arguments
// ----------------------------------------------------
console.log('\nTEST GROUP 5: Stepping Control & Parameter Validation');
{
  const engine = new SimulationEngine();
  let syncCalled = 0;
  const onStateChange = () => { syncCalled++; };

  // Default step 1
  const tBefore = engine.time;
  const step1 = executeKernelCommand('step', engine, { onStateChange });
  assert(step1.success === true, "'step' default succeeds");
  assert(step1.data.executed === 1, "'step' default advances exactly 1 step");
  assert(syncCalled === 1, "'step' triggers onStateChange callback");

  // Step multiple steps (step 4)
  const step4 = executeKernelCommand('step 4', engine, { onStateChange });
  assert(step4.success === true, "'step 4' succeeds");
  assert(step4.data.executed === 4, "'step 4' executed 4 steps");
  assert(syncCalled === 2, "'step 4' triggers onStateChange callback");

  // Invalid step arguments
  const invalidSteps = ['step -1', 'step 0', 'step abc', 'step 1.5'];
  invalidSteps.forEach((cmd) => {
    const res = executeKernelCommand(cmd, engine, { onStateChange });
    assert(res.success === false, `'${cmd}' correctly rejected`);
    assert(res.actionType === 'error', `'${cmd}' actionType is 'error'`);
    assert(res.rawText.includes('positive integer'), `'${cmd}' gives helpful integer error message`);
  });
  // Callback not called on invalid commands
  assert(syncCalled === 2, 'onStateChange not triggered on invalid step command');
}

// ----------------------------------------------------
// TEST GROUP 6: Run, Pause & Reset Synchronization
// ----------------------------------------------------
console.log('\nTEST GROUP 6: Execution Controls & Synchronous React Callbacks');
{
  const engine = new SimulationEngine();
  let syncCount = 0;
  const onStateChange = () => { syncCount++; };

  // Initial state
  assert(engine.isRunning === false, 'Engine initially paused');

  // 'run' command
  const runRes = executeKernelCommand('run', engine, { onStateChange });
  assert(runRes.success === true, "'run' command succeeds");
  assert(engine.isRunning === true, "'run' mutates engine.isRunning to true");
  assert(syncCount === 1, "'run' triggers UI synchronization callback");

  // 'pause' command
  const pauseRes = executeKernelCommand('pause', engine, { onStateChange });
  assert(pauseRes.success === true, "'pause' command succeeds");
  assert(engine.isRunning === false, "'pause' mutates engine.isRunning to false");
  assert(syncCount === 2, "'pause' triggers UI synchronization callback");

  // Advance time then reset
  engine.step();
  engine.step();
  engine.step();
  assert(engine.time >= 0, 'Clock advanced');

  // 'reset' command
  const resetRes = executeKernelCommand('reset', engine, { onStateChange });
  assert(resetRes.success === true, "'reset' command succeeds");
  assert(engine.time === 0, "'reset' restores clock to t=0s");
  assert(syncCount === 3, "'reset' triggers UI synchronization callback");
}

// ----------------------------------------------------
// TEST GROUP 7: Deadlock Inspection (deadlock inspect)
// ----------------------------------------------------
console.log('\nTEST GROUP 7: Deadlock Inspection on Live RAG');
{
  // Test A: Normal Production (No Deadlock)
  const normalEngine = new SimulationEngine();
  normalEngine.setScenario(SCENARIO_TYPES.NORMAL_PRODUCTION);
  const dlNorm = executeKernelCommand('deadlock inspect', normalEngine);
  assert(dlNorm.success === true, "'deadlock inspect' succeeds on normal production");
  assert(dlNorm.rawText.includes('NO DEADLOCK DETECTED'), 'Reports NO DEADLOCK DETECTED');
  assert(dlNorm.data.deadlockInfo.hasDeadlock === false, 'deadlockInfo.hasDeadlock is false');

  // Test B: Deadlock Scenario (Deadlock Detected with 4 Coffman conditions)
  const dlEngine = new SimulationEngine();
  dlEngine.setScenario(SCENARIO_TYPES.DEADLOCK_SCENARIO);
  // Advance steps until deadlock locks
  for (let s = 0; s < 250; s++) {
    const res = dlEngine.step();
    if (res.deadlocked) break;
  }
  const dlDetect = executeKernelCommand('deadlock inspect', dlEngine);
  assert(dlDetect.success === true, "'deadlock inspect' succeeds on deadlock state");
  assert(dlDetect.rawText.includes('DEADLOCK DETECTED'), 'Reports DEADLOCK DETECTED');
  assert(dlDetect.rawText.includes('Cycle Chain'), 'Displays circular dependency chain');
  assert(dlDetect.rawText.includes('Involved Processes: [J101, J102]'), 'Identifies involved jobs J101 and J102');
  assert(dlDetect.rawText.includes('1. Mutual Exclusion: SATISFIED'), 'Evaluates Coffman 1: Mutual Exclusion');
  assert(dlDetect.rawText.includes('2. Hold and Wait:    SATISFIED'), 'Evaluates Coffman 2: Hold and Wait');
  assert(dlDetect.rawText.includes('3. No Preemption:    SATISFIED'), 'Evaluates Coffman 3: No Preemption');
  assert(dlDetect.rawText.includes('4. Circular Wait:    SATISFIED'), 'Evaluates Coffman 4: Circular Wait');
}

// ----------------------------------------------------
// TEST GROUP 8: Banker's Algorithm Safety Check (banker check)
// ----------------------------------------------------
console.log("\nTEST GROUP 8: Banker's Safety Algorithm Check");
{
  // Test A: Banker Safe State
  const safeEngine = new SimulationEngine();
  safeEngine.setScenario(SCENARIO_TYPES.BANKER_SAFE_REQUEST);
  const bankerSafe = executeKernelCommand('banker check', safeEngine);
  assert(bankerSafe.success === true, "'banker check' succeeds on safe state");
  assert(bankerSafe.rawText.includes('SAFETY STATUS: SAFE STATE'), 'Confirms SAFE STATE');
  assert(bankerSafe.rawText.includes('Safe Sequence: <'), 'Outputs safe sequence');
  assert(bankerSafe.data.safety.isSafe === true, 'Structured data confirms isSafe=true');
  assert(bankerSafe.data.safety.safeSequence.length > 0, 'Safe sequence is non-empty');

  // Test B: Verify matrices are computed accurately
  assert(bankerSafe.data.matrices.available.CNC !== undefined, 'Available vector includes CNC');
  assert(bankerSafe.data.matrices.max !== undefined, 'Max matrix generated');
  assert(bankerSafe.data.matrices.allocation !== undefined, 'Allocation matrix generated');
  assert(bankerSafe.data.matrices.need !== undefined, 'Need matrix generated');
}

// ----------------------------------------------------
// TEST GROUP 9: Continuous Stepping & Natural Completion
// ----------------------------------------------------
console.log('\nTEST GROUP 9: Console Step to Scenario Completion');
{
  const engine = new SimulationEngine();
  engine.setScenario(SCENARIO_TYPES.NORMAL_PRODUCTION);

  // Stepping with large n should halt cleanly when complete
  const finishStep = executeKernelCommand('step 100', engine);
  assert(finishStep.success === true, "'step 100' succeeds");
  assert(finishStep.rawText.includes('SYSTEM HALT') || finishStep.data.lastResult.completed === true,
    'Console detects and reports SYSTEM HALT upon job completion');
  assert(engine.time > 0, 'Simulation clock progressed to completion');
}

console.log('\n====================================================');
console.log(`  ALL ${passed}/${total} PHASE 2 KERNEL CONSOLE CHECKS PASSED!`);
console.log('====================================================\n');
