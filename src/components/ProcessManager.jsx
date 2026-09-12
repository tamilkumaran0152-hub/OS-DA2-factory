import React from 'react';
import { ProcessState } from '../simulation/types.js';
import { Layers, Play, Clock, CheckCircle2, AlertTriangle, HelpCircle, XCircle } from 'lucide-react';

export default function ProcessManager({ jobs, onInspectJob, onWhyWaiting }) {
  const jobList = Object.values(jobs);

  const readyJobs = jobList.filter((j) => j.state === ProcessState.READY);
  const runningJobs = jobList.filter((j) => j.state === ProcessState.RUNNING);
  const waitingJobs = jobList.filter((j) => j.state === ProcessState.WAITING);
  const completedJobs = jobList.filter((j) => j.state === ProcessState.COMPLETED);
  const terminatedJobs = jobList.filter((j) => j.state === ProcessState.TERMINATED);

  const columns = [
    {
      title: 'READY QUEUE',
      count: readyJobs.length,
      jobs: readyJobs,
      color: 'text-blue-400',
      badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
      dotColor: 'bg-blue-400',
    },
    {
      title: 'RUNNING ON MACHINE',
      count: runningJobs.length,
      jobs: runningJobs,
      color: 'text-cyan-400',
      badgeColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      dotColor: 'bg-cyan-400',
    },
    {
      title: 'WAITING / BLOCKED',
      count: waitingJobs.length,
      jobs: waitingJobs,
      color: 'text-amber-400',
      badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      dotColor: 'bg-amber-400',
    },
    {
      title: 'COMPLETED & TERMINATED',
      count: completedJobs.length + terminatedJobs.length,
      jobs: [...completedJobs, ...terminatedJobs],
      color: 'text-emerald-400',
      badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      dotColor: 'bg-emerald-400',
    },
  ];

  return (
    <div className="panel-industrial p-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
            PROCESS CONTROL QUEUES (PCB SCHEDULING)
          </h2>
          <p className="text-xs text-slate-400">
            Lifecycle state machine: CREATED → READY → RUNNING → WAITING → COMPLETED
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Total: <strong className="text-slate-200">{jobList.length}</strong> | Ready:{' '}
          <strong className="text-blue-400">{readyJobs.length}</strong> | Running:{' '}
          <strong className="text-cyan-400">{runningJobs.length}</strong> | Blocked:{' '}
          <strong className="text-amber-400">{waitingJobs.length}</strong>
        </div>
      </div>

      {/* 4 Process Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {columns.map((col, idx) => (
          <div
            key={idx}
            className="bg-[#0e1422] rounded-xl border border-slate-800/90 p-3 flex flex-col justify-between"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <span className={`text-xs font-bold flex items-center gap-1.5 ${col.color}`}>
                <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                {col.title}
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${col.badgeColor}`}>
                {col.count}
              </span>
            </div>

            {/* Process Cards List */}
            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {col.jobs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 font-medium">
                  Queue empty
                </div>
              ) : (
                col.jobs.map((job) => (
                  <ProcessCard
                    key={job.id}
                    job={job}
                    onInspectJob={onInspectJob}
                    onWhyWaiting={onWhyWaiting}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProcessCard({ job, onInspectJob, onWhyWaiting }) {
  const currentStage = job.stages[job.currentStageIndex];
  const isRunning = job.state === ProcessState.RUNNING;
  const isWaiting = job.state === ProcessState.WAITING;
  const isCompleted = job.state === ProcessState.COMPLETED;
  const isTerminated = job.state === ProcessState.TERMINATED;

  // Calculate progress percentage of current stage
  const currentStageProgress =
    isRunning && job.currentStageBurstTotal > 0
      ? Math.round(
          ((job.currentStageBurstTotal - job.currentStageBurstRemaining) /
            job.currentStageBurstTotal) *
            100
        )
      : isCompleted
      ? 100
      : 0;

  return (
    <div
      onClick={() => onInspectJob && onInspectJob(job.id)}
      className="p-3 rounded-lg bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition shadow-sm space-y-2"
    >
      {/* Top: Job ID, Name, Priority */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-cyan-300">
            {job.id}
          </span>
          <span className="text-xs font-medium text-slate-200 truncate max-w-[110px]">
            {job.name}
          </span>
        </div>

        <span
          className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
            job.priority === 1
              ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
              : job.priority === 2
              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}
        >
          P{job.priority}
        </span>
      </div>

      {/* Stage Dots Pipeline */}
      <div className="flex items-center gap-1 py-0.5">
        {job.stages.map((st, i) => {
          const isDone = i < job.currentStageIndex || isCompleted;
          const isCurrent = i === job.currentStageIndex && !isCompleted && !isTerminated;

          return (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                isDone
                  ? 'bg-emerald-400'
                  : isCurrent
                  ? 'bg-cyan-400'
                  : 'bg-slate-800'
              }`}
              title={`Stage 0${i + 1}: ${st.stageName} (${st.resourceType})`}
            />
          );
        })}
      </div>

      {/* Operation & Progress Info */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span>
          {isCompleted
            ? 'Completed'
            : isTerminated
            ? 'Aborted'
            : `${currentStage?.resourceType}: ${job.currentStageBurstRemaining}s left`}
        </span>

        {isRunning && (
          <span className="text-cyan-400 font-bold">
            {currentStageProgress}%
          </span>
        )}

        {isWaiting && (
          <div className="flex items-center gap-1">
            <span className="text-amber-400 font-bold">
              {job.waitingForResourceType}
            </span>
            {onWhyWaiting && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onWhyWaiting(job);
                }}
                className="text-amber-400 hover:text-amber-200"
                title="Inspect why this process is waiting"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Assigned machine pill if running */}
      {job.assignedInstanceId && (
        <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between pt-1 border-t border-slate-800/80">
          <span>Assigned Cell:</span>
          <span className="text-cyan-300 font-bold">{job.assignedInstanceId}</span>
        </div>
      )}
    </div>
  );
}
