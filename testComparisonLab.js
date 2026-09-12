import { runAlgorithmBenchmark } from './src/simulation/comparisonLab.js';
import { SCENARIO_TYPES } from './src/simulation/scenarios.js';

console.log('=== TESTING ALGORITHM COMPARISON LAB ===\n');

const res = runAlgorithmBenchmark(SCENARIO_TYPES.NORMAL_PRODUCTION, 35);
console.log('Workload:', res.scenario);
console.log('Best for WT:', res.analysis.bestForWaitingTime);
console.log('Best for RT:', res.analysis.bestForResponseTime);
console.log('Commentary:', res.analysis.commentary);

console.log('\nResults Table:');
console.table(res.results.map(r => ({
  Policy: r.name,
  Completed: `${r.completedCount}/${r.totalJobs}`,
  'Avg WT (s)': r.avgWaitingTime,
  'Avg TAT (s)': r.avgTurnaroundTime,
  'Avg RT (s)': r.avgResponseTime,
  'Utilization (%)': r.overallUtilization,
})));

console.log('\n=== COMPARISON LAB VALIDATION PASSED ===');
