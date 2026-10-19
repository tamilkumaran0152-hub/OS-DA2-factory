import React from 'react';
import { Terminal, Cpu, ShieldCheck } from 'lucide-react';
import KernelConsoleView from '../views/KernelConsoleView.jsx';

export default function KernelConsoleModule({
  engine,
  onStateChange,
  snapshot,
}) {
  return (
    <div className="space-y-4">
      {/* Module Header Bar */}
      <div className="bg-[#0b101e] border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100">Kernel Console</h2>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                TTY0 ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive operating system terminal interface connected directly to live simulation engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 self-start md:self-auto">
          <span className="text-slate-500">POLICY:</span>
          <span className="text-amber-400 font-bold">{snapshot?.algorithm ?? engine?.algorithm}</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-500">CLOCK:</span>
          <span className="text-cyan-400 font-bold">t={snapshot?.time ?? engine?.time}s</span>
        </div>
      </div>

      <KernelConsoleView
        engine={engine}
        onStateChange={onStateChange}
        snapshot={snapshot}
      />
    </div>
  );
}
