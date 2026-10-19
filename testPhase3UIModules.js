/**
 * Phase 3 UI Redesign & Machine Configuration Verification Test Suite
 * Validates the six-module architecture, machine configuration engine integration,
 * capacity scaling, and snapshot synchronization.
 */

import React from 'react';
import { SimulationEngine } from './src/simulation/simulationEngine.js';
import { SCENARIO_TYPES } from './src/simulation/scenarios.js';
import { SchedulingAlgorithm, ResourceType } from './src/simulation/types.js';
import { DEFAULT_MACHINE_COUNTS, normalizeMachineConfig, generateMachineIds } from './src/simulation/resources.js';

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
console.log('   RUNNING PHASE 3 SIX-MODULE & CONFIG TEST SUITE');
console.log('====================================================\n');

// ----------------------------------------------------
// TEST GROUP 1: Dynamic Machine Configuration Engine Integration
// ----------------------------------------------------
console.log('TEST GROUP 1: Dynamic Machine Configuration & Engine Capacities');
{
  const engine = new SimulationEngine();

  // Baseline defaults
  assert(engine.resourceTypes[ResourceType.CNC].capacity === 2, 'Default CNC capacity is 2');
  assert(engine.resourceTypes[ResourceType.WELDING].capacity === 2, 'Default Welding capacity is 2');
  assert(engine.resourceTypes[ResourceType.ASSEMBLY].capacity === 2, 'Default Assembly capacity is 2');
  assert(engine.resourceTypes[ResourceType.PAINTING].capacity === 1, 'Default Painting capacity is 1');
  assert(engine.resourceTypes[ResourceType.PACKAGING].capacity === 2, 'Default Packaging capacity is 2');
  assert(Object.keys(engine.machineInstances).length === 9, 'Default total machine instances count is 9');

  // Custom configuration scaling: 3 CNC, 4 Welding, 2 Assembly, 2 Painting, 3 Packaging
  const customConfig = {
    CNC: 3,
    WELDING: 4,
    ASSEMBLY: 2,
    PAINTING: 2,
    PACKAGING: 3,
  };

  engine.setMachineConfig(customConfig);

  // Capacities updated in resourceTypes
  assert(engine.resourceTypes[ResourceType.CNC].capacity === 3, 'Scaled CNC capacity is 3');
  assert(engine.resourceTypes[ResourceType.WELDING].capacity === 4, 'Scaled Welding capacity is 4');
  assert(engine.resourceTypes[ResourceType.ASSEMBLY].capacity === 2, 'Scaled Assembly capacity is 2');
  assert(engine.resourceTypes[ResourceType.PAINTING].capacity === 2, 'Scaled Painting capacity is 2');
  assert(engine.resourceTypes[ResourceType.PACKAGING].capacity === 3, 'Scaled Packaging capacity is 3');

  // Available amounts reflect capacity
  assert(engine.resourceTypes[ResourceType.CNC].available === 3, 'Initial available CNC equals new capacity 3');
  assert(engine.resourceTypes[ResourceType.WELDING].available === 4, 'Initial available Welding equals new capacity 4');

  // Semaphores reflect updated capacity
  assert(engine.semaphores[ResourceType.CNC].value === 3, 'CNC counting semaphore value scaled to 3');
  assert(engine.semaphores[ResourceType.WELDING].value === 4, 'Welding counting semaphore value scaled to 4');
  assert(engine.semaphores[ResourceType.PAINTING].value === 2, 'Painting counting semaphore value scaled to 2');

  // Physical machine instances generated
  const cncMachines = Object.values(engine.machineInstances).filter((m) => m.type === ResourceType.CNC);
  assert(cncMachines.length === 3, 'Generated exactly 3 CNC physical machine instances');
  assert(engine.machineInstances['CNC-01'] !== undefined, 'Instance CNC-01 exists');
  assert(engine.machineInstances['CNC-02'] !== undefined, 'Instance CNC-02 exists');
  assert(engine.machineInstances['CNC-03'] !== undefined, 'Instance CNC-03 exists');

  const weldMachines = Object.values(engine.machineInstances).filter((m) => m.type === ResourceType.WELDING);
  assert(weldMachines.length === 4, 'Generated exactly 4 Welding physical machine instances');
  assert(engine.machineInstances['WELD-04'] !== undefined, 'Instance WELD-04 exists');

  const totalCustom = 3 + 4 + 2 + 2 + 3;
  assert(Object.keys(engine.machineInstances).length === totalCustom, `Total machine instances equals ${totalCustom}`);

  // Snapshot contains scaled machine configuration
  const snap = engine.getSnapshot();
  assert(snap.machineConfig !== null, 'Snapshot exposes machineConfig object');
  assert(snap.machineConfig.CNC === 3, 'Snapshot machineConfig.CNC is 3');
  assert(snap.machineConfig.WELDING === 4, 'Snapshot machineConfig.WELDING is 4');
  assert(Object.keys(snap.machineInstances).length === totalCustom, 'Snapshot reflects all generated machine fixtures');

  // Reset to null restores default machine counts
  engine.setMachineConfig(null);
  assert(engine.resourceTypes[ResourceType.CNC].capacity === 2, 'Resetting config to null restores default CNC capacity 2');
  assert(Object.keys(engine.machineInstances).length === 9, 'Resetting config to null restores 9 total machines');
}

