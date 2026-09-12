import React from 'react';
import { Play, Pause, SkipForward, RotateCcw, ShieldCheck, Zap } from 'lucide-react';
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
    <section className="bg-slate-900/60 border-b border-slate-800 px-6 py-2.5">
      <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Playback Controls & STEP */}
        <div className="flex items-center gap-2">
          {isRunning ? (
            <button
              onClick={onPause}
              className="btn-industrial bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs px-3.5 py-1.5"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>PAUSE</span>
            </button>
          ) : (
            <button
              onClick={onPlay}
              className="btn-industrial bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs px-3.5 py-1.5 shadow-[0_0_12px_rgba(0,240,255,0.2)]"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>START</span>
            </button>
          )}

          <button
            onClick={onStep}
            disabled={isRunning}
            className="btn-industrial bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs px-3.5 py-1.5"
            title="Execute exactly ONE discrete simulation event"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>STEP (1 Event)</span>
          </button>

          <button
            onClick={onReset}
            className="btn-industrial bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs px-3 py-1.5"
            title="Reset Simulation State"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET</span>
          </button>

          {/* Speed Selector */}
          <div className="flex items-center ml-2 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 px-2 flex items-center gap-1">
              <Zap className="w-2.5 h-2.5 text-amber-400" /> SPEED:
            </span>
            {speeds.map((s) => (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded ${
                  speed === s
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Algorithm & Quantum Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 font-semibold">SCHEDULER:</label>
            <select
              value={algorithm}
              onChange={(e) => onAlgorithmChange(e.target.value)}
              className="bg-slate-950 text-cyan-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-cyan-400"
            >
              <option value={SchedulingAlgorithm.FCFS}>FCFS (Non-preemptive)</option>
              <option value={SchedulingAlgorithm.SJF}>SJF (Shortest Job First)</option>
              <option value={SchedulingAlgorithm.PRIORITY}>Priority (P1 Highest)</option>
              <option value={SchedulingAlgorithm.ROUND_ROBIN}>Round Robin (Preemptive)</option>
            </select>
          </div>

          {algorithm === SchedulingAlgorithm.ROUND_ROBIN && (
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              <label className="text-[11px] text-slate-400 font-mono">QUANTUM (q):</label>
              <input
                type="number"
                min="1"
                max="8"
                value={quantum}
                onChange={(e) => onQuantumChange(parseInt(e.target.value) || 2)}
                className="w-10 bg-slate-900 text-cyan-400 text-xs font-mono font-bold text-center rounded border border-slate-700 py-0.5"
              />
              <span className="text-[11px] text-slate-500">sec</span>
            </div>
          )}

          {/* Banker Mode Switch */}
          <button
            onClick={() => onBankerModeChange(!bankerMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              bankerMode
                ? 'bg-purple-600/20 text-purple-300 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Enable/disable Banker's Algorithm safety checking on all resource requests"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Banker Avoidance: {bankerMode ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Scenario Center Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-amber-400 font-bold uppercase tracking-wider">SCENARIO:</label>
          <select
            value={scenario}
            onChange={(e) => onScenarioChange(e.target.value)}
            className="bg-slate-950 text-amber-300 text-xs font-semibold px-3 py-1.5 rounded-lg border border-amber-500/40 focus:outline-none focus:border-amber-400"
          >
            {Object.values(SCENARIO_METADATA).map((meta) => (
              <option key={meta.id} value={meta.id}>
                {meta.title} — {meta.subtitle}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}
