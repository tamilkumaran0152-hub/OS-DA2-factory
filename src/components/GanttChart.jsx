import React, { useState } from 'react';
import { BarChart3, Clock, Info } from 'lucide-react';
import { ProcessState } from '../simulation/types.js';

export default function GanttChart({ jobs, ganttRecords, currentTime, metrics }) {
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const jobList = Object.values(jobs);
  const maxTime = Math.max(25, currentTime + 5);

  const jobRows = jobList.map((job) => {
    const records = ganttRecords.filter((r) => r.jobId === job.id);
    const m = metrics?.jobMetrics?.[job.id] || {};
    return { job, records, metrics: m };
  });

  return (
    <div className="panel-industrial p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
            LIVE PRODUCTION TIMELINE (GANTT CHART)
          </h2>
          <p className="text-xs text-slate-400">
            Chronological multi-stage task dispatch, waiting periods, and turnaround metrics
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded-sm bg-cyan-400" />
            <span>Running</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded-sm bg-amber-400/80" />
            <span>Waiting / Blocked</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded-sm bg-emerald-400" />
            <span>Completed</span>
          </span>
          <span className="font-mono text-xs text-slate-300">
            Scale: 0s — {maxTime}s
          </span>
        </div>
      </div>

      {/* Gantt Timeline Container */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[760px]">
          {/* Time Axis Header */}
          <div className="flex items-center pb-2 mb-2 border-b border-slate-800 text-xs font-mono text-slate-400">
            <div className="w-48 flex-shrink-0 font-sans font-semibold text-slate-300">
              Workpiece / Process
            </div>
            <div className="flex-1 relative h-4">
              {Array.from({ length: Math.ceil(maxTime / 5) + 1 }).map((_, i) => {
                const tickTime = i * 5;
                const leftPercent = (tickTime / maxTime) * 100;
                if (leftPercent > 100) return null;
                return (
                  <div
                    key={tickTime}
                    className="absolute -translate-x-1/2 flex flex-col items-center"
                    style={{ left: `${leftPercent}%` }}
                  >
                    <span>{tickTime}s</span>
                    <div className="h-1.5 w-[1px] bg-slate-700 mt-0.5" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Job Rows */}
          <div className="space-y-3">
            {jobRows.map(({ job, records, metrics: jm }) => (
              <div key={job.id} className="flex items-center group">
                {/* Left Column: Job Info & Computed Metrics */}
                <div className="w-48 flex-shrink-0 pr-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-300">
                      {job.id}
                    </span>
                    <span className="text-xs text-slate-300 font-medium truncate max-w-[100px]">
                      {job.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[10px] font-mono text-slate-400 mt-0.5">
                    <span title="Waiting Time: WT = TAT - Burst">WT: {jm.waitingTime ?? 0}s</span>
                    <span title="Turnaround Time: TAT = Completion - Arrival">TAT: {jm.turnaroundTime ?? 0}s</span>
                    <span title="Response Time: RT = First Run - Arrival">RT: {jm.responseTime ?? '-'}s</span>
                  </div>
                </div>

                {/* Right Column: Timeline Track */}
                <div className="flex-1 h-8 bg-slate-950/80 rounded-lg relative overflow-hidden border border-slate-800/80">
                  {/* Vertical Grid Markers */}
                  {Array.from({ length: Math.ceil(maxTime / 5) }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 border-r border-slate-900 pointer-events-none"
                      style={{ left: `${((i * 5) / maxTime) * 100}%` }}
                    />
                  ))}

                  {/* Slices */}
                  {records.map((slice, sIdx) => {
                    const left = (slice.start / maxTime) * 100;
                    const width = Math.max(0.6, ((slice.end - slice.start) / maxTime) * 100);
                    const isRunning = slice.state === ProcessState.RUNNING;

                    return (
                      <div
                        key={sIdx}
                        onMouseEnter={() => setHoveredSlice({ job, slice })}
                        onMouseLeave={() => setHoveredSlice(null)}
                        className={`absolute top-1 bottom-1 rounded-sm cursor-pointer transition-opacity ${
                          isRunning
                            ? 'bg-cyan-500 hover:opacity-90'
                            : 'bg-amber-500/70 hover:opacity-90'
                        }`}
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
                        }}
                      />
                    );
                  })}

                  {/* Red Current Simulation Time Cursor */}
                  <div
                    className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-10 pointer-events-none shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                    style={{ left: `${(currentTime / maxTime) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip on Slice Hover */}
      {hoveredSlice && (
        <div className="mt-3 p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-slate-100">
              {hoveredSlice.job.id} ({hoveredSlice.job.name}):
            </span>
            <span className="font-mono text-cyan-300">
              State: {hoveredSlice.slice.state}
            </span>
            {hoveredSlice.slice.machineId && (
              <span className="font-mono text-slate-400">
                Machine: {hoveredSlice.slice.machineId}
              </span>
            )}
          </div>
          <div className="font-mono text-slate-400">
            Interval: [{hoveredSlice.slice.start}s → {hoveredSlice.slice.end}s]
          </div>
        </div>
      )}
    </div>
  );
}
