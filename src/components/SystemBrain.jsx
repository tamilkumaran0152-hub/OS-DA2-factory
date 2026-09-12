import React from 'react';
import { Subsystem } from '../simulation/types.js';
import { Cpu, Layers, Box, Lock, ShieldCheck, AlertOctagon, RefreshCw, Factory, ArrowRight } from 'lucide-react';

const PIPELINE_STEPS = [
  {
    id: Subsystem.PROCESS_MGR,
    name: 'Process Manager',
    subtitle: 'PCB & Lifecycle',
    icon: Layers,
    description: 'Manages job states (CREATED → READY → RUNNING → WAITING → COMPLETED)',
  },
  {
    id: Subsystem.SCHEDULER,
    name: 'CPU Scheduler',
    subtitle: 'FCFS / SJF / RR',
    icon: Cpu,
    description: 'Selects the optimal ready workpiece to dispatch',
  },
  {
    id: Subsystem.RESOURCE_MGR,
    name: 'Resource Manager',
    subtitle: 'Workcells & Units',
    icon: Box,
    description: 'Binds concrete physical machines (CNC-01, etc.)',
  },
  {
    id: Subsystem.SYNCHRONIZATION,
    name: 'Synchronization',
    subtitle: 'Counting Semaphores',
    icon: Lock,
    description: 'Enforces mutual exclusion with FIFO wait queues',
  },
  {
    id: Subsystem.SAFETY_ENGINE,
    name: 'Safety Engine',
    subtitle: "Banker's Algorithm",
    icon: ShieldCheck,
    description: 'Tests Need <= Work to prevent entering unsafe states',
  },
  {
    id: Subsystem.DEADLOCK_DETECTOR,
    name: 'Deadlock Detector',
    subtitle: 'RAG Cycle Analysis',
    icon: AlertOctagon,
    description: 'Traces Resource Allocation Graph for circular wait',
  },
  {
    id: Subsystem.RECOVERY_MGR,
    name: 'Recovery Advisor',
    subtitle: 'Preemption & Reclaim',
    icon: RefreshCw,
    description: 'Evaluates termination costs to break circular deadlock',
  },
  {
    id: Subsystem.FACTORY_EXECUTION,
    name: 'Factory Execution',
    subtitle: 'Floor Machining',
    icon: Factory,
    description: 'Physical progression of machining and packaging operations',
  },
];

export default function SystemBrain({ activeSubsystem }) {
  return (
    <div className="panel-industrial p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
            SYSTEM BRAIN — OPERATING SYSTEM ARCHITECTURAL PIPELINE
          </h2>
          <p className="text-xs text-slate-400">
            Internal subsystem coordination path governing factory resources in real time
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-500">Active Stage:</span>
          <span className="text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800">
            {activeSubsystem}
          </span>
        </div>
      </div>

      {/* Horizontal Pipeline Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {PIPELINE_STEPS.map((step, idx) => {
          const isActive = activeSubsystem === step.id;
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                isActive
                  ? 'bg-[#142036] border-cyan-400 shadow-[0_0_18px_rgba(0,240,255,0.18)] scale-[1.02]'
                  : 'bg-[#0e1422] border-slate-800/90 opacity-75 hover:opacity-100'
              }`}
              title={step.description}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'bg-slate-800/80 text-slate-400'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 font-bold">
                    0{idx + 1}
                  </span>
                </div>

                <div className="text-xs font-bold text-slate-100 leading-tight">
                  {step.name}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {step.subtitle}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80">
                {isActive ? (
                  <span className="text-[10px] font-mono font-bold text-cyan-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 status-dot-active" />
                    ACTIVE
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
    </div>
  );
}
