import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal,
  Play,
  Pause,
  RotateCcw,
  StepForward,
  Trash2,
  Cpu,
  CornerDownLeft,
  ShieldCheck,
  AlertOctagon,
  Layers,
  Box,
} from 'lucide-react';
import { executeKernelCommand } from '../../simulation/kernelConsole.js';

export default function KernelConsoleView({ engine, onStateChange, snapshot }) {
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState(() => [
    {
      id: 1,
      type: 'banner',
      text: '================ SMART FACTORY OS - KERNEL CONSOLE v2.0 ================',
    },
    {
      id: 2,
      type: 'info',
      text: 'Authoritative OS command-line interface. Commands execute directly on the live simulation core.',
    },
    {
      id: 3,
      type: 'info',
      text: "Type 'help' to view available commands, or click any quick-action shortcut below.",
    },
    {
      id: 4,
      type: 'divider',
      text: '------------------------------------------------------------------------',
    },
  ]);

  // Command history for Up / Down arrow navigation
  const [cmdHistory, setCmdHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const outputEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll terminal output to bottom
  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleExecute = (rawCmd) => {
    const cmd = rawCmd !== undefined ? rawCmd : inputVal;
    const trimmed = cmd.trim();
    if (!trimmed) return;

    // Append user input prompt to terminal output
    const userPromptLine = {
      id: Date.now() + Math.random(),
      type: 'prompt',
      text: `os-kernel:~$ ${trimmed}`,
    };

    // Update command history for arrow navigation
    setCmdHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);
    setInputVal('');

    // Execute against authoritative SimulationEngine
    const res = executeKernelCommand(trimmed, engine, { onStateChange });

    if (res.actionType === 'clear') {
      setHistory([
        {
          id: Date.now(),
          type: 'dim',
          text: 'Console history cleared. Session ready.',
        },
      ]);
      return;
    }

    const newLines = res.output.map((line, idx) => ({
      id: Date.now() + idx + Math.random(),
      type: line.type,
      text: line.text,
    }));

    setHistory((prev) => [...prev, userPromptLine, ...newLines]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const nextIdx = historyIndex === -1 ? cmdHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setInputVal(cmdHistory[nextIdx] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (cmdHistory.length === 0 || historyIndex === -1) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx >= cmdHistory.length) {
        setHistoryIndex(-1);
        setInputVal('');
      } else {
        setHistoryIndex(nextIdx);
        setInputVal(cmdHistory[nextIdx] || '');
      }
    }
  };

  const handleClear = () => {
    setHistory([
      {
        id: Date.now(),
        type: 'dim',
        text: 'Console history cleared. Session ready.',
      },
    ]);
    inputRef.current?.focus();
  };

  const quickCommands = [
    { label: 'help', cmd: 'help', icon: Terminal, color: 'hover:text-cyan-400' },
    { label: 'ps', cmd: 'ps', icon: Layers, color: 'hover:text-blue-400' },
    { label: 'resources', cmd: 'resources', icon: Box, color: 'hover:text-amber-400' },
    { label: 'step', cmd: 'step', icon: StepForward, color: 'hover:text-emerald-400' },
    { label: 'step 5', cmd: 'step 5', icon: StepForward, color: 'hover:text-emerald-400' },
    { label: 'run', cmd: 'run', icon: Play, color: 'hover:text-emerald-400' },
    { label: 'pause', cmd: 'pause', icon: Pause, color: 'hover:text-amber-400' },
    { label: 'reset', cmd: 'reset', icon: RotateCcw, color: 'hover:text-rose-400' },
    { label: 'deadlock inspect', cmd: 'deadlock inspect', icon: AlertOctagon, color: 'hover:text-rose-400' },
    { label: 'banker check', cmd: 'banker check', icon: ShieldCheck, color: 'hover:text-cyan-400' },
  ];

  return (
    <div className="space-y-4 font-mono">
      {/* 1. Terminal Window Container */}
      <div className="bg-[#070b14] border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[520px] max-h-[72vh] min-h-[400px]">
        {/* Terminal Title Bar */}
        <div className="bg-[#0a0f1d] border-b border-slate-800 px-4 py-2.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 mr-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-200 tracking-wide">
              smart-factory-os: kernel-console (tty0)
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">CLOCK:</span>
              <span className="text-cyan-400 font-bold">t={snapshot?.time ?? engine.time}s</span>
            </div>
            <div className="flex items-center gap-1.5 hidden sm:flex">
              <span className="text-slate-500">POLICY:</span>
              <span className="text-amber-400 font-bold">{snapshot?.algorithm ?? engine.algorithm}</span>
            </div>
            <div className="flex items-center gap-1.5 hidden md:flex">
              <span className="text-slate-500">STATE:</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  snapshot?.isRunning
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {snapshot?.isRunning ? 'RUNNING' : 'PAUSED'}
              </span>
            </div>
            <button
              onClick={handleClear}
              title="Clear terminal output"
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Terminal Output Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-1 text-xs select-text bg-[#060911]/95 leading-relaxed">
          {history.map((line) => {
            let colorClass = 'text-slate-300';
            if (line.type === 'prompt') {
              colorClass = 'text-cyan-400 font-bold';
            } else if (line.type === 'banner') {
              colorClass = 'text-cyan-300 font-bold tracking-wide';
            } else if (line.type === 'header') {
              colorClass = 'text-amber-300 font-bold pt-1';
            } else if (line.type === 'table-header') {
              colorClass = 'text-slate-200 font-bold bg-slate-900/60 py-0.5 px-1 rounded';
            } else if (line.type === 'success') {
              colorClass = 'text-emerald-400';
            } else if (line.type === 'warn') {
              colorClass = 'text-amber-400';
            } else if (line.type === 'error') {
              colorClass = 'text-rose-400 font-semibold';
            } else if (line.type === 'dim') {
              colorClass = 'text-slate-500';
            } else if (line.type === 'divider') {
              colorClass = 'text-slate-800 select-none';
            }

            return (
              <div key={line.id} className={`${colorClass} whitespace-pre-wrap break-words font-mono`}>
                {line.text}
              </div>
            );
          })}
          <div ref={outputEndRef} />
        </div>

        {/* Command Input Area */}
        <div className="p-3 bg-[#0a0f1d] border-t border-slate-800/90 flex flex-col gap-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 text-xs font-bold select-none pl-1">os-kernel:~$</span>
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter kernel command (e.g. 'ps', 'resources', 'step 5', 'help')..."
              className="flex-1 bg-transparent text-slate-100 text-xs font-mono outline-none border-none placeholder:text-slate-600 focus:ring-0"
              autoFocus
            />
            <button
              onClick={() => handleExecute()}
              disabled={!inputVal.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 disabled:hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded transition shadow-sm font-mono"
            >
              <span>Execute</span>
              <CornerDownLeft className="w-3 h-3" />
            </button>
          </div>

          {/* Quick-Action Chips Toolbar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 text-[11px] text-slate-400 scrollbar-none">
            <span className="text-slate-500 text-[10px] uppercase font-bold mr-1 flex-shrink-0">
              Quick Actions:
            </span>
            {quickCommands.map(({ label, cmd, icon: Icon, color }) => (
              <button
                key={label}
                onClick={() => handleExecute(cmd)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 ${color} hover:border-slate-700 transition flex-shrink-0`}
              >
                <Icon className="w-3 h-3" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Architecture Notice Footer */}
      <div className="text-[11px] text-slate-500 flex items-center justify-between px-2">
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-cyan-500/70" />
          <span>Connected directly to authoritative SimulationEngine instance. Mutations sync immediately with OS registers and views.</span>
        </div>
        <span className="hidden sm:inline">Use ↑ / ↓ keys for command history</span>
      </div>
    </div>
  );
}
