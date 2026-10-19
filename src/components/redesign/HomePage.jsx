import React from 'react';
import {
  ArrowRight,
  RotateCcw,
  BookOpen,
  Cpu,
} from 'lucide-react';
import { MODULE_CONFIGS } from '../workspaces/WorkspaceLayout.jsx';

export default function HomePage({
  onSelectModule,
  snapshot,
  onReset,
  onOpenViva,
}) {
  const totalMachinesCount = Object.values(snapshot?.machineInstances || {}).length;
  const hasDeadlock = Boolean(snapshot?.deadlockInfo?.hasDeadlock);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased">
      {/* 1. COMPACT TOP HEADER */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-13 flex items-center justify-between gap-4">
          {/* Logo & Branding */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Cpu className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 tracking-tight">
                Smart Factory OS
              </span>
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                v2.0
              </span>
            </div>
          </div>

          {/* Quick Simulation State, Reset & Viva */}
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-mono">
              <span className="text-slate-400">CLOCK</span>
              <span className="text-slate-900 font-bold">t={snapshot?.time ?? 0}s</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-400">SCENARIO</span>
              <span className="text-blue-700 font-semibold">{snapshot?.scenario?.replace(/_/g, ' ') ?? 'NORMAL'}</span>
            </div>

            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition"
              title="Reset simulation to initial state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            {onOpenViva && (
              <button
                onClick={onOpenViva}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition"
                title="Open Viva & Theory Defense Reference"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Viva Guide</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. COMPACT HEADING AREA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4 w-full">
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Smart Factory OS
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-600 mt-0.5">
            Interactive Operating Systems Laboratory for Manufacturing
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Choose a module to configure, simulate, and analyze OS behavior.
          </p>
        </div>
      </div>

      {/* 3. SIX DEDICATED MODULE CARDS */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 pb-8 w-full flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULE_CONFIGS.map((mod) => {
            const Icon = mod.icon;

            // Generate single contextual live badge
            let badgeText = 'Ready';
            let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';

            if (mod.id === 'scheduler') {
              badgeText = `Policy: ${snapshot?.algorithm ?? 'FCFS'}`;
              badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
            } else if (mod.id === 'simulator') {
              badgeText = snapshot?.isRunning ? 'Running' : 'Paused';
              badgeStyle = snapshot?.isRunning
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium'
                : 'bg-slate-100 text-slate-600 border-slate-200';
            } else if (mod.id === 'resources') {
              badgeText = `${totalMachinesCount} Fixtures Provisioned`;
              badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
            } else if (mod.id === 'banker') {
              badgeText = snapshot?.bankerMode ? 'Avoidance: Active' : 'Avoidance: Off';
              badgeStyle = snapshot?.bankerMode
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : 'bg-slate-100 text-slate-600 border-slate-200';
            } else if (mod.id === 'deadlock') {
              badgeText = hasDeadlock ? 'Deadlock Active' : 'RAG Acyclic';
              badgeStyle = hasDeadlock
                ? 'bg-rose-50 text-rose-700 border-rose-300 font-bold'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200';
            } else if (mod.id === 'console') {
              badgeText = 'Shell Ready (tty0)';
              badgeStyle = 'bg-slate-100 text-slate-800 border-slate-200 font-mono';
            }

            return (
              <div
                key={mod.id}
                onClick={() => onSelectModule(mod.id)}
                className="group bg-white border border-slate-200 hover:border-blue-400 rounded-xl p-4 sm:p-5 flex flex-col justify-between transition-colors cursor-pointer"
              >
                <div>
                  {/* Card Header: Icon & Live Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded border ${badgeStyle}`}>
                      {badgeText}
                    </span>
                  </div>

                  {/* Module Name & One Short Description */}
                  <h2 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {mod.label}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {mod.description}
                  </p>
                </div>

                {/* Card Action Link */}
                <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:text-blue-700">
                  <span>Open {mod.shortLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* 4. CLEAN FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-3 px-4 text-center text-xs text-slate-400">
        Smart Factory OS • Operating Systems Laboratory
      </footer>
    </div>
  );
}
