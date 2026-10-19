import React, { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import KernelConsoleView from '../views/KernelConsoleView.jsx';

export default function ConsoleWorkspace({
  engine,
  snapshot,
  onStateChange,
}) {
  const [showHelp, setShowHelp] = useState(false);

  const commandReference = [
    { cmd: 'help', desc: 'Lists all kernel commands' },
    { cmd: 'ps / jobs', desc: 'Displays process table (PIDs, stages, burst, priority)' },
    { cmd: 'resources', desc: 'Shows machine capacities, availability, and queues' },
    { cmd: 'step [n]', desc: 'Advances simulation by n seconds (default 1s)' },
    { cmd: 'run / pause', desc: 'Starts continuous execution or halts simulation' },
    { cmd: 'reset', desc: 'Restores engine to initial scenario state' },
    { cmd: 'banker check', desc: "Audits safety matrix under Dijkstra's Banker's algorithm" },
    { cmd: 'deadlock inspect', desc: 'Traverses RAG for circular wait cycles' },
  ];

  return (
    <div className="space-y-3">
      {/* 1. MINIMAL LIGHT TOOLBAR: STATUS & COMMAND HELP TOGGLE */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Kernel Status Telemetry */}
        <div className="flex items-center gap-3 font-mono">
          <div>
            <span className="text-slate-400">CLOCK: </span>
            <span className="font-bold text-slate-800">t={snapshot?.time ?? 0}s</span>
          </div>
          <span className="text-slate-300">|</span>
          <div>
            <span className="text-slate-400">POLICY: </span>
            <span className="font-bold text-blue-700">{snapshot?.algorithm}</span>
          </div>
          <span className="text-slate-300">|</span>
          <div>
            <span className="text-slate-400">STATE: </span>
            <span className={`font-bold ${snapshot?.isRunning ? 'text-emerald-600' : 'text-slate-600'}`}>
              {snapshot?.isRunning ? 'RUNNING' : 'PAUSED'}
            </span>
          </div>
        </div>

        {/* Command Help Accordion Toggle */}
        <button
          onClick={() => setShowHelp((prev) => !prev)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-200 transition"
        >
          <HelpCircle className="w-3.5 h-3.5 text-slate-600" />
          <span>{showHelp ? 'Hide Command Help' : 'Command Reference'}</span>
          {showHelp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Expandable Command Reference */}
      {showHelp && (
        <div className="bg-white border border-slate-200 rounded-xl p-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
            {commandReference.map(({ cmd, desc }) => (
              <div
                key={cmd}
                className="p-2 rounded-lg bg-slate-50 border border-slate-200"
              >
                <span className="font-mono font-bold text-blue-700 block">{cmd}</span>
                <span className="text-[11px] text-slate-500 leading-tight">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. RESTRAINED DARK TERMINAL */}
      <KernelConsoleView
        engine={engine}
        onStateChange={onStateChange}
        snapshot={snapshot}
      />
    </div>
  );
}
