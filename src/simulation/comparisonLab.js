import { SimulationEngine } from './simulationEngine.js';
import { SchedulingAlgorithm } from './types.js';
import { SCENARIO_TYPES } from './scenarios.js';

/**
 * Head-to-head algorithm comparison laboratory
 * Runs identical workloads across FCFS, SJF, Priority, and Round Robin
 * and returns calculated performance metrics.
 */
export function runAlgorithmBenchmark(
  scenario = SCENARIO_TYPES.NORMAL_PRODUCTION,
  maxTicks = 45,
  machineConfig = null
) {
  let ticksLimit = maxTicks;
  let config = machineConfig;

  if (typeof maxTicks === 'object' && maxTicks !== null) {
    ticksLimit = maxTicks.maxTicks ?? 45;
    config = maxTicks.machineConfig ?? null;
  }

  const algorithmsToTest = [
    { name: 'FCFS (Non-preemptive)', algo: SchedulingAlgorithm.FCFS, quantum: 2 },
    { name: 'SJF (Shortest Job First)', algo: SchedulingAlgorithm.SJF, quantum: 2 },
    { name: 'Priority Scheduling', algo: SchedulingAlgorithm.PRIORITY, quantum: 2 },
    { name: 'Round Robin (q = 2s)', algo: SchedulingAlgorithm.ROUND_ROBIN, quantum: 2 },
    { name: 'Round Robin (q = 4s)', algo: SchedulingAlgorithm.ROUND_ROBIN, quantum: 4 },
  ];

  const results = algorithmsToTest.map((item) => {
    const sim = new SimulationEngine({
      scenario,
      algorithm: item.algo,
      quantum: item.quantum,
      machineConfig: config,
    });

    let ticks = 0;
    let maxSteps = 400; // Safeguard

    while (ticks < ticksLimit && maxSteps > 0) {
      maxSteps--;
      const stepRes = sim.step();
      if (stepRes.completed) break;
      if (stepRes.timeAdvanced) ticks++;
    }

    const snap = sim.getSnapshot();
    const summary = snap.metrics.summary;

    return {
      name: item.name,
      algo: item.algo,
      algorithm: item.algo,
      quantum: item.quantum,
      ticks: snap.time,
      completedCount: summary.completedCount,
      totalJobs: summary.totalJobs,
      avgWaitingTime: summary.avgWaitingTime,
      avgTurnaroundTime: summary.avgTurnaroundTime,
      avgResponseTime: summary.avgResponseTime,
      overallUtilization: summary.overallUtilization,
      throughput: summary.throughput,
    };
  });

  // Determine winner for Average Waiting Time
  const sortedByWT = [...results].sort((a, b) => a.avgWaitingTime - b.avgWaitingTime);
  const bestWT = sortedByWT[0];

  // Determine winner for Response Time
  const sortedByRT = [...results].sort((a, b) => a.avgResponseTime - b.avgResponseTime);
  const bestRT = sortedByRT[0];

  const winnerExplanation =
    bestWT.algo === SchedulingAlgorithm.SJF
      ? 'aligning with OS scheduling theory that SJF mathematically minimizes waiting time by clearing shorter bursts first.'
      : bestWT.algo === SchedulingAlgorithm.FCFS
      ? 'benefiting from balanced arrival spacing where first-come orders experienced minimal queue contention.'
      : bestWT.algo === SchedulingAlgorithm.ROUND_ROBIN
      ? 'utilizing rapid timeslicing to rotate execution fairly across competing orders.'
      : 'favoring critical high-priority workpieces through the production routing.';

  return {
    scenario,
    machineConfig: config,
    results,
    analysis: {
      bestForWaitingTime: bestWT.name,
      bestForResponseTime: bestRT.name,
      commentary: `In this benchmark workload, ${bestWT.name} achieved the lowest average waiting time (${bestWT.avgWaitingTime}s), ${winnerExplanation} ${bestRT.name} delivered the fastest initial machine response (${bestRT.avgResponseTime}s).`,
    },
  };
}

export const runAlgorithmComparison = runAlgorithmBenchmark;

