import React, { useState } from 'react';
import { BarChart3, Play, Trophy, Sparkles, RefreshCw, Info } from 'lucide-react';
import { runAlgorithmBenchmark } from '../simulation/comparisonLab.js';
import { SCENARIO_TYPES, SCENARIO_METADATA } from '../simulation/scenarios.js';

export default function AlgorithmComparisonLab({ currentScenario }) {
  const [selectedScenario, setSelectedScenario] = useState(currentScenario || SCENARIO_TYPES.NORMAL_PRODUCTION);
  const [benchmarkData, setBenchmarkData] = useState(() => runAlgorithmBenchmark(selectedScenario));

  const handleRunBenchmark = () => {
    const data = runAlgorithmBenchmark(selectedScenario);
    setBenchmarkData(data);
  };

  const { results, analysis } = benchmarkData;

  // Max value for bar scaling
  const maxWT = Math.max(...results.map((r) => r.avgWaitingTime), 1);
  const maxTAT = Math.max(...results.map((r) => r.avgTurnaroundTime), 1);

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="panel-industrial p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              SCHEDULING ALGORITHM LAB & BENCHMARK
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Executes identical batch workloads across 5 scheduling policies to evaluate real mathematical trade-offs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-300 font-semibold">WORKLOAD:</label>
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              className="bg-slate-950 text-cyan-300 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700"
            >
              <option value={SCENARIO_TYPES.NORMAL_PRODUCTION}>1. Normal Production Flow</option>
              <option value={SCENARIO_TYPES.RESOURCE_CONTENTION}>2. Resource Contention Flow</option>
              <option value={SCENARIO_TYPES.HEAVY_LOAD}>7. Heavy Production Load</option>
            </select>
          </div>

          <button
            onClick={handleRunBenchmark}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Benchmark</span>
          </button>
        </div>
      </div>

      {/* Analysis & Winner Commentary */}
      <div className="panel-industrial p-4 bg-gradient-to-r from-blue-950/40 to-indigo-950/40 border-blue-500/30">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 mt-0.5">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                BENCHMARK FINDINGS & OS SCHEDULING THEORY
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-amber-500/20 text-amber-200">
                Best WT: {analysis.bestForWaitingTime}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {analysis.commentary}
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {results.map((res, idx) => {
          const isBestWT = res.name === analysis.bestForWaitingTime;

          return (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border flex flex-col justify-between transition ${
                isBestWT
                  ? 'bg-slate-900/90 border-cyan-500/50 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                  : 'bg-slate-950/70 border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-200">
                    {res.name}
                  </span>
                  {isBestWT && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                      ★ Lowest WT
                    </span>
                  )}
                </div>

                <div className="space-y-2 font-mono text-xs mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Avg WT:</span>
                    <span className="font-bold text-cyan-300">{res.avgWaitingTime}s</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Avg TAT:</span>
                    <span className="font-bold text-slate-200">{res.avgTurnaroundTime}s</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Avg RT:</span>
                    <span className="font-bold text-blue-300">{res.avgResponseTime}s</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Utilization:</span>
                    <span className="font-bold text-emerald-400">{res.overallUtilization}%</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono">
                Completed: {res.completedCount}/{res.totalJobs} jobs
              </div>
            </div>
          );
        })}
      </div>

      {/* SVG Bar Chart Comparisons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Average Waiting Time Chart */}
        <div className="panel-industrial p-4">
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3">
            AVERAGE WAITING TIME (WT) COMPARISON — LOWER IS BETTER
          </div>
          <div className="space-y-2.5">
            {results.map((res, i) => {
              const width = Math.max(8, (res.avgWaitingTime / maxWT) * 100);
              const isBest = res.name === analysis.bestForWaitingTime;

              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-300">{res.name}</span>
                    <span className={`font-bold ${isBest ? 'text-cyan-400' : 'text-slate-400'}`}>
                      {res.avgWaitingTime}s
                    </span>
                  </div>
                  <div className="h-3 bg-slate-900 rounded-full overflow-hidden">
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

        {/* Average Turnaround Time Chart */}
        <div className="panel-industrial p-4">
          <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3">
            AVERAGE TURNAROUND TIME (TAT) COMPARISON — LOWER IS BETTER
          </div>
          <div className="space-y-2.5">
            {results.map((res, i) => {
              const width = Math.max(8, (res.avgTurnaroundTime / maxTAT) * 100);

              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-300">{res.name}</span>
                    <span className="font-bold text-slate-300">{res.avgTurnaroundTime}s</span>
                  </div>
                  <div className="h-3 bg-slate-900 rounded-full overflow-hidden">
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
