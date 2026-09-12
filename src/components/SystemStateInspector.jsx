import React from 'react';
import { X, Database, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { ProcessState } from '../simulation/types.js';

export default function SystemStateInspector({ isOpen, onClose, snapshot }) {
  if (!isOpen || !snapshot) return null;

  const {
    time,
    jobs,
    resourceTypes,
    machineInstances,
    deadlockInfo,
    metrics,
  } = snapshot;

  const jobList = Object.values(jobs);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0b101c] border border-slate-700 rounded-2xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                SYSTEM STATE INSPECTOR
                <span className="font-mono text-xs font-bold text-cyan-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                  SNAPSHOT AT t = {time}s
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Exact mathematical and architectural snapshot of operating system registers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Snapshot Content */}
        <div className="my-5 space-y-6">
          {/* 1. Process States */}
          <div>
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">
              1. PROCESS CONTROL BLOCKS (PCB)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {jobList.map((j) => (
                <div key={j.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-200">{j.id}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
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
                  <div className="text-[10px] text-slate-400 truncate">
                    {j.name} (P{j.priority})
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Stage {j.currentStageIndex + 1}/{j.stages.length} | Rem: {j.currentStageBurstRemaining}s
                  </div>
                  {j.assignedInstanceId && (
                    <div className="text-[10px] text-cyan-400">
                      Machine: {j.assignedInstanceId}
                    </div>
                  )}
                  {j.waitingForResourceType && (
                    <div className="text-[10px] text-amber-400">
                      Blocked on: {j.waitingForResourceType}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 2. Resources & Counting Semaphores */}
          <div>
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
              2. RESOURCES & COUNTING SEMAPHORES
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {Object.values(resourceTypes).map((r) => (
                <div key={r.type} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-center">
                  <div className="font-bold text-slate-200 mb-1">{r.shortName || r.type}</div>
                  <div className="text-xs font-bold text-cyan-300">
                    Avail: {r.available}/{r.capacity}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Allocated: {r.allocated}
                  </div>
                  <div className="text-[10px] text-amber-400">
                    Queue: {r.waitingQueue?.length || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Safety & Deadlock Register */}
          <div>
            <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">
              3. SAFETY & CONCURRENCY STATE
            </h3>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400">Deadlock State:</span>{' '}
                <span className={`font-bold ${deadlockInfo.hasDeadlock ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {deadlockInfo.hasDeadlock ? `DEADLOCK (${deadlockInfo.cycleString})` : 'NONE (Cycle-free)'}
                </span>
              </div>
              <div>
                <span className="text-slate-400">System Throughput:</span>{' '}
                <span className="text-cyan-300 font-bold">{metrics.summary.throughput} jobs/sec</span>
              </div>
              <div>
                <span className="text-slate-400">Average Waiting Time:</span>{' '}
                <span className="text-amber-300 font-bold">{metrics.summary.avgWaitingTime}s</span>
              </div>
              <div>
                <span className="text-slate-400">Overall Utilization:</span>{' '}
                <span className="text-emerald-300 font-bold">{metrics.summary.overallUtilization}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="btn-industrial btn-ghost text-xs px-4 py-2"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
