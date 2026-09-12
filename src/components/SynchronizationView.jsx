import React from 'react';
import { Lock, Unlock, ArrowDown, Users, CheckCircle2, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import { RESOURCE_DEFINITIONS } from '../simulation/resources.js';

export default function SynchronizationView({ semaphores, resourceTypes, jobs }) {
  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="panel-industrial p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
              SYNCHRONIZATION & COUNTING SEMAPHORES
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Dijkstra Counting Semaphore concurrency model governing physical machine assignment across workstation pools.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
            wait(P) / signal(V) Atomic Operations
          </span>
        </div>
      </div>

      {/* 5 Semaphore Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.values(RESOURCE_DEFINITIONS).map((def) => {
          const sem = semaphores[def.type] || {};
          const res = resourceTypes[def.type] || {};
          const isExhausted = sem.value === 0;

          return (
            <div
              key={def.type}
              className={`panel-industrial p-4 flex flex-col justify-between transition-all ${
                isExhausted
                  ? 'border-amber-500/40 bg-[#121827]'
                  : 'border-slate-800 bg-[#0e1422]'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold"
                      style={{ backgroundColor: def.accentColor, color: def.color }}
                    >
                      {def.shortName.substring(0, 3)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-100">
                        {def.shortName} Semaphore
                      </h3>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Resource Type: {def.type}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold border ${
                      isExhausted
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    S = {sem.value} / {def.capacity}
                  </div>
                </div>

                {/* Status Grid */}
                <div className="grid grid-cols-3 gap-2 text-xs font-mono text-center mb-3">
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">CAPACITY</span>
                    <span className="font-bold text-slate-200">{def.capacity}</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">ALLOCATED</span>
                    <span className="font-bold text-cyan-400">{res.allocated}</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">WAITING</span>
                    <span className="font-bold text-amber-400">{sem.waitingQueue?.length || 0}</span>
                  </div>
                </div>

                {/* Currently Holding Jobs */}
                <div className="space-y-2 mb-3">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                    CURRENTLY HOLDING INSTANCES:
                  </span>
                  {sem.allocatedJobs && sem.allocatedJobs.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {sem.allocatedJobs.map((jId) => (
                        <span
                          key={jId}
                          className="px-2 py-1 rounded bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1.5"
                        >
                          <Lock className="w-3 h-3 text-cyan-400" />
                          {jId} ({jobs[jId]?.name || 'Job'})
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 italic">No active locks held</span>
                  )}
                </div>

                {/* Waiting FIFO Queue */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span>FIFO WAITING QUEUE:</span>
                  </span>
                  {sem.waitingQueue && sem.waitingQueue.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {sem.waitingQueue.map((wId, qIdx) => (
                        <span
                          key={wId}
                          className="px-2 py-1 rounded bg-amber-950/70 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold"
                        >
                          #{qIdx + 1}: {wId}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 italic">No processes blocked in queue</span>
                  )}
                </div>
              </div>

              {/* Semaphore Atomic Rules */}
              <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-400 font-mono space-y-1">
                <div>• wait(S): if S &gt; 0, S-- ; else block into FIFO queue.</div>
                <div>• signal(S): if queue not empty, wake head; else S++.</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
