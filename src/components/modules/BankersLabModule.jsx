import React from 'react';
import { ShieldCheck, CheckCircle2, AlertOctagon } from 'lucide-react';
import BankersSafetyView from '../views/BankersSafetyView.jsx';

export default function BankersLabModule({
  banker,
  snapshot,
  onBankerModeChange,
}) {
  const matrices = banker.buildMatrices(snapshot.jobs, snapshot.resourceTypes);
  const safety = banker.runSafetyAlgorithm(matrices);

  return (
    <div className="space-y-4">
      {/* Module Header Bar */}
      <div className="bg-[#0b101e] border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100">Banker's Algorithm Lab</h2>
              <span
                className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
                  safety.isSafe
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                }`}
              >
                {safety.isSafe ? 'SAFE STATE' : 'UNSAFE STATE'}
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  snapshot.bankerMode
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                AVOIDANCE: {snapshot.bankerMode ? 'ENFORCED' : 'OFF'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Dijkstra's Banker's Algorithm verification: Need ≤ Available Work vector audits & interactive request testing
            </p>
          </div>
        </div>

        {/* Safe Sequence Preview */}
        {safety.isSafe && safety.safeSequence?.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-mono bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800/80 text-slate-300 self-start md:self-auto">
            <span className="text-emerald-400 font-bold">Safe Sequence:</span>
            <span className="text-slate-200">
              &lt; {safety.safeSequence.join(' → ')} &gt;
            </span>
          </div>
        )}
      </div>

      <BankersSafetyView
        banker={banker}
        jobs={snapshot.jobs}
        resourceTypes={snapshot.resourceTypes}
      />
    </div>
  );
}
