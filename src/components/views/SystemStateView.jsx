import React from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Activity,
  Layers,
  Box,
  Lock,
} from 'lucide-react';
import { ProcessState } from '../../simulation/types.js';

export default function SystemStateView({ snapshot }) {
  if (!snapshot) return null;

  const {
    time = 0,
    jobs = {},
    resourceTypes = {},
    semaphores = {},
    deadlockInfo = {},
    metrics = {},
    bankerMode,
  } = snapshot;

  const jobList = Object.values(jobs);

  return (
    <div className="space-y-5">
      {/* 1. Header Banner with Current Time t = Xs */}
      <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              SYSTEM STATE INSPECTOR
              <span className="font-mono text-xs font-bold text-cyan-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                t = {time.toFixed(0)}s
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Direct telemetry inspection of all active OS registers, PCB queues, semaphores, and safety states
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-400">STATE SNAPSHOT:</span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
            VALIDATED
          </span>
        </div>
      </div>

      {/* 2. Processes Snapshot (Section 20: J101 RUNNING, J102 WAITING, J103 READY, J104 COMPLETED) */}
      <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            PROCESS CONTROL BLOCKS (PCB) REGISTERS
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {jobList.length} total workpieces
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
          {jobList.map((j) => {
            const isRunning = j.state === ProcessState.RUNNING;
            const isWaiting = j.state === ProcessState.WAITING;
            const isCompleted = j.state === ProcessState.COMPLETED;
            const isTerminated = j.state === ProcessState.TERMINATED;

            return (
              <div
                key={j.id}
                className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">{j.id}</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                      isRunning
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : isWaiting
                        ? 'bg-amber-500/20 text-amber-300'
                        : isCompleted
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : isTerminated
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-blue-500/20 text-blue-300'
                    }`}
                  >
                    {j.state}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 font-sans truncate">
                  {j.name}
                </div>

                <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
                  Priority: P{j.priority}
                </div>

                {j.assignedInstanceId && (
                  <div className="text-[10px] text-cyan-400">
                    Cell: {j.assignedInstanceId}
                  </div>
                )}

                {j.waitingForResourceType && (
                  <div className="text-[10px] text-amber-400">
                    Waiting: {j.waitingForResourceType}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Resources & Semaphores Snapshot (Section 20: CNC 1/2 available, CNC = 1, etc.) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Resources */}
        <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5" />
              RESOURCES INVENTORY
            </span>
          </div>

          <div className="space-y-2 font-mono text-xs">
            {Object.values(resourceTypes).map((r) => (
              <div
                key={r.type}
                className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-slate-200">{r.shortName || r.type}</span>
                  <span className="text-[10px] text-slate-500 ml-2">Cap: {r.capacity}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-slate-400">
                    Alloc: <strong className="text-cyan-400">{r.allocated}</strong>
                  </span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      r.available === 0
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {r.available} / {r.capacity} available
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Semaphores */}
        <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              COUNTING SEMAPHORES (S)
            </span>
          </div>

          <div className="space-y-2 font-mono text-xs">
            {Object.entries(semaphores).map(([type, sem]) => (
              <div
                key={type}
                className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-slate-200">{type} Semaphore</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-slate-400">
                    Queue: <strong className="text-amber-400">{sem.waitingQueue?.length || 0}</strong>
                  </span>
                  <span
                    className={`font-bold px-2.5 py-0.5 rounded text-[11px] ${
                      sem.value === 0
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    S = {sem.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Safety & Deadlock Diagnostics (Section 20: System State: SAFE, Deadlock: NONE) */}
      <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-5 shadow-sm space-y-3">
        <div className="pb-2 border-b border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400 font-mono">
            SAFETY & CONCURRENCY DIAGNOSTICS
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
          {/* System Safety */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-500 block">SYSTEM STATE</span>
            <span
              className={`font-bold text-sm ${
                deadlockInfo.hasDeadlock ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {deadlockInfo.hasDeadlock ? 'UNSAFE / DEADLOCK' : 'SAFE ✓'}
            </span>
          </div>

          {/* Deadlock Detection */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-500 block">DEADLOCK CYCLE</span>
            <span
              className={`font-bold text-sm ${
                deadlockInfo.hasDeadlock ? 'text-rose-400' : 'text-slate-200'
              }`}
            >
              {deadlockInfo.hasDeadlock ? 'CIRCULAR WAIT' : 'NONE'}
            </span>
          </div>

          {/* Average Waiting Time */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-500 block">AVG WAITING TIME</span>
            <span className="font-bold text-sm text-amber-300">
              {metrics?.summary?.avgWaitingTime ?? 0}s
            </span>
          </div>

          {/* Utilization */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-500 block">OVERALL UTILIZATION</span>
            <span className="font-bold text-sm text-cyan-300">
              {metrics?.summary?.overallUtilization ?? 0}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
