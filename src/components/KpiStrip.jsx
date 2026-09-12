import React from 'react';
import { Cpu, Play, Clock, CheckCircle2, Activity, ShieldCheck, AlertOctagon } from 'lucide-react';
import { ProcessState } from '../simulation/types.js';

export default function KpiStrip({ jobs, metrics, deadlockInfo, bankerMode }) {
  const jobList = Object.values(jobs);
  const activeCount = jobList.filter((j) => j.state !== ProcessState.COMPLETED && j.state !== ProcessState.TERMINATED).length;
  const runningCount = jobList.filter((j) => j.state === ProcessState.RUNNING).length;
  const waitingCount = jobList.filter((j) => j.state === ProcessState.WAITING).length;
  const completedCount = jobList.filter((j) => j.state === ProcessState.COMPLETED).length;

  const utilization = metrics?.summary?.overallUtilization ?? 0;
  const hasDeadlock = deadlockInfo?.hasDeadlock;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Active Jobs */}
      <div className="panel-industrial p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>ACTIVE ORDERS</span>
          <Cpu className="w-4 h-4 text-blue-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-slate-100">
            {String(activeCount).padStart(2, '0')}
          </span>
          <span className="text-xs text-slate-500 font-mono">/ {String(jobList.length).padStart(2, '0')}</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">In-flight workpieces</div>
      </div>

      {/* 2. Running on Machines */}
      <div className="panel-industrial p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>RUNNING</span>
          <Play className="w-4 h-4 text-cyan-400 fill-current" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-cyan-400">
            {String(runningCount).padStart(2, '0')}
          </span>
          <span className="text-xs text-slate-500 font-mono">workcells</span>
        </div>
        <div className="text-[11px] text-cyan-500/80 mt-1">Active machine cycles</div>
      </div>

      {/* 3. Waiting / Contention */}
      <div className="panel-industrial p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>WAITING QUEUE</span>
          <Clock className="w-4 h-4 text-amber-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-amber-400">
            {String(waitingCount).padStart(2, '0')}
          </span>
          <span className="text-xs text-slate-500 font-mono">contending</span>
        </div>
        <div className="text-[11px] text-amber-500/80 mt-1">Blocked on semaphores</div>
      </div>

      {/* 4. Completed */}
      <div className="panel-industrial p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>COMPLETED</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-emerald-400">
            {String(completedCount).padStart(2, '0')}
          </span>
          <span className="text-xs text-slate-500 font-mono">finished</span>
        </div>
        <div className="text-[11px] text-emerald-500/80 mt-1">100% stage fulfillment</div>
      </div>

      {/* 5. Machine Utilization */}
      <div className="panel-industrial p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>UTILIZATION</span>
          <Activity className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-slate-100">
            {utilization}%
          </span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
          <div
            className="bg-cyan-400 h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, utilization)}%` }}
          />
        </div>
      </div>

      {/* 6. System Safety */}
      <div className="panel-industrial p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>SYSTEM SAFETY</span>
          {hasDeadlock ? (
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          )}
        </div>
        <div className="mt-2">
          {hasDeadlock ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-bold font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40">
              DEADLOCK
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              SAFE ✓
            </span>
          )}
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          {bankerMode ? 'Banker check active' : 'Standard semaphore flow'}
        </div>
      </div>
    </div>
  );
}
