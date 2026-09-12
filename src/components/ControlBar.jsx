import React from 'react';
import { Play, Pause, SkipForward, RotateCcw, ShieldCheck, Zap, Sliders, ChevronDown } from 'lucide-react';
import { SchedulingAlgorithm } from '../simulation/types.js';
import { SCENARIO_TYPES, SCENARIO_METADATA } from '../simulation/scenarios.js';

export default function ControlBar({
  isRunning,
  onPlay,
  onPause,
  onStep,
  onReset,
  speed,
  onSpeedChange,
  algorithm,
  onAlgorithmChange,
  quantum,
  onQuantumChange,
  bankerMode,
  onBankerModeChange,
  scenario,
  onScenarioChange,
}) {
  const speeds = [0.5, 1, 2, 5, 10];

  return (
    <div className="border-b border-slate-800 bg-[#0c1322] px-4 lg:px-6 py-2.5">
      <div className="max-w-[1780px] mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Playback & Single-Event STEP */}
        <div className="flex items-center gap-2">
          {isRunning ? (
            <button
              onClick={onPause}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold transition shadow-sm"
            >
              <Pause className="w-4 h-4 fill-current" />
              <span>PAUSE</span>
            </button>
          ) : (
            <button
              onClick={onPlay}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition shadow-[0_0_16px_rgba(0,240,255,0.25)]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>START SIMULATION</span>
            </button>
          )}

          <button
            onClick={onStep}
            disabled={isRunning}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition"
            title="Execute exactly ONE discrete OS event"
          >
            <SkipForward className="w-3.5 h-3.5 text-cyan-400" />
            <span>STEP</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-700">
              1 EVENT
            </span>
          </button>

          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium transition"
            title="Reset Simulation State"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          {/* Speed Selector Segmented Pill */}
          <div className="flex items-center ml-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 px-2 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> SPEED:
            </span>
            <div className="flex items-center gap-0.5">
              {speeds.map((s) => (
                <button
                  key={s}
                  onClick={() => onSpeedChange(s)}
                  className={`px-2 py-1 text-[11px] font-mono font-bold rounded-md transition ${
                    speed === s
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center: CPU Scheduler & Quantum */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              Scheduler:
            </label>
            <div className="relative">
              <select
                value={algorithm}
                onChange={(e) => onAlgorithmChange(e.target.value)}
                className="appearance-none bg-slate-950 text-slate-100 text-xs font-semibold pl-3 pr-8 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value={SchedulingAlgorithm.FCFS}>FCFS (First-Come, First-Served)</option>
                <option value={SchedulingAlgorithm.SJF}>SJF (Shortest Job First)</option>
                <option value={SchedulingAlgorithm.PRIORITY}>Priority Scheduling (P1 Highest)</option>
                <option value={SchedulingAlgorithm.ROUND_ROBIN}>Round Robin (Time-sliced)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {algorithm === SchedulingAlgorithm.ROUND_ROBIN && (
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 font-mono">QUANTUM:</span>
              <input
                type="number"
                min="1"
                max="8"
                value={quantum}
                onChange={(e) => onQuantumChange(parseInt(e.target.value) || 2)}
                className="w-10 bg-slate-900 text-cyan-400 text-xs font-mono font-bold text-center rounded border border-slate-700 py-0.5 focus:outline-none focus:border-cyan-400"
              />
              <span className="text-[11px] text-slate-500">sec</span>
            </div>
          )}

          {/* Banker Avoidance Toggle */}
          <button
            onClick={() => onBankerModeChange(!bankerMode)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
              bankerMode
                ? 'bg-purple-950/40 text-purple-300 border-purple-500/50'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Toggle Banker's Algorithm safety checking for dynamic resource claims"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Banker Avoidance:</span>
            <span
              className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded ${
                bankerMode ? 'bg-purple-500/30 text-purple-200' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {bankerMode ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        {/* Right: Deterministic Scenario Picker */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-amber-400 font-bold uppercase tracking-wider">
            SCENARIO:
          </label>
          <div className="relative">
            <select
              value={scenario}
              onChange={(e) => onScenarioChange(e.target.value)}
              className="appearance-none bg-slate-950 text-amber-300 text-xs font-semibold pl-3 pr-8 py-2 rounded-lg border border-amber-500/40 focus:outline-none focus:border-amber-400 cursor-pointer max-w-[320px] truncate"
            >
              {Object.values(SCENARIO_METADATA).map((meta) => (
                <option key={meta.id} value={meta.id}>
                  {meta.title}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-amber-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
