import React from 'react';
import { X, Layers, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { ProcessState } from '../simulation/types.js';

export default function JobHistoryModal({ isOpen, onClose, job }) {
  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0b101c] border border-cyan-500/30 rounded-2xl max-w-xl w-full p-6 max-h-[85vh] overflow-y-auto shadow-[0_0_30px_rgba(0,240,255,0.2)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                {job.id}: {job.name}
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                  {job.category}
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Process Control Block (PCB) History & Routing Audit
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

        {/* Details Overview */}
        <div className="my-4 grid grid-cols-3 gap-2.5 text-xs font-mono bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div>
            <span className="text-slate-500 text-[10px] block">STATE:</span>
            <span className="font-bold text-cyan-300">{job.state}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">PRIORITY:</span>
            <span className="font-bold text-amber-300">P{job.priority}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">ARRIVAL:</span>
            <span className="text-slate-200">t = {job.arrivalTime}s</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">TOTAL BURST:</span>
            <span className="text-slate-200">{job.totalBurst}s</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">EXECUTION:</span>
            <span className="text-emerald-400">{job.totalExecutionTime || 0}s</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">WAITING:</span>
            <span className="text-amber-400">{job.totalWaitingTime || 0}s</span>
          </div>
        </div>

        {/* Manufacturing Routing Pipeline */}
        <div className="mb-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            PRODUCTION ROUTING STAGES
          </h3>
          <div className="space-y-1.5">
            {job.stages.map((stage, idx) => {
              const isPast = idx < job.currentStageIndex || job.state === ProcessState.COMPLETED;
              const isCurrent = idx === job.currentStageIndex && job.state !== ProcessState.COMPLETED;

              return (
                <div
                  key={idx}
                  className={`p-2 rounded-lg border text-xs font-mono flex items-center justify-between ${
                    isCurrent
                      ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
                      : isPast
                      ? 'bg-slate-950/60 border-slate-800 text-slate-400'
                      : 'bg-slate-950/30 border-slate-900 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold">Stage 0{idx + 1}:</span>
                    <span>{stage.stageName}</span>
                    <span className="text-[10px] text-slate-500">({stage.resourceType})</span>
                  </div>
                  <div className="font-bold">
                    {isPast ? 'COMPLETED' : isCurrent ? `${job.currentStageBurstRemaining}s left` : `${stage.burst}s`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* History Log */}
        <div>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            PCB LIFECYCLE EVENT HISTORY
          </h3>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {job.history.map((h, i) => (
              <div
                key={i}
                className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono flex items-start gap-2.5"
              >
                <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/60 px-1 rounded">
                  t={h.time}s
                </span>
                <span className="text-slate-300 leading-snug">
                  {h.description}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 mt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="btn-industrial btn-ghost text-xs px-4 py-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
