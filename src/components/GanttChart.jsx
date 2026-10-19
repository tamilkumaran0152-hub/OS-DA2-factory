import React, { useState } from 'react';
import { Clock, Info, CheckCircle2 } from 'lucide-react';
import { ProcessState } from '../simulation/types.js';

export default function GanttChart({ jobs = {}, ganttRecords = [], currentTime = 0, metrics = {} }) {
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const jobList = Object.values(jobs || {});
  const maxTime = Math.max(25, Math.ceil((currentTime + 5) / 5) * 5);
  const hasHistory = Array.isArray(ganttRecords) && ganttRecords.length > 0;

  // Process rows and coalesce adjacent slices of same state & machine
  const jobRows = jobList.map((job) => {
    const rawRecords = (ganttRecords || []).filter((r) => r.jobId === job.id);
    const coalesced = [];

    rawRecords.forEach((rec) => {
      const last = coalesced[coalesced.length - 1];
      if (
        last &&
        last.state === rec.state &&
        last.machineId === rec.machineId &&
        last.end === rec.start
      ) {
        last.end = rec.end;
      } else {
        coalesced.push({ ...rec });
      }
    });

    const jm = metrics?.jobMetrics?.[job.id] || {};
    return { job, records: coalesced, metrics: jm };
  });

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-200">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <span>Execution Timeline</span>
            <span className="font-mono text-[11px] font-normal text-slate-500">
              (0s — {maxTime}s)
            </span>
          </h4>
          <p className="text-[11px] text-slate-500">
            Real-time process dispatch, workcell execution, and wait intervals
          </p>
        </div>

        {/* Legend with restrained colors */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-2.5 rounded-xs bg-blue-600 border border-blue-700/30" />
            <span>Running</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-2.5 rounded-xs bg-amber-400 border border-amber-500/30" />
            <span>Waiting / Blocked</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="px-1 py-0.2 rounded-xs bg-emerald-600 text-white text-[9px] font-mono font-bold">
              DONE
            </span>
            <span>Completion Milestone</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2.5 border-l-2 border-red-500" />
            <span className="font-mono text-[11px]">Clock Cursor</span>
          </span>
        </div>
      </div>

      {/* Pre-Run Empty State */}
      {!hasHistory ? (
        <div className="py-10 px-4 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/60 my-1">
          <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-xs font-semibold text-slate-800">
            Run the scheduler to generate the execution timeline.
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Execution history, machine allocations, and wait intervals will render here as discrete simulation events occur.
          </p>
        </div>
      ) : (
        /* Timeline Container with actual records */
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[700px]">
            {/* Time Axis Header */}
            <div className="flex items-center pb-2 mb-2 border-b border-slate-200 text-xs font-mono text-slate-500">
              <div className="w-48 sm:w-56 flex-shrink-0 font-sans font-semibold text-slate-700">
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
                      <span className="text-[10px] text-slate-500 font-mono">{tickTime}s</span>
                      <div className="h-1.5 w-[1px] bg-slate-300 mt-0.5" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Job Rows */}
            <div className="space-y-2">
              {jobRows.map(({ job, records, metrics: jm }) => {
                const isCompleted = job.state === ProcessState.COMPLETED;
                const isRunning = job.state === ProcessState.RUNNING;
                const isWaiting = job.state === ProcessState.WAITING;

                return (
                  <div key={job.id} className="flex items-center group py-0.5">
                    {/* Left Column: Job Info with High Contrast */}
                    <div className="w-48 sm:w-56 flex-shrink-0 pr-3">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                          {job.id}
                        </span>
                        <span
                          className="text-xs font-semibold text-slate-800 truncate flex-1"
                          title={job.name}
                        >
                          {job.name}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-1 py-0.2 rounded border font-semibold ${
                            isRunning
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : isWaiting
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : isCompleted
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {job.state === ProcessState.COMPLETED ? 'DONE' : job.state}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 mt-0.5">
                        <span title="Waiting Time">
                          WT: <strong className="text-slate-800">{jm.waitingTime ?? job.waitingTime ?? 0}s</strong>
                        </span>
                        <span className="text-slate-300">·</span>
                        <span title="Turnaround Time">
                          TAT: <strong className="text-slate-800">
                            {isCompleted && (jm.turnaroundTime != null || job.turnaroundTime != null)
                              ? `${jm.turnaroundTime ?? job.turnaroundTime}s`
                              : '—'}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Right Column: Timeline Track */}
                    <div className="flex-1 h-7 bg-slate-50 rounded-md relative overflow-hidden border border-slate-200">
                      {/* Vertical Grid Markers */}
                      {Array.from({ length: Math.ceil(maxTime / 5) }).map((_, i) => (
                        <div
                          key={i}
                          className="absolute top-0 bottom-0 border-r border-slate-200/80 pointer-events-none"
                          style={{ left: `${((i * 5) / maxTime) * 100}%` }}
                        />
                      ))}

                      {/* Slices from real simulation engine history */}
                      {records.map((slice, sIdx) => {
                        const left = (slice.start / maxTime) * 100;
                        const width = Math.max(0.6, ((slice.end - slice.start) / maxTime) * 100);
                        const isSliceRunning = slice.state === ProcessState.RUNNING;

                        return (
                          <div
                            key={sIdx}
                            onMouseEnter={() => setHoveredSlice({ job, slice })}
                            onMouseLeave={() => setHoveredSlice(null)}
                            className={`absolute top-0.5 bottom-0.5 rounded-xs cursor-pointer transition-opacity flex items-center justify-center overflow-hidden text-[9px] font-mono font-bold ${
                              isSliceRunning
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-amber-400 text-amber-950 hover:bg-amber-500'
                            }`}
                            style={{
                              left: `${left}%`,
                              width: `${width}%`,
                            }}
                            title={`${job.id}: ${slice.state} [${slice.start}s-${slice.end}s] ${slice.machineId ? `(${slice.machineId})` : ''}`}
                          >
                            {width > 6 && (
                              <span className="truncate px-0.5 select-none">
                                {isSliceRunning ? slice.machineId || 'RUN' : 'WAIT'}
                              </span>
                            )}
                          </div>
                        );
                      })}

                      {/* Clear Terminal Completion Milestone Marker at completionTime */}
                      {isCompleted && job.completionTime != null && (
                        <div
                          className="absolute top-0 bottom-0 -translate-x-1/2 z-10 flex items-center justify-center cursor-pointer pointer-events-auto"
                          style={{ left: `${(job.completionTime / maxTime) * 100}%` }}
                          title={`${job.id} completed at ${job.completionTime}s. Turnaround: ${jm.turnaroundTime ?? job.turnaroundTime}s, Waiting: ${jm.waitingTime ?? job.waitingTime ?? 0}s`}
                          onMouseEnter={() =>
                            setHoveredSlice({
                              job,
                              slice: {
                                state: 'COMPLETED',
                                start: job.completionTime,
                                end: job.completionTime,
                                machineId: null,
                                isMilestone: true,
                              },
                            })
                          }
                          onMouseLeave={() => setHoveredSlice(null)}
                        >
                          <div className="h-5 px-1.5 rounded-xs bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-mono font-bold flex items-center gap-0.5 border border-emerald-700 shadow-xs select-none">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>DONE {job.completionTime}s</span>
                          </div>
                        </div>
                      )}

                      {/* Red Current Simulation Time Cursor */}
                      <div
                        className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-10 pointer-events-none"
                        style={{ left: `${(currentTime / maxTime) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Hover Tooltip */}
      {hoveredSlice && (
        <div className="mt-3 p-2.5 rounded-lg bg-slate-900 text-white border border-slate-700 text-xs flex flex-wrap items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <span className="font-bold text-slate-100">
              {hoveredSlice.job.id} ({hoveredSlice.job.name}):
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                hoveredSlice.slice.state === ProcessState.RUNNING
                  ? 'bg-blue-500 text-white'
                  : hoveredSlice.slice.state === ProcessState.COMPLETED
                  ? 'bg-emerald-500 text-white'
                  : 'bg-amber-400 text-amber-950'
              }`}
            >
              {hoveredSlice.slice.state}
            </span>
            {hoveredSlice.slice.machineId && (
              <span className="text-slate-300 font-mono text-[11px]">
                Workcell: <strong className="text-white">{hoveredSlice.slice.machineId}</strong>
              </span>
            )}
          </div>
          <div className="font-mono text-slate-300 text-xs">
            {hoveredSlice.slice.isMilestone ? (
              <span>
                Completed at <strong>{hoveredSlice.slice.start}s</strong> · TAT: <strong>{hoveredSlice.job.turnaroundTime ?? metrics?.jobMetrics?.[hoveredSlice.job.id]?.turnaroundTime}s</strong> · WT: <strong>{hoveredSlice.job.waitingTime ?? metrics?.jobMetrics?.[hoveredSlice.job.id]?.waitingTime ?? 0}s</strong>
              </span>
            ) : (
              <span>
                Interval: [{hoveredSlice.slice.start}s → {hoveredSlice.slice.end}s]
                <span className="text-slate-400 ml-1.5">
                  (Duration: {hoveredSlice.slice.end - hoveredSlice.slice.start}s)
                </span>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
