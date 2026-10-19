import React, { useState, useEffect } from 'react';
import {
  Cpu,
  RotateCcw,
  CheckCircle2,
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

export default function MachineConfigPanel({
  currentConfig,
  onApplyConfig,
  onClose,
  isModal = false,
}) {
  // Initialize form with current engine config or defaults
  const [counts, setCounts] = useState(() => ({
    ...DEFAULT_MACHINE_COUNTS,
    ...(currentConfig || {}),
  }));

  const [validationError, setValidationError] = useState('');
  const [successBanner, setSuccessBanner] = useState('');

  // Sync if currentConfig changes from outside
  useEffect(() => {
    if (currentConfig) {
      setCounts((prev) => ({
        ...prev,
        ...currentConfig,
      }));
    }
  }, [currentConfig]);

  const handleChange = (type, val) => {
    setValidationError('');
    setSuccessBanner('');
    const num = parseInt(val, 10);
    setCounts((prev) => ({
      ...prev,
      [type]: isNaN(num) ? '' : num,
    }));
  };

  const handleStep = (type, delta) => {
    setValidationError('');
    setSuccessBanner('');
    const current = Number(counts[type]) || 1;
    const nextVal = Math.max(1, Math.min(8, current + delta));
    setCounts((prev) => ({
      ...prev,
      [type]: nextVal,
    }));
  };

  const handleResetDefaults = () => {
    setValidationError('');
    setSuccessBanner('');
    setCounts({ ...DEFAULT_MACHINE_COUNTS });
  };

  const handleApply = (e) => {
    e?.preventDefault();
    setValidationError('');

    // Validate all counts are integers >= 1 and <= 8
    const validated = {};
    for (const [type, val] of Object.entries(counts)) {
      const num = Number(val);
      if (!Number.isInteger(num) || num < 1) {
        setValidationError(`Invalid machine count for ${type}: must be at least 1.`);
        return;
      }
      if (num > 8) {
        setValidationError(`Machine count for ${type} cannot exceed 8 for shopfloor stability.`);
        return;
      }
      validated[type] = num;
    }

    onApplyConfig(validated);
    const total = Object.values(validated).reduce((a, b) => a + b, 0);
    setSuccessBanner(`Applied successfully: ${total} total machine fixtures configured across 5 workstations.`);
    if (isModal && onClose) {
      setTimeout(() => {
        onClose();
      }, 700);
    }
  };

  const totalMachines = Object.values(counts).reduce((sum, n) => sum + (Number(n) || 0), 0);

  const workstations = [
    { type: ResourceType.CNC, label: 'CNC Milling', desc: 'Precision high-speed milling & drilling' },
    { type: ResourceType.WELDING, label: 'Robotic Welding', desc: 'Structural laser & MIG seam fabrication' },
    { type: ResourceType.ASSEMBLY, label: 'Assembly Station', desc: 'Robotic component integration & fastening' },
    { type: ResourceType.PAINTING, label: 'Painting Booth', desc: 'Electrostatic paint & thermal cure' },
    { type: ResourceType.PACKAGING, label: 'Quality & Packing', desc: 'Inspection, barcode stamping & packaging' },
  ];

  return (
    <div className="space-y-4">
      {/* Header Info Banner */}
      <div className="bg-[#0b101d] border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Physical Workstation Machine Configuration</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Set capacity per workcell. Applying directly adjusts engine resource capacities, counting semaphores, and physical fixtures.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            TOTAL FIXTURES: {totalMachines}
          </span>
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition border border-slate-700"
            title="Reset to OS Defaults: CNC 2, Welding 2, Assembly 2, Painting 1, Packaging 2"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Defaults</span>
          </button>
        </div>
      </div>

      {/* Validation / Success Notices */}
      {validationError && (
        <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 font-mono">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {successBanner && (
        <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Grid of 5 Workstations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {workstations.map(({ type, label, desc }) => {
          const count = Number(counts[type]) || 1;
          const def = RESOURCE_DEFINITIONS[type] || {};
          const Icon = MACHINE_ICONS[type] || Cpu;
          const generatedIds = generateMachineIds(type, count);

          return (
            <div
              key={type}
              className="bg-[#0d1322] border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between shadow-sm hover:border-slate-700 transition"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center border"
                      style={{
                        backgroundColor: def.accentColor || 'rgba(0,240,255,0.1)',
                        borderColor: def.color || '#38bdf8',
                        color: def.color || '#38bdf8',
                      }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-100">{label}</h4>
                      <span className="text-[10px] font-mono text-slate-500">[{type}]</span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                    Cap: {count}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 mb-3">{desc}</p>
              </div>

              {/* Stepper Controls */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-300">Machines:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleStep(type, -1)}
                      disabled={count <= 1}
                      className="w-7 h-7 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-200 text-xs font-bold transition border border-slate-700"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="8"
                      value={counts[type]}
                      onChange={(e) => handleChange(type, e.target.value)}
                      className="w-12 h-7 text-center bg-slate-950 border border-slate-700 rounded text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="button"
                      onClick={() => handleStep(type, 1)}
                      disabled={count >= 8}
                      className="w-7 h-7 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-200 text-xs font-bold transition border border-slate-700"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Generated IDs Preview */}
                <div className="text-[10px] font-mono text-slate-500 truncate" title={generatedIds.join(', ')}>
                  IDs: {generatedIds.join(', ')}
                </div>
              </div>
            </div>
          );
        })}

        {/* Action Card */}
        <div className="bg-[#0b101d] border border-cyan-500/20 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div>
            <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wide mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Apply Configuration</span>
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
              Applying re-initializes the scenario baseline with your requested physical capacities, rebuilds counting semaphores, and creates updated machine fixtures.
            </p>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleApply}
              className="w-full py-2 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition shadow-sm flex items-center justify-center gap-1.5"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Apply & Re-initialize Engine</span>
            </button>
            {isModal && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-semibold text-xs transition border border-slate-800"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
