/**
 * testUIWorkspaces.js
 * Comprehensive integration test for the redesigned workspaces and landing page.
 * Validates module configurations, component exports, snapshot bindings,
 * and simulated workflows across all 6 workspaces.
 */

import React from 'react';
import { SimulationEngine } from './src/simulation/simulationEngine.js';
import { SCENARIO_TYPES } from './src/simulation/scenarios.js';
import { SchedulingAlgorithm, ResourceType } from './src/simulation/types.js';
import { runAlgorithmBenchmark } from './src/simulation/comparisonLab.js';

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
console.log('   RUNNING REDESIGNED WORKSPACES INTEGRATION TEST');
console.log('====================================================\n');

// 1. MODULE CONFIGURATIONS CHECK
console.log('TEST GROUP 1: Redesigned Module Registry');
{
  const { readFileSync } = await import('node:fs');
  const layoutContent = readFileSync('./src/components/workspaces/WorkspaceLayout.jsx', 'utf-8');
  assert(layoutContent.includes('export const MODULE_CONFIGS ='), 'MODULE_CONFIGS is exported by WorkspaceLayout.jsx');
  const expectedIds = ['scheduler', 'simulator', 'resources', 'banker', 'deadlock', 'console'];
  expectedIds.forEach((id) => {
    assert(layoutContent.includes(`id: '${id}'`), `Module '${id}' is defined in MODULE_CONFIGS`);
  });
}


// 2. COMPONENT FILES & DEFAULT EXPORTS CHECK
console.log('\nTEST GROUP 2: Workspace Component Integrity');
{
  const files = [
    './src/components/redesign/HomePage.jsx',
    './src/components/workspaces/WorkspaceLayout.jsx',
    './src/components/workspaces/SchedulerWorkspace.jsx',
    './src/components/workspaces/FactoryWorkspace.jsx',
    './src/components/workspaces/ResourcesWorkspace.jsx',
    './src/components/workspaces/BankerWorkspace.jsx',
    './src/components/workspaces/DeadlockWorkspace.jsx',
    './src/components/workspaces/ConsoleWorkspace.jsx',
    './src/components/views/VivaGuideView.jsx',
    './src/App.jsx',
  ];

  const { existsSync, readFileSync } = await import('node:fs');
  files.forEach((file) => {
    assert(existsSync(file), `Workspace file ${file} exists`);
    const content = readFileSync(file, 'utf-8');
    assert(content.includes('export default function'), `Workspace file ${file} exports a default React component`);
  });
}

// 3. SCHEDULER WORKSPACE SIMULATION & COMPARISON ENGINE
console.log('\nTEST GROUP 3: Scheduler Workspace Benchmark & Metrics');
{
  const engine = new SimulationEngine({
    scenario: SCENARIO_TYPES.NORMAL_PRODUCTION,
    algorithm: SchedulingAlgorithm.FCFS,
  });

  const snap = engine.getSnapshot();
  assert(snap.algorithm === SchedulingAlgorithm.FCFS, 'Default algorithm is FCFS');
  assert(snap.metrics !== undefined, 'Snapshot exposes performance metrics');

  // Verify benchmark computation
  const bench = runAlgorithmBenchmark(SCENARIO_TYPES.NORMAL_PRODUCTION, 35);
  assert(bench.results.length === 5, 'Benchmark evaluated all 5 scheduling policies');
  assert(typeof bench.analysis.bestForWaitingTime === 'string', 'Benchmark identified best WT policy');
  assert(typeof bench.analysis.commentary === 'string', 'Benchmark generates plain-language commentary');
}

// 4. RESOURCE MANAGER PROVISIONING & MACHINE CONFIG
console.log('\nTEST GROUP 4: Resource Manager Capacity Scaling');
{
  const engine = new SimulationEngine();
  const scaled = { CNC: 3, WELDING: 3, ASSEMBLY: 2, PAINTING: 2, PACKAGING: 2 };
  engine.setMachineConfig(scaled);
  const snap = engine.getSnapshot();

  assert(snap.resourceTypes[ResourceType.CNC].capacity === 3, 'CNC scaled to 3');
  assert(snap.machineInstances['CNC-03'] !== undefined, 'Fixture CNC-03 registered');
  assert(snap.semaphores[ResourceType.CNC].value === 3, 'Semaphore initialized to 3');
}

// 5. BANKER'S ALGORITHM LAB MATRICES & REQUEST SANDBOX
console.log('\nTEST GROUP 5: Banker Safety Algorithm & Sandbox');
{
  const engine = new SimulationEngine();
  const matrices = engine.banker.buildMatrices(engine.jobs, engine.resourceTypes);
  assert(matrices.jobIds.length > 0, 'Job IDs listed in Banker matrix');
  assert(Object.keys(matrices.available).length === 5, '5 Resource Types listed in available vector');

  const safety = engine.banker.runSafetyAlgorithm(matrices);
  assert(safety.isSafe === true, 'Initial state is safe');
  assert(safety.safeSequence.length > 0, 'Safe sequence generated');

  // Test sandbox request evaluation
  const req = { CNC: 1, WELDING: 0, ASSEMBLY: 0, PAINTING: 0, PACKAGING: 0 };
  const evalResult = engine.banker.evaluateRequest(matrices.jobIds[0], req, matrices);
  assert(typeof evalResult.granted === 'boolean', 'Request evaluation returned granted boolean');
  assert(typeof evalResult.reason === 'string', 'Request evaluation returned explanation');
}

// 6. DEADLOCK DETECTION & RECOVERY
console.log('\nTEST GROUP 6: Deadlock Lab Detection & Recovery');
{
  const engine = new SimulationEngine({ scenario: SCENARIO_TYPES.DEADLOCK_SCENARIO });
  // Step until deadlock
  for (let i = 0; i < 300; i++) {
    const res = engine.step();
    if (res.deadlocked) break;
  }

  assert(engine.deadlockInfo.hasDeadlock === true, 'Deadlock successfully triggered');
  assert(engine.deadlockInfo.cycleString.length > 0, 'Cycle path string detected in RAG');
  assert(engine.deadlockInfo.cycleNodes.length > 0, 'Cycle nodes detected in RAG');
  assert(engine.deadlockInfo.involvedJobIds.length > 0, 'Involved job IDs identified');

  // Recover
  const victim = engine.deadlockInfo.involvedJobIds[0];
  const rec = engine.recoverFromDeadlock(victim);
  assert(rec.victimJobId === victim, 'Deadlock recovery executed on victim');
  assert(engine.deadlockInfo.hasDeadlock === false, 'System recovered from deadlock');
}


console.log('\n====================================================');
console.log(`  ALL ${passed}/${total} REDESIGNED WORKSPACE CHECKS PASSED!`);
console.log('====================================================\n');
