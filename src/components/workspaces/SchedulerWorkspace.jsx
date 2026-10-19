import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Sliders,
  BarChart2,
  Info,
} from 'lucide-react';
import { SchedulingAlgorithm } from '../../simulation/types.js';
import { SCENARIO_TYPES } from '../../simulation/scenarios.js';
import { runAlgorithmComparison } from '../../simulation/comparisonLab.js';
import GanttChart from '../GanttChart.jsx';

export default function SchedulerWorkspace({
  snapshot,
  onAlgorithmChange,
  onQuantumChange,
  onScenarioChange,
  onPlay,
  onPause,
  onStep,
  onReset,
  onInspectJob,
  onWhyWaiting,
}) {
  const [selectedAlgo, setSelectedAlgo] = useState(snapshot?.algorithm || SchedulingAlgorithm.FCFS);
  const [quantum, setQuantum] = useState(snapshot?.quantum || 2);
  const [showBenchmark, setShowBenchmark] = useState(false);
  const [benchmarkResults, setBenchmarkResults] = useState(null);

  const jobsList = Object.values(snapshot?.jobs || {});
  const completedJobs = jobsList.filter((j) => j.state === 'COMPLETED');
  const metrics = snapshot?.metrics?.summary || {};
  const hasRun = (snapshot?.time || 0) > 0 || (snapshot?.ganttRecords && snapshot.ganttRecords.length > 0);

  const handleApplyAndRun = () => {
    if (selectedAlgo !== snapshot?.algorithm) {
      onAlgorithmChange(selectedAlgo);
    }
    if (selectedAlgo === SchedulingAlgorithm.ROUND_ROBIN && quantum !== snapshot?.quantum) {
      onQuantumChange(quantum);
    }
    onPlay();
  };

  const handleRunBenchmark = () => {
    const res = runAlgorithmComparison(snapshot.scenario, snapshot.machineConfig);
    setBenchmarkResults(res);
    setShowBenchmark(true);
  };

  return (
    <div className="space-y-4">
      {/* 1. CONFIGURATION & PRIMARY ACTION */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Scheduler Configuration
            </h2>
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Active: <span className="font-bold text-slate-800">{snapshot?.algorithm}</span>
          </div>
        </div>

        {/* Form Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Algorithm Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Scheduling Policy
            </label>
            <select
              value={selectedAlgo}
              onChange={(e) => {
                setSelectedAlgo(e.target.value);
                onAlgorithmChange(e.target.value);
              }}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value={SchedulingAlgorithm.FCFS}>FCFS (First-Come, First-Served)</option>
              <option value={SchedulingAlgorithm.SJF}>SJF (Shortest Job First)</option>
              <option value={SchedulingAlgorithm.PRIORITY}>Priority Scheduling (P1 High, P3 Low)</option>
              <option value={SchedulingAlgorithm.ROUND_ROBIN}>Round Robin (Time-sliced)</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              {selectedAlgo === SchedulingAlgorithm.FCFS && 'Dispatches jobs in arrival order.'}
              {selectedAlgo === SchedulingAlgorithm.SJF && 'Prioritizes shortest estimated burst time.'}
              {selectedAlgo === SchedulingAlgorithm.PRIORITY && 'Dispatches highest priority processes first.'}
              {selectedAlgo === SchedulingAlgorithm.ROUND_ROBIN && 'Preempts jobs after fixed quantum slices.'}
            </p>
          </div>

          {/* Time Quantum (Round Robin only) */}
          <div className={selectedAlgo === SchedulingAlgorithm.ROUND_ROBIN ? 'opacity-100' : 'opacity-40 pointer-events-none'}>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Round Robin Quantum
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="8"
                value={quantum}
                onChange={(e) => {
                  const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                  setQuantum(val);
                  onQuantumChange(val);
                }}
                className="w-20 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500"
              />
              <span className="text-xs text-slate-500 font-mono">seconds</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Slice size before involuntary process preemption.
            </p>
          </div>

          {/* Workload Scenario Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Workload Scenario
            </label>
            <select
              value={snapshot?.scenario || SCENARIO_TYPES.NORMAL_PRODUCTION}
              onChange={(e) => onScenarioChange(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value={SCENARIO_TYPES.NORMAL_PRODUCTION}>1. Normal Production Flow (6 jobs)</option>
              <option value={SCENARIO_TYPES.RESOURCE_CONTENTION}>2. Resource Contention & Bottlenecks</option>
              <option value={SCENARIO_TYPES.HEAVY_LOAD}>7. Heavy Load (10 jobs)</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Defines workpiece arrival spacing and service durations.
            </p>
          </div>
        </div>

        {/* Primary Action Button & Secondary Controls (Run Scheduler Dominant) */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
          {snapshot?.isRunning ? (
            <button
              onClick={onPause}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition shadow-xs"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause Scheduler</span>
            </button>
          ) : (
            <button
              onClick={handleApplyAndRun}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Scheduler</span>
            </button>
          )}

          <button
            onClick={onStep}
            disabled={snapshot?.isRunning}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 disabled:opacity-40 transition"
            title="Advance discrete event step"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Step</span>
          </button>

          <button
            onClick={onReset}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition"
            title="Reset simulation state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </section>

      {/* 2. RESULTS: PERFORMANCE METRICS */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Execution Metrics & Results
          </h2>
          <span className="text-xs font-mono text-slate-500">
            Completed: <strong className="text-slate-800">{completedJobs.length} / {jobsList.length}</strong>
          </span>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Waiting Time</span>
            <div className="text-lg font-bold font-mono text-blue-600 mt-0.5">
              {hasRun ? (metrics.avgWaitingTime !== undefined ? `${metrics.avgWaitingTime}s` : '0.0s') : '—'}
            </div>
            <span className="text-[10px] text-slate-400">Queue wait duration</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Turnaround Time</span>
            <div className="text-lg font-bold font-mono text-slate-800 mt-0.5">
              {hasRun ? (metrics.avgTurnaroundTime !== undefined ? `${metrics.avgTurnaroundTime}s` : '0.0s') : '—'}
            </div>
            <span className="text-[10px] text-slate-400">Arrival to completion</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Response Time</span>
            <div className="text-lg font-bold font-mono text-slate-800 mt-0.5">
              {hasRun ? (metrics.avgResponseTime !== undefined ? `${metrics.avgResponseTime}s` : '0.0s') : '—'}
            </div>
            <span className="text-[10px] text-slate-400">Time to first dispatch</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Workstation Load</span>
            <div className="text-lg font-bold font-mono text-slate-800 mt-0.5">
              {hasRun ? (metrics.overallUtilization !== undefined ? `${metrics.overallUtilization}%` : '0%') : '—'}
            </div>
            <span className="text-[10px] text-slate-400">Shopfloor duty cycle</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Throughput</span>
            <div className="text-lg font-bold font-mono text-slate-800 mt-0.5">
              {hasRun ? (metrics.throughput !== undefined ? `${metrics.throughput}` : '0.00') : '—'}{' '}
              {hasRun && <span className="text-xs font-normal">j/s</span>}
            </div>
            <span className="text-[10px] text-slate-400">Finished orders/sec</span>
          </div>
        </div>

        {/* Latest Decision Note */}
        {snapshot?.lastDecision ? (
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900">Latest Decision: </span>
              <span>{snapshot.lastDecision.whatHappened} </span>
              <span className="text-slate-500">({snapshot.lastDecision.whyItHappened})</span>
            </div>
          </div>
        ) : (
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span>Ready to schedule. Click <strong>Run Scheduler</strong> or <strong>Step</strong> to begin dispatching workpiece processes.</span>
          </div>
        )}

        {/* Process Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 font-semibold bg-slate-50">
                <th className="py-2 px-3">Process ID</th>
                <th className="py-2 px-3">Product Name</th>
                <th className="py-2 px-3">Priority</th>
                <th className="py-2 px-3">State</th>
                <th className="py-2 px-3">Current Operation</th>
                <th className="py-2 px-3">Burst Rem.</th>
                <th className="py-2 px-3">Wait (WT)</th>
                <th className="py-2 px-3">Resp (RT)</th>
                <th className="py-2 px-3">Turnaround (TAT)</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobsList.map((job) => {
                const jm = snapshot?.metrics?.jobMetrics?.[job.id] || {};
                const isRunning = job.state === 'RUNNING';
                const isWaiting = job.state === 'WAITING';
                const isReady = job.state === 'READY';
                const isCompleted = job.state === 'COMPLETED';

                const displayWait = hasRun
                  ? `${jm.waitingTime ?? job.waitingTime ?? 0}s`
                  : '—';
                const displayResp = hasRun && (jm.responseTime != null || job.responseTime != null)
                  ? `${jm.responseTime ?? job.responseTime}s`
                  : '—';
                const displayTat = hasRun && isCompleted && (jm.turnaroundTime != null || job.turnaroundTime != null)
                  ? `${jm.turnaroundTime ?? job.turnaroundTime}s`
                  : '—';

                return (
                  <tr key={job.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-2 px-3 font-mono font-bold text-slate-900">{job.id}</td>
                    <td className="py-2 px-3 font-medium text-slate-700">{job.name}</td>
                    <td className="py-2 px-3 font-mono text-slate-600">P{job.priority}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${
                          isRunning
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isWaiting
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : isReady
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : isCompleted
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {job.state}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-600 truncate max-w-[180px]">
                      {job.stages?.[job.currentStageIndex]?.stageName || 'Complete'}
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-600">
                      {isCompleted ? '0s' : `${job.currentStageBurstRemaining ?? 0}s`}
                    </td>
                    <td className="py-2 px-3 font-mono font-semibold text-slate-800">{displayWait}</td>
                    <td className="py-2 px-3 font-mono text-slate-600">{displayResp}</td>
                    <td className="py-2 px-3 font-mono font-semibold text-slate-800">{displayTat}</td>
                    <td className="py-2 px-3 text-right space-x-1.5">
                      {isWaiting && onWhyWaiting && (
                        <button
                          onClick={() => onWhyWaiting(job)}
                          className="px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-semibold transition"
                        >
                          Why Blocked?
                        </button>
                      )}
                      <button
                        onClick={() => onInspectJob && onInspectJob(job.id)}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-mono transition border border-slate-200"
                      >
                        PCB
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Visual Gantt Chart */}
        <div className="pt-2">
          <GanttChart
            ganttRecords={snapshot?.ganttRecords || []}
            currentTime={snapshot?.time || 0}
            jobs={snapshot?.jobs || {}}
            metrics={snapshot?.metrics}
          />
        </div>
      </section>

      {/* 3. ADVANCED ANALYSIS: POLICY BENCHMARKING (Visually Demoted) */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Comparative Policy Benchmark</span>
              <span className="text-[11px] font-normal text-slate-400 font-sans">(Optional Analysis)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Evaluate FCFS, SJF, Priority, and Round Robin side-by-side under identical workload arrival spacing.
            </p>
          </div>

          <button
            onClick={() => {
              if (showBenchmark) {
                setShowBenchmark(false);
              } else {
                handleRunBenchmark();
              }
            }}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition"
          >
            <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
            <span>{showBenchmark ? 'Hide Benchmark' : 'Run Side-by-Side Benchmark'}</span>
          </button>
        </div>

        {/* Side-by-Side Algorithm Comparison Benchmark */}
        {showBenchmark && benchmarkResults && (
          <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900">
              <span className="font-bold">Analysis: </span>
              {benchmarkResults.commentary}
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-2 px-3">Scheduling Policy</th>
                    <th className="py-2 px-3">Completed</th>
                    <th className="py-2 px-3">Avg Wait</th>
                    <th className="py-2 px-3">Avg Turnaround</th>
                    <th className="py-2 px-3">Avg Response</th>
                    <th className="py-2 px-3">Utilization</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {benchmarkResults.results?.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 font-mono">
                      <td className="py-2 px-3 font-sans font-semibold text-slate-800">{row.policy}</td>
                      <td className="py-2 px-3">{row.completed}</td>
                      <td className="py-2 px-3 font-bold text-blue-600">{row.avgWaitingTime}s</td>
                      <td className="py-2 px-3">{row.avgTurnaroundTime}s</td>
                      <td className="py-2 px-3 text-slate-600">{row.avgResponseTime}s</td>
                      <td className="py-2 px-3 text-slate-800">{row.utilization}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
