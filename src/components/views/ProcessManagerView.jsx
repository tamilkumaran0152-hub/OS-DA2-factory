import React, { useState } from 'react';
import {
  Play,
  Clock,
  CheckCircle2,
  HelpCircle,
  Table as TableIcon,
  Kanban,
} from 'lucide-react';
import { ProcessState } from '../../simulation/types.js';

export default function ProcessManagerView({
  jobs,
  onInspectJob,
  onWhyWaiting,
}) {
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'kanban'
  const [filterState, setFilterState] = useState('ALL');
  const [selectedJobId, setSelectedJobId] = useState(null);

  const jobList = Object.values(jobs || {});

  const readyJobs = jobList.filter((j) => j.state === ProcessState.READY);
  const runningJobs = jobList.filter((j) => j.state === ProcessState.RUNNING);
  const waitingJobs = jobList.filter((j) => j.state === ProcessState.WAITING);
  const completedJobs = jobList.filter((j) => j.state === ProcessState.COMPLETED);
  const terminatedJobs = jobList.filter((j) => j.state === ProcessState.TERMINATED);

  const filteredJobs = jobList.filter((j) => {
    if (filterState === 'ALL') return true;
    return j.state === filterState;
  });

  const selectedJob = selectedJobId ? jobs[selectedJobId] : null;

  return (
    <div className="space-y-5">
      {/* 1. Top Summary Counters (Section 10) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Ready */}
        <div
          onClick={() => setFilterState(filterState === ProcessState.READY ? 'ALL' : ProcessState.READY)}
          className={`p-4 rounded-xl border cursor-pointer transition ${
            filterState === ProcessState.READY
              ? 'bg-blue-950/40 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
              : 'bg-[#0e1422] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-blue-400">
            <span>READY QUEUE</span>
            <span className="w-2 h-2 rounded-full bg-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-2">
            {readyJobs.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Dispatched on CPU availability</div>
        </div>

        {/* Running */}
        <div
          onClick={() => setFilterState(filterState === ProcessState.RUNNING ? 'ALL' : ProcessState.RUNNING)}
          className={`p-4 rounded-xl border cursor-pointer transition ${
            filterState === ProcessState.RUNNING
              ? 'bg-cyan-950/40 border-cyan-500 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
              : 'bg-[#0e1422] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-cyan-400">
            <span>RUNNING</span>
            <Play className="w-3.5 h-3.5 fill-current text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-2">
            {runningJobs.length}
          </div>
          <div className="text-[11px] text-cyan-500/80 mt-0.5">Holding physical machine cells</div>
        </div>

        {/* Waiting */}
        <div
          onClick={() => setFilterState(filterState === ProcessState.WAITING ? 'ALL' : ProcessState.WAITING)}
          className={`p-4 rounded-xl border cursor-pointer transition ${
            filterState === ProcessState.WAITING
              ? 'bg-amber-950/40 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
              : 'bg-[#0e1422] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-amber-400">
            <span>WAITING / BLOCKED</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-2">
            {waitingJobs.length}
          </div>
          <div className="text-[11px] text-amber-500/80 mt-0.5">Blocked on semaphores (S=0)</div>
        </div>

        {/* Completed */}
        <div
          onClick={() => setFilterState(filterState === ProcessState.COMPLETED ? 'ALL' : ProcessState.COMPLETED)}
          className={`p-4 rounded-xl border cursor-pointer transition ${
            filterState === ProcessState.COMPLETED
              ? 'bg-emerald-950/40 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
              : 'bg-[#0e1422] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
            <span>COMPLETED</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">
            {completedJobs.length}
          </div>
          <div className="text-[11px] text-emerald-500/80 mt-0.5">All 4 production stages fulfilled</div>
        </div>
      </div>

      {/* 2. Controls & View Mode Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0e1422] p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">FILTER:</span>
          <div className="flex items-center gap-1">
            {['ALL', ProcessState.READY, ProcessState.RUNNING, ProcessState.WAITING, ProcessState.COMPLETED].map((st) => (
              <button
                key={st}
                onClick={() => setFilterState(st)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition ${
                  filterState === st
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition ${
              viewMode === 'table'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Process Table</span>
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition ${
              viewMode === 'kanban'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Queue Columns</span>
          </button>
        </div>
      </div>

      {/* 3. PROCESS TABLE (Section 10) */}
      {viewMode === 'table' ? (
        <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-4 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] font-mono uppercase">
                  <th className="pb-3 font-semibold">JOB</th>
                  <th className="pb-3 font-semibold">DESCRIPTION</th>
                  <th className="pb-3 font-semibold">STATE</th>
                  <th className="pb-3 font-semibold">CURRENT STAGE</th>
                  <th className="pb-3 font-semibold">BURST</th>
                  <th className="pb-3 font-semibold">PRIORITY</th>
                  <th className="pb-3 font-semibold">WAITING</th>
                  <th className="pb-3 text-right font-semibold">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredJobs.map((job) => {
                  const currentStage = job.stages[job.currentStageIndex];
                  const isRunning = job.state === ProcessState.RUNNING;
                  const isWaiting = job.state === ProcessState.WAITING;
                  const isCompleted = job.state === ProcessState.COMPLETED;
                  const isTerminated = job.state === ProcessState.TERMINATED;

                  return (
                    <tr
                      key={job.id}
                      onClick={() => setSelectedJobId(job.id)}
                      className={`hover:bg-slate-800/40 cursor-pointer transition ${
                        selectedJobId === job.id ? 'bg-slate-800/60' : ''
                      }`}
                    >
                      {/* JOB */}
                      <td className="py-3 font-mono font-bold text-cyan-300">
                        {job.id}
                      </td>

                      {/* DESCRIPTION */}
                      <td className="py-3 text-slate-200">
                        <div>{job.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Arr: {job.arrivalTime}s • Total Burst: {job.totalBurst}s
                        </div>
                      </td>

                      {/* STATE */}
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                            isRunning
                              ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                              : isWaiting
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : isCompleted
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : isTerminated
                              ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                              : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                          }`}
                        >
                          {job.state}
                        </span>
                      </td>

                      {/* CURRENT STAGE */}
                      <td className="py-3 font-mono text-[11px] text-slate-300">
                        {isCompleted ? (
                          <span className="text-emerald-400">Complete (Stage 4/4)</span>
                        ) : isTerminated ? (
                          <span className="text-rose-400">Terminated</span>
                        ) : (
                          <span>
                            Stage {job.currentStageIndex + 1}: {currentStage?.stageName}{' '}
                            <span className="text-slate-500">({currentStage?.resourceType})</span>
                          </span>
                        )}
                      </td>

                      {/* BURST */}
                      <td className="py-3 font-mono text-xs">
                        {isCompleted ? (
                          <span className="text-slate-500">0s</span>
                        ) : isRunning ? (
                          <span className="text-cyan-400 font-bold">
                            {job.currentStageBurstRemaining}s left
                          </span>
                        ) : (
                          <span className="text-slate-300">
                            {job.currentStageBurstRemaining}s
                          </span>
                        )}
                      </td>

                      {/* PRIORITY */}
                      <td className="py-3 font-mono text-xs">
                        <span
                          className={`px-1.5 py-0.2 rounded border font-bold ${
                            job.priority === 1
                              ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                              : job.priority === 2
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          P{job.priority}
                        </span>
                      </td>

                      {/* WAITING */}
                      <td className="py-3 font-mono text-xs">
                        {isWaiting ? (
                          <span className="text-amber-400 font-bold flex items-center gap-1">
                            <span>{job.waitingForResourceType}</span>
                            {onWhyWaiting && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onWhyWaiting(job);
                                }}
                                className="text-amber-300 hover:text-amber-100"
                                title="Inspect why waiting"
                              >
                                <HelpCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* ACTION */}
                      <td className="py-3 text-right space-x-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onInspectJob && onInspectJob(job.id);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-semibold transition"
                        >
                          Inspect PCB
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* KANBAN QUEUE VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'READY QUEUE', count: readyJobs.length, jobs: readyJobs, color: 'text-blue-400', badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
            { title: 'RUNNING ON CELLS', count: runningJobs.length, jobs: runningJobs, color: 'text-cyan-400', badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' },
            { title: 'WAITING (SEMAPHORE)', count: waitingJobs.length, jobs: waitingJobs, color: 'text-amber-400', badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
            { title: 'COMPLETED', count: completedJobs.length, jobs: completedJobs, color: 'text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
          ].map((col, idx) => (
            <div key={idx} className="bg-[#0e1422] rounded-xl border border-slate-800 p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                  <span className={`text-xs font-bold ${col.color}`}>{col.title}</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${col.badge}`}>
                    {col.count}
                  </span>
                </div>

                <div className="space-y-2">
                  {col.jobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => onInspectJob && onInspectJob(job.id)}
                      className="p-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 cursor-pointer transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-cyan-300">{job.id}</span>
                        <span className="text-[10px] font-mono text-slate-400">P{job.priority}</span>
                      </div>
                      <div className="text-xs text-slate-200 mt-1 truncate">{job.name}</div>
                      <div className="text-[10px] font-mono text-slate-400 mt-1">
                        Stage: {job.stages[job.currentStageIndex]?.resourceType || 'Done'}
                      </div>
                    </div>
                  ))}
                  {col.jobs.length === 0 && (
                    <div className="py-6 text-center text-xs text-slate-600">No workpieces</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. INLINE PCB INSPECTOR TABS (Section 10) */}
      {selectedJob && (
        <div className="bg-[#0e1422] border border-cyan-500/40 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-mono font-bold text-xs">
                PCB
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span>{selectedJob.id}: {selectedJob.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Priority P{selectedJob.priority}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Process Control Block Register Inspection</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedJobId(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">JOB ID</span>
              <span className="text-cyan-300 font-bold">{selectedJob.id}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">ARRIVAL TIME</span>
              <span className="text-slate-200 font-bold">{selectedJob.arrivalTime}s</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">CURRENT STATE</span>
              <span className="text-cyan-400 font-bold">{selectedJob.state}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">CURRENT STAGE</span>
              <span className="text-slate-200 font-bold">
                {selectedJob.stages[selectedJob.currentStageIndex]?.resourceType || 'Complete'}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">REMAINING BURST</span>
              <span className="text-amber-300 font-bold">{selectedJob.currentStageBurstRemaining}s</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">ASSIGNED CELL</span>
              <span className="text-emerald-400 font-bold">
                {selectedJob.assignedInstanceId || 'None'}
              </span>
            </div>
          </div>

          {/* Allocation & Claim Matrices for this Process */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-blue-400 block text-[10px] font-bold uppercase mb-1">
                CURRENT ALLOCATION VECTOR (A)
              </span>
              <div className="text-slate-300">
                {JSON.stringify(selectedJob.currentAllocations || {})}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-amber-400 block text-[10px] font-bold uppercase mb-1">
                MAXIMUM CLAIM VECTOR (M)
              </span>
              <div className="text-slate-300">
                {JSON.stringify(selectedJob.maxClaims || {})}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-purple-400 block text-[10px] font-bold uppercase mb-1">
                REMAINING NEED VECTOR (N = M − A)
              </span>
              <div className="text-slate-300">
                {JSON.stringify(
                  Object.fromEntries(
                    Object.entries(selectedJob.maxClaims || {}).map(([k, v]) => [
                      k,
                      Math.max(0, v - (selectedJob.currentAllocations?.[k] || 0)),
                    ])
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
