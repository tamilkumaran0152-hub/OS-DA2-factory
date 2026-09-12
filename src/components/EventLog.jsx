import React, { useState } from 'react';
import { Terminal, Filter, Eye, ChevronRight } from 'lucide-react';
import { Subsystem } from '../simulation/types.js';

export default function EventLog({ eventLog, onSelectEvent }) {
  const [filter, setFilter] = useState('ALL');

  const filteredEvents = eventLog.filter((evt) => {
    if (filter === 'ALL') return true;
    if (filter === 'SCHEDULER') return evt.subsystem === Subsystem.SCHEDULER;
    if (filter === 'SEMAPHORE') return evt.subsystem === Subsystem.SYNCHRONIZATION || evt.subsystem === Subsystem.RESOURCE_MGR;
    if (filter === 'BANKER') return evt.subsystem === Subsystem.SAFETY_ENGINE;
    if (filter === 'DEADLOCK') return evt.subsystem === Subsystem.DEADLOCK_DETECTOR || evt.subsystem === Subsystem.RECOVERY_MGR;
    return true;
  });

  return (
    <div className="control-card p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            SYSTEM DISCRETE EVENT STREAM
          </h2>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['ALL', 'SCHEDULER', 'SEMAPHORE', 'BANKER', 'DEADLOCK'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition ${
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

      {/* Event Stream List */}
      <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
        {filteredEvents.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 font-mono">
            No events recorded for filter: {filter}
          </div>
        ) : (
          filteredEvents.map((evt) => (
            <div
              key={evt.id}
              onClick={() => onSelectEvent && onSelectEvent(evt)}
              className="p-2 rounded-lg bg-slate-950/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition flex items-start justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-2.5">
                <span className="font-mono text-[10px] text-cyan-400 font-bold bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/20 mt-0.5">
                  t={evt.time}s
                </span>

                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-[10px] font-bold text-slate-300 uppercase tracking-wide">
                      {evt.eventType}
                    </span>
                    {evt.jobId && (
                      <span className="font-mono text-[9px] font-bold text-cyan-400 bg-cyan-500/10 px-1 rounded">
                        {evt.jobId}
                      </span>
                    )}
                    {evt.resourceType && (
                      <span className="font-mono text-[9px] text-amber-400 bg-amber-500/10 px-1 rounded">
                        {evt.resourceType}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    {evt.whatHappened || evt.reason}
                  </p>
                </div>
              </div>

              <div className="flex items-center text-slate-600 hover:text-cyan-400 transition mt-1">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
