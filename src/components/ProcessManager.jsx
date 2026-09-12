import React from 'react';
import { ProcessState } from '../simulation/types.js';
import { Layers, Play, Clock, CheckCircle, AlertTriangle, ArrowRight, HelpCircle } from 'lucide-react';

export default function ProcessManager({ jobs, onInspectJob, onWhyWaiting }) {
  const jobList = Object.values(jobs);

  const readyJobs = jobList.filter((j) => j.state === ProcessState.READY);
  const runningJobs = jobList.filter((j) => j.state === ProcessState.RUNNING);
  const waitingJobs = jobList.filter((j) => j.state === ProcessState.WAITING);
  const completedJobs = jobList.filter(
    (j) => j.state === ProcessState.COMPLETED || j.state === ProcessState.TERMINATED
  );

  return (
    <div className="control-card p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            PROCESS QUEUES & JOB SCHEDULING (PCB)
          </h2>
        </div>
        <div className="text-[11px] text-slate-400 font-mono">
          Total Workpieces: {jobList.length} | Active: {runningJobs.length} | Waiting: {waitingJobs.length}
        </div>
      </div>

      {/* 4 Process Queue Columns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* READY QUEUE */}
        <div className="bg-slate-950/70 rounded-xl border border-blue-500/30 p-3">
          <div className="flex items-center justify-between mb-3 pb-1.5 border-b border-slate-800">
            <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              READY QUEUE
            </span>
            <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
              {readyJobs.length}
            </span>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {readyJobs.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 font-mono">
                Ready queue empty
              </div>
            ) : (
              readyJobs.map((job) => (
                <JobCard key={job.id} job={job} onInspectJob={onInspectJob} />
              ))
            )}
          </div>
        </div>

        {/* RUNNING */}
        <div className="bg-slate-950/70 rounded-xl border border-cyan-500/30 p-3">
          <div className="flex items-center justify-between mb-3 pb-1.5 border-b border-slate-800">
            <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              RUNNING (MACHINES)
            </span>
            <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
              {runningJobs.length}
            </span>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {runningJobs.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 font-mono">
                No active jobs executing
              </div>
            ) : (
              runningJobs.map((job) => (
                <JobCard key={job.id} job={job} onInspectJob={onInspectJob} />
              ))
            )}
          </div>
        </div>

        {/* WAITING / BLOCKED */}
        <div className="bg-slate-950/70 rounded-xl border border-amber-500/30 p-3">
          <div className="flex items-center justify-between mb-3 pb-1.5 border-b border-slate-800">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              WAITING / BLOCKED
            </span>
            <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
              {waitingJobs.length}
            </span>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {waitingJobs.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 font-mono">
                No blocked processes
              </div>
            ) : (
              waitingJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onInspectJob={onInspectJob}
                  onWhyWaiting={onWhyWaiting}
                />
              ))
            )}
          </div>
        </div>

        {/* COMPLETED / TERMINATED */}
        <div className="bg-slate-950/70 rounded-xl border border-emerald-500/30 p-3">
          <div className="flex items-center justify-between mb-3 pb-1.5 border-b border-slate-800">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              COMPLETED / EXIT
            </span>
            <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
              {completedJobs.length}
            </span>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {completedJobs.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 font-mono">
                No completed orders yet
              </div>
            ) : (
              completedJobs.map((job) => (
                <JobCard key={job.id} job={job} onInspectJob={onInspectJob} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function JobCard({ job, onInspectJob, onWhyWaiting }) {
  const currentStage = job.stages[job.currentStageIndex];
  const isTerminated = job.state === ProcessState.TERMINATED;

  return (
    <div
      onClick={() => onInspectJob && onInspectJob(job.id)}
      className="p-2.5 rounded-lg bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 cursor-pointer transition"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-cyan-400">
            {job.id}
          </span>
          <span className="text-[10px] text-slate-300 font-medium truncate max-w-[90px]">
            {job.name}
          </span>
        </div>

        <span
          className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
            job.priority === 1
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : job.priority === 2
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          P{job.priority}
        </span>
      </div>

      {/* Stage Dots */}
      <div className="flex items-center gap-1 my-1.5">
        {job.stages.map((stage, idx) => {
          const isDone = idx < job.currentStageIndex || job.state === ProcessState.COMPLETED;
          const isCurrent = idx === job.currentStageIndex && job.state !== ProcessState.COMPLETED;

          return (
            <div
              key={idx}
              className={`h-1 flex-1 rounded-full ${
                isDone
                  ? 'bg-emerald-400'
                  : isCurrent
                  ? 'bg-cyan-400 animate-pulse'
                  : 'bg-slate-800'
              }`}
              title={`Stage ${idx + 1}: ${stage.stageName} (${stage.resourceType}, ${stage.burst}s)`}
            />
          );
        })}
      </div>

      {/* Current Operation Info */}
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span className="truncate max-w-[120px]">
          {job.state === ProcessState.COMPLETED
            ? 'Finished All Stages'
            : isTerminated
            ? 'Terminated (Victim)'
            : `${currentStage?.resourceType}: ${job.currentStageBurstRemaining}s left`}
        </span>

        {job.assignedInstanceId && (
          <span className="text-cyan-300 font-bold">
            {job.assignedInstanceId}
          </span>
        )}

        {job.waitingForResourceType && (
          <span className="text-amber-400 font-bold flex items-center gap-1">
            Waiting: {job.waitingForResourceType}
            {onWhyWaiting && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onWhyWaiting(job);
                }}
                className="hover:text-amber-200"
                title="Why is this job waiting?"
              >
                <HelpCircle className="w-3 h-3 text-amber-400" />
              </button>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
