import React, { useState } from 'react';
import { ShieldCheck, Play, RotateCcw, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import { ResourceType } from '../simulation/types.js';

export default function BankersPanel({ banker, jobs, resourceTypes }) {
  const resourceTypesList = Object.values(ResourceType);
  const matrices = banker.buildMatrices(jobs, resourceTypes);
  const safetyResult = banker.runSafetyAlgorithm(matrices);

  // Custom Request Sandbox
  const [testJobId, setTestJobId] = useState(matrices.jobIds[0] || 'J101');
  const [testRequest, setTestRequest] = useState({
    [ResourceType.CNC]: 0,
    [ResourceType.WELDING]: 0,
    [ResourceType.ASSEMBLY]: 0,
    [ResourceType.PAINTING]: 0,
    [ResourceType.PACKAGING]: 0,
  });
  const [testResult, setTestResult] = useState(null);

  const handleRunTest = () => {
    const res = banker.evaluateRequest(testJobId, testRequest, matrices);
    setTestResult(res);
  };

  return (
    <div className="space-y-4">
      {/* Overview Banner */}
      <div className="control-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              BANKER'S ALGORITHM — DEADLOCK AVOIDANCE
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Guarantees system remains in a SAFE STATE before granting resource requests (Need ≤ Work test).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`px-3 py-1.5 rounded-xl font-bold font-mono text-xs border flex items-center gap-2 ${
              safetyResult.isSafe
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}
          >
            {safetyResult.isSafe ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>CURRENT STATE: SAFE</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span>CURRENT STATE: UNSAFE</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Available Vector & Matrices */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Available Vector Card */}
        <div className="control-card p-4">
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">
            AVAILABLE VECTOR (V)
          </div>
          <div className="grid grid-cols-5 gap-2 text-center">
            {resourceTypesList.map((rt) => (
              <div key={rt} className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 font-mono">{rt.substring(0, 3)}</div>
                <div className="text-sm font-bold font-mono text-cyan-300">
                  {matrices.available[rt] ?? 0}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[10px] text-slate-500">
            Instances currently free in the resource pool
          </div>
        </div>

        {/* Safe Sequence Card */}
        <div className="control-card p-4 lg:col-span-3">
          <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
            CALCULATED SAFE SEQUENCE
          </div>
          {safetyResult.isSafe ? (
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs font-bold text-slate-200">
              {safetyResult.safeSequence.map((id, idx) => (
                <React.Fragment key={id}>
                  <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {id}
                  </span>
                  {idx < safetyResult.safeSequence.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  )}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="text-xs font-mono text-rose-400">
              No safe execution sequence exists. System at risk of circular wait!
            </div>
          )}
          <div className="mt-2 text-[10px] text-slate-500">
            Order in which processes can safely complete without risking deadlock
          </div>
        </div>
      </div>

      {/* 3 Matrix Tables: Allocation, Max, Need */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Allocation Matrix */}
        <div className="control-card p-4">
          <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3">
            ALLOCATION MATRIX (A)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 text-[10px]">
                  <th className="pb-1 text-left">JOB</th>
                  {resourceTypesList.map((rt) => (
                    <th key={rt} className="pb-1 text-center">{rt.substring(0, 3)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {matrices.jobIds.map((id) => (
                  <tr key={id} className="hover:bg-slate-900/40">
                    <td className="py-1 font-bold text-slate-300">{id}</td>
                    {resourceTypesList.map((rt) => (
                      <td key={rt} className="py-1 text-center text-blue-300">
                        {matrices.allocation[id]?.[rt] || 0}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Max Matrix */}
        <div className="control-card p-4">
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
            MAX CLAIM MATRIX (M)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 text-[10px]">
                  <th className="pb-1 text-left">JOB</th>
                  {resourceTypesList.map((rt) => (
                    <th key={rt} className="pb-1 text-center">{rt.substring(0, 3)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {matrices.jobIds.map((id) => (
                  <tr key={id} className="hover:bg-slate-900/40">
                    <td className="py-1 font-bold text-slate-300">{id}</td>
                    {resourceTypesList.map((rt) => (
                      <td key={rt} className="py-1 text-center text-amber-300">
                        {matrices.max[id]?.[rt] || 0}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Need Matrix (Need = Max - Allocation) */}
        <div className="control-card p-4">
          <div className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3">
            NEED MATRIX (N = M − A)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 text-[10px]">
                  <th className="pb-1 text-left">JOB</th>
                  {resourceTypesList.map((rt) => (
                    <th key={rt} className="pb-1 text-center">{rt.substring(0, 3)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {matrices.jobIds.map((id) => (
                  <tr key={id} className="hover:bg-slate-900/40">
                    <td className="py-1 font-bold text-slate-300">{id}</td>
                    {resourceTypesList.map((rt) => (
                      <td key={rt} className="py-1 text-center text-purple-300 font-bold">
                        {matrices.need[id]?.[rt] || 0}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Step-by-Step Safety Trace & Request Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Trace */}
        <div className="control-card p-4">
          <div className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
            SAFETY ALGORITHM STEP-BY-STEP AUDIT
          </div>
          <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
            {safetyResult.trace.map((t, idx) => (
              <div
                key={idx}
                className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono"
              >
                <div className="flex items-center justify-between text-slate-400 text-[10px] mb-0.5">
                  <span className="font-bold text-cyan-400">Step {t.step}: {t.action}</span>
                  {t.jobId && <span className="text-slate-300">Process: {t.jobId}</span>}
                </div>
                <div className="text-slate-300 text-[11px] leading-snug">
                  {t.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Request Sandbox */}
        <div className="control-card p-4">
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
            INTERACTIVE RESOURCE REQUEST SANDBOX
          </div>
          <p className="text-[11px] text-slate-400 mb-3">
            Test arbitrary resource requests against Banker's safety check without affecting the live run.
          </p>

          <div className="flex flex-wrap items-center gap-3 mb-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-300 font-bold">Process:</label>
              <select
                value={testJobId}
                onChange={(e) => setTestJobId(e.target.value)}
                className="bg-slate-950 text-cyan-300 text-xs font-mono font-bold px-2.5 py-1.5 rounded-lg border border-slate-700"
              >
                {matrices.jobIds.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {resourceTypesList.map((rt) => (
                <div key={rt} className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono">{rt.substring(0, 3)}:</span>
                  <input
                    type="number"
                    min="0"
                    max="2"
                    value={testRequest[rt]}
                    onChange={(e) =>
                      setTestRequest({
                        ...testRequest,
                        [rt]: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-8 bg-slate-900 text-cyan-400 text-xs font-mono font-bold text-center rounded border border-slate-700"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={handleRunTest}
              className="btn-industrial btn-cyan text-xs py-1.5 px-3"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Evaluate Safety</span>
            </button>
          </div>

          {/* Test Evaluation Result */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs font-mono ${
                testResult.granted
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5 mb-1">
                {testResult.granted ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>REQUEST CAN BE SAFELY GRANTED</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>REQUEST DENIED ({testResult.errorType})</span>
                  </>
                )}
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                {testResult.reason}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
