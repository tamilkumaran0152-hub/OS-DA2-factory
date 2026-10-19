import React from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import MachineConfigPanel from '../modules/MachineConfigPanel.jsx';

export default function MachineConfigModal({
  isOpen,
  onClose,
  currentConfig,
  onApplyConfig,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div
        className="bg-[#080d1a] border border-slate-700/80 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="machine-config-title"
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-[#0b1122] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h2 id="machine-config-title" className="text-sm font-bold text-slate-100">
                Machine Counts & Capacity Configuration
              </h2>
              <p className="text-[11px] text-slate-400">
                Dynamic resource capacity allocation for Smart Factory OS
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 max-h-[calc(85vh-4rem)] overflow-y-auto">
          <MachineConfigPanel
            currentConfig={currentConfig}
            onApplyConfig={onApplyConfig}
            onClose={onClose}
            isModal={true}
          />
        </div>
      </div>
    </div>
  );
}
