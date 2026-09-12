import React, { useState } from 'react';
import { Terminal, Filter, ChevronRight, Cpu, Box, Lock, ShieldCheck, AlertOctagon, RefreshCw } from 'lucide-react';
import { Subsystem } from '../simulation/types.js';

const CATEGORY_STYLES = {
  SCHEDULER: { icon: Cpu, badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  RESOURCE: { icon: Box, badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  SEMAPHORE: { icon: Lock, badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  BANKER: { icon: ShieldCheck, badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
  DEADLOCK: { icon: AlertOctagon, badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  RECOVERY: { icon: RefreshCw, badge: 'bg-pink-500/15 text-pink-300 border-pink-500/30' },
};

export default function EventLog({ eventLog, onSelectEvent }) {
  const [filter, setFilter] = useState('ALL');

  const getEventCategory = (evt) => {
    if (evt.subsystem === Subsystem.SCHEDULER) return 'SCHEDULER';
    if (evt.subsystem === Subsystem.RESOURCE_MGR) return 'RESOURCE';
    if (evt.subsystem === Subsystem.SYNCHRONIZATION) return 'SEMAPHORE';
    if (evt.subsystem === Subsystem.SAFETY_ENGINE) return 'BANKER';
    if (evt.subsystem === Subsystem.DEADLOCK_DETECTOR) return 'DEADLOCK';
    if (evt.subsystem === Subsystem.RECOVERY_MGR) return 'RECOVERY';
    return 'RESOURCE';
  };

  const filteredEvents = eventLog.filter((evt) => {
    if (filter === 'ALL') return true;
    const cat = getEventCategory(evt);
    return cat === filter;
  });

  return (
    <div className="panel-industrial p-4 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100">
              DISCRETE EVENT STREAM
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {['ALL', 'SCHEDULER', 'RESOURCE', 'SEMAPHORE', 'BANKER', 'DEADLOCK', 'RECOVERY'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition whitespace-nowrap ${
                  filter === f
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Events List */}
        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {filteredEvents.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 font-medium">
              No events found for {filter}
            </div>
          ) : (
            filteredEvents.map((evt) => {
              const cat = getEventCategory(evt);
              const style = CATEGORY_STYLES[cat] || CATEGORY_STYLES.RESOURCE;
              const Icon = style.icon;

              return (
                <div
                  key={evt.id}
                  onClick={() => onSelectEvent && onSelectEvent(evt)}
                  className="p-2.5 rounded-lg bg-[#0e1422] hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition flex items-start justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    {/* Timestamp */}
                    <span className="font-mono text-[11px] font-bold text-slate-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 mt-0.5 flex-shrink-0">
                      {evt.time.toFixed(1)}s
                    </span>

                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border flex items-center gap-1 ${style.badge}`}
                        >
                          <Icon className="w-2.5 h-2.5" />
                          {cat}
                        </span>

                        {evt.jobId && (
                          <span className="font-mono text-[10px] font-bold text-cyan-400">
                            {evt.jobId}
                          </span>
                        )}

                        {evt.resourceType && (
                          <span className="font-mono text-[10px] text-amber-400">
                            [{evt.resourceType}]
                          </span>
                        )}
                      </div>

                      <p className="text-slate-300 text-xs leading-snug font-medium">
                        {evt.whatHappened || evt.reason}
                      </p>
                    </div>
                  </div>

                  <div className="text-slate-600 hover:text-cyan-400 mt-1 flex-shrink-0">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
