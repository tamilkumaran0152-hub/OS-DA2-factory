import React, { useState } from 'react';
import { AlertOctagon, CheckCircle2, RefreshCw, Trash2 } from 'lucide-react';

export default function DeadlockRecoveryView({
  deadlockInfo,
  jobs,
  resourceTypes,
  onExecuteRecovery,
}) {
  const { hasDeadlock, involvedJobIds = [], cycleString } = deadlockInfo;

  // Victim candidate analysis
  const candidates = involvedJobIds.map((id) => {
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
    const terminationCost = (priorityWeights[job.priority] || 25) + (job.totalExecutionTime || 0) * 5;

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
  }).filter(Boolean);

  candidates.sort((a, b) => b.score - a.score);
  const recommendedId = candidates[0]?.id;

  const [selectedVictim, setSelectedVictim] = useState(recommendedId || involvedJobIds[0]);

  const handleExecute = () => {
    if (selectedVictim) {
      onExecuteRecovery(selectedVictim);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="panel-industrial p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <RefreshCw className="w-5 h-5 text-rose-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
              DEADLOCK RECOVERY & INCIDENT RESPONSE
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Process preemption and resource reclamation protocol to safely break circular dependencies.
          </p>
        </div>

        {hasDeadlock ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold animate-pulse">
            <AlertOctagon className="w-4 h-4" />
            <span>INCIDENT ACTIVE: CIRCULAR WAIT DETECTED</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>SYSTEM RECOVERED / CYCLE-FREE</span>
          </div>
        )}
      </div>

      {hasDeadlock ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Candidate Victims Left 2 Cols */}
          <div className="panel-industrial p-4 lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                DEADLOCKED CANDIDATE PROCESSES ({candidates.length})
              </span>
              <span className="font-mono text-xs text-rose-400">
                {cycleString}
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
                      <div className="flex items-center gap-2">
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
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            ★ RECOMMENDED VICTIM
                          </span>
                        )}
                      </div>

                      <span className="text-xs font-mono font-semibold text-slate-400">
                        Cost Score: {cand.terminationCost}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-xs font-mono text-slate-400 mt-3 pt-2 border-t border-slate-800/80">
                      <div>
                        <span className="text-slate-500 block text-[10px]">SUNK MACHINING</span>
                        <span className="text-slate-200 font-bold">{cand.sunkTime}s elapsed</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">RESOURCES RECLAIMED</span>
                        <span className="text-amber-300 font-bold">
                          {cand.held.map((h) => `${h.resourceType} (${h.instanceId || 1})`).join(', ') || 'None'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">WILL UNBLOCK</span>
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

          {/* Recovery Plan & Action Right Col */}
          <div className="panel-industrial p-4 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block mb-3 pb-2 border-b border-slate-800">
                RECOVERY EXECUTION PLAN
              </span>

              <div className="space-y-2.5 text-xs text-slate-300 mb-4">
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2">
                  <span className="font-mono text-cyan-400 font-bold">1.</span>
                  <span>Select candidate workpiece <strong className="text-rose-400">{selectedVictim}</strong> to abort.</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2">
                  <span className="font-mono text-cyan-400 font-bold">2.</span>
                  <span>Forcibly unlock machine fixture and signal counting semaphore.</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2">
                  <span className="font-mono text-cyan-400 font-bold">3.</span>
                  <span>Immediately transfer freed machine to waiting queue head.</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2">
                  <span className="font-mono text-cyan-400 font-bold">4.</span>
                  <span>Recalculate RAG edges and resume scheduler dispatch.</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleExecute}
              className="w-full py-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-[0_0_15px_rgba(244,63,94,0.3)]"
            >
              <Trash2 className="w-4 h-4" />
              <span>EXECUTE DEADLOCK RECOVERY</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="panel-industrial p-12 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-100">
            No Active Deadlock Detected
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            The factory is currently operating in a cycle-free safe state. To trigger a deterministic deadlock demonstration, load Scenario 5 from the top control bar.
          </p>
        </div>
      )}
    </div>
  );
}
