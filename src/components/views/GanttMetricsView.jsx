import React, { useState } from 'react';
import {
  BarChart3,
  Info,
} from 'lucide-react';
import { ProcessState } from '../../simulation/types.js';

export default function GanttMetricsView({
  jobs,
  ganttRecords,
  currentTime,
  metrics,
}) {
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const jobList = Object.values(jobs || {});
  const maxTime = Math.max(30, Math.ceil((currentTime + 10) / 5) * 5);

  const jobRows = jobList.map((job) => {
    const records = (ganttRecords || []).filter((r) => r.jobId === job.id);
    const m = metrics?.jobMetrics?.[job.id] || {};
    return { job, records, metrics: m };
  });

  const summary = metrics?.summary || {};

  return (
    <div className="space-y-5">
      {/* 1. Header Banner */}
      <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
              PRODUCTION TIMELINE (GANTT CHART)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Chronological multi-stage task dispatch, waiting periods, and quantitative turnaround metrics
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-medium">
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

      {/* 2. Large Professional Gantt Chart (Section 17) */}
      <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-5 shadow-sm space-y-4">
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[800px]">
            {/* Time Axis Header */}
            <div className="flex items-center pb-2 mb-3 border-b border-slate-800 text-xs font-mono text-slate-400">
              <div className="w-56 flex-shrink-0 font-sans font-semibold text-slate-300">
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
                  <div className="w-56 flex-shrink-0 pr-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-cyan-300">
                        {job.id}
                      </span>
                      <span className="text-xs text-slate-300 font-medium truncate max-w-[120px]">
                        {job.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                      <span title="Waiting Time: WT = TAT - Burst">
                        WT: <strong className="text-amber-300">{jm.waitingTime ?? 0}s</strong>
                      </span>
                      <span title="Turnaround Time: TAT = Completion - Arrival">
                        TAT: <strong className="text-slate-200">{jm.turnaroundTime ?? 0}s</strong>
                      </span>
                      <span title="Response Time: RT = First Run - Arrival">
                        RT: <strong className="text-blue-300">{jm.responseTime ?? '-'}s</strong>
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Timeline Track */}
                  <div className="flex-1 h-8 bg-slate-950/90 rounded-lg relative overflow-hidden border border-slate-800">
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
                      const width = Math.max(0.8, ((slice.end - slice.start) / maxTime) * 100);
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

                    {/* Current Simulation Time Cursor */}
                    <div
                      className="absolute top-0 bottom-0 w-[2px] bg-rose-500 z-10 pointer-events-none shadow-[0_0_8px_rgba(244,63,94,0.8)]"
                      style={{ left: `${(currentTime / maxTime) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hover Tooltip */}
        {hoveredSlice && (
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-700 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono">
              <Info className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-slate-100">
                {hoveredSlice.job.id} ({hoveredSlice.job.name}):
              </span>
              <span className="text-cyan-300">State: {hoveredSlice.slice.state}</span>
              {hoveredSlice.slice.machineId && (
                <span className="text-slate-400">Cell: {hoveredSlice.slice.machineId}</span>
              )}
            </div>
            <div className="font-mono text-slate-400 text-xs">
              Interval: [{hoveredSlice.slice.start}s → {hoveredSlice.slice.end}s] (Duration: {hoveredSlice.slice.end - hoveredSlice.slice.start}s)
            </div>
          </div>
        )}
      </div>

      {/* 3. QUANTITATIVE OS PERFORMANCE METRICS CARDS (Section 17) */}
      <div>
        <div className="mb-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
          SYSTEM PERFORMANCE METRICS (ACTUAL VALUES)
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* Average Waiting Time */}
          <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-4 shadow-sm">
            <span className="text-slate-500 text-[10px] font-mono uppercase block mb-1">
              AVERAGE WAITING TIME
            </span>
            <div className="text-2xl font-bold font-mono text-amber-400">
              {summary.avgWaitingTime ?? 0}s
            </div>
            <p className="text-[10px] text-slate-500 mt-1 font-mono">
              WT = TAT − Total Burst
            </p>
          </div>

          {/* Average Turnaround Time */}
          <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-4 shadow-sm">
            <span className="text-slate-500 text-[10px] font-mono uppercase block mb-1">
              AVERAGE TURNAROUND TIME
            </span>
            <div className="text-2xl font-bold font-mono text-slate-100">
              {summary.avgTurnaroundTime ?? 0}s
            </div>
            <p className="text-[10px] text-slate-500 mt-1 font-mono">
              TAT = Completion − Arrival
            </p>
          </div>

          {/* Average Response Time */}
          <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-4 shadow-sm">
            <span className="text-slate-500 text-[10px] font-mono uppercase block mb-1">
              AVERAGE RESPONSE TIME
            </span>
            <div className="text-2xl font-bold font-mono text-blue-400">
              {summary.avgResponseTime ?? 0}s
            </div>
            <p className="text-[10px] text-slate-500 mt-1 font-mono">
              RT = First Run − Arrival
            </p>
          </div>

          {/* Throughput */}
          <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-4 shadow-sm">
            <span className="text-slate-500 text-[10px] font-mono uppercase block mb-1">
              SYSTEM THROUGHPUT
            </span>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {summary.throughput ?? 0}
            </div>
            <p className="text-[10px] text-slate-500 mt-1 font-mono">
              Completed jobs / second
            </p>
          </div>

          {/* Machine Utilization */}
          <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-4 shadow-sm">
            <span className="text-slate-500 text-[10px] font-mono uppercase block mb-1">
              MACHINE UTILIZATION
            </span>
            <div className="text-2xl font-bold font-mono text-cyan-400">
              {summary.overallUtilization ?? 0}%
            </div>
            <p className="text-[10px] text-slate-500 mt-1 font-mono">
              Busy machine time / Total time
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
