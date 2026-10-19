import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  RefreshCw,
  GitCommit,
  ShieldAlert,
} from 'lucide-react';
import DeadlockView from '../views/DeadlockView.jsx';
import RecoveryView from '../views/RecoveryView.jsx';

export default function DeadlockLabModule({
  snapshot,
  initialTab = 'detection',
  onExecuteRecovery,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const hasDeadlock = snapshot.deadlockInfo?.hasDeadlock;

  const tabs = [
    {
      id: 'detection',
      label: 'Detection & RAG Graph',
      icon: AlertOctagon,
      badge: hasDeadlock ? 'CYCLE DETECTED' : 'ACYCLIC',
      badgeColor: hasDeadlock ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/15 text-emerald-300',
    },
    {
      id: 'recovery',
      label: 'Deadlock Recovery',
      icon: RefreshCw,
      badge: hasDeadlock ? 'ACTION REQUIRED' : null,
      badgeColor: 'bg-rose-500/20 text-rose-300',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Module Header & Sub-Navigation */}
      <div className="bg-[#0b101e] border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100">Deadlock Lab</h2>
              <span
                className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
                  hasDeadlock
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                }`}
              >
                {hasDeadlock ? 'CIRCULAR WAIT DETECTED' : 'RAG ACYCLIC (NORMAL)'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Bipartite Resource Allocation Graph (RAG), 4 Coffman conditions audit & victim selection recovery
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800/90 text-xs overflow-x-auto scrollbar-none">
          {tabs.map(({ id, label, icon: Icon, badge, badgeColor }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
                {badge && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${badgeColor || 'bg-slate-800 text-slate-300'}`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Rendering */}
      <div>
        {activeTab === 'detection' && (
          <DeadlockView
            deadlockInfo={snapshot.deadlockInfo}
            jobs={snapshot.jobs}
            resourceTypes={snapshot.resourceTypes}
            onNavigateToRecovery={() => setActiveTab('recovery')}
          />
        )}

        {activeTab === 'recovery' && (
          <RecoveryView
            deadlockInfo={snapshot.deadlockInfo}
            jobs={snapshot.jobs}
            resourceTypes={snapshot.resourceTypes}
            onExecuteRecovery={onExecuteRecovery}
          />
        )}
      </div>
    </div>
  );
}
