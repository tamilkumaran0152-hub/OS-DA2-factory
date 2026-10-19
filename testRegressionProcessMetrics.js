/**
 * testRegressionProcessMetrics.js
 * Regression test verifying that table-facing process metrics strictly match
 * the authoritative simulation metrics engine values after a completed run.
 *
 * Formulas verified:
 * - Turnaround Time = Completion Time - Arrival Time
 * - Response Time = First Start Time - Arrival Time
 * - Waiting Time = Turnaround Time - Total Burst Time
 */

import { SimulationEngine } from './src/simulation/simulationEngine.js';
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
console.log('  RUNNING PROCESS TABLE & METRICS ENGINE PARITY TEST');
console.log('====================================================\n');

// TEST 1: FCFS (NORMAL_PRODUCTION) Run to Completion
console.log('TEST 1: FCFS Normal Production Flow Metrics Verification');
{
  const engine = new SimulationEngine();
  engine.setScenario(SCENARIO_TYPES.NORMAL_PRODUCTION);
  engine.setAlgorithm(SchedulingAlgorithm.FCFS);

  // Run discrete event steps until all jobs complete or timeout
  let steps = 0;
  while (Object.values(engine.jobs).some((j) => j.state !== 'COMPLETED') && steps < 300) {
    engine.step();
    steps++;
  }

  const snapshot = engine.getSnapshot();
  const jobs = snapshot.jobs;
  const metrics = snapshot.metrics.jobMetrics;

  // Expected FCFS metrics observed by user
  const expectedFCFS = {
    J101: { wt: 0, tat: 8, rt: 0 },
    J102: { wt: 0, tat: 5, rt: 0 },
    J103: { wt: 1, tat: 11, rt: 1 },
    J104: { wt: 0, tat: 7, rt: 0 },
    J105: { wt: 0, tat: 5, rt: 0 },
    J106: { wt: 0, tat: 7, rt: 0 },
  };

  Object.entries(expectedFCFS).forEach(([jobId, exp]) => {
    const job = jobs[jobId];
    const jm = metrics[jobId];

    assert(job !== undefined, `Job ${jobId} exists in snapshot.jobs`);
    assert(jm !== undefined, `Job ${jobId} exists in snapshot.metrics.jobMetrics`);
    assert(job.state === 'COMPLETED', `Job ${jobId} is COMPLETED (actual: ${job.state})`);

    // Verify OS Textbook Definitions
    const expectedTat = job.completionTime - job.arrivalTime;
    const expectedRt = job.firstStartTime - job.arrivalTime;
    const expectedWt = expectedTat - job.totalBurst;

    assert(job.turnaroundTime === expectedTat, `${jobId} Turnaround Time = Completion (${job.completionTime}) - Arrival (${job.arrivalTime}) = ${expectedTat}s`);
    assert(job.responseTime === expectedRt, `${jobId} Response Time = First Start (${job.firstStartTime}) - Arrival (${job.arrivalTime}) = ${expectedRt}s`);
    assert(job.waitingTime === expectedWt, `${jobId} Waiting Time = TAT (${expectedTat}) - Total Burst (${job.totalBurst}) = ${expectedWt}s`);

    // Verify Parity: snapshot.jobs metrics strictly equal snapshot.metrics.jobMetrics
    assert(job.turnaroundTime === jm.turnaroundTime, `${jobId} table turnaroundTime (${job.turnaroundTime}s) matches metrics engine (${jm.turnaroundTime}s)`);
    assert(job.waitingTime === jm.waitingTime, `${jobId} table waitingTime (${job.waitingTime}s) matches metrics engine (${jm.waitingTime}s)`);
    assert(job.responseTime === jm.responseTime, `${jobId} table responseTime (${job.responseTime}s) matches metrics engine (${jm.responseTime}s)`);

    // Verify against exact expected benchmarks
    assert(job.turnaroundTime === exp.tat, `${jobId} TAT is exactly ${exp.tat}s`);
    assert(job.waitingTime === exp.wt, `${jobId} WT is exactly ${exp.wt}s`);
    assert(job.responseTime === exp.rt, `${jobId} RT is exactly ${exp.rt}s`);
  });
}

// TEST 2: Round Robin Time-slicing Metrics Parity
console.log('\nTEST 2: Round Robin (q = 2s) Metrics Parity');
{
  const engine = new SimulationEngine();
  engine.setScenario(SCENARIO_TYPES.NORMAL_PRODUCTION);
  engine.setAlgorithm(SchedulingAlgorithm.ROUND_ROBIN);
  engine.setQuantum(2);

  let steps = 0;
  while (Object.values(engine.jobs).some((j) => j.state !== 'COMPLETED') && steps < 300) {
    engine.step();
    steps++;
  }

  const snapshot = engine.getSnapshot();
  const jobs = snapshot.jobs;
  const metrics = snapshot.metrics.jobMetrics;

  Object.keys(jobs).forEach((jobId) => {
    const job = jobs[jobId];
    const jm = metrics[jobId];

    assert(job.turnaroundTime === jm.turnaroundTime, `RR ${jobId} table TAT matches metrics engine`);
    assert(job.waitingTime === jm.waitingTime, `RR ${jobId} table WT matches metrics engine`);
    assert(job.responseTime === jm.responseTime, `RR ${jobId} table RT matches metrics engine`);
    assert(job.turnaroundTime === job.completionTime - job.arrivalTime, `RR ${jobId} TAT = Completion - Arrival`);
    assert(job.waitingTime === job.turnaroundTime - job.totalBurst, `RR ${jobId} WT = TAT - Burst`);
  });
}

console.log(`\n====================================================`);
console.log(`  ALL ${passed}/${total} REGRESSION CHECKS PASSED PERFECTLY!`);
console.log(`====================================================`);
