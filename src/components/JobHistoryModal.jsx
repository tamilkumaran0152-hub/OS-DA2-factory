import React from 'react';
import { X, Layers, Clock, CheckCircle2, ArrowDown, ShieldAlert, Cpu } from 'lucide-react';
import { ProcessState } from '../simulation/types.js';

export default function JobHistoryModal({ isOpen, onClose, job }) {
  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0b101c] border border-slate-700 rounded-2xl max-w-2xl w-full p-6 max-h-[85vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                {job.id} — {job.name}
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {job.category}
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Process Control Block (PCB) & Lifecycle Audit Trail
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

        {/* PCB Properties Grid */}
        <div className="my-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <div>
            <span className="text-slate-500 text-[10px] block">CURRENT STATE:</span>
            <span className="font-bold text-cyan-400">{job.state}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">PRIORITY:</span>
            <span className="font-bold text-amber-300">P{job.priority}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">ARRIVAL TIME:</span>
            <span className="text-slate-200">t = {job.arrivalTime}s</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">TOTAL BURST:</span>
            <span className="text-slate-200">{job.totalBurst}s</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">EXECUTION TIME:</span>
            <span className="text-emerald-400">{job.totalExecutionTime || 0}s</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">WAITING TIME (WT):</span>
            <span className="text-amber-400 font-bold">{job.waitingTime ?? job.totalWaitingTime ?? 0}s</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">RESPONSE TIME (RT):</span>
            <span className="text-blue-400 font-bold">{job.responseTime != null ? `${job.responseTime}s` : '—'}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">TURNAROUND TIME (TAT):</span>
            <span className="text-slate-200 font-bold">{job.turnaroundTime != null ? `${job.turnaroundTime}s` : '—'}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">ALLOCATED CELL:</span>
            <span className="text-cyan-300 font-bold">{job.assignedInstanceId || 'None'}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">WAITING FOR:</span>
            <span className="text-amber-400 font-bold">{job.waitingForResourceType || 'None'}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">STAGE PROGRESS:</span>
            <span className="text-slate-200">Stage {job.currentStageIndex + 1} of {job.stages.length}</span>
          </div>
        </div>

        {/* Production Stages Pipeline */}
        <div className="mb-5">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            MULTI-STAGE ROUTING SEQUENCE
          </h3>
          <div className="space-y-1.5">
            {job.stages.map((stage, idx) => {
              const isPast = idx < job.currentStageIndex || job.state === ProcessState.COMPLETED;
              const isCurrent = idx === job.currentStageIndex && job.state !== ProcessState.COMPLETED;

              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between ${
                    isCurrent
                      ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
                      : isPast
                      ? 'bg-slate-950/60 border-slate-800 text-slate-400'
                      : 'bg-slate-950/30 border-slate-900 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-400">0{idx + 1}.</span>
                    <span>{stage.stageName}</span>
                    <span className="text-[10px] text-slate-500">[{stage.resourceType}]</span>
                  </div>
                  <div className="font-bold">
                    {isPast ? (
                      <span className="text-emerald-400">COMPLETED</span>
                    ) : isCurrent ? (
                      <span className="text-cyan-300">{job.currentStageBurstRemaining}s remaining</span>
                    ) : (
                      <span>{stage.burst}s burst</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Visual History Timeline */}
        <div>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            LIFECYCLE TRANSITION AUDIT TRAIL
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {job.history.map((h, i) => (
              <div
                key={i}
                className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono flex items-start gap-3"
              >
                <span className="text-[10px] font-bold text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 flex-shrink-0">
                  t = {h.time.toFixed(1)}s
                </span>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 mr-2 uppercase">
                    [{h.state}]
                  </span>
                  <span className="text-slate-300 leading-snug">
                    {h.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
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
