import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  Users,
  ArrowRight,
  ArrowDown,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  History,
  Info,
} from 'lucide-react';
import { RESOURCE_DEFINITIONS } from '../../simulation/resources.js';
import { Subsystem } from '../../simulation/types.js';

export default function SynchronizationView({
  semaphores,
  resourceTypes,
  jobs,
  eventLog = [],
  onInspectJob,
}) {
  const [selectedResourceType, setSelectedResourceType] = useState('CNC');

  const selectedDef = RESOURCE_DEFINITIONS[selectedResourceType] || RESOURCE_DEFINITIONS.CNC;
  const currentSem = semaphores[selectedResourceType] || {};
  const currentRes = resourceTypes[selectedResourceType] || {};
  const queue = currentSem.waitingQueue || [];
  const holdingJobs = currentSem.allocatedJobs || [];

  // Filter actual simulation event history for semaphore / synchronization events
  const semaphoreEvents = eventLog
    .filter(
      (evt) =>
        evt.subsystem === Subsystem.SYNCHRONIZATION ||
        evt.eventType?.includes('SEMAPHORE') ||
        evt.eventType?.includes('BLOCK') ||
        evt.eventType?.includes('ACQUIRE') ||
        evt.eventType?.includes('RELEASE') ||
        evt.resourceType === selectedResourceType
    )
    .slice(0, 15);

  return (
    <div className="space-y-5">
      {/* 1. Header Banner */}
      <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
              SYNCHRONIZATION & COUNTING SEMAPHORES
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Dijkstra Concurrency Model with atomic wait(P) / signal(V) primitives governing shared machine workcells
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
            P(S): Test & Decrement • V(S): Signal & Wake
          </span>
        </div>
      </div>

      {/* 2. Resource Type Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {Object.values(RESOURCE_DEFINITIONS).map((def) => {
          const sem = semaphores[def.type] || {};
          const isSelected = selectedResourceType === def.type;

          return (
            <button
              key={def.type}
              onClick={() => setSelectedResourceType(def.type)}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition ${
                isSelected
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'bg-[#0e1422] text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>{def.shortName}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded ${
                  sem.value === 0
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                S = {sem.value ?? def.capacity}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Deep Dive for Selected Semaphore (Section 12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 7 Cols: Concurrency State & Visual Flow */}
        <div className="lg:col-span-7 space-y-4">
          {/* Semaphore Value Card */}
          <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span>{selectedDef.shortName} Semaphore</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                    Type: {selectedDef.type}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">{selectedDef.fullName}</p>
              </div>

              <div className="flex items-center gap-3 font-mono">
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">INITIAL VALUE</span>
                  <span className="text-xs font-bold text-slate-300">
                    S_0 = {selectedDef.capacity}
                  </span>
                </div>
                <div className="text-right pl-3 border-l border-slate-800">
                  <span className="text-[10px] text-slate-500 block">CURRENT VALUE</span>
                  <span
                    className={`text-base font-bold ${
                      currentSem.value === 0 ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    S = {currentSem.value ?? selectedDef.capacity}
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Acquire / Release Flowchart (Section 12) */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 block">
                SEMAPHORE EXECUTION LOGIC:
              </span>

              <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-xs font-mono text-center">
                {/* 1. Acquire */}
                <div className="w-full md:w-auto p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200">
                  <div className="font-bold text-cyan-300">wait(P)</div>
                  <div className="text-[10px] text-slate-500">Workpiece requests cell</div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-500 hidden md:block" />
                <ArrowDown className="w-4 h-4 text-slate-500 md:hidden" />

                {/* 2. Condition */}
                <div className="w-full md:w-auto p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200">
                  <div className="font-bold text-amber-300">S &gt; 0 ?</div>
                  <div className="text-[10px] text-slate-500">Capacity available?</div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-500 hidden md:block" />
                <ArrowDown className="w-4 h-4 text-slate-500 md:hidden" />

                {/* 3. Outcomes */}
                <div className="w-full md:w-auto flex flex-col gap-1.5">
                  <div className="p-2 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold">
                    YES → S--, ALLOCATE & LOCK
                  </div>
                  <div className="p-2 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300 text-[11px] font-bold">
                    NO → BLOCK INTO FIFO QUEUE
                  </div>
                </div>
              </div>
            </div>

            {/* Holding Jobs */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                CURRENTLY HOLDING INSTANCES ({holdingJobs.length} / {selectedDef.capacity}):
              </span>
              <div className="flex flex-wrap gap-2">
                {holdingJobs.length > 0 ? (
                  holdingJobs.map((jId) => (
                    <button
                      key={jId}
                      onClick={() => onInspectJob && onInspectJob(jId)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1.5 hover:bg-cyan-900/60 transition"
                    >
                      <Lock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{jId}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({jobs[jId]?.name || 'Workpiece'})
                      </span>
                    </button>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic font-mono">
                    No active locks held on {selectedDef.shortName}
                  </span>
                )}
              </div>
            </div>

            {/* Waiting Queue (Section 12: 1. J103, 2. J105) */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  SEMAPHORE FIFO WAITING QUEUE:
                </span>
                <span className="text-amber-300 font-bold">{queue.length} blocked</span>
              </div>

              {queue.length > 0 ? (
                <div className="space-y-1.5">
                  {queue.map((wId, qIdx) => (
                    <div
                      key={wId}
                      onClick={() => onInspectJob && onInspectJob(wId)}
                      className="p-2 rounded-lg bg-amber-950/30 border border-amber-500/30 flex items-center justify-between text-xs font-mono cursor-pointer hover:border-amber-400 transition"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-400">{qIdx + 1}.</span>
                        <span className="text-slate-100 font-bold">{wId}</span>
                        <span className="text-slate-400 text-[11px]">
                          ({jobs[wId]?.name || 'Workpiece'})
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                        P{jobs[wId]?.priority || 1} • Awaiting signal(V)
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-center text-xs text-slate-500 font-mono italic">
                  Queue empty. Processes requesting {selectedDef.shortName} will acquire immediately.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Live Semaphore Event History (Section 12) */}
        <div className="lg:col-span-5 bg-[#0e1422] border border-slate-800/90 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                  LIVE SEMAPHORE EVENT HISTORY
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {semaphoreEvents.length} events logged
              </span>
            </div>

            {/* Event List */}
            <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
              {semaphoreEvents.length > 0 ? (
                semaphoreEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs font-mono space-y-1 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-cyan-400 font-bold">
                        t = {evt.time.toFixed(0)}s
                      </span>
                      <span className="text-slate-400 uppercase font-semibold">
                        {evt.eventType}
                      </span>
                    </div>

                    <div className="text-slate-200 text-[11px] leading-snug">
                      {evt.whatHappened || evt.reason}
                    </div>

                    {evt.jobId && (
                      <div className="text-[10px] text-slate-500 flex items-center justify-between pt-0.5">
                        <span>Job: <strong className="text-cyan-300">{evt.jobId}</strong></span>
                        <span>Resource: <strong className="text-amber-300">{evt.resourceType || selectedResourceType}</strong></span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-16 text-center text-xs text-slate-500 font-mono">
                  No semaphore events recorded yet. Run simulation to generate acquire/release transitions.
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
            Directly derived from simulation synchronization telemetry.
          </div>
        </div>
      </div>
    </div>
  );
}
