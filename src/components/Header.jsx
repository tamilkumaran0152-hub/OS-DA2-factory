import React from 'react';
import { Cpu, Activity, BookOpen, ShieldAlert, Layers, BarChart3, Database } from 'lucide-react';
import { Subsystem } from '../simulation/types.js';

const SUBSYSTEM_LABELS = {
  [Subsystem.PROCESS_MGR]: { label: 'Process Manager', color: 'text-cyan-400' },
  [Subsystem.SCHEDULER]: { label: 'CPU Scheduler', color: 'text-blue-400' },
  [Subsystem.RESOURCE_MGR]: { label: 'Resource Manager', color: 'text-amber-400' },
  [Subsystem.SYNCHRONIZATION]: { label: 'Semaphore Sync', color: 'text-emerald-400' },
  [Subsystem.SAFETY_ENGINE]: { label: "Banker's Safety", color: 'text-purple-400' },
  [Subsystem.DEADLOCK_DETECTOR]: { label: 'RAG Deadlock Det.', color: 'text-rose-400' },
  [Subsystem.RECOVERY_MGR]: { label: 'Recovery Advisor', color: 'text-pink-400' },
  [Subsystem.FACTORY_EXECUTION]: { label: 'Factory Floor', color: 'text-slate-300' },
};

export default function Header({
  time,
  activeSubsystem,
  hasDeadlock,
  activeTab,
  setActiveTab,
  onOpenVivaGuide,
  onOpenStateSnapshot,
}) {
  const subInfo = SUBSYSTEM_LABELS[activeSubsystem] || { label: activeSubsystem, color: 'text-cyan-400' };

  return (
    <header className="border-b border-slate-800 bg-[#0a0f1c]/90 backdrop-blur-md px-6 py-3 sticky top-0 z-40">
      <div className="max-w-[1700px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/40 shadow-[0_0_15px_rgba(0,240,255,0.25)]">
            <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300 bg-clip-text text-transparent">
                SMART FACTORY OS
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-500/30">
                v2.4 REAL-TIME SIM
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold rounded-md bg-slate-800/80 text-slate-300 border border-slate-700">
                VIT Chennai CSE OS DA2
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Manufacturing Resource & Process Management System Based on OS Concepts
            </p>
          </div>
        </div>

        {/* Center: System Status & Clock */}
        <div className="flex items-center gap-4 bg-slate-900/80 px-4 py-1.5 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-400 font-medium">SIM CLOCK:</span>
            <span className="font-mono text-base font-bold text-cyan-300">
              t = {time}s
            </span>
          </div>

          <div className="h-4 w-[1px] bg-slate-700" />

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">ACTIVE SUBSYSTEM:</span>
            <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded bg-slate-800/90 border border-slate-700 ${subInfo.color}`}>
              {subInfo.label}
            </span>
          </div>

          {hasDeadlock && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-400 text-xs font-bold animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>DEADLOCK ACTIVE</span>
            </div>
          )}
        </div>

        {/* Right: Navigation Tabs & Modal Triggers */}
        <div className="flex items-center gap-2">
          <nav className="flex items-center bg-slate-900/90 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('floor')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'floor'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.15)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Floor & Internals</span>
            </button>
            <button
              onClick={() => setActiveTab('deepdive')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'deepdive'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.15)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>RAG & Banker</span>
            </button>
            <button
              onClick={() => setActiveTab('benchmark')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'benchmark'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.15)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Comparison Lab</span>
            </button>
          </nav>

          <button
            onClick={onOpenStateSnapshot}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Inspect System State Snapshot"
          >
            <Database className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenVivaGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-semibold text-xs transition"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Viva Guide</span>
          </button>
        </div>
      </div>
    </header>
  );
}
