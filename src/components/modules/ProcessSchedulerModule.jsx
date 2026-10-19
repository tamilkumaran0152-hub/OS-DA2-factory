import React, { useState, useEffect } from 'react';
import {
  Layers,
  BarChart3,
  Sliders,
  Cpu,
  Clock,
  CheckCircle2,
  ListFilter,
} from 'lucide-react';
import ProcessManagerView from '../views/ProcessManagerView.jsx';
import GanttMetricsView from '../views/GanttMetricsView.jsx';
import AlgorithmLabView from '../views/AlgorithmLabView.jsx';

export default function ProcessSchedulerModule({
  snapshot,
  initialTab = 'processes',
  onInspectJob,
  onWhyWaiting,
  onAlgorithmChange,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const tabs = [
    { id: 'processes', label: 'Process Table & Queues', icon: Layers, count: Object.keys(snapshot.jobs || {}).length },
    { id: 'gantt', label: 'Gantt Chart & Metrics', icon: BarChart3 },
    { id: 'algorithms', label: 'Algorithm Comparison Lab', icon: Sliders },
  ];

  return (
    <div className="space-y-4">
      {/* Module Header & Sub-Navigation */}
      <div className="bg-[#0b101e] border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100">Process Scheduler</h2>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                POLICY: {snapshot.algorithm}
              </span>
              {snapshot.algorithm === 'ROUND_ROBIN' && (
                <span className="text-[10px] font-mono text-slate-400">
                  q={snapshot.quantum}s
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              CPU/Workcell scheduling policies (FCFS, SJF, Priority, Round Robin), ready queues & benchmark analytics
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
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
                {count !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded text-[10px] font-mono ${
                      isActive ? 'bg-blue-700 text-blue-100' : 'bg-slate-800 text-slate-400'
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
        {activeTab === 'processes' && (
          <ProcessManagerView
            jobs={snapshot.jobs}
            onInspectJob={onInspectJob}
            onWhyWaiting={onWhyWaiting}
          />
        )}

        {activeTab === 'gantt' && (
          <GanttMetricsView
            jobs={snapshot.jobs}
            ganttRecords={snapshot.ganttRecords}
            currentTime={snapshot.time}
            metrics={snapshot.metrics}
          />
        )}

        {activeTab === 'algorithms' && (
          <AlgorithmLabView currentScenario={snapshot.scenario} />
        )}
      </div>
    </div>
  );
}