// ----------------------------------------------------
// TEST GROUP 2: Validation of Machine Configuration Inputs
// ----------------------------------------------------
console.log('\nTEST GROUP 2: Input Validation Rules for Machine Configuration');
{
  // Valid normalization
  const norm1 = normalizeMachineConfig({ cnc: 3, welding: 2 });
  assert(norm1.CNC === 3, 'Case-insensitive lookup maps cnc to CNC');
  assert(norm1.WELDING === 2, 'Case-insensitive lookup maps welding to WELDING');
  assert(norm1.ASSEMBLY === 2, 'Unspecified types receive default counts (Assembly: 2)');
  assert(norm1.PAINTING === 1, 'Unspecified types receive default counts (Painting: 1)');
  assert(norm1.PACKAGING === 2, 'Unspecified types receive default counts (Packaging: 2)');

  // Null & undefined return defaults
  const normNull = normalizeMachineConfig(null);
  assert(normNull.CNC === 2 && normNull.PAINTING === 1, 'null returns DEFAULT_MACHINE_COUNTS');

  // Invalid values rejected
  let threwZero = false;
  try {
    normalizeMachineConfig({ CNC: 0 });
  } catch {
    threwZero = true;
  }
  assert(threwZero, 'Capacity count of 0 is rejected');

  let threwNegative = false;
  try {
    normalizeMachineConfig({ WELDING: -2 });
  } catch {
    threwNegative = true;
  }
  assert(threwNegative, 'Negative capacity count is rejected');

  let threwFloat = false;
  try {
    normalizeMachineConfig({ ASSEMBLY: 2.5 });
  } catch {
    threwFloat = true;
  }
  assert(threwFloat, 'Float capacity count is rejected');

  let threwUnknown = false;
  try {
    normalizeMachineConfig({ LASER_CUTTER: 2 });
  } catch {
    threwUnknown = true;
  }
  assert(threwUnknown, 'Unknown workstation type is rejected');
}

// ----------------------------------------------------
// TEST GROUP 3: Six-Module Exports & Component Integrity
// ----------------------------------------------------
console.log('\nTEST GROUP 3: Six-Module Architectural Components');
{
  const { existsSync, readFileSync } = await import('node:fs');
  const componentFiles = [
    './src/components/modules/ProcessSchedulerModule.jsx',
    './src/components/modules/FactorySimulatorModule.jsx',
    './src/components/modules/ResourceManagerModule.jsx',
    './src/components/modules/BankersLabModule.jsx',
    './src/components/modules/DeadlockLabModule.jsx',
    './src/components/modules/KernelConsoleModule.jsx',
    './src/components/modules/MachineConfigPanel.jsx',
    './src/components/modals/MachineConfigModal.jsx',
  ];

  componentFiles.forEach((file) => {
    assert(existsSync(file), `Component file ${file} exists`);
    const content = readFileSync(file, 'utf-8');
    assert(content.includes('export default function'), `Component ${file} exports default function`);
  });
}

// ----------------------------------------------------
// TEST GROUP 4: Invariant Integrity Under Custom Machine Counts
// ----------------------------------------------------
console.log('\nTEST GROUP 4: Simulation Execution Under Scaled Machine Counts');
{
  const engine = new SimulationEngine({
    scenario: SCENARIO_TYPES.NORMAL_PRODUCTION,
    machineConfig: { CNC: 3, WELDING: 3, ASSEMBLY: 3, PAINTING: 2, PACKAGING: 3 },
  });

  // Step through simulation
  let maxSteps = 100;
  let res = null;
  for (let s = 0; s < maxSteps; s++) {
    res = engine.step();
    if (res.completed || res.deadlocked) break;
  }

  assert(res.completed === true, 'Simulation completes cleanly under custom machine capacity');
  assert(engine.time > 0, 'Clock progressed during execution');

  // Verify all machines are released upon completion
  for (const [type, rt] of Object.entries(engine.resourceTypes)) {
    assert(rt.allocated === 0, `All allocated released for ${type}`);
    assert(rt.available === rt.capacity, `Available equals scaled capacity for ${type}`);
    assert(engine.semaphores[type].value === rt.capacity, `Semaphore value equals capacity for ${type}`);
  }
}

console.log('\n====================================================');
console.log(`  ALL ${passed}/${total} PHASE 3 CHECKS PASSED!`);
console.log('====================================================\n');
