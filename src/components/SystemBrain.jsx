import React from 'react';
import { Subsystem } from '../simulation/types.js';
import { ArrowRight, Cpu, Layers, Box, Lock, ShieldCheck, AlertTriangle, RefreshCw, Factory } from 'lucide-react';

const PIPELINE_NODES = [
  {
    id: Subsystem.PROCESS_MGR,
    name: 'Process Manager',
    subtitle: 'PCB & Lifecycle',
    icon: Layers,
    color: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10',
    activeColor: 'border-cyan-400 text-cyan-300 bg-cyan-500/25 shadow-[0_0_18px_rgba(0,240,255,0.4)]',
    description: 'Tracks job states (CREATED, READY, RUNNING, WAITING, COMPLETED) and operation sequences.',
  },
  {
    id: Subsystem.SCHEDULER,
    name: 'CPU Scheduler',
    subtitle: 'FCFS / SJF / RR',
    icon: Cpu,
    color: 'border-blue-500/40 text-blue-400 bg-blue-500/10',
    activeColor: 'border-blue-400 text-blue-300 bg-blue-500/25 shadow-[0_0_18px_rgba(59,130,246,0.4)]',
    description: 'Selects the optimal ready workpiece to dispatch according to the chosen scheduling policy.',
  },
  {
    id: Subsystem.RESOURCE_MGR,
    name: 'Resource Manager',
    subtitle: 'Types & Instances',
    icon: Box,
    color: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
    activeColor: 'border-amber-400 text-amber-300 bg-amber-500/25 shadow-[0_0_18px_rgba(245,158,11,0.4)]',
    description: 'Binds concrete physical machines (CNC-01, WELD-01) and tracks available vs allocated capacity.',
  },
  {
    id: Subsystem.SYNCHRONIZATION,
    name: 'Synchronization',
    subtitle: 'Counting Semaphores',
    icon: Lock,
    color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
    activeColor: 'border-emerald-400 text-emerald-300 bg-emerald-500/25 shadow-[0_0_18px_rgba(16,185,129,0.4)]',
    description: 'Enforces mutual exclusion via wait(P) and signal(V) with FIFO queues for contended machines.',
  },
  {
    id: Subsystem.SAFETY_ENGINE,
    name: 'Safety Engine',
    subtitle: "Banker's Algorithm",
    icon: ShieldCheck,
    color: 'border-purple-500/40 text-purple-400 bg-purple-500/10',
    activeColor: 'border-purple-400 text-purple-300 bg-purple-500/25 shadow-[0_0_18px_rgba(168,85,247,0.4)]',
    description: "Evaluates Need <= Work to guarantee that granting dynamic resource claims avoids unsafe states.",
  },
  {
    id: Subsystem.DEADLOCK_DETECTOR,
    name: 'Deadlock Detector',
    subtitle: 'RAG Cycle Analysis',
    icon: AlertTriangle,
    color: 'border-rose-500/40 text-rose-400 bg-rose-500/10',
    activeColor: 'border-rose-400 text-rose-300 bg-rose-500/25 shadow-[0_0_18px_rgba(244,63,94,0.4)]',
    description: 'Maintains the Resource Allocation Graph and executes DFS to detect circular wait conditions.',
  },
  {
    id: Subsystem.RECOVERY_MGR,
    name: 'Recovery Advisor',
    subtitle: 'Victim Selection',
    icon: RefreshCw,
    color: 'border-pink-500/40 text-pink-400 bg-pink-500/10',
    activeColor: 'border-pink-400 text-pink-300 bg-pink-500/25 shadow-[0_0_18px_rgba(236,72,153,0.4)]',
    description: 'Evaluates process termination costs, aborts victim workpieces, and restores factory flow.',
  },
  {
    id: Subsystem.FACTORY_EXECUTION,
    name: 'Factory Execution',
    subtitle: 'Floor Machining',
    icon: Factory,
    color: 'border-slate-500/40 text-slate-300 bg-slate-500/10',
    activeColor: 'border-slate-300 text-white bg-slate-500/25 shadow-[0_0_18px_rgba(203,213,225,0.4)]',
    description: 'Physical progression of CNC milling, robotic welding, painting, and packaging operations.',
  },
];

export default function SystemBrain({ activeSubsystem }) {
  return (
    <div className="control-card p-3 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            SYSTEM BRAIN — OS ARCHITECTURAL PIPELINE
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          Subsystem Glow: Active Decision Maker
        </span>
      </div>

      {/* Pipeline Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {PIPELINE_NODES.map((node, idx) => {
          const isActive = activeSubsystem === node.id;
          const Icon = node.icon;

          return (
            <div
              key={node.id}
              className={`relative p-2.5 rounded-xl border transition-all duration-300 flex flex-col justify-between ${
                isActive ? node.activeColor : node.color
              } ${isActive ? 'scale-[1.03] z-10' : 'opacity-85 hover:opacity-100'}`}
              title={node.description}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Icon className={`w-4 h-4 ${isActive ? 'animate-bounce' : ''}`} />
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  0{idx + 1}
                </span>
              </div>

              <div>
                <div className="text-[11px] font-bold leading-tight truncate">
                  {node.name}
                </div>
                <div className="text-[9px] text-slate-400 truncate">
                  {node.subtitle}
                </div>
              </div>

              {isActive && (
                <div className="mt-1.5 pt-1 border-t border-cyan-500/30 text-[9px] font-mono font-bold text-cyan-300 animate-pulse">
                  ● ACTIVE
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
