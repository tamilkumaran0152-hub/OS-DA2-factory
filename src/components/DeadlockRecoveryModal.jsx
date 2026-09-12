import React, { useState } from 'react';
import { X, AlertTriangle, ShieldCheck, RefreshCw, Trash2, ArrowRight } from 'lucide-react';

export default function DeadlockRecoveryModal({
  isOpen,
  onClose,
  deadlockInfo,
  jobs,
  resourceTypes,
  onExecuteRecovery,
}) {
  if (!isOpen) return null;

  const { involvedJobIds = [], cycleString } = deadlockInfo;

  // Compute victim analysis
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

    // Cost formula
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

  // Sort by recommendation score descending (best victim first)
  candidates.sort((a, b) => b.score - a.score);
  const recommendedId = candidates[0]?.id;

  const [selectedVictim, setSelectedVictim] = useState(recommendedId || involvedJobIds[0]);

  const handleConfirm = () => {
    if (selectedVictim) {
      onExecuteRecovery(selectedVictim);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0c1322] border border-rose-500/40 rounded-2xl max-w-2xl w-full p-6 shadow-[0_0_40px_rgba(244,63,94,0.3)]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                DEADLOCK RECOVERY ADVISOR
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Circular Chain: {cycleString || 'Active Deadlock Detected'}
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

        {/* Advisor Body */}
        <div className="my-5 space-y-4">
          <div className="text-xs text-slate-300">
            To resolve circular wait, select a victim process to terminate. Its held machines will be immediately reclaimed and assigned to the blocked processes.
          </div>

          {/* Victim Candidates List */}
          <div className="space-y-2.5">
            {candidates.map((cand) => {
              const isSelected = selectedVictim === cand.id;
              const isRecommended = cand.id === recommendedId;

              return (
                <div
                  key={cand.id}
                  onClick={() => setSelectedVictim(cand.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? 'bg-rose-950/30 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-cyan-300">
                        {cand.id}: {cand.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        Priority P{cand.priority}
                      </span>
                      {isRecommended && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          ★ RECOMMENDED VICTIM
                        </span>
                      )}
                    </div>

                    <input
                      type="radio"
                      name="victim"
                      checked={isSelected}
                      onChange={() => setSelectedVictim(cand.id)}
                      className="accent-rose-500 w-4 h-4 cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-slate-400">
                    <div>
                      <span>Sunk Machining:</span>{' '}
                      <span className="text-slate-200">{cand.sunkTime}s</span>
                    </div>
                    <div>
                      <span>Reclaims:</span>{' '}
                      <span className="text-amber-300 font-bold">
                        {cand.held.map((h) => `${h.resourceType} (${h.instanceId || 1})`).join(', ') || 'None'}
                      </span>
                    </div>
                    <div>
                      <span>Unblocks:</span>{' '}
                      <span className="text-emerald-400 font-bold">
                        {cand.unblocks.join(', ') || 'None'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <div className="text-[11px] text-slate-400 font-mono">
            Selected Victim: <strong className="text-rose-400">{selectedVictim}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="btn-industrial btn-ghost text-xs px-4 py-2"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="btn-industrial btn-rose text-xs px-4 py-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>TERMINATE & RECOVER FACTORY</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
