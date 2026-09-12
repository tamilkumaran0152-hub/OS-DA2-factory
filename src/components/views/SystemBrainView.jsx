import React, { useState } from 'react';
import {
  Brain,
  Layers,
  Cpu,
  Box,
  Lock,
  ShieldCheck,
  AlertOctagon,
  RefreshCw,
  Factory,
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { Subsystem } from '../../simulation/types.js';

const PIPELINE_STEPS = [
  {
    id: Subsystem.PROCESS_MGR,
    stepNum: '01',
    name: 'Process Manager',
    subtitle: 'PCB Lifecycle Engine',
    icon: Layers,
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/40',
    bgColor: 'bg-cyan-500/10',
    whatItDoes:
      'Creates, tracks, and transitions Process Control Blocks (PCBs) through CREATED, READY, RUNNING, WAITING, and COMPLETED states.',
    osConcept:
      'Process Control Block (PCB), Process State Transition Model, Process Routing Table.',
    factoryEquivalent:
      'Production Work Order routing sheet tracking a workpiece through machining steps.',
  },
  {
    id: Subsystem.SCHEDULER,
    stepNum: '02',
    name: 'CPU Scheduler',
    subtitle: 'Dispatch & Policy Engine',
    icon: Cpu,
    color: 'text-blue-400',
    borderColor: 'border-blue-500/40',
    bgColor: 'bg-blue-500/10',
    whatItDoes:
      'Selects the highest priority / optimal workpiece from the READY queue using the active algorithm (FCFS, SJF, Priority, or Round Robin).',
    osConcept:
      'CPU Scheduling, Context Switching, Preemption, Time Quantum Slicing, Starvation Prevention.',
    factoryEquivalent:
      'Shopfloor production dispatcher deciding which order is next sent to an open workstation cell.',
  },
  {
    id: Subsystem.RESOURCE_MGR,
    stepNum: '03',
    name: 'Resource Manager',
    subtitle: 'Physical Workcell Binder',
    icon: Box,
    color: 'text-amber-400',
    borderColor: 'border-amber-500/40',
    bgColor: 'bg-amber-500/10',
    whatItDoes:
      'Maintains workstation inventories across 5 resource types and binds discrete machine fixtures (e.g. CNC-01) upon allocation.',
    osConcept:
      'Resource Types vs Instances, Resource Allocation State, System Workload Tracking.',
    factoryEquivalent:
      'Physical tool crib and workstation bay inventory manager.',
  },
  {
    id: Subsystem.SYNCHRONIZATION,
    stepNum: '04',
    name: 'Synchronization',
    subtitle: 'Counting Semaphores',
    icon: Lock,
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/40',
    bgColor: 'bg-emerald-500/10',
    whatItDoes:
      'Enforces mutual exclusion using Dijkstra Counting Semaphores with atomic wait(P) and signal(V) primitives and FIFO wait queues.',
    osConcept:
      'Dijkstra Counting Semaphores, Critical Section Protection, Atomic Test-and-Set, Process Blocking.',
    factoryEquivalent:
      'Electronic machine safety interlocks preventing collisions and conflicting setups.',
  },
  {
    id: Subsystem.SAFETY_ENGINE,
    stepNum: '05',
    name: "Banker's Safety",
    subtitle: 'Deadlock Avoidance',
    icon: ShieldCheck,
    color: 'text-purple-400',
    borderColor: 'border-purple-500/40',
    bgColor: 'bg-purple-500/10',
    whatItDoes:
      "Tests dynamic resource claims before granting them. Proves that a safe sequence exists where Need <= Work before committing.",
    osConcept:
      "Dijkstra's Banker's Algorithm, Safe State vs Unsafe State, Request Evaluation, Matrix Rollback.",
    factoryEquivalent:
      'Operations risk assessor pre-checking tool reservation sequences to prevent shopfloor gridlock.',
  },
  {
    id: Subsystem.DEADLOCK_DETECTOR,
    stepNum: '06',
    name: 'Deadlock Detector',
    subtitle: 'RAG Cycle Analyzer',
    icon: AlertOctagon,
    color: 'text-rose-400',
    borderColor: 'border-rose-500/40',
    bgColor: 'bg-rose-500/10',
    whatItDoes:
      'Constructs the directed bipartite Resource Allocation Graph (RAG) and runs DFS cycle detection to spot circular wait deadlocks.',
    osConcept:
      'Resource Allocation Graph (RAG), DFS Cycle Detection, The 4 Coffman Conditions verification.',
    factoryEquivalent:
      'Automated vision system detecting circular conveyor traffic jams.',
  },
  {
    id: Subsystem.RECOVERY_MGR,
    stepNum: '07',
    name: 'Recovery Advisor',
    subtitle: 'Victim Preemption Engine',
    icon: RefreshCw,
    color: 'text-pink-400',
    borderColor: 'border-pink-500/40',
    bgColor: 'bg-pink-500/10',
    whatItDoes:
      'Scores deadlocked candidate processes by priority and sunk time, selects the optimal victim to abort, and reclaims machine fixtures.',
    osConcept:
      'Deadlock Recovery, Process Termination Cost Function, Resource Preemption, Rollback.',
    factoryEquivalent:
      'Incident management protocol removing a jammed workpiece to restore line flow.',
  },
  {
    id: Subsystem.FACTORY_EXECUTION,
    stepNum: '08',
    name: 'Factory Execution',
    subtitle: 'Physical Cell Machining',
    icon: Factory,
    color: 'text-slate-300',
    borderColor: 'border-slate-700',
    bgColor: 'bg-slate-800/80',
    whatItDoes:
      'Executes discrete machine bursts, advances progress counters, decrements remaining burst times, and triggers completion interrupts.',
    osConcept:
      'Instruction Execution Cycle, Timer Interrupts, CPU Burst Completion, I/O Completion Signaling.',
    factoryEquivalent:
      'Actual physical spindle spinning, welding arcs, robotic painting, and automated packaging.',
  },
];

export default function SystemBrainView({ activeSubsystem, snapshot }) {
  const [selectedSubsystemId, setSelectedSubsystemId] = useState(
    activeSubsystem || Subsystem.PROCESS_MGR
  );

  const selectedStep =
    PIPELINE_STEPS.find((s) => s.id === selectedSubsystemId) || PIPELINE_STEPS[0];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
              SYSTEM BRAIN ARCHITECTURAL PIPELINE
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            How Smart Factory OS coordinates 8 subsystems to make deterministic real-time operations decisions
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-500">Currently Executing:</span>
          <span className="px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold">
            {activeSubsystem}
          </span>
        </div>
      </div>

      {/* 8-Step Pipeline Connected Grid (Section 16) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {PIPELINE_STEPS.map((step, idx) => {
          const isActive = activeSubsystem === step.id;
          const isSelected = selectedSubsystemId === step.id;
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              onClick={() => setSelectedSubsystemId(step.id)}
              className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                isActive
                  ? 'bg-[#15233c] border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.2)] scale-[1.02]'
                  : isSelected
                  ? 'bg-slate-900 border-slate-600'
                  : 'bg-[#0e1422] border-slate-800/80 hover:border-slate-700 opacity-85 hover:opacity-100'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${step.bgColor} ${step.color}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 font-bold">
                    {step.stepNum}
                  </span>
                </div>

                <div className="text-xs font-bold text-slate-100 leading-snug">
                  {step.name}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                  {step.subtitle}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80">
                {isActive ? (
                  <span className="text-[10px] font-mono font-bold text-cyan-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 status-dot-active" />
                    EXECUTING
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-slate-600">
                    Standby
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Subsystem Details Card (Section 16: What it does, OS concept, Factory equivalent, Current state) */}
      <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedStep.bgColor} ${selectedStep.color} border ${selectedStep.borderColor}`}
            >
              {React.createElement(selectedStep.icon, { className: 'w-5 h-5' })}
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{selectedStep.name}</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                  Step {selectedStep.stepNum}
                </span>
                {activeSubsystem === selectedStep.id && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    ACTIVE NOW
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">{selectedStep.subtitle}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* What it does */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-mono text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
              WHAT IT DOES
            </span>
            <p className="text-slate-300 leading-relaxed">
              {selectedStep.whatItDoes}
            </p>
          </div>

          {/* Current Live State */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-mono text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
              CURRENT LIVE STATE
            </span>
            <div className="text-slate-300 leading-relaxed font-mono text-[11px]">
              {activeSubsystem === selectedStep.id ? (
                <span className="text-cyan-400 font-bold">
                  ● Currently executing active transitions at time t = {snapshot?.time?.toFixed(0) ?? 0}s.
                </span>
              ) : (
                <span className="text-slate-400">
                  Subsystem initialized and ready for event triggering.
                </span>
              )}
            </div>
          </div>

          {/* OS Concept */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-mono text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
              OPERATING SYSTEM CONCEPT
            </span>
            <p className="text-slate-300 leading-relaxed">
              {selectedStep.osConcept}
            </p>
          </div>

          {/* Factory Equivalent */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-mono text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
              MANUFACTURING SHOPFLOOR EQUIVALENT
            </span>
            <p className="text-slate-300 leading-relaxed">
              {selectedStep.factoryEquivalent}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
