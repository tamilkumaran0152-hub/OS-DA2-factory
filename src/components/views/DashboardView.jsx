import React, { useState } from 'react';
import {
  Cpu,
  Play,
  Clock,
  CheckCircle2,
  Activity,
  ShieldCheck,
  AlertOctagon,
  HelpCircle,
  Brain,
  ChevronRight,
  Flame,
  Wrench,
  Paintbrush,
  Package,
  Cog,
  Info,
} from 'lucide-react';
import { ProcessState } from '../../simulation/types.js';
import { RESOURCE_DEFINITIONS } from '../../simulation/resources.js';

const WORKSTATION_ICONS = {
  CNC: Cog,
  WELDING: Flame,
  ASSEMBLY: Wrench,
  PAINTING: Paintbrush,
  PACKAGING: Package,
};

export default function DashboardView({
  snapshot,
  onNavigateToView,
  onInspectJob,
  onWhyWaiting,
}) {
  const [showExplanationRegisters, setShowExplanationRegisters] = useState(false);

  const {
    jobs,
    resourceTypes,
    machineInstances,
    metrics,
    deadlockInfo,
    lastDecision,
    bankerMode,
  } = snapshot;

  const jobList = Object.values(jobs || {});
  const activeCount = jobList.filter(
    (j) => j.state !== ProcessState.COMPLETED && j.state !== ProcessState.TERMINATED
  ).length;
  const runningCount = jobList.filter((j) => j.state === ProcessState.RUNNING).length;
  const waitingCount = jobList.filter((j) => j.state === ProcessState.WAITING).length;
  const completedCount = jobList.filter((j) => j.state === ProcessState.COMPLETED).length;
  const overallUtil = metrics?.summary?.overallUtilization ?? 0;
  const hasDeadlock = deadlockInfo?.hasDeadlock;

  // Calculate actual machine utilization per resource type from simulation metrics
  const machines = Object.values(machineInstances || {});
  const resourceUtilization = Object.values(RESOURCE_DEFINITIONS).map((def) => {
    const typeMachines = machines.filter((m) => m.type === def.type);
    let utilPct = 0;
    if (snapshot.time > 0 && typeMachines.length > 0) {
      const totalBusy = typeMachines.reduce((sum, m) => sum + (m.totalBusyTime || 0), 0);
      const totalCapTime = typeMachines.length * snapshot.time;
      utilPct = Math.min(100, Math.round((totalBusy / totalCapTime) * 100));
    } else {
      // If at t=0, show currently allocated % if running
      const resState = resourceTypes[def.type] || {};
      utilPct = Math.round(((resState.allocated || 0) / def.capacity) * 100);
    }

    return {
      type: def.type,
      name: def.shortName,
      capacity: def.capacity,
      allocated: resourceTypes[def.type]?.allocated || 0,
      available: resourceTypes[def.type]?.available ?? def.capacity,
      utilizationPercent: utilPct,
      color: def.color,
      accentColor: def.accentColor,
    };
  });

  return (
    <div className="space-y-5">
      {/* 1. TOP SUMMARY CARDS (Section 6) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Active Jobs */}
        <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>ACTIVE JOBS</span>
            <Cpu className="w-4 h-4 text-blue-400" />
          </div>
          <div className="my-2 flex items-baseline gap-1.5">
            <span className="text-2xl lg:text-3xl font-bold font-mono text-slate-100">
              {activeCount}
            </span>
            <span className="text-xs font-mono text-slate-500">/ {jobList.length}</span>
          </div>
          <div className="text-[11px] text-slate-500 truncate">In-flight workpieces</div>
        </div>

        {/* Running */}
        <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>RUNNING</span>
            <Play className="w-4 h-4 text-cyan-400 fill-current" />
          </div>
          <div className="my-2 flex items-baseline gap-1.5">
            <span className="text-2xl lg:text-3xl font-bold font-mono text-cyan-400">
              {runningCount}
            </span>
            <span className="text-xs font-mono text-slate-500">cells</span>
          </div>
          <div className="text-[11px] text-cyan-500/80 truncate">Active machine fixtures</div>
        </div>

        {/* Waiting */}
        <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>WAITING</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-2 flex items-baseline gap-1.5">
            <span className="text-2xl lg:text-3xl font-bold font-mono text-amber-400">
              {waitingCount}
            </span>
            <span className="text-xs font-mono text-slate-500">queued</span>
          </div>
          <div className="text-[11px] text-amber-500/80 truncate">Semaphore contention</div>
        </div>

        {/* Completed */}
        <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>COMPLETED</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-2 flex items-baseline gap-1.5">
            <span className="text-2xl lg:text-3xl font-bold font-mono text-emerald-400">
              {completedCount}
            </span>
            <span className="text-xs font-mono text-slate-500">done</span>
          </div>
          <div className="text-[11px] text-emerald-500/80 truncate">100% stage fulfillment</div>
        </div>

        {/* Machine Utilization */}
        <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>UTILIZATION</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="my-2 flex items-baseline gap-1.5">
            <span className="text-2xl lg:text-3xl font-bold font-mono text-slate-100">
              {overallUtil}%
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-cyan-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, overallUtil)}%` }}
            />
          </div>
        </div>

        {/* System Safety */}
        <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>SYSTEM SAFETY</span>
            {hasDeadlock ? (
              <AlertOctagon className="w-4 h-4 text-rose-400" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            )}
          </div>
          <div className="my-2">
            {hasDeadlock ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                DEADLOCK
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                SAFE ✓
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 truncate">
            {bankerMode ? 'Banker check active' : 'Standard semaphore flow'}
          </div>
        </div>
      </div>

      {/* 2. MIDDLE SECTION: FACTORY STATUS (LEFT) & OS DECISION ENGINE (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT LARGE CARD: FACTORY STATUS */}
        <div className="lg:col-span-7 bg-[#0e1422] border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
                  FACTORY STATUS
                </h2>
                <p className="text-[11px] text-slate-400">
                  Shopfloor workstation capacity and live cell assignment
                </p>
              </div>

              <button
                onClick={() => onNavigateToView && onNavigateToView('factory-floor')}
                className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
              >
                <span>Floor Plan</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 5 Workstations List */}
            <div className="space-y-2.5">
              {resourceUtilization.map((res) => {
                const Icon = WORKSTATION_ICONS[res.type] || Cog;
                const isFull = res.available === 0;
                const queue = resourceTypes[res.type]?.waitingQueue || [];

                return (
                  <div
                    key={res.type}
                    className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition"
                  >
                    {/* Left: Icon & Name */}
                    <div className="flex items-center gap-2.5 min-w-[120px]">
                      <div
                        className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: res.accentColor, color: res.color }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200">
                          {res.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {res.type}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Visual Capacity Dots */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: res.capacity }).map((_, i) => {
                          const isOccupied = i < res.allocated;
                          return (
                            <span
                              key={i}
                              className={`w-2.5 h-2.5 rounded-full ${
                                isOccupied
                                  ? 'bg-cyan-400 shadow-[0_0_6px_rgba(0,240,255,0.4)]'
                                  : 'bg-slate-700'
                              }`}
                              title={isOccupied ? 'Machine busy' : 'Machine available'}
                            />
                          );
                        })}
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-300">
                        {res.available} / {res.capacity} avail
                      </span>
                    </div>

                    {/* Right: Queue Pill & Status */}
                    <div className="flex items-center gap-2">
                      {queue.length > 0 ? (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          {queue.length} in queue
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-500">
                          No queue
                        </span>
                      )}

                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          isFull
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {isFull ? 'BUSY' : 'READY'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>5 Workstation Pools • 9 Physical Fixtures</span>
            <span>Governed by Dijkstra Semaphores</span>
          </div>
        </div>

        {/* RIGHT CARD: OS DECISION ENGINE */}
        <div className="lg:col-span-5 bg-[#0e1422] border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Brain className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
                    OS DECISION ENGINE
                    <span className="text-[10px] font-mono text-cyan-400 font-semibold px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800">
                      t = {lastDecision?.time?.toFixed(0) ?? 0}s
                    </span>
                  </h2>
                </div>
              </div>

              <button
                onClick={() => setShowExplanationRegisters(!showExplanationRegisters)}
                className="text-[11px] font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-500/30 transition flex items-center gap-1"
              >
                <HelpCircle className="w-3 h-3" />
                <span>{showExplanationRegisters ? 'Hide' : 'Inspect WHY'}</span>
              </button>
            </div>

            {lastDecision ? (
              <div className="space-y-2.5">
                {/* WHAT HAPPENED */}
                <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
                  <div className="text-[9px] font-bold uppercase font-mono tracking-wider text-slate-400 mb-0.5">
                    WHAT HAPPENED?
                  </div>
                  <div className="text-xs font-medium text-slate-200 leading-snug">
                    {lastDecision.whatHappened}
                  </div>
                </div>

                {/* WHY IT HAPPENED */}
                <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
                  <div className="text-[9px] font-bold uppercase font-mono tracking-wider text-amber-400 mb-0.5">
                    WHY?
                  </div>
                  <div className="text-xs text-slate-300 leading-snug">
                    {lastDecision.whyItHappened}
                  </div>
                </div>

                {/* DECISION & CONCEPT */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80">
                    <div className="text-[9px] font-bold uppercase font-mono tracking-wider text-cyan-400 mb-0.5">
                      OS CONCEPT
                    </div>
                    <div className="text-[11px] font-bold text-slate-200 truncate">
                      {lastDecision.osConcept}
                    </div>
                  </div>

                  <div className="bg-[#121c32] p-2 rounded-lg border border-cyan-500/40">
                    <div className="text-[9px] font-bold uppercase font-mono tracking-wider text-cyan-300 mb-0.5">
                      DECISION
                    </div>
                    <div className="text-[11px] font-bold text-white truncate">
                      {lastDecision.decision}
                    </div>
                  </div>
                </div>

                {/* FACTORY IMPACT */}
                <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
                  <div className="text-[9px] font-bold uppercase font-mono tracking-wider text-emerald-400 mb-0.5">
                    FACTORY IMPACT
                  </div>
                  <div className="text-xs text-slate-300 leading-snug">
                    {lastDecision.manufacturingImpact}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">
                Awaiting first discrete OS event. Press PLAY or STEP.
              </div>
            )}
          </div>

          {/* Expandable Explanation Register Data */}
          {showExplanationRegisters && lastDecision?.explanationData && (
            <div className="mt-2.5 p-2 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[10px] font-mono font-bold text-cyan-400 mb-1 flex items-center gap-1">
                <Info className="w-3 h-3" />
                <span>REGISTER VALUES:</span>
              </div>
              <pre className="text-[10px] font-mono text-slate-300 overflow-x-auto max-h-24 bg-slate-900/90 p-1.5 rounded border border-slate-800">
                {JSON.stringify(lastDecision.explanationData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* 3. LIVE PRODUCTION QUEUE (Section 7) */}
      <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              LIVE PRODUCTION
            </h2>
            <p className="text-[11px] text-slate-400">
              Real-time workpiece progression and machine assignments
            </p>
          </div>

          <button
            onClick={() => onNavigateToView && onNavigateToView('processes')}
            className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
          >
            <span>Process Manager</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Compact Jobs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[10px] font-mono uppercase">
                <th className="pb-2 font-semibold">JOB ID</th>
                <th className="pb-2 font-semibold">WORKPIECE NAME</th>
                <th className="pb-2 font-semibold">CURRENT STAGE</th>
                <th className="pb-2 font-semibold">STATE</th>
                <th className="pb-2 font-semibold min-w-[140px]">PROGRESS</th>
                <th className="pb-2 font-semibold">PRIORITY</th>
                <th className="pb-2 text-right font-semibold">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {jobList.map((job) => {
                const currentStage = job.stages[job.currentStageIndex];
                const isRunning = job.state === ProcessState.RUNNING;
                const isWaiting = job.state === ProcessState.WAITING;
                const isCompleted = job.state === ProcessState.COMPLETED;
                const isTerminated = job.state === ProcessState.TERMINATED;

                const progress =
                  isRunning && job.currentStageBurstTotal > 0
                    ? Math.round(
                        ((job.currentStageBurstTotal - job.currentStageBurstRemaining) /
                          job.currentStageBurstTotal) *
                          100
                      )
                    : isCompleted
                    ? 100
                    : 0;

                return (
                  <tr key={job.id} className="hover:bg-slate-800/40 transition">
                    {/* Job ID */}
                    <td className="py-2.5 font-mono font-bold text-cyan-300">
                      {job.id}
                    </td>

                    {/* Name */}
                    <td className="py-2.5 text-slate-200">
                      {job.name}
                    </td>

                    {/* Current Operation */}
                    <td className="py-2.5 text-slate-300 font-mono text-[11px]">
                      {isCompleted ? (
                        <span className="text-emerald-400">All Stages Finished</span>
                      ) : isTerminated ? (
                        <span className="text-rose-400">Aborted (Victim)</span>
                      ) : (
                        <span>
                          {currentStage?.stageName}{' '}
                          <span className="text-slate-500">
                            ({currentStage?.resourceType})
                          </span>
                        </span>
                      )}
                    </td>

                    {/* State Badge */}
                    <td className="py-2.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                          isRunning
                            ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                            : isWaiting
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : isCompleted
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : isTerminated
                            ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                        }`}
                      >
                        {job.state}
                      </span>
                    </td>

                    {/* Progress Bar */}
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isCompleted
                                ? 'bg-emerald-400'
                                : isWaiting
                                ? 'bg-amber-400'
                                : 'bg-cyan-400'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-slate-400 w-8 text-right">
                          {progress}%
                        </span>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-2.5 font-mono text-xs text-slate-400">
                      P{job.priority}
                    </td>

                    {/* Action */}
                    <td className="py-2.5 text-right space-x-1">
                      {isWaiting && onWhyWaiting && (
                        <button
                          onClick={() => onWhyWaiting(job)}
                          className="px-2 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] font-bold font-mono transition"
                          title="Inspect why this workpiece is blocked"
                        >
                          WHY?
                        </button>
                      )}
                      <button
                        onClick={() => onInspectJob && onInspectJob(job.id)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono transition"
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
      </div>

      {/* 4. MACHINE UTILIZATION CHART (Section 8) */}
      <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              MACHINE UTILIZATION
            </h2>
            <p className="text-[11px] text-slate-400">
              Workstation duty cycles derived from active machining runtime vs total elapsed clock
            </p>
          </div>

          <div className="text-xs font-mono text-slate-400">
            Overall Plant Load: <strong className="text-cyan-400">{overallUtil}%</strong>
          </div>
        </div>

        {/* Clean Utilization Bars */}
        <div className="space-y-3 pt-1">
          {resourceUtilization.map((res) => {
            return (
              <div key={res.type} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">{res.name}</span>
                    <span className="text-[10px] text-slate-500">
                      ({res.capacity} {res.capacity === 1 ? 'fixture' : 'fixtures'})
                    </span>
                  </div>
                  <span className="font-bold text-cyan-400">
                    {res.utilizationPercent}%
                  </span>
                </div>

                <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                    style={{ width: `${Math.max(2, res.utilizationPercent)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
