import React, { useState } from 'react';
import {
  Terminal,
  Cpu,
  Box,
  Lock,
  ShieldCheck,
  AlertOctagon,
  RefreshCw,
  Search,
} from 'lucide-react';
import { Subsystem } from '../../simulation/types.js';

const CATEGORY_STYLES = {
  SCHEDULER: { icon: Cpu, badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  RESOURCE: { icon: Box, badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  SEMAPHORE: { icon: Lock, badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  BANKER: { icon: ShieldCheck, badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
  DEADLOCK: { icon: AlertOctagon, badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  RECOVERY: { icon: RefreshCw, badge: 'bg-pink-500/15 text-pink-300 border-pink-500/30' },
};

export default function EventStreamView({ eventLog = [], onSelectEvent }) {
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

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
    const cat = getEventCategory(evt);
    if (filter !== 'ALL' && cat !== filter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        evt.whatHappened?.toLowerCase().includes(q) ||
        evt.jobId?.toLowerCase().includes(q) ||
        evt.resourceType?.toLowerCase().includes(q) ||
        evt.eventType?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* 1. Header Banner */}
      <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
              SYSTEM EVENT STREAM
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Chronological audit log of discrete operating system transitions and shopfloor actions
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Total Events: <strong className="text-cyan-400">{eventLog.length}</strong> logged
        </div>
      </div>

      {/* 2. Filters & Search (Section 19) */}
      <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Category Filter Pills: ALL, SCHEDULER, RESOURCE, SEMAPHORE, BANKER, DEADLOCK, RECOVERY */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-mono">
          {['ALL', 'SCHEDULER', 'RESOURCE', 'SEMAPHORE', 'BANKER', 'DEADLOCK', 'RECOVERY'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                filter === f
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative min-w-[220px]">
          <input
            type="text"
            placeholder="Search job, resource, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 text-slate-200 text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-400 font-mono"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* 3. Professional Event Table (Section 19: TIME, EVENT, JOB, RESOURCE, SUBSYSTEM, DESCRIPTION) */}
      <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-4 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                <th className="pb-3 font-semibold">TIME</th>
                <th className="pb-3 font-semibold">EVENT</th>
                <th className="pb-3 font-semibold">JOB</th>
                <th className="pb-3 font-semibold">RESOURCE</th>
                <th className="pb-3 font-semibold">SUBSYSTEM</th>
                <th className="pb-3 font-semibold">DESCRIPTION</th>
                <th className="pb-3 text-right font-semibold">INSPECT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredEvents.map((evt) => {
                const cat = getEventCategory(evt);
                const style = CATEGORY_STYLES[cat] || CATEGORY_STYLES.RESOURCE;
                const Icon = style.icon;

                return (
                  <tr
                    key={evt.id}
                    onClick={() => onSelectEvent && onSelectEvent(evt)}
                    className="hover:bg-slate-800/40 cursor-pointer transition"
                  >
                    {/* TIME */}
                    <td className="py-2.5 font-bold text-slate-200">
                      t = {evt.time.toFixed(1)}s
                    </td>

                    {/* EVENT */}
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 w-max ${style.badge}`}>
                        <Icon className="w-3 h-3" />
                        <span>{evt.eventType}</span>
                      </span>
                    </td>

                    {/* JOB */}
                    <td className="py-2.5 text-cyan-300 font-bold">
                      {evt.jobId || '—'}
                    </td>

                    {/* RESOURCE */}
                    <td className="py-2.5 text-amber-300">
                      {evt.resourceType || '—'}
                    </td>

                    {/* SUBSYSTEM */}
                    <td className="py-2.5 text-slate-400 text-[11px]">
                      {evt.subsystem || cat}
                    </td>

                    {/* DESCRIPTION */}
                    <td className="py-2.5 text-slate-300 font-sans text-xs max-w-[420px]">
                      {evt.whatHappened || evt.reason}
                    </td>

                    {/* INSPECT */}
                    <td className="py-2.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEvent && onSelectEvent(evt);
                        }}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold transition"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredEvents.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No discrete events found matching filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
