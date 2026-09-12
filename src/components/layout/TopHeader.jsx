import React from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  ShieldCheck,
  Menu,
  ChevronDown,
  BookOpen,
} from 'lucide-react';
import { SchedulingAlgorithm } from '../../simulation/types.js';
import { SCENARIO_METADATA } from '../../simulation/scenarios.js';

export default function TopHeader({
  currentView,
  time,
  isRunning,
  hasDeadlock,
  bankerMode,
  isSafe,
  algorithm,
  quantum,
  speed,
  scenario,
  onPlay,
  onPause,
  onStep,
  onReset,
  onSpeedChange,
  onAlgorithmChange,
  onQuantumChange,
  onBankerModeChange,
  onScenarioChange,
  onToggleMobileMenu,
  onOpenVivaGuide,
}) {
  const VIEW_TITLES = {
    dashboard: {
      title: 'Dashboard',
      subtitle: 'Real-time manufacturing operations overview and executive KPIs',
    },
    'factory-floor': {
      title: 'Factory Floor',
      subtitle: 'Live workstation and machine allocation across 9 shopfloor cells',
    },
    processes: {
      title: 'Process Manager',
      subtitle: 'Workpiece lifecycle states, queues, and PCB register inspection',
    },
    resources: {
      title: 'Resource Manager',
      subtitle: 'OS resource types, physical workcells, and allocation registries',
    },
    brain: {
      title: 'System Brain',
      subtitle: 'How Smart Factory OS coordinates subsystems to make decisions',
    },
    sync: {
      title: 'Synchronization',
      subtitle: 'Dijkstra Counting Semaphores and FIFO wait buffers',
    },
    banker: {
      title: "Banker's Safety",
      subtitle: "Deadlock avoidance matrix checks verifying Need ≤ Work",
    },
    deadlock: {
      title: 'Deadlock & RAG',
      subtitle: 'Bipartite Resource Allocation Graph and Coffman condition checks',
    },
    recovery: {
      title: 'Deadlock Recovery',
      subtitle: 'Incident response, candidate victim analysis, and preemption',
    },
    gantt: {
      title: 'Production Timeline & Metrics',
      subtitle: 'Real-time Gantt tracking and quantitative OS performance metrics',
    },
    algorithms: {
      title: 'Scheduling Algorithm Lab',
      subtitle: 'Rigorous comparative benchmarking on identical workloads',
    },
    events: {
      title: 'System Event Stream',
      subtitle: 'Chronological discrete event stream with category filtering',
    },
    state: {
      title: 'System State Inspector',
      subtitle: 'Direct telemetry snapshot of all active OS registers and queues',
    },
    viva: {
      title: 'Viva & Defense Guide',
      subtitle: 'Key OS principles, trade-offs, and manufacturing analogies',
    },
  };

  const currentInfo = VIEW_TITLES[currentView] || {
    title: 'Operations Dashboard',
    subtitle: 'Manufacturing Operations Control Center',
  };

  const speeds = [0.5, 1, 2, 5, 10];

  return (
    <header className="sticky top-0 z-30 bg-[#090d16]/95 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-6 py-2.5">
      <div className="flex flex-col gap-2.5">
        {/* Top Row: Title on Left, Controls & Telemetry on Right */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Mobile Toggle & Page Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white">
                  {currentInfo.title}
                </h1>
                {hasDeadlock && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                    DEADLOCK ACTIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                {currentInfo.subtitle}
              </p>
            </div>
          </div>

          {/* Right: Controls & Badges */}
          <div className="flex flex-wrap items-center gap-2.5 ml-auto">
            {/* Play/Pause Button */}
            {isRunning ? (
              <button
                onClick={onPause}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold transition shadow-sm"
                title="Pause simulation"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>PAUSE</span>
              </button>
            ) : (
              <button
                onClick={onPlay}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition shadow-[0_0_12px_rgba(0,240,255,0.25)]"
                title="Start live simulation clock"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>PLAY</span>
              </button>
            )}

            {/* Step Button */}
            <button
              onClick={onStep}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Step exactly 1 discrete event"
            >
              <SkipForward className="w-3.5 h-3.5 text-cyan-400" />
              <span>STEP</span>
            </button>

            {/* Reset Button */}
            <button
              onClick={onReset}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium transition"
              title="Reset state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            {/* Speed Pills */}
            <div className="hidden md:flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
              {speeds.map((s) => (
                <button
                  key={s}
                  onClick={() => onSpeedChange(s)}
                  className={`px-1.5 py-0.5 font-mono font-bold rounded transition ${
                    speed === s
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />

            {/* Status Telemetry Group */}
            <div className="flex items-center gap-2">
              {/* Clock Badge */}
              <div className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs font-bold text-slate-200">
                t = {time.toFixed(0)}s
              </div>

              {/* Banker Status Pill */}
              <div
                className={`px-2 py-1 rounded-lg font-mono text-xs font-bold border flex items-center gap-1 ${
                  bankerMode
                    ? isSafe
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
                title={bankerMode ? 'Banker Avoidance is Active' : 'Banker Avoidance is OFF'}
              >
                <ShieldCheck className="w-3 h-3" />
                <span>{bankerMode ? (isSafe ? 'SAFE' : 'UNSAFE') : 'STD'}</span>
              </div>

              {/* Viva Guide Shortcut Button */}
              <button
                onClick={onOpenVivaGuide}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-300 border border-indigo-500/40 text-xs font-semibold font-mono transition"
                title="Open Viva & Defense Guide"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Viva</span>
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Compact Ribbon: Scenario Picker & Scheduler Settings */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-800/60 text-xs">
          {/* Left: Scenario Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
              SCENARIO:
            </span>
            <div className="relative">
              <select
                value={scenario}
                onChange={(e) => onScenarioChange(e.target.value)}
                className="appearance-none bg-slate-950 text-amber-300 text-xs font-semibold pl-2.5 pr-7 py-1 rounded-md border border-amber-500/30 hover:border-amber-500/50 focus:outline-none focus:border-amber-400 cursor-pointer max-w-[280px] truncate"
              >
                {Object.values(SCENARIO_METADATA).map((meta) => (
                  <option key={meta.id} value={meta.id}>
                    {meta.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-amber-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Right: CPU Scheduler Policy & Banker Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
                POLICY:
              </span>
              <div className="relative">
                <select
                  value={algorithm}
                  onChange={(e) => onAlgorithmChange(e.target.value)}
                  className="appearance-none bg-slate-950 text-slate-200 text-xs font-semibold pl-2.5 pr-7 py-1 rounded-md border border-slate-700 hover:border-slate-600 focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value={SchedulingAlgorithm.FCFS}>FCFS</option>
                  <option value={SchedulingAlgorithm.SJF}>SJF</option>
                  <option value={SchedulingAlgorithm.PRIORITY}>Priority</option>
                  <option value={SchedulingAlgorithm.ROUND_ROBIN}>Round Robin</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {algorithm === SchedulingAlgorithm.ROUND_ROBIN && (
              <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                <span className="text-[10px] text-slate-400 font-mono">Q:</span>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={quantum}
                  onChange={(e) => onQuantumChange(parseInt(e.target.value) || 2)}
                  className="w-8 bg-slate-900 text-cyan-400 text-xs font-mono font-bold text-center rounded border border-slate-700 py-0.2 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500">s</span>
              </div>
            )}

            {/* Banker Toggle Button */}
            <button
              onClick={() => onBankerModeChange(!bankerMode)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition ${
                bankerMode
                  ? 'bg-purple-950/40 text-purple-300 border-purple-500/50'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-300'
              }`}
              title="Toggle Banker's Algorithm Pre-Evaluation"
            >
              <span>Banker Avoidance:</span>
              <span
                className={`font-mono text-[9px] font-bold px-1 rounded ${
                  bankerMode ? 'bg-purple-500/30 text-purple-200' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {bankerMode ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
