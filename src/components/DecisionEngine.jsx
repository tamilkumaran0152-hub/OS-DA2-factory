import React, { useState } from 'react';
import { Brain, HelpCircle, CheckCircle2, ShieldAlert, Clock, ArrowRight, Layers, Info } from 'lucide-react';

export default function DecisionEngine({ lastDecision, onInspectJob }) {
  const [showInspector, setShowInspector] = useState(false);

  if (!lastDecision) {
    return (
      <div className="panel-industrial p-4 flex items-center gap-3 text-slate-400">
        <Brain className="w-5 h-5 text-cyan-400" />
        <span className="text-xs">OS Decision Engine standing by. Click START or STEP to begin.</span>
      </div>
    );
  }

  const {
    time,
    eventType,
    jobId,
    jobName,
    resourceType,
    subsystem,
    osConcept,
    whatHappened,
    whyItHappened,
    decision,
    manufacturingImpact,
    explanationData,
  } = lastDecision;

  return (
    <div className="panel-elevated p-4 flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
                OS DECISION ENGINE
                <span className="text-[10px] font-mono text-cyan-400 font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                  t = {time}s
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">Live Operating System Reasoning</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-900 text-slate-300 border border-slate-800">
              {eventType}
            </span>
            <button
              onClick={() => setShowInspector(!showInspector)}
              className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 px-2.5 py-1 rounded-md border border-cyan-500/30 transition"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showInspector ? 'Hide Details' : 'Inspect WHY'}</span>
            </button>
          </div>
        </div>

        {/* Structured Sections */}
        <div className="space-y-3">
          {/* 1. Current Event */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                CURRENT EVENT
              </span>
              {jobId && (
                <button
                  onClick={() => onInspectJob && onInspectJob(jobId)}
                  className="font-mono text-cyan-400 hover:underline"
                >
                  Job: {jobId}
                </button>
              )}
            </div>
            <p className="text-xs font-medium text-slate-200 leading-snug">
              {whatHappened}
            </p>
          </div>

          {/* 2. Visual Decision Box (Visually Dominant!) */}
          <div className="bg-[#121a2d] p-3.5 rounded-xl border border-cyan-500/40 shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 mb-1">
              SYSTEM DECISION
            </div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>{decision}</span>
            </div>
          </div>

          {/* 3. WHY It Happened */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              WHY IT HAPPENED
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {whyItHappened}
            </p>
          </div>

          {/* 4. OS Concept & Manufacturing Impact */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-1">
                OS CONCEPT
              </div>
              <div className="text-[11px] font-semibold text-slate-200 leading-tight">
                {osConcept}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-1">
                Subsystem: {subsystem}
              </div>
            </div>

            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
                FACTORY IMPACT
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                {manufacturingImpact}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Mathematical Inspector */}
      {showInspector && explanationData && (
        <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-[11px] font-mono font-bold text-cyan-400 mb-2 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            <span>EXPLANATION REGISTER VALUES:</span>
          </div>
          <pre className="text-[10px] font-mono text-slate-300 overflow-x-auto max-h-32 bg-slate-900/80 p-2 rounded border border-slate-800">
            {JSON.stringify(explanationData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
