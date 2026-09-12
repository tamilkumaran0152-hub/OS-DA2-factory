import React, { useState } from 'react';
import {
  Sliders,
  Play,
  Trophy,
  Info,
  TrendingDown,
} from 'lucide-react';
import { runAlgorithmBenchmark } from '../../simulation/comparisonLab.js';
import { SCENARIO_TYPES } from '../../simulation/scenarios.js';

export default function AlgorithmLabView({ currentScenario }) {
  const [selectedScenario, setSelectedScenario] = useState(
    currentScenario || SCENARIO_TYPES.NORMAL_PRODUCTION
  );
  const [benchmarkData, setBenchmarkData] = useState(() =>
    runAlgorithmBenchmark(selectedScenario)
  );

  const handleRunBenchmark = () => {
    const data = runAlgorithmBenchmark(selectedScenario);
    setBenchmarkData(data);
  };

  const { results = [], analysis = {} } = benchmarkData || {};

  const maxWT = Math.max(...results.map((r) => r.avgWaitingTime), 1);
  const maxTAT = Math.max(...results.map((r) => r.avgTurnaroundTime), 1);

  return (
    <div className="space-y-5">
      {/* 1. Header Banner */}
      <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
              SCHEDULING ALGORITHM BENCHMARK LAB
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Executes identical batch workloads across 4 core scheduling policies to evaluate real mathematical trade-offs
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400 font-bold">WORKLOAD:</span>
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              className="bg-slate-950 text-cyan-300 text-xs font-mono font-bold px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none"
            >
              <option value={SCENARIO_TYPES.NORMAL_PRODUCTION}>1. Normal Production Flow</option>
              <option value={SCENARIO_TYPES.RESOURCE_CONTENTION}>2. Resource Contention Flow</option>
              <option value={SCENARIO_TYPES.HEAVY_LOAD}>7. Heavy Production Load</option>
            </select>
          </div>

          <button
            onClick={handleRunBenchmark}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold font-mono transition shadow-[0_0_12px_rgba(0,240,255,0.25)]"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Benchmark</span>
          </button>
        </div>
      </div>

      {/* 2. Scientific Rigor Notice (Section 18) */}
      <div className="bg-[#0e1422] border border-blue-500/30 rounded-xl p-4 flex items-start gap-3 shadow-sm bg-gradient-to-r from-blue-950/20 to-slate-900/40">
        <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 flex-shrink-0">
          <Trophy className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">
              BENCHMARK FINDINGS & SCHEDULING THEORY
            </span>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-amber-500/20 text-amber-200">
              Lowest WT: {analysis.bestForWaitingTime}
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {analysis.commentary}
          </p>
          <div className="mt-2 text-[11px] text-cyan-400 font-mono flex items-center gap-1">
            <Info className="w-3.5 h-3.5" />
            <span>Same workload used for every algorithm — makes the comparison scientifically meaningful.</span>
          </div>
        </div>
      </div>

      {/* 3. Clean Comparison Table (Section 18: Algorithm | Avg WT | Avg TAT | Avg RT | Utilization | Throughput) */}
      <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-5 shadow-sm">
        <div className="pb-3 mb-3 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100 font-mono">
            ALGORITHM PERFORMANCE MATRIX
          </h3>
          <span className="text-[10px] font-mono text-slate-400">
            Workload evaluated under identical arrival sequences
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                <th className="pb-2.5 font-semibold">ALGORITHM</th>
                <th className="pb-2.5 font-semibold">AVG WAITING TIME (WT)</th>
                <th className="pb-2.5 font-semibold">AVG TURNAROUND TIME (TAT)</th>
                <th className="pb-2.5 font-semibold">AVG RESPONSE TIME (RT)</th>
                <th className="pb-2.5 font-semibold">MACHINE UTILIZATION</th>
                <th className="pb-2.5 font-semibold">THROUGHPUT</th>
                <th className="pb-2.5 text-right font-semibold">COMPLETED</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {results.map((res) => {
                const isBestWT = res.name === analysis.bestForWaitingTime;

                return (
                  <tr
                    key={res.name}
                    className={`hover:bg-slate-800/40 transition ${
                      isBestWT ? 'bg-cyan-950/20' : ''
                    }`}
                  >
                    <td className="py-3 font-bold text-slate-200 flex items-center gap-2">
                      <span>{res.name}</span>
                      {isBestWT && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                          ★ OPTIMAL WT
                        </span>
                      )}
                    </td>
                    <td className={`py-3 font-bold ${isBestWT ? 'text-cyan-400' : 'text-slate-300'}`}>
                      {res.avgWaitingTime}s
                    </td>
                    <td className="py-3 text-slate-300">{res.avgTurnaroundTime}s</td>
                    <td className="py-3 text-blue-300">{res.avgResponseTime}s</td>
                    <td className="py-3 text-emerald-400">{res.overallUtilization}%</td>
                    <td className="py-3 text-slate-300">{res.throughput} jobs/s</td>
                    <td className="py-3 text-right text-slate-400">
                      {res.completedCount} / {res.totalJobs}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Comparative Bar Charts (Section 18) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Average Waiting Time */}
        <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-cyan-400 uppercase tracking-wider">
              AVERAGE WAITING TIME (LOWER IS BETTER)
            </span>
            <TrendingDown className="w-4 h-4 text-cyan-400" />
          </div>

          <div className="space-y-3 pt-2">
            {results.map((res) => {
              const width = Math.max(8, (res.avgWaitingTime / maxWT) * 100);
              const isBest = res.name === analysis.bestForWaitingTime;

              return (
                <div key={res.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-300 font-semibold">{res.name}</span>
                    <span className={`font-bold ${isBest ? 'text-cyan-400' : 'text-slate-400'}`}>
                      {res.avgWaitingTime}s
                    </span>
                  </div>
                  <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isBest
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                          : 'bg-slate-700'
                      }`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Average Turnaround Time */}
        <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-blue-400 uppercase tracking-wider">
              AVERAGE TURNAROUND TIME (LOWER IS BETTER)
            </span>
            <TrendingDown className="w-4 h-4 text-blue-400" />
          </div>

          <div className="space-y-3 pt-2">
            {results.map((res) => {
              const width = Math.max(8, (res.avgTurnaroundTime / maxTAT) * 100);

              return (
                <div key={res.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-300 font-semibold">{res.name}</span>
                    <span className="font-bold text-slate-300">{res.avgTurnaroundTime}s</span>
                  </div>
                  <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-500"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
