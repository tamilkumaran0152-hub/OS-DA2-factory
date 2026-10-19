import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Sliders,
  Activity,
  Cog,
  Flame,
  Wrench,
  Paintbrush,
  Package,
  AlertOctagon,
  ArrowRight,
} from 'lucide-react';
import { SCENARIO_TYPES } from '../../simulation/scenarios.js';
import { RESOURCE_DEFINITIONS } from '../../simulation/resources.js';

const WORKSTATION_ICONS = {
  CNC: Cog,
  WELDING: Flame,
  ASSEMBLY: Wrench,
  PAINTING: Paintbrush,
  PACKAGING: Package,
};

export default function FactoryWorkspace({
  snapshot,
  onScenarioChange,
  onSpeedChange,
  onPlay,
  onPause,
  onStep,
  onReset,
  onInspectJob,
  onWhyWaiting,
  onSelectEvent,
  onNavigateModule,
}) {
  const [selectedScenario, setSelectedScenario] = useState(snapshot?.scenario || SCENARIO_TYPES.NORMAL_PRODUCTION);
  const [selectedSpeed, setSelectedSpeed] = useState(snapshot?.speed || 1);

  const jobsList = Object.values(snapshot?.jobs || {});
  const createdJobs = jobsList.filter((j) => j.state === 'CREATED');
  const readyJobs = jobsList.filter((j) => j.state === 'READY');
  const runningJobs = jobsList.filter((j) => j.state === 'RUNNING');
  const waitingJobs = jobsList.filter((j) => j.state === 'WAITING');
  const completedJobs = jobsList.filter((j) => j.state === 'COMPLETED');
  const terminatedJobs = jobsList.filter((j) => j.state === 'TERMINATED');

  const speeds = [0.5, 1, 2, 5];

  return (
    <div className="space-y-4">
      {/* 1. CONFIGURATION & PRIMARY ACTION */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Factory Simulation Settings
            </h2>
          </div>
          <div className="text-xs font-mono text-slate-500">
            Clock: <span className="font-bold text-slate-800">t = {snapshot?.time ?? 0}s</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Workload Scenario */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Manufacturing Scenario
            </label>
            <select
              value={selectedScenario}
              onChange={(e) => {
                setSelectedScenario(e.target.value);
                onScenarioChange(e.target.value);
              }}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value={SCENARIO_TYPES.NORMAL_PRODUCTION}>Normal Production Flow (Standard staging)</option>
              <option value={SCENARIO_TYPES.RESOURCE_CONTENTION}>Resource Contention & Bottlenecks</option>
              <option value={SCENARIO_TYPES.BANKER_SAFE_REQUEST}>Banker's Safe Request Flow</option>
              <option value={SCENARIO_TYPES.DEADLOCK_SCENARIO}>Deadlock Detection Scenario</option>
              <option value={SCENARIO_TYPES.HEAVY_LOAD}>Heavy Load (High volume workpieces)</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Configures workpiece types, stage sequence, and arrival spacing.
            </p>
          </div>

          {/* Clock Rate Speed */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Simulation Speed
            </label>
            <div className="flex items-center gap-2">
              {speeds.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSelectedSpeed(s);
                    onSpeedChange(s);
                  }}
                  className={`flex-1 py-1 rounded-lg text-xs font-mono font-semibold transition border ${
                    selectedSpeed === s
                      ? 'bg-cyan-50 text-cyan-800 border-cyan-400 font-bold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Rate of simulated seconds per wallclock second.
            </p>
          </div>
        </div>

        {/* Primary Action Button & Secondary Controls */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            {snapshot?.isRunning ? (
              <button
                onClick={onPause}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause Simulation</span>
              </button>
            ) : (
              <button
                onClick={onPlay}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs transition"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Simulation</span>
              </button>
            )}

            <button
              onClick={onStep}
              disabled={snapshot?.isRunning}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 disabled:opacity-40 transition"
              title="Advance discrete event step"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span>Step</span>
            </button>

            <button
              onClick={onReset}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition"
              title="Reset simulation state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {createdJobs.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[11px]" title="Workpieces initialized prior to arrival time">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                Created: <span className="font-bold text-slate-900">{createdJobs.length}</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-mono text-[11px]" title="Workpieces in ready queue waiting for scheduler dispatch">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Ready: <span className="font-bold text-blue-900">{readyJobs.length}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-[11px]" title="Workpieces actively machining on shopfloor fixtures">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Running: <span className="font-bold text-emerald-900">{runningJobs.length}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-mono text-[11px]" title="Workpieces blocked on busy workstation semaphores">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Waiting: <span className="font-bold text-amber-900">{waitingJobs.length}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 font-mono text-[11px]" title="Workpieces finished all production operations">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              Completed: <span className="font-bold text-slate-900">{completedJobs.length}</span>
            </span>
            {terminatedJobs.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-mono text-[11px]" title="Workpieces terminated by deadlock recovery">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Terminated: <span className="font-bold text-rose-900">{terminatedJobs.length}</span>
              </span>
            )}
          </div>
        </div>
      </section>

      {/* DEADLOCK NOTIFICATION BANNER */}
      {snapshot?.deadlockInfo?.hasDeadlock && (
        <section className="bg-rose-50 border-2 border-rose-300 rounded-xl p-4 text-rose-900 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-100 border border-rose-300 text-rose-700 mt-0.5">
              <AlertOctagon className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-mono font-extrabold uppercase tracking-wide">
                  DEADLOCK DETECTED
                </span>
                <span className="text-xs font-bold text-rose-800">
                  Circular Wait Condition Formed
                </span>
              </div>
              <p className="text-xs text-rose-800 mt-1 font-medium">
                {snapshot.deadlockInfo.cycleString
                  ? `Circular wait chain: ${snapshot.deadlockInfo.cycleString}. Automatic simulation advancement has been halted.`
                  : 'Circular dependency detected between manufacturing processes. Automatic advancement has been halted.'}
              </p>
              <p className="text-[11px] text-rose-600 font-mono mt-0.5">
                Involved jobs: {snapshot.deadlockInfo.involvedJobIds?.join(', ') || 'N/A'} • Coffman Conditions: 4/4 Active
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateModule && onNavigateModule('deadlock')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
            >
              <span>Open Deadlock Lab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>
      )}

      {/* 2. RESULTS: WORKSTATIONS & PIPELINE */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Workcell States & Resource Allocation
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            5 Workstations
          </span>
        </div>

        {/* Workstations Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {Object.values(RESOURCE_DEFINITIONS).map((def) => {
            const rt = snapshot?.resourceTypes?.[def.type] || {};
            const sem = snapshot?.semaphores?.[def.type] || {};
            const cap = rt.capacity ?? def.capacity;
            const Icon = WORKSTATION_ICONS[def.type] || Cog;
            const waitingQueue = sem.waitingQueue || [];

            const machinesOfType = Object.values(snapshot?.machineInstances || {}).filter(
              (m) => m.type === def.type
            );

            return (
              <div
                key={def.type}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="p-1 rounded bg-white border border-slate-200 text-slate-700">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-900">{def.shortName}</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-semibold">
                      Cap: {cap}
                    </span>
                  </div>

                  {/* Machine instances */}
                  <div className="space-y-1 my-2">
                    {machinesOfType.map((m) => {
                      const isBusy = m.state === 'RUNNING' && m.currentJobId;
                      return (
                        <div
                          key={m.id}
                          className={`px-2 py-1 rounded text-[11px] font-mono flex items-center justify-between border ${
                            isBusy
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold'
                              : 'bg-white text-slate-400 border-slate-200'
                          }`}
                        >
                          <span>{m.id}</span>
                          <span>{isBusy ? m.currentJobId : 'IDLE'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Queue footer */}
                <div className="pt-2 border-t border-slate-200 text-[10px] flex items-center justify-between font-mono">
                  <span className="text-slate-500">Wait:</span>
                  <span className={waitingQueue.length > 0 ? 'text-amber-600 font-bold' : 'text-slate-400'}>
                    {waitingQueue.length > 0 ? `[${waitingQueue.join(', ')}]` : 'None'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Active Workpieces Pipeline Table */}
        <div className="pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Manufacturing Workpieces
          </h3>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-semibold bg-slate-50">
                  <th className="py-2 px-3">Order ID</th>
                  <th className="py-2 px-3">Product Name</th>
                  <th className="py-2 px-3">Current Operation</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Progress</th>
                  <th className="py-2 px-3">Burst Rem.</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobsList.map((job) => {
                  const currentStage = job.stages?.[job.currentStageIndex];
                  const totalStages = job.stages?.length || 1;
                  const progressPct =
                    job.state === 'COMPLETED'
                      ? 100
                      : Math.round(((job.currentStageIndex) / totalStages) * 100);

                  const isRunning = job.state === 'RUNNING';
                  const isWaiting = job.state === 'WAITING';
                  const isCompleted = job.state === 'COMPLETED';

                  const heldMachines = Object.values(snapshot?.machineInstances || {})
                    .filter((m) => m.currentJobId === job.id)
                    .map((m) => m.id);

                  if (job.assignedInstanceId && !heldMachines.includes(job.assignedInstanceId)) {
                    heldMachines.push(job.assignedInstanceId);
                  }

                  const heldAllocations = Object.entries(job.currentAllocations || {})
                    .filter(([, cnt]) => cnt > 0)
                    .map(([rt, cnt]) => (cnt > 1 ? `${rt} (${cnt})` : rt));

                  const holdingText =
                    heldMachines.length > 0
                      ? heldMachines.join(', ')
                      : heldAllocations.length > 0
                      ? heldAllocations.join(', ')
                      : 'None';

                  const waitingForText =
                    job.waitingForResourceType ||
                    (isWaiting && currentStage ? currentStage.resourceType : null) ||
                    'Resource';

                  return (
                    <tr key={job.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">{job.id}</td>
                      <td className="py-2 px-3 font-medium text-slate-800">{job.name}</td>
                      <td className="py-2 px-3 text-slate-600 truncate max-w-[200px]">
                        {isCompleted
                          ? 'Completed'
                          : currentStage
                          ? `${currentStage.stageName} (${job.currentStageIndex + 1}/${totalStages})`
                          : 'Staging'}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border inline-block ${
                            isRunning
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isWaiting
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : isCompleted
                              ? 'bg-slate-100 text-slate-500 border-slate-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {job.state}
                        </span>
                        {isWaiting && (
                          <div className="mt-1 text-[10.5px] font-mono leading-snug space-y-0.5">
                            <div className="text-amber-800">
                              <span className="text-slate-500 font-normal">Waiting for: </span>
                              <span className="font-semibold text-amber-900 bg-amber-100/70 px-1 py-0.2 rounded">
                                {waitingForText}
                              </span>
                            </div>
                            <div className="text-slate-700">
                              <span className="text-slate-500 font-normal">Holding: </span>
                              <span className="font-semibold text-slate-800 bg-slate-100 px-1 py-0.2 rounded">
                                {holdingText}
                              </span>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-cyan-600'}`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <span className="font-mono text-[10px] text-slate-500">{progressPct}%</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-600">
                        {isCompleted ? '0s' : `${job.currentStageBurstRemaining ?? 0}s`}
                      </td>
                      <td className="py-2 px-3 text-right space-x-1.5">
                        {isWaiting && onWhyWaiting && (
                          <button
                            onClick={() => onWhyWaiting(job)}
                            className="px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-semibold transition"
                          >
                            Why Blocked?
                          </button>
                        )}
                        <button
                          onClick={() => onInspectJob && onInspectJob(job.id)}
                          className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-mono transition border border-slate-200"
                        >
                          PCB
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Chronological OS Event Log */}
        <div className="pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            <span>Chronological Operating System Event Feed</span>
          </h3>
          <div className="max-h-44 overflow-y-auto space-y-1 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            {snapshot?.eventLog?.slice(-15).reverse().map((evt) => (
              <div
                key={evt.id}
                onClick={() => onSelectEvent && onSelectEvent(evt)}
                className="p-1.5 rounded bg-white border border-slate-200 flex items-start justify-between gap-2 hover:border-slate-300 transition cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-blue-600 text-[11px]">
                      [t={evt.time}s]
                    </span>
                    <span className="font-semibold text-slate-800">{evt.eventType}</span>
                    {evt.jobId && (
                      <span className="font-mono px-1 rounded bg-slate-100 text-slate-600 text-[10px]">
                        {evt.jobId}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">{evt.whatHappened}</p>
                </div>
                <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
                  {evt.subsystem}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
