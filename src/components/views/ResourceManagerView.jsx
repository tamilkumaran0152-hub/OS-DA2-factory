import React from 'react';
import {
  Box,
  Cog,
  Flame,
  Wrench,
  Paintbrush,
  Package,
  Lock,
  Unlock,
  Users,
  Layers,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { RESOURCE_DEFINITIONS } from '../../simulation/resources.js';
import { ResourceType, ResourceState } from '../../simulation/types.js';

const WORKSTATION_ICONS = {
  CNC: Cog,
  WELDING: Flame,
  ASSEMBLY: Wrench,
  PAINTING: Paintbrush,
  PACKAGING: Package,
};

export default function ResourceManagerView({
  resourceTypes,
  machineInstances,
  jobs,
  semaphores,
  onInspectJob,
}) {
  return (
    <div className="space-y-5">
      {/* 1. Header Banner & Conceptual Mapping */}
      <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 mb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Box className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
                RESOURCE ALLOCATION & WORKCELL INVENTORY
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Operating System Resource Management mapping abstract types to concrete machine fixtures
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
              5 Resource Types • 9 Units
            </span>
          </div>
        </div>

        {/* Conceptual Mapping Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase block mb-0.5">
              1. OS RESOURCE TYPES
            </span>
            <p className="text-slate-300 text-[11px] leading-snug">
              Classes of resources (R_j) with discrete capacity vectors initialized in Banker's available vector V.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase block mb-0.5">
              2. PHYSICAL INSTANCES
            </span>
            <p className="text-slate-300 text-[11px] leading-snug">
              Concrete machinery (e.g. CNC-01, CNC-02). Upon allocation, processes are locked to a specific physical fixture.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase block mb-0.5">
              3. SYNCHRONIZATION MUTEX
            </span>
            <p className="text-slate-300 text-[11px] leading-snug">
              Each resource type possesses a counting semaphore S equal to remaining available instances, enforcing atomic reservation.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Resource Type Cards (Section 11) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Object.values(RESOURCE_DEFINITIONS).map((def) => {
          const resState = resourceTypes[def.type] || {};
          const sem = semaphores[def.type] || {};
          const Icon = WORKSTATION_ICONS[def.type] || Cog;
          const waitingQueue = resState.waitingQueue || [];

          return (
            <div
              key={def.type}
              className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-slate-700 transition space-y-4"
            >
              <div>
                {/* Header: Name, Capacity & Availability */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold"
                      style={{ backgroundColor: def.accentColor, color: def.color }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-100">
                        {def.shortName} ({def.type})
                      </h3>
                      <p className="text-[10px] font-mono text-slate-400">
                        {def.fullName}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded text-xs font-mono font-bold border ${
                      resState.available === 0
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {resState.available} / {def.capacity} Available
                  </span>
                </div>

                {/* Quantitative Metric Counters: Total, Available, Allocated, Semaphore */}
                <div className="grid grid-cols-4 gap-2 pt-3 text-center text-xs font-mono">
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">TOTAL</span>
                    <span className="text-slate-200 font-bold text-sm">{def.capacity}</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">AVAILABLE</span>
                    <span className="text-emerald-400 font-bold text-sm">{resState.available}</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">ALLOCATED</span>
                    <span className="text-cyan-400 font-bold text-sm">{resState.allocated}</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">SEMAPHORE S</span>
                    <span className="text-amber-300 font-bold text-sm">{sem.value ?? resState.available}</span>
                  </div>
                </div>

                {/* Physical Machine Fixtures */}
                <div className="pt-3 space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                    PHYSICAL MACHINE INSTANCES:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {def.instances.map((instId) => {
                      const m = machineInstances[instId] || {};
                      const isRunning = m.state === ResourceState.RUNNING;
                      const job = m.currentJobId ? jobs[m.currentJobId] : null;

                      return (
                        <div
                          key={instId}
                          className={`p-2.5 rounded-lg border text-xs font-mono ${
                            isRunning
                              ? 'bg-slate-900/90 border-cyan-500/40 text-slate-200'
                              : 'bg-slate-950/60 border-slate-800 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-200">#{instId}</span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                isRunning
                                  ? 'bg-cyan-500/20 text-cyan-300'
                                  : 'bg-slate-800 text-slate-500'
                              }`}
                            >
                              {isRunning ? 'LOCKED' : 'FREE'}
                            </span>
                          </div>

                          {isRunning && job ? (
                            <div className="space-y-1 pt-1 border-t border-slate-800/80">
                              <div className="flex justify-between text-[11px]">
                                <span className="text-cyan-300 font-bold">{job.id}</span>
                                <span className="text-slate-400">{m.progress}%</span>
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">{job.name}</div>
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-600 pt-1">
                              Idle in pool
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Waiting Queue Table/List */}
                <div className="pt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span className="font-bold uppercase tracking-wider flex items-center gap-1">
                      <Users className="w-3 h-3 text-amber-400" />
                      FIFO WAITING QUEUE:
                    </span>
                    <span className="font-bold text-amber-400">
                      {waitingQueue.length} jobs suspended
                    </span>
                  </div>

                  {waitingQueue.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {waitingQueue.map((wId, qIdx) => (
                        <button
                          key={wId}
                          onClick={() => onInspectJob && onInspectJob(wId)}
                          className="px-2 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold transition flex items-center gap-1"
                        >
                          <span>#{qIdx + 1}:</span>
                          <span>{wId}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-2 rounded bg-slate-950/60 border border-slate-800/60 text-xs text-slate-500 font-mono italic text-center">
                      No jobs currently contending for {def.shortName}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
