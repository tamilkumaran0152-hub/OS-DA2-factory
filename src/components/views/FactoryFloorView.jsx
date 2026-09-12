import React from 'react';
import {
  Cog,
  Flame,
  Wrench,
  Paintbrush,
  Package,
  Users,
  Lock,
  Unlock,
} from 'lucide-react';
import { RESOURCE_DEFINITIONS } from '../../simulation/resources.js';
import { ResourceState } from '../../simulation/types.js';

const WORKSTATION_ICONS = {
  CNC: Cog,
  WELDING: Flame,
  ASSEMBLY: Wrench,
  PAINTING: Paintbrush,
  PACKAGING: Package,
};

export default function FactoryFloorView({
  resourceTypes,
  machineInstances,
  jobs,
  onInspectJob,
  onWhyWaiting,
}) {
  const machines = Object.values(machineInstances || {});
  const runningMachinesCount = machines.filter((m) => m.state === ResourceState.RUNNING).length;
  const totalMachinesCount = machines.length;

  return (
    <div className="space-y-5">
      {/* Header Banner & Live Telemetry Strip */}
      <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
              SHOPFLOOR WORKSTATION CELLS
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              5 WORKSTATIONS • 9 MACHINES
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Counting semaphores coordinate discrete machine assignments and mutual exclusion
          </p>
        </div>

        {/* Legend & Stats */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-400">
            <span>ACTIVE CELLS:</span>
            <span className="text-cyan-400 font-bold">
              {runningMachinesCount} / {totalMachinesCount}
            </span>
          </div>

          <div className="h-3.5 w-[1px] bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>Running</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-600" />
              <span>Idle</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Contention</span>
            </span>
          </div>
        </div>
      </div>

      {/* 5 Workstation Sections in Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {Object.values(RESOURCE_DEFINITIONS).map((def) => {
          const resState = resourceTypes[def.type] || {};
          const Icon = WORKSTATION_ICONS[def.type] || Cog;
          const waitingQueue = resState.waitingQueue || [];
          const isExhausted = resState.available === 0;

          return (
            <div
              key={def.type}
              className={`rounded-xl border flex flex-col justify-between transition-all p-3.5 ${
                isExhausted
                  ? 'bg-[#111726] border-amber-500/35 shadow-[0_0_15px_rgba(245,158,11,0.06)]'
                  : 'bg-[#0e1422] border-slate-800'
              }`}
            >
              <div>
                {/* Workstation Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-slate-200"
                      style={{ backgroundColor: def.accentColor, color: def.color }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-200 leading-tight">
                        {def.shortName}
                      </h3>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Cap: {def.capacity} {def.capacity === 1 ? 'cell' : 'cells'}
                      </div>
                    </div>
                  </div>

                  {/* Availability Pill */}
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                      isExhausted
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {resState.available} / {def.capacity} AVAIL
                  </span>
                </div>

                {/* Capacity Dots */}
                <div className="flex items-center justify-between mb-3 px-1 text-[10px] font-mono text-slate-400">
                  <span>Allocation:</span>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: def.capacity }).map((_, i) => {
                      const isAlloc = i < resState.allocated;
                      return (
                        <div
                          key={i}
                          className={`w-2.5 h-2.5 rounded-sm ${
                            isAlloc ? 'bg-cyan-400' : 'bg-slate-700'
                          }`}
                          title={isAlloc ? 'Instance Busy' : 'Instance Free'}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Individual Machine Cards */}
                <div className="space-y-2">
                  {def.instances.map((instId) => {
                    const m = machineInstances[instId] || {};
                    const isRunning = m.state === ResourceState.RUNNING;
                    const job = m.currentJobId ? jobs[m.currentJobId] : null;

                    return (
                      <div
                        key={instId}
                        className={`p-3 rounded-lg border transition-all ${
                          isRunning
                            ? 'bg-[#131d32] border-cyan-500/40 shadow-sm'
                            : 'bg-slate-900/60 border-slate-800/80'
                        }`}
                      >
                        {/* Machine ID & State */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-xs font-bold text-slate-200 flex items-center gap-1">
                            <span className="text-slate-500">#</span> {instId}
                          </span>
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                              isRunning
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {isRunning ? '● RUNNING' : '○ IDLE'}
                          </span>
                        </div>

                        {/* Running Details or Idle Banner */}
                        {isRunning && job ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <button
                                onClick={() => onInspectJob && onInspectJob(job.id)}
                                className="font-bold text-cyan-300 hover:text-cyan-200 hover:underline truncate max-w-[130px] text-left"
                                title={`Inspect PCB for ${job.name}`}
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
                                className="h-full bg-cyan-400 rounded-full transition-all duration-300"
                                style={{ width: `${m.progress}%` }}
                              />
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                              <span>Remaining: {m.currentBurstRemaining}s</span>
                              <span className="text-cyan-400 font-semibold flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" /> Cell Locked
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="py-2 flex items-center justify-center gap-1 text-[11px] text-slate-500 font-medium">
                            <Unlock className="w-3 h-3 text-slate-600" />
                            <span>Fixture Available</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Waiting Queue Footer */}
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
                        className="px-1.5 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold transition"
                        title="Waiting in semaphore queue"
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
