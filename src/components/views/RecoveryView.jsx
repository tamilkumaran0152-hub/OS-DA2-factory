import React, { useState } from 'react';
import {
  AlertOctagon,
  CheckCircle2,
  RefreshCw,
  Trash2,
  ArrowDown,
  ArrowRight,
  ShieldCheck,
  Info,
  Layers,
  Award,
} from 'lucide-react';

export default function RecoveryView({
  deadlockInfo,
  jobs,
  resourceTypes,
  onExecuteRecovery,
}) {
  const { hasDeadlock, involvedJobIds = [], cycleString } = deadlockInfo || {};

  // Candidate Victims Analysis (Section 15)
  const candidates = (involvedJobIds || [])
    .map((id) => {
      const job = jobs[id];
      if (!job) return null;

      const held = [];
      Object.entries(job.currentAllocations || {}).forEach(([rt, count]) => {
        if (count > 0) held.push({ resourceType: rt, count, instanceId: job.assignedInstanceId });
      });

      const unblocks = [];
      held.forEach((h) => {
        const q = resourceTypes[h.resourceType]?.waitingQueue || [];
        q.forEach((wId) => {
          if (wId !== id && !unblocks.includes(wId)) unblocks.push(wId);
        });
      });

      const priorityWeights = { 1: 100, 2: 50, 3: 25, 4: 10, 5: 5 };
      const terminationCost =
        (priorityWeights[job.priority] || 25) + (job.totalExecutionTime || 0) * 5;

      return {
        id: job.id,
        name: job.name,
        priority: job.priority,
        sunkTime: job.totalExecutionTime || 0,
        held,
        unblocks,
        terminationCost,
        score: 1000 - terminationCost + unblocks.length * 50,
      };
    })
    .filter(Boolean);

  candidates.sort((a, b) => b.score - a.score);
  const recommendedId = candidates[0]?.id;

  const [selectedVictim, setSelectedVictim] = useState(
    recommendedId || (involvedJobIds && involvedJobIds[0]) || 'J101'
  );

  const handleExecute = () => {
    if (selectedVictim && onExecuteRecovery) {
      onExecuteRecovery(selectedVictim);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Header Banner */}
      <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-rose-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
              DEADLOCK RECOVERY PROTOCOL
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Process preemption and resource reclamation protocol to safely break circular dependencies
          </p>
        </div>

        {hasDeadlock ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold font-mono animate-pulse">
            <AlertOctagon className="w-4 h-4" />
            <span>ACTION REQUIRED: DEADLOCK DETECTED</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold font-mono">
            <CheckCircle2 className="w-4 h-4" />
            <span>SYSTEM RECOVERED & SAFE</span>
          </div>
        )}
      </div>

      {hasDeadlock ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left 7 Cols: Candidate Victims List (Section 15) */}
          <div className="lg:col-span-7 bg-[#0e1422] border border-slate-800/90 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100 font-mono">
                  DEADLOCKED JOBS & CANDIDATE VICTIMS ({candidates.length})
                </h3>
                <p className="text-[11px] text-slate-400">
                  Select optimal workpiece to terminate based on cost and unblocked resources
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-rose-400">
                Cycle: {cycleString}
              </span>
            </div>

            <div className="space-y-3">
              {candidates.map((cand) => {
                const isSelected = selectedVictim === cand.id;
                const isRecommended = cand.id === recommendedId;

                return (
                  <div
                    key={cand.id}
                    onClick={() => setSelectedVictim(cand.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-rose-950/30 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="recoveryVictim"
                          checked={isSelected}
                          onChange={() => setSelectedVictim(cand.id)}
                          className="accent-rose-500 w-4 h-4 cursor-pointer"
                        />
                        <span className="font-mono font-bold text-sm text-slate-100">
                          {cand.id}: {cand.name}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                          Priority P{cand.priority}
                        </span>
                        {isRecommended && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            RECOMMENDED VICTIM
                          </span>
                        )}
                      </div>

                      <span className="text-xs font-mono font-semibold text-slate-400">
                        Recovery Cost: <strong className="text-slate-200">{cand.terminationCost}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-xs font-mono text-slate-400 mt-3 pt-2.5 border-t border-slate-800/80">
                      <div>
                        <span className="text-slate-500 block text-[10px]">SUNK MACHINING</span>
                        <span className="text-slate-200 font-bold">{cand.sunkTime}s elapsed</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">RESOURCES RELEASED</span>
                        <span className="text-amber-300 font-bold">
                          {cand.held.map((h) => `${h.resourceType} (${h.instanceId || 1})`).join(', ') || 'None'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">JOBS UNBLOCKED</span>
                        <span className="text-emerald-400 font-bold">
                          {cand.unblocks.length > 0 ? cand.unblocks.join(', ') : 'None'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 5 Cols: RECOVERY EXECUTION & FLOWCHART (Section 15) */}
          <div className="lg:col-span-5 bg-[#0e1422] border border-slate-800/90 rounded-xl p-5 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="pb-3 border-b border-slate-800 mb-3">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono block">
                  RECOVERY SEQUENCE
                </span>
                <p className="text-[11px] text-slate-400">
                  Execution flow enforced upon victim preemption
                </p>
              </div>

              {/* 4 Steps Pipeline: RESOURCES RELEASED → WAITING JOBS RE-EVALUATED → SCHEDULER RUNS → SYSTEM RECOVERED */}
              <div className="space-y-2 text-xs font-mono">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center text-[11px]">
                    1
                  </span>
                  <div>
                    <div className="font-bold text-cyan-300">RESOURCES RELEASED</div>
                    <div className="text-[10px] text-slate-400 font-sans">
                      Abort {selectedVictim}; release fixtures and signal semaphores.
                    </div>
                  </div>
                </div>

                <div className="flex justify-center text-slate-600">
                  <ArrowDown className="w-4 h-4" />
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[11px]">
                    2
                  </span>
                  <div>
                    <div className="font-bold text-amber-300">WAITING JOBS RE-EVALUATED</div>
                    <div className="text-[10px] text-slate-400 font-sans">
                      Head processes in FIFO queues unblocked.
                    </div>
                  </div>
                </div>

                <div className="flex justify-center text-slate-600">
                  <ArrowDown className="w-4 h-4" />
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 font-bold flex items-center justify-center text-[11px]">
                    3
                  </span>
                  <div>
                    <div className="font-bold text-blue-300">SCHEDULER RUNS</div>
                    <div className="text-[10px] text-slate-400 font-sans">
                      Dispatcher context switches unblocked workpieces to cells.
                    </div>
                  </div>
                </div>

                <div className="flex justify-center text-slate-600">
                  <ArrowDown className="w-4 h-4" />
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-[11px]">
                    4
                  </span>
                  <div>
                    <div className="font-bold text-emerald-300">SYSTEM RECOVERED</div>
                    <div className="text-[10px] text-slate-400 font-sans">
                      RAG cycle broken; factory execution resumes safely.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleExecute}
              className="w-full py-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs font-mono flex items-center justify-center gap-2 transition shadow-[0_0_18px_rgba(244,63,94,0.35)]"
            >
              <Trash2 className="w-4 h-4" />
              <span>RECOVER SYSTEM (TERMINATE {selectedVictim})</span>
            </button>
          </div>
        </div>
      ) : (
        /* Cycle-free State */
        <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-12 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-100">
            No Active Deadlock Detected
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            The factory is currently operating in a cycle-free safe state. To trigger a deterministic deadlock demonstration and evaluate victim preemption, load Scenario 5 from the top bar.
          </p>
        </div>
      )}
    </div>
  );
}
