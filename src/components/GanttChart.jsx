import React, { useState } from 'react';
import { BarChart3, Clock, Info } from 'lucide-react';
import { ProcessState } from '../simulation/types.js';

export default function GanttChart({ jobs, ganttRecords, currentTime, metrics }) {
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const jobList = Object.values(jobs);
  const maxTime = Math.max(20, currentTime + 5);

  // Group records by job
  const jobRows = jobList.map((job) => {
    const records = ganttRecords.filter((r) => r.jobId === job.id);
    const m = metrics.jobMetrics[job.id] || {};
    return { job, records, metrics: m };
  });

  return (
    <div className="control-card p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            PRODUCTION TIMELINE & GANTT CHART
          </h2>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded bg-cyan-400" /> Running
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded bg-amber-400" /> Waiting / Blocked
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded bg-emerald-400" /> Completed
          </span>
          <span className="font-mono text-cyan-300">
            Window: [0 — {maxTime}s]
          </span>
        </div>
      </div>

      {/* Gantt Timeline Area */}
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Time axis markers */}
          <div className="flex border-b border-slate-800 pb-1 mb-2 font-mono text-[10px] text-slate-500">
            <div className="w-36 flex-shrink-0">Job / PCB Metric</div>
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
          <div className="space-y-2.5">
            {jobRows.map(({ job, records, metrics: jm }) => (
              <div key={job.id} className="flex items-center group">
                {/* Left: Job Info & Computed Metrics */}
                <div className="w-36 flex-shrink-0 pr-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-400">
                      {job.id}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[80px]">
                      {job.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] font-mono text-slate-400 mt-0.5">
                    <span title="Waiting Time">WT: {jm.waitingTime ?? 0}s</span>
                    <span title="Turnaround Time">TAT: {jm.turnaroundTime ?? 0}s</span>
                    <span title="Response Time">RT: {jm.responseTime ?? '-'}s</span>
                  </div>
                </div>

                {/* Right: Timeline Bar */}
                <div className="flex-1 h-7 bg-slate-950/80 rounded-lg relative overflow-hidden border border-slate-800/80">
                  {/* Grid Lines */}
                  {Array.from({ length: Math.ceil(maxTime / 5) }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 border-r border-slate-900"
                      style={{ left: `${((i * 5) / maxTime) * 100}%` }}
                    />
                  ))}

                  {/* Slices */}
                  {records.map((slice, sIdx) => {
                    const left = (slice.start / maxTime) * 100;
                    const width = Math.max(0.5, ((slice.end - slice.start) / maxTime) * 100);
                    const isRunning = slice.state === ProcessState.RUNNING;

                    return (
                      <div
                        key={sIdx}
                        onMouseEnter={() => setHoveredSlice({ job, slice })}
                        onMouseLeave={() => setHoveredSlice(null)}
                        className={`absolute top-1 bottom-1 rounded-sm transition cursor-pointer ${
                          isRunning
                            ? 'bg-cyan-500/80 hover:bg-cyan-400'
                            : 'bg-amber-500/60 hover:bg-amber-400'
                        }`}
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
                        }}
                      />
                    );
                  })}

                  {/* Current Time Cursor */}
                  <div
                    className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-10 pointer-events-none"
                    style={{ left: `${(currentTime / maxTime) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip on Hover */}
      {hoveredSlice && (
        <div className="mt-3 p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-200">
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
