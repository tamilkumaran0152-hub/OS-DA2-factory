import React, { useState, useEffect } from 'react';
import {
  Box,
  Lock,
  SlidersHorizontal,
  Server,
  Layers,
} from 'lucide-react';
import ResourceManagerView from '../views/ResourceManagerView.jsx';
import SynchronizationView from '../views/SynchronizationView.jsx';
import MachineConfigPanel from './MachineConfigPanel.jsx';

export default function ResourceManagerModule({
  snapshot,
  initialTab = 'inventory',
  onInspectJob,
  onApplyMachineConfig,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const totalMachines = Object.values(snapshot.machineInstances || {}).length;

  const tabs = [
    { id: 'inventory', label: 'Machine Inventory & Cells', icon: Box, count: totalMachines },
    { id: 'semaphores', label: 'Semaphores & FIFO Queues', icon: Lock },
    { id: 'config', label: 'Machine Configuration', icon: SlidersHorizontal },
  ];

  return (
    <div className="space-y-4">
      {/* Module Header & Sub-Navigation */}
      <div className="bg-[#0b101e] border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100">Resource Manager</h2>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                {totalMachines} PHYSICAL FIXTURES
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Workstation registries, Dijkstra counting semaphores S, wait queues & dynamic machine capacity provisioning
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800/90 text-xs overflow-x-auto scrollbar-none">
          {tabs.map(({ id, label, icon: Icon, count }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
                {count !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded text-[10px] font-mono ${
                      isActive ? 'bg-amber-600 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Rendering */}
      <div>
        {activeTab === 'inventory' && (
          <ResourceManagerView
            resourceTypes={snapshot.resourceTypes}
            machineInstances={snapshot.machineInstances}
            jobs={snapshot.jobs}
            semaphores={snapshot.semaphores}
            onInspectJob={onInspectJob}
          />
        )}

        {activeTab === 'semaphores' && (
          <SynchronizationView
            semaphores={snapshot.semaphores}
            resourceTypes={snapshot.resourceTypes}
            jobs={snapshot.jobs}
            eventLog={snapshot.eventLog}
            onInspectJob={onInspectJob}
          />
        )}

        {activeTab === 'config' && (
          <div className="bg-[#080d19] border border-slate-800/90 rounded-xl p-5 shadow-sm">
            <MachineConfigPanel
              currentConfig={snapshot.machineConfig}
              onApplyConfig={onApplyMachineConfig}
            />
          </div>
        )}
      </div>
    </div>
  );
}
