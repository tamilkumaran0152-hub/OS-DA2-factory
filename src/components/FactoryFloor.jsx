import React from 'react';
import { RESOURCE_DEFINITIONS } from '../simulation/resources.js';
import { ResourceState } from '../simulation/types.js';
import { Factory, Cog, Flame, Wrench, Paintbrush, Package, Check, Clock, Users } from 'lucide-react';

const ICONS = {
  CNC: Cog,
  WELDING: Flame,
  ASSEMBLY: Wrench,
  PAINTING: Paintbrush,
  PACKAGING: Package,
};

export default function FactoryFloor({ resourceTypes, machineInstances, jobs, onInspectJob }) {
  return (
    <div className="control-card p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Factory className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            SHOPFLOOR WORKSTATIONS & PHYSICAL MACHINES
          </h2>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" /> Running
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500" /> Idle / Free
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Contended Queue
          </span>
        </div>
      </div>

      {/* 5 Workstation Bays */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        {Object.values(RESOURCE_DEFINITIONS).map((def) => {
          const resState = resourceTypes[def.type] || {};
          const Icon = ICONS[def.type] || Cog;
          const waitingQueue = resState.waitingQueue || [];

          return (
            <div
              key={def.type}
              className="bg-slate-950/60 rounded-xl border border-slate-800/80 p-3 flex flex-col justify-between"
            >
              {/* Header: Resource Type & Semaphore */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="p-1.5 rounded-lg"
                      style={{ backgroundColor: def.accentColor, color: def.color }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-200 leading-tight">
                        {def.shortName}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Cap: {def.capacity}
                      </span>
                    </div>
                  </div>

                  {/* Semaphore Pill */}
                  <div
                    className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold border ${
                      resState.available > 0
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}
                    title={`Counting Semaphore S = ${resState.available}`}
                  >
                    Sem: {resState.available}/{def.capacity}
                  </div>
                </div>

                {/* Machines inside this Resource Type */}
                <div className="space-y-2 mt-3">
                  {def.instances.map((instId) => {
                    const m = machineInstances[instId] || {};
                    const isRunning = m.state === ResourceState.RUNNING;
                    const job = m.currentJobId ? jobs[m.currentJobId] : null;

                    return (
                      <div
                        key={instId}
                        className={`p-2.5 rounded-lg border transition-all ${
                          isRunning
                            ? 'bg-slate-900/90 border-cyan-500/40 shadow-[0_0_12px_rgba(0,240,255,0.1)]'
                            : 'bg-slate-900/40 border-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-xs font-bold text-slate-300">
                            {instId}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                              isRunning
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {m.state}
                          </span>
                        </div>

                        {isRunning && job ? (
                          <div>
                            <div className="flex items-center justify-between text-[11px] mb-1">
                              <button
                                onClick={() => onInspectJob && onInspectJob(job.id)}
                                className="font-bold text-cyan-400 hover:underline truncate max-w-[130px]"
                              >
                                {job.id}: {job.name}
                              </button>
                              <span className="text-[10px] font-mono text-slate-400">
                                {m.progress}%
                              </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1">
                              <div
                                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                                style={{ width: `${m.progress}%` }}
                              />
                            </div>

                            <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                              <span>Rem: {m.currentBurstRemaining}s</span>
                              <span>Total: {m.totalBusyTime}s</span>
                            </div>
                          </div>
                        ) : (
                          <div className="py-2 text-center text-[10px] text-slate-500 font-mono">
                            Available for dispatch
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Waiting Queue for this semaphore */}
              <div className="mt-3 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-amber-400" />
                    <span>Semaphore Queue:</span>
                  </span>
                  <span className="font-bold text-amber-400">
                    {waitingQueue.length}
                  </span>
                </div>

                {waitingQueue.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {waitingQueue.map((wId) => (
                      <button
                        key={wId}
                        onClick={() => onInspectJob && onInspectJob(wId)}
                        className="px-1.5 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-mono font-bold"
                        title="Click to inspect waiting workpiece PCB"
                      >
                        {wId}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="text-[9px] text-slate-600 font-mono">
                    Queue empty (No contention)
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
