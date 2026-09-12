import React from 'react';
import { Cpu, Activity, BookOpen, ShieldAlert, Layers, BarChart3, Database, Lock, ShieldCheck, AlertOctagon, RefreshCw } from 'lucide-react';
import { Subsystem } from '../simulation/types.js';

const SUBSYSTEM_LABELS = {
  [Subsystem.PROCESS_MGR]: { label: 'Process Mgr', color: 'text-cyan-400 bg-cyan-950/60 border-cyan-800' },
  [Subsystem.SCHEDULER]: { label: 'CPU Scheduler', color: 'text-blue-400 bg-blue-950/60 border-blue-800' },
  [Subsystem.RESOURCE_MGR]: { label: 'Resource Mgr', color: 'text-amber-400 bg-amber-950/60 border-amber-800' },
  [Subsystem.SYNCHRONIZATION]: { label: 'Semaphore Sync', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800' },
  [Subsystem.SAFETY_ENGINE]: { label: 'Banker Avoidance', color: 'text-purple-400 bg-purple-950/60 border-purple-800' },
  [Subsystem.DEADLOCK_DETECTOR]: { label: 'RAG Deadlock', color: 'text-rose-400 bg-rose-950/60 border-rose-800' },
  [Subsystem.RECOVERY_MGR]: { label: 'Recovery Advisor', color: 'text-pink-400 bg-pink-950/60 border-pink-800' },
  [Subsystem.FACTORY_EXECUTION]: { label: 'Shopfloor Exec', color: 'text-slate-300 bg-slate-800 border-slate-700' },
};

export default function Header({
  time,
  isRunning,
  activeSubsystem,
  hasDeadlock,
  activeTab,
  setActiveTab,
  onOpenVivaGuide,
}) {
  const subInfo = SUBSYSTEM_LABELS[activeSubsystem] || {
    label: activeSubsystem,
    color: 'text-cyan-400 bg-cyan-950/60 border-cyan-800',
  };

  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'brain', label: 'System Brain' },
    { id: 'sync', label: 'Synchronization' },
    { id: 'banker', label: "Banker's Safety" },
    { id: 'deadlock', label: 'Deadlock & RAG' },
    { id: 'recovery', label: 'Recovery' },
    { id: 'benchmark', label: 'Algorithm Lab' },
    { id: 'state', label: 'System State' },
  ];

  return (
    <header className="border-b border-slate-800/90 bg-[#0a0f1c] px-4 lg:px-6 py-2.5 sticky top-0 z-40">
      <div className="max-w-[1780px] mx-auto flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                SMART FACTORY OS
              </h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                VIT Chennai • OS DA2
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Real-Time Manufacturing Operations Control Center
            </p>
          </div>
        </div>

        {/* Center: Top Navigation Bar */}
        <nav className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(0,240,255,0.15)] font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Live Telemetry & Quick Actions */}
        <div className="flex items-center gap-3 self-end xl:self-auto">
          {/* Status Indicator */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            {hasDeadlock ? (
              <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-500 status-dot-active" />
                DEADLOCK
              </span>
            ) : isRunning ? (
              <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-cyan-400 status-dot-active" />
                RUNNING
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                PAUSED
              </span>
            )}

            <div className="h-3 w-[1px] bg-slate-800 mx-0.5" />

            {/* Sim Time */}
            <span className="font-mono text-xs font-bold text-slate-200">
              t = {time}s
            </span>
          </div>

          {/* Active Subsystem */}
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500">SUBSYSTEM:</span>
            <span
              className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border ${subInfo.color}`}
            >
              {subInfo.label}
            </span>
          </div>

          {/* Viva Guide Button */}
          <button
            onClick={onOpenVivaGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-300 border border-indigo-500/40 text-xs font-semibold transition"
            title="Open OS Concepts & Manufacturing Analogies Viva Guide"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Viva Guide</span>
          </button>
        </div>
      </div>
    </header>
  );
}
