import React from 'react';
import {
  ArrowLeft,
  RotateCcw,
  BookOpen,
  Layers,
  Factory,
  Box,
  ShieldCheck,
  AlertOctagon,
  Terminal,
} from 'lucide-react';
import ErrorBoundary from '../common/ErrorBoundary.jsx';

export const MODULE_CONFIGS = [
  {
    id: 'scheduler',
    label: 'Process Scheduler',
    shortLabel: 'Scheduler',
    icon: Layers,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: 'Select scheduling policies (FCFS, SJF, Priority, Round Robin) and analyze waiting, turnaround, and response times.',
  },
  {
    id: 'simulator',
    label: 'Factory Simulator',
    shortLabel: 'Factory',
    icon: Factory,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    description: 'Monitor active jobs, workstation states, and production stages advancing along the factory line.',
  },
  {
    id: 'resources',
    label: 'Resource Manager',
    shortLabel: 'Resources',
    icon: Box,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    description: 'Configure machine capacities, inspect Dijkstra counting semaphores, and manage waiting queues.',
  },
  {
    id: 'banker',
    label: "Banker's Algorithm Lab",
    shortLabel: "Banker",
    icon: ShieldCheck,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    description: 'Audit Allocation, Max, Need, and Available matrices; evaluate custom requests with safety verification.',
  },
  {
    id: 'deadlock',
    label: 'Deadlock Lab',
    shortLabel: 'Deadlock',
    icon: AlertOctagon,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    description: 'Detect circular wait conditions in the Resource Allocation Graph, inspect Coffman conditions, and recover.',
  },
  {
    id: 'console',
    label: 'Kernel Console',
    shortLabel: 'Console',
    icon: Terminal,
    color: 'text-slate-800',
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-300',
    description: 'Direct terminal access to the operating system kernel with instant state mutation and diagnostic commands.',
  },
];

export default function WorkspaceLayout({
  activeModuleId,
  onNavigateModule,
  onGoHome,
  snapshot,
  onReset,
  onOpenViva,
  children,
}) {
  const currentModule = MODULE_CONFIGS.find((m) => m.id === activeModuleId) || MODULE_CONFIGS[0];
  const Icon = currentModule.icon;

  const totalMachinesCount = Object.values(snapshot?.machineInstances || {}).length;
  const hasDeadlock = Boolean(snapshot?.deadlockInfo?.hasDeadlock);

  // Relevant live status per module
  let relevantStatusLabel = '';
  let relevantStatusStyle = 'bg-slate-100 text-slate-700 border-slate-200';

  if (activeModuleId === 'scheduler') {
    relevantStatusLabel = `Algorithm: ${snapshot?.algorithm ?? 'FCFS'}`;
    relevantStatusStyle = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (activeModuleId === 'simulator') {
    if (hasDeadlock) {
      relevantStatusLabel = 'Simulation: DEADLOCK DETECTED';
      relevantStatusStyle = 'bg-rose-50 text-rose-700 border-rose-300 font-bold';
    } else {
      relevantStatusLabel = snapshot?.isRunning ? 'Simulation: Running' : 'Simulation: Paused';
      relevantStatusStyle = snapshot?.isRunning
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold'
        : 'bg-slate-100 text-slate-600 border-slate-200';
    }
  } else if (activeModuleId === 'resources') {
    relevantStatusLabel = `${totalMachinesCount} Fixtures Provisioned`;
    relevantStatusStyle = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (activeModuleId === 'banker') {
    relevantStatusLabel = snapshot?.bankerMode ? 'Avoidance: Active' : 'Avoidance: Monitor Only';
    relevantStatusStyle = snapshot?.bankerMode
      ? 'bg-purple-50 text-purple-700 border-purple-200'
      : 'bg-slate-100 text-slate-600 border-slate-200';
  } else if (activeModuleId === 'deadlock') {
    relevantStatusLabel = hasDeadlock ? 'RAG: Deadlock Active' : 'RAG: Acyclic';
    relevantStatusStyle = hasDeadlock
      ? 'bg-rose-50 text-rose-700 border-rose-300 font-bold'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (activeModuleId === 'console') {
    relevantStatusLabel = 'tty0 Connected';
    relevantStatusStyle = 'bg-slate-100 text-slate-800 border-slate-300 font-mono';
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased">
      {/* 1. TOP GLOBAL BAR */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-13 flex items-center justify-between gap-3">
          {/* Left: Home Button & App Branding (Single source of module name in page body) */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onGoHome}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition border border-slate-200"
              title="Return to Home"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>

            <span className="text-slate-300 hidden sm:inline">|</span>

            <span className="text-xs font-bold text-slate-700 hidden sm:inline tracking-tight">
              Smart Factory OS
            </span>
          </div>

          {/* Center: Module Navigation Tabs (Visually Secondary, Clean & Unclipped) */}
          <nav className="flex items-center gap-0.5 sm:gap-1 bg-slate-100/90 p-0.5 rounded-lg border border-slate-200 text-xs">
            {MODULE_CONFIGS.map((mod) => {
              const ModIcon = mod.icon;
              const isActive = mod.id === activeModuleId;
              return (
                <button
                  key={mod.id}
                  onClick={() => onNavigateModule(mod.id)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-slate-900 font-semibold border border-slate-200/90 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                  }`}
                  title={mod.label}
                >
                  <ModIcon className="w-3 h-3 flex-shrink-0" />
                  <span className="inline">{mod.shortLabel}</span>
                </button>
              );
            })}
          </nav>

          {/* Right: Clock & Quick Reset */}
          <div className="flex items-center gap-2 text-xs">
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 font-mono text-[11px] text-slate-700">
              <span className="text-slate-400">CLOCK</span>
              <span className="font-bold text-slate-900">t={snapshot?.time ?? 0}s</span>
            </div>

            <button
              onClick={onReset}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition"
              title="Reset simulation"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            {onOpenViva && (
              <button
                onClick={onOpenViva}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition"
                title="Open Viva Guide"
              >
                <BookOpen className="w-3 h-3" />
                <span className="hidden sm:inline">Viva Guide</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. WORKSPACE CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Compact Workspace Header */}
        <div className="mb-4 pb-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className={`p-1 rounded-md ${currentModule.bgColor} ${currentModule.color}`}>
                <Icon className="w-4 h-4" />
              </span>
              <span>{currentModule.label}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentModule.description}
            </p>
          </div>

          {/* Module-Specific Live Status Badge */}
          <div className="self-start sm:self-auto flex items-center gap-2">
            <span className={`text-[11px] px-2.5 py-1 rounded-lg border font-mono ${relevantStatusStyle}`}>
              {relevantStatusLabel}
            </span>
          </div>
        </div>

        {/* Workspace Body with Error Boundary */}
        <ErrorBoundary onGoHome={onGoHome} onReset={onReset}>
          {children}
        </ErrorBoundary>
      </main>
    </div>
  );
}
