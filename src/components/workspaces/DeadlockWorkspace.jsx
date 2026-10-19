import React, { useState } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  SkipForward,
} from 'lucide-react';
import { SCENARIO_TYPES } from '../../simulation/scenarios.js';
import ResourceAllocationGraph from '../ResourceAllocationGraph.jsx';

export default function DeadlockWorkspace({
  snapshot,
  onScenarioChange,
  onStep,
  onReset,
  onExecuteRecovery,
}) {
  const dInfo = snapshot?.deadlockInfo || {};
  const hasDeadlock = Boolean(dInfo.hasDeadlock);
  const hasCycle = Boolean(dInfo.hasCycle);
  const coffman = dInfo.coffman;

  const victimCandidates = (dInfo.deadlockedJobIds?.length ? dInfo.deadlockedJobIds : dInfo.involvedJobIds) || ['J101', 'J102'];
  const [selectedVictim, setSelectedVictim] = useState(
    victimCandidates[0] || 'J101'
  );

  const handleRunRecovery = () => {
    if (selectedVictim) {
      onExecuteRecovery(selectedVictim);
    }
  };

  const conds = coffman?.conditions || [];
  const me = conds.find((c) => c.name === 'Mutual Exclusion');
  const hw = conds.find((c) => c.name === 'Hold and Wait');
  const np = conds.find((c) => c.name === 'No Preemption');
  const cw = conds.find((c) => c.name === 'Circular Wait');

  return (
    <div className="space-y-4">
      {/* 1. CONFIGURATION & PRIMARY ACTION */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-rose-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Deadlock Lab Configuration & Audit
            </h2>
          </div>

          <div className="text-xs font-mono text-slate-500">
            Scenario: <span className="font-bold text-slate-800">{snapshot?.scenario}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Preset Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Deadlock Test Scenario
            </label>
            <select
              value={snapshot?.scenario || SCENARIO_TYPES.DEADLOCK_SCENARIO}
              onChange={(e) => onScenarioChange(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value={SCENARIO_TYPES.DEADLOCK_SCENARIO}>
                Deadlock Detection Scenario (Forces J101 ⇄ J102 Circular Wait)
              </option>
              <option value={SCENARIO_TYPES.NORMAL_PRODUCTION}>
                1. Normal Production Flow (Safe, Acyclic Baseline)
              </option>
              <option value={SCENARIO_TYPES.RESOURCE_CONTENTION}>
                2. Resource Contention & Semaphores (High contention, no cycle)
              </option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Selects whether the workload mounts cross-held machine resources.
            </p>
          </div>

          {/* How detection works note */}
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <span className="font-semibold text-slate-800 block mb-0.5">Detection Principle:</span>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              DFS detects directed cycles in the bipartite RAG, while multi-instance Work-reduction algorithm verifies genuine deadlock.
            </p>
          </div>
        </div>

        {/* Primary Action Button & Secondary Controls */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={onStep}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span>Detect Deadlock (Step Event)</span>
            </button>

            <button
              onClick={onReset}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          <div className="text-xs font-mono">
            Status:{' '}
            <strong
              className={
                hasDeadlock
                  ? 'text-rose-600'
                  : hasCycle
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }
            >
              {hasDeadlock
                ? 'DEADLOCK CONFIRMED'
                : hasCycle
                ? 'CIRCULAR DEPENDENCY DETECTED'
                : 'NO DEADLOCK'}
            </strong>
          </div>
        </div>
      </section>

      {/* 2. RESULTS: DETECTION STATUS & 4 COFFMAN CONDITIONS */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Deadlock Detection Results & Coffman Conditions
          </h2>
          <span className="text-xs font-mono text-slate-500">
            Bipartite RAG & Multi-Instance Reduction
          </span>
        </div>

        {/* Status Alert Banner */}
        {hasDeadlock ? (
          <div className="p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs bg-rose-50 border-rose-300 text-rose-950">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">DEADLOCK CONFIRMED</div>
                <p className="opacity-90 mt-0.5">
                  Multi-instance resource reduction confirms processes cannot make progress. Cycle: {dInfo.cycleString || dInfo.cycleNodes?.join(' → ') || 'Circular loop in RAG'}.
                </p>
                {dInfo.deadlockedJobIds && dInfo.deadlockedJobIds.length > 0 && (
                  <div className="mt-1 font-mono font-bold text-rose-800 text-[11px]">
                    Trapped Processes: [{dInfo.deadlockedJobIds.join(', ')}]
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : hasCycle ? (
          <div className="p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs bg-amber-50 border-amber-300 text-amber-950">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Circular dependency detected — progress still possible</div>
                <p className="opacity-90 mt-0.5">
                  Circular dependency detected, but no deadlock is confirmed because other resource instances can still be released.
                </p>
                <div className="mt-1 font-mono text-amber-900 text-[11px]">
                  RAG Cycle: {dInfo.cycleString || dInfo.cycleNodes?.join(' → ')}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs bg-emerald-50 border-emerald-300 text-emerald-950">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">SYSTEM HEALTHY: NO DEADLOCK DETECTED</div>
                <p className="opacity-90 mt-0.5">
                  Bipartite Resource Allocation Graph is strictly acyclic and multi-instance reduction confirms safe progress.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 4 Coffman Conditions Grid */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            The 4 Necessary Coffman Conditions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* 1. Mutual Exclusion */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800">1. Mutual Exclusion</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                    me?.satisfied ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {me?.satisfied ? 'SATISFIED' : 'NOT MET'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  {me?.explanation || 'Machines are dedicated and non-shareable.'}
                </p>
              </div>
            </div>

            {/* 2. Hold and Wait */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800">2. Hold & Wait</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                    hw?.satisfied ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {hw?.satisfied ? 'SATISFIED' : 'NOT MET'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  {hw?.explanation || 'Jobs holding machines while waiting for others.'}
                </p>
              </div>
            </div>

            {/* 3. No Preemption */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800">3. No Preemption</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                    np?.satisfied ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {np?.satisfied ? 'SATISFIED' : 'NOT MET'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  {np?.explanation || 'Workpieces mounted cannot be preempted.'}
                </p>
              </div>
            </div>

            {/* 4. Circular Wait */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800">4. Circular Wait</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                    cw?.satisfied ? 'bg-rose-100 text-rose-800 font-bold' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {cw?.satisfied ? 'SATISFIED' : 'ACYCLIC'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  {cw?.explanation || 'Closed loop of process dependencies in RAG.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Resource Allocation Graph */}
        <div className="pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Resource Allocation Graph (RAG)
          </h3>
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 overflow-x-auto">
            <ResourceAllocationGraph
              deadlockInfo={dInfo}
              ragData={dInfo.rag}
              cycleNodes={dInfo.cycleNodes || []}
              jobs={snapshot?.jobs || {}}
              resourceTypes={snapshot?.resourceTypes || {}}
              onOpenRecoveryModal={handleRunRecovery}
            />
          </div>
        </div>

        {/* Deadlock Recovery Action Panel */}
        {hasDeadlock && (
          <div className="pt-3 border-t border-slate-200 space-y-2">
            <div className="flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-rose-600" />
              <h3 className="text-xs font-bold text-rose-950 uppercase tracking-wider">
                Deadlock Recovery: Victim Termination
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-snug">
              Terminate one of the trapped workpiece processes to reclaim its allocated machine fixtures and break the circular wait cycle.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-700">Victim Candidate:</span>
                {victimCandidates.map((jid) => (
                  <button
                    key={jid}
                    type="button"
                    onClick={() => setSelectedVictim(jid)}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition border ${
                      selectedVictim === jid
                        ? 'bg-rose-600 text-white border-rose-700'
                        : 'bg-white text-rose-900 border-rose-300 hover:bg-rose-50'
                    }`}
                  >
                    {jid}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleRunRecovery}
                className="px-3.5 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs transition flex items-center gap-1.5"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Terminate {selectedVictim} & Break Cycle</span>
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
