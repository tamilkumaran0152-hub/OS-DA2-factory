import React, { useState } from 'react';
import {
  Box,
  RotateCcw,
  CheckCircle2,
  Sliders,
  AlertTriangle,
  Cog,
  Flame,
  Wrench,
  Paintbrush,
  Package,
} from 'lucide-react';
import { ResourceType } from '../../simulation/types.js';
import {
  DEFAULT_MACHINE_COUNTS,
  RESOURCE_DEFINITIONS,
  generateMachineIds,
} from '../../simulation/resources.js';

const MACHINE_ICONS = {
  CNC: Cog,
  WELDING: Flame,
  ASSEMBLY: Wrench,
  PAINTING: Paintbrush,
  PACKAGING: Package,
};

export default function ResourcesWorkspace({
  snapshot,
  onApplyMachineConfig,
  onInspectJob: _onInspectJob,
  onWhyWaiting: _onWhyWaiting,
}) {
  const isRunning = Boolean(snapshot?.isRunning);
  const simTime = Number(snapshot?.time) || 0;
  const hasStarted = simTime > 0;

  const [counts, setCounts] = useState(() => ({
    ...DEFAULT_MACHINE_COUNTS,
    ...(snapshot?.machineConfig || {}),
  }));

  const [validationError, setValidationError] = useState('');
  const [successBanner, setSuccessBanner] = useState('');
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [pendingConfig, setPendingConfig] = useState(null);

  const totalConfigured = Object.values(counts).reduce((sum, n) => sum + (Number(n) || 0), 0);
  const totalActive = Object.values(snapshot?.machineInstances || {}).length;

  const handleStep = (type, delta) => {
    if (isRunning) return;
    setValidationError('');
    setSuccessBanner('');
    setShowConfirmReset(false);
    const current = Number(counts[type]) || 1;
    const nextVal = Math.max(1, Math.min(8, current + delta));
    setCounts((prev) => ({
      ...prev,
      [type]: nextVal,
    }));
  };

  const handleResetDefaults = () => {
    if (isRunning) return;
    setValidationError('');
    setSuccessBanner('');
    setShowConfirmReset(false);
    setCounts({ ...DEFAULT_MACHINE_COUNTS });
  };

  const validateConfig = () => {
    const validated = {};
    for (const [type, val] of Object.entries(counts)) {
      const num = Number(val);
      if (!Number.isInteger(num) || num < 1) {
        setValidationError(`Invalid machine count for ${type}: must be at least 1.`);
        return null;
      }
      if (num > 8) {
        setValidationError(`Machine count for ${type} cannot exceed 8.`);
        return null;
      }
      validated[type] = num;
    }
    return validated;
  };

  const handleApply = (e) => {
    e?.preventDefault();
    if (isRunning) return;
    setValidationError('');
    setSuccessBanner('');

    const validated = validateConfig();
    if (!validated) return;

    if (hasStarted) {
      setPendingConfig(validated);
      setShowConfirmReset(true);
      return;
    }

    onApplyMachineConfig(validated);
    const total = Object.values(validated).reduce((a, b) => a + b, 0);
    setSuccessBanner(`Applied: Provisioned ${total} machine fixtures and synced counting semaphores.`);
  };

  const handleConfirmApply = () => {
    if (!pendingConfig) return;
    onApplyMachineConfig(pendingConfig);
    const total = Object.values(pendingConfig).reduce((a, b) => a + b, 0);
    setShowConfirmReset(false);
    setPendingConfig(null);
    setSuccessBanner(`Applied: Provisioned ${total} machine fixtures and reinitialized simulation (t = 0s).`);
  };

  const handleCancelApply = () => {
    setShowConfirmReset(false);
    setPendingConfig(null);
  };

  const workstations = [
    { type: ResourceType.CNC, label: 'CNC Milling', desc: 'Precision milling & drilling fixtures' },
    { type: ResourceType.WELDING, label: 'Robotic Welding', desc: 'Automated laser & MIG cells' },
    { type: ResourceType.ASSEMBLY, label: 'Assembly Station', desc: 'Component mounting cells' },
    { type: ResourceType.PAINTING, label: 'Painting Booth', desc: 'Electrostatic spray & curing' },
    { type: ResourceType.PACKAGING, label: 'Quality & Packing', desc: 'Inspection & packaging cells' },
  ];

  return (
    <div className="space-y-4">
      {/* 1. CONFIGURATION & PRIMARY ACTION */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Workcell Capacity & Machine Provisioning
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-mono">Active:</span>
            <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
              {totalActive} Fixtures
            </span>
            <button
              onClick={handleResetDefaults}
              disabled={isRunning}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-semibold border border-slate-200 transition"
              title={isRunning ? 'Cannot reset while simulation is running' : 'Reset machine capacities to defaults'}
            >
              <RotateCcw className="w-3 h-3" />
              <span>Defaults</span>
            </button>
          </div>
        </div>

        {validationError && (
          <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {successBanner && (
          <div className="mb-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successBanner}</span>
          </div>
        )}

        {isRunning && (
          <div className="mb-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600" />
            <span>Simulation running — Pause simulation to reconfigure machine capacities.</span>
          </div>
        )}

        {/* 5 Workstation Capacity Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {workstations.map(({ type, label, desc }) => {
            const count = Number(counts[type]) || 1;
            const Icon = MACHINE_ICONS[type] || Box;
            const generatedIds = generateMachineIds(type, count);

            return (
              <div
                key={type}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="p-1 rounded bg-white border border-slate-200 text-slate-700">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 leading-tight">{label}</h3>
                      <span className="text-[10px] font-mono text-slate-400">[{type}]</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2">{desc}</p>
                </div>

                {/* Stepper Buttons */}
                <div className="pt-2 border-t border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">Count:</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStep(type, -1)}
                        disabled={isRunning || count <= 1}
                        className="w-6 h-6 flex items-center justify-center rounded bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-300 text-xs font-bold"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-mono font-bold text-xs text-slate-800">
                        {count}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleStep(type, 1)}
                        disabled={isRunning || count >= 8}
                        className="w-6 h-6 flex items-center justify-center rounded bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-300 text-xs font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="text-[10px] font-mono text-slate-400 truncate" title={generatedIds.join(', ')}>
                    IDs: {generatedIds.join(', ')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Confirmation Modal/Card when simTime > 0 */}
        {showConfirmReset && (
          <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-300 text-xs space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-900">
                  Simulation in progress (t = {simTime}s): Applying configuration will reinitialize the simulation
                </span>
                <p className="text-amber-800 text-[11px] mt-0.5">
                  Modifying hardware fixtures resets counting semaphores, job states, and execution history back to t = 0s.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleConfirmApply}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition shadow-sm"
              >
                Confirm & Reinitialize Simulation
              </button>
              <button
                type="button"
                onClick={handleCancelApply}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Primary Action Button */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApply}
              disabled={isRunning || showConfirmReset}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs transition"
            >
              Apply Capacity & Provision Workcells ({totalConfigured} Total)
            </button>
            {isRunning && (
              <span className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Simulation running — Pause to apply changes
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Scales counting semaphores and fixtures in engine.
          </span>
        </div>
      </section>

      {/* 2. RESULTS: SEMAPHORES & FIXTURE REGISTRY */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Resource Registry & Semaphore Allocations
          </h2>
          <span className="text-xs font-mono text-slate-500">
            Dijkstra Counting Semaphores
          </span>
        </div>

        {/* Capacities & Semaphores Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 font-semibold bg-slate-50 font-mono">
                <th className="py-2 px-3">Resource Type</th>
                <th className="py-2 px-3">Capacity</th>
                <th className="py-2 px-3">Allocated</th>
                <th className="py-2 px-3">Available</th>
                <th className="py-2 px-3">Semaphore (S)</th>
                <th className="py-2 px-3">Waiting Queue</th>
                <th className="py-2 px-3">Contention Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {Object.values(RESOURCE_DEFINITIONS).map((def) => {
                const rt = snapshot?.resourceTypes?.[def.type] || {};
                const sem = snapshot?.semaphores?.[def.type] || {};
                const cap = rt.capacity ?? def.capacity;
                const alloc = rt.allocated ?? 0;
                const avail = rt.available ?? cap;
                const semVal = sem.value ?? avail;
                const queue = sem.waitingQueue || [];

                return (
                  <tr key={def.type} className="hover:bg-slate-50/60">
                    <td className="py-2 px-3 font-bold text-slate-900 font-sans">
                      {def.shortName} <span className="text-slate-400 font-normal font-mono text-[11px]">({def.type})</span>
                    </td>
                    <td className="py-2 px-3 text-slate-700 font-bold">{cap}</td>
                    <td className="py-2 px-3 text-amber-700 font-bold">{alloc}</td>
                    <td className="py-2 px-3 text-emerald-700 font-bold">{avail}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded font-bold border ${
                        semVal === 0 ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        S = {semVal}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      {queue.length > 0 ? (
                        <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          [{queue.join(', ')}] ({queue.length} waiting)
                        </span>
                      ) : (
                        <span className="text-slate-400">Empty</span>
                      )}
                    </td>
                    <td className="py-2 px-3 font-sans">
                      {queue.length > 0 ? (
                        <span className="text-amber-600 font-bold text-[11px]">Contention Active</span>
                      ) : alloc === cap ? (
                        <span className="text-blue-600 text-[11px]">Fully Allocated</span>
                      ) : (
                        <span className="text-emerald-600 text-[11px]">Available</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Physical Machines Grid */}
        <div className="pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Physical Machine Cells ({totalActive} Total Fixtures)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {Object.values(snapshot?.machineInstances || {}).map((m) => {
              const isBusy = m.state === 'RUNNING' && m.currentJobId;
              return (
                <div
                  key={m.id}
                  className={`p-2.5 rounded-lg border text-xs font-mono flex flex-col justify-between ${
                    isBusy
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold">{m.id}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                      isBusy ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {isBusy ? 'BUSY' : 'IDLE'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Type: <span className="font-semibold text-slate-700">{m.type}</span>
                  </div>
                  <div className="text-[11px] mt-1 pt-1 border-t border-slate-200/60 truncate">
                    {isBusy ? `Job: ${m.currentJobId}` : 'Standby'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
