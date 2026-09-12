import React from 'react';
import { X, Database, CheckCircle2, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import { ProcessState } from '../simulation/types.js';

export default function SystemStateInspector({ isOpen, onClose, snapshot, inline = false }) {
  if (!inline && !isOpen) return null;
  if (!snapshot) return null;

  const {
    time,
    jobs,
    resourceTypes,
    machineInstances,
    deadlockInfo,
    metrics,
  } = snapshot;

  const jobList = Object.values(jobs);

  const content = (
    <div className="space-y-4">
      {/* Overview Banner */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              SYSTEM STATE INSPECTOR
              <span className="font-mono text-xs font-bold text-cyan-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                t = {time.toFixed(1)}s
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Direct telemetry inspection of all active OS registers, PCB queues, and semaphores
            </p>
          </div>
        </div>

        {!inline && onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* 1. Process States */}
        <div className="panel-industrial p-4">
          <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3">
            1. PROCESS CONTROL BLOCKS (PCB) REGISTERS
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {jobList.map((j) => (
              <div key={j.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-200">{j.id}</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                      j.state === ProcessState.RUNNING
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : j.state === ProcessState.WAITING
                        ? 'bg-amber-500/20 text-amber-300'
                        : j.state === ProcessState.READY
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {j.state}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-sans truncate">
                  {j.name}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
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
            ))}
          </div>
        </div>

        {/* 2. Resources & Counting Semaphores */}
        <div className="panel-industrial p-4">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">
            2. RESOURCE INVENTORY & SEMAPHORE COUNTERS
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {Object.values(resourceTypes).map((r) => (
              <div key={r.type} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
                <div className="font-bold text-slate-200 mb-1 flex items-center justify-between">
                  <span>{r.shortName || r.type}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded ${r.available === 0 ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                    {r.available} / {r.capacity} AVAIL
                  </span>
                </div>
                <div className="text-slate-400 text-[11px] mt-2">
                  Allocated: <strong className="text-cyan-400">{r.allocated}</strong>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Semaphore S: <strong className="text-slate-200">{r.available}</strong>
                </div>
                <div className="text-amber-400 text-[11px]">
                  Blocked in queue: <strong>{r.waitingQueue?.length || 0}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Safety & Concurrency Diagnostics */}
        <div className="panel-industrial p-4">
          <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3">
            3. SAFETY, DEADLOCK & PERFORMANCE SUMMARY
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">DEADLOCK STATE</span>
              <span className={`font-bold text-sm ${deadlockInfo.hasDeadlock ? 'text-rose-400' : 'text-emerald-400'}`}>
                {deadlockInfo.hasDeadlock ? 'DEADLOCK DETECTED' : 'NONE (Cycle-Free)'}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">AVG WAITING TIME (WT)</span>
              <span className="font-bold text-sm text-amber-300">
                {metrics?.summary?.avgWaitingTime ?? 0}s
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">OVERALL UTILIZATION</span>
              <span className="font-bold text-sm text-cyan-300">
                {metrics?.summary?.overallUtilization ?? 0}%
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">THROUGHPUT</span>
              <span className="font-bold text-sm text-emerald-400">
                {metrics?.summary?.throughput ?? 0} jobs/s
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (inline) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0b101c] border border-slate-700 rounded-2xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
        {content}
        <div className="flex justify-end pt-4 mt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
