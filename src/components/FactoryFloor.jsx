import React from 'react';
import { RESOURCE_DEFINITIONS } from '../simulation/resources.js';
import { ResourceState } from '../simulation/types.js';
import { Cog, Flame, Wrench, Paintbrush, Package, Users, Lock, Unlock, AlertCircle } from 'lucide-react';

const WORKSTATION_ICONS = {
  CNC: Cog,
  WELDING: Flame,
  ASSEMBLY: Wrench,
  PAINTING: Paintbrush,
  PACKAGING: Package,
};

export default function FactoryFloor({ resourceTypes, machineInstances, jobs, onInspectJob }) {
  return (
    <div className="panel-industrial p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
            SHOPFLOOR WORKSTATIONS & PHYSICAL MACHINES
          </h2>
          <p className="text-xs text-slate-400">
            5 workstation types governing 9 dedicated machine cells via counting semaphores
          </p>
        </div>

        {/* Status Legend */}
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Running</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span>Idle</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Contention</span>
          </span>
        </div>
      </div>

      {/* 5 Workstation Bays */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {Object.values(RESOURCE_DEFINITIONS).map((def) => {
          const resState = resourceTypes[def.type] || {};
          const Icon = WORKSTATION_ICONS[def.type] || Cog;
          const waitingQueue = resState.waitingQueue || [];
          const isExhausted = resState.available === 0;

          return (
            <div
              key={def.type}
              className={`rounded-xl border flex flex-col justify-between transition-all ${
                isExhausted
                  ? 'bg-[#111625] border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.08)]'
                  : 'bg-[#0e1422] border-slate-800'
              } p-3.5`}
            >
              {/* Workstation Header & Capacity Summary */}
              <div>
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-200"
                      style={{ backgroundColor: def.accentColor, color: def.color }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-200 leading-tight">
                        {def.shortName}
                      </h3>
                      <div className="text-[10px] text-slate-400">
                        Cap: {def.capacity} {def.capacity === 1 ? 'unit' : 'units'}
                      </div>
                    </div>
                  </div>

                  {/* Availability Pill */}
                  <div
                    className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold border ${
                      isExhausted
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {resState.available} / {def.capacity} AVAIL
                  </div>
                </div>

                {/* Capacity Dots */}
                <div className="flex items-center justify-between mb-3 px-1 text-[10px] font-mono text-slate-400">
                  <span>Capacity Allocation:</span>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: def.capacity }).map((_, i) => {
                      const isAllocated = i < resState.allocated;
                      return (
                        <div
                          key={i}
                          className={`w-2.5 h-2.5 rounded-sm ${
                            isAllocated ? 'bg-cyan-400' : 'bg-slate-700'
                          }`}
                          title={isAllocated ? 'Instance Allocated' : 'Instance Available'}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Machine Cards inside Workstation */}
                <div className="space-y-2">
                  {def.instances.map((instId) => {
                    const m = machineInstances[instId] || {};
                    const isRunning = m.state === ResourceState.RUNNING;
                    const job = m.currentJobId ? jobs[m.currentJobId] : null;

                    return (
                      <div
                        key={instId}
                        className={`p-2.5 rounded-lg border transition-all ${
                          isRunning
                            ? 'bg-[#141d30] border-cyan-500/40 shadow-sm'
                            : 'bg-slate-900/60 border-slate-800'
                        }`}
                      >
                        {/* Machine ID & Status Badge */}
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <span className="text-slate-400">#</span> {instId}
                          </span>
                          <span
                            className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                              isRunning
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {isRunning ? '● RUNNING' : '○ IDLE'}
                          </span>
                        </div>

                        {/* Running Details or Idle State */}
                        {isRunning && job ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <button
                                onClick={() => onInspectJob && onInspectJob(job.id)}
                                className="font-bold text-cyan-300 hover:text-cyan-200 hover:underline truncate max-w-[130px] text-left"
                                title={`Inspect ${job.name}`}
                              >
                                {job.id} — {job.name}
                              </button>
                              <span className="font-mono text-xs font-bold text-cyan-400">
                                {m.progress}%
                              </span>
                            </div>

                            {/* Clean Progress Bar */}
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-cyan-400 transition-all duration-300"
                                style={{ width: `${m.progress}%` }}
                              />
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                              <span>Rem: {m.currentBurstRemaining}s</span>
                              <span className="text-cyan-500/90 font-semibold flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" /> LOCKED
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="py-2.5 flex items-center justify-center gap-1 text-[11px] text-slate-500 font-medium">
                            <Unlock className="w-3 h-3 text-slate-600" />
                            <span>Resource Available</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Workstation Footer: Semaphore & Queue */}
              <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1 text-slate-400">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  <span>Queue:</span>
                  <span className="font-bold font-mono text-amber-400">
                    {waitingQueue.length}
                  </span>
                </div>

                {waitingQueue.length > 0 ? (
                  <div className="flex items-center gap-1">
                    {waitingQueue.map((wId) => (
                      <button
                        key={wId}
                        onClick={() => onInspectJob && onInspectJob(wId)}
                        className="px-1.5 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold"
                        title="Waiting in semaphore queue — click to inspect"
                      >
                        {wId}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-600 font-mono">No wait</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
