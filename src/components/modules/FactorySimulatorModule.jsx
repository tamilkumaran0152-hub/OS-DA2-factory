import React, { useState, useEffect } from 'react';
import {
  Factory,
  LayoutDashboard,
  Activity,
  Brain,
  Clock,
  Play,
  Pause,
} from 'lucide-react';
import FactoryFloorView from '../views/FactoryFloorView.jsx';
import DashboardView from '../views/DashboardView.jsx';
import EventStreamView from '../views/EventStreamView.jsx';
import SystemBrainView from '../views/SystemBrainView.jsx';

export default function FactorySimulatorModule({
  snapshot,
  initialTab = 'floor',
  onInspectJob,
  onWhyWaiting,
  onNavigateToView,
  onSelectEvent,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const tabs = [
    { id: 'floor', label: 'Shopfloor Workcells', icon: Factory },
    { id: 'overview', label: 'Production Overview', icon: LayoutDashboard },
    { id: 'events', label: 'OS Event Stream', icon: Activity, count: snapshot.eventLog?.length || 0 },
    { id: 'brain', label: 'OS Decision Brain', icon: Brain },
  ];

  return (
    <div className="space-y-4">
      {/* Module Header & Sub-Navigation */}
      <div className="bg-[#0b101e] border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Factory className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100">Factory Simulator</h2>
              <span
                className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
                  snapshot.isRunning
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {snapshot.isRunning ? 'RUNNING' : 'PAUSED'} (t={snapshot.time}s)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live multi-stage manufacturing simulation, physical machine allocations & chronological OS events
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
                    ? 'bg-cyan-600 text-slate-950 shadow-sm font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
                {count !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded text-[10px] font-mono ${
                      isActive ? 'bg-cyan-700 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
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
        {activeTab === 'floor' && (
          <FactoryFloorView
            resourceTypes={snapshot.resourceTypes}
            machineInstances={snapshot.machineInstances}
            jobs={snapshot.jobs}
            onInspectJob={onInspectJob}
            onWhyWaiting={onWhyWaiting}
          />
        )}

        {activeTab === 'overview' && (
          <DashboardView
            snapshot={snapshot}
            onNavigateToView={onNavigateToView}
            onInspectJob={onInspectJob}
            onWhyWaiting={onWhyWaiting}
          />
        )}

        {activeTab === 'events' && (
          <EventStreamView
            eventLog={snapshot.eventLog}
            onSelectEvent={onSelectEvent}
          />
        )}

        {activeTab === 'brain' && (
          <SystemBrainView
            activeSubsystem={snapshot.activeSubsystem}
            snapshot={snapshot}
          />
        )}
      </div>
    </div>
  );
}
