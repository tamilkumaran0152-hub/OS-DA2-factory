import React, { useState } from 'react';
import { HelpCircle, Brain, CheckCircle2, AlertOctagon, Terminal, Info, ChevronRight } from 'lucide-react';

export default function DecisionEngine({ lastDecision, onInspectJob }) {
  const [showDetailedReason, setShowDetailedReason] = useState(false);

  if (!lastDecision) {
    return (
      <div className="control-card p-4 flex items-center gap-3 text-slate-400">
        <Brain className="w-5 h-5 text-cyan-400 animate-pulse" />
        <span className="text-xs">OS Decision Engine initialized. Advance simulation to observe real-time decisions.</span>
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
    <div className="control-card p-4 relative overflow-hidden">
      {/* Background ambient gradient */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              OS DECISION ENGINE
              <span className="font-mono text-[10px] text-cyan-400 font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                t = {time}s
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Live mathematical & logical breakdown of OS resource management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold font-mono uppercase bg-cyan-950/70 text-cyan-300 border border-cyan-500/40">
            {eventType}
          </span>
          <button
            onClick={() => setShowDetailedReason(!showDetailedReason)}
            className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 px-2.5 py-1 rounded-md border border-cyan-500/30 transition"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{showDetailedReason ? 'Hide WHY Details' : 'WHY DID THIS HAPPEN?'}</span>
          </button>
        </div>
      </div>

      {/* 5-Column / Grid OS Explanation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
        {/* WHAT */}
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase text-cyan-400 tracking-wider mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              1. WHAT HAPPENED
            </div>
            <p className="text-slate-200 leading-relaxed font-medium">
              {whatHappened}
            </p>
          </div>
          {jobId && (
            <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400">JOB TARGET:</span>
              <button
                onClick={() => onInspectJob && onInspectJob(jobId)}
                className="text-[10px] font-mono font-bold text-cyan-400 hover:underline"
              >
                {jobId}
              </button>
            </div>
          )}
        </div>

        {/* WHY */}
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase text-amber-400 tracking-wider mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              2. WHY IT HAPPENED
            </div>
            <p className="text-slate-300 leading-relaxed">
              {whyItHappened}
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/60 text-[10px] font-mono text-slate-400">
            Based on current simulation vectors
          </div>
        </div>

        {/* OS CONCEPT */}
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase text-blue-400 tracking-wider mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              3. OS CONCEPT
            </div>
            <p className="text-slate-200 font-semibold leading-relaxed">
              {osConcept}
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/60 text-[10px] font-mono text-blue-400">
            Module: {subsystem}
          </div>
        </div>

        {/* DECISION */}
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              4. DECISION TAKEN
            </div>
            <p className="text-slate-200 leading-relaxed font-medium">
              {decision}
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-emerald-400 font-mono flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> State Updated
          </div>
        </div>

        {/* IMPACT */}
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase text-indigo-400 tracking-wider mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              5. FACTORY IMPACT
            </div>
            <p className="text-slate-300 leading-relaxed">
              {manufacturingImpact}
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-indigo-300 font-mono">
            Physical Shopfloor Flow
          </div>
        </div>
      </div>

      {/* Expandable "WHY?" Deep Dive Drawer */}
      {showDetailedReason && explanationData && (
        <div className="mt-3 p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs">
          <div className="flex items-center gap-2 text-cyan-300 font-bold mb-2">
            <Info className="w-4 h-4" />
            <span>MATHEMATICAL & STATE INSPECTION DATA FOR THIS DECISION</span>
          </div>

          <pre className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-40">
            {JSON.stringify(explanationData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
