import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { ResourceType } from '../../simulation/types.js';

export default function BankersSafetyView({ banker, jobs, resourceTypes }) {
  const resourceTypesList = Object.values(ResourceType);
  const matrices = banker.buildMatrices(jobs, resourceTypes);
  const safetyResult = banker.runSafetyAlgorithm(matrices);

  // Custom Request Sandbox (Section 13)
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
    <div className="space-y-5">
      {/* 1. Overview Banner (Section 13) */}
      <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
              BANKER'S ALGORITHM — DEADLOCK AVOIDANCE
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Banker's Algorithm checks whether granting a resource request keeps the system in a SAFE STATE.
          </p>
        </div>

        {/* Global Safety Badge */}
        <div className="flex items-center gap-3">
          <div
            className={`px-3 py-1.5 rounded-lg font-bold font-mono text-xs border flex items-center gap-2 ${
              safetyResult.isSafe
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
            }`}
          >
            {safetyResult.isSafe ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>SYSTEM STATE: SAFE</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>SYSTEM STATE: UNSAFE</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Available Vector & Safe Sequence Banner (Section 13) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Available Vector */}
        <div className="lg:col-span-5 bg-[#0e1422] border border-slate-800/90 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2 font-mono">
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
          <div className="mt-2 text-[10px] text-slate-500 font-mono">
            Unallocated physical units available for immediate dispatch
          </div>
        </div>

        {/* Calculated Safe Sequence */}
        <div className="lg:col-span-7 bg-[#0e1422] border border-slate-800/90 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 font-mono">
              CALCULATED SAFE SEQUENCE
            </div>
            {safetyResult.isSafe ? (
              <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs font-bold text-slate-200">
                {safetyResult.safeSequence.map((id, idx) => (
                  <React.Fragment key={id}>
                    <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
                      {id}
                    </span>
                    {idx < safetyResult.safeSequence.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <div className="text-xs font-mono text-rose-400 font-bold">
                No safe execution sequence exists. System at risk of circular wait!
              </div>
            )}
          </div>
          <div className="mt-2 text-[10px] text-slate-500 font-mono">
            Order in which processes can complete without deadlock (Need ≤ Work)
          </div>
        </div>
      </div>

      {/* 3. Four Clean Matrix Cards/Tables: ALLOCATION, MAX, NEED, AVAILABLE (Section 13) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ALLOCATION MATRIX */}
        <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3 font-mono">
            ALLOCATION MATRIX (A)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 text-[10px]">
                  <th className="pb-1.5 text-left font-semibold">JOB</th>
                  {resourceTypesList.map((rt) => (
                    <th key={rt} className="pb-1.5 text-center font-semibold">{rt.substring(0, 3)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {matrices.jobIds.map((id) => (
                  <tr key={id} className="hover:bg-slate-900/40">
                    <td className="py-1.5 font-bold text-slate-300">{id}</td>
                    {resourceTypesList.map((rt) => (
                      <td key={rt} className="py-1.5 text-center text-blue-300">
                        {matrices.allocation[id]?.[rt] || 0}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* MAX CLAIM MATRIX */}
        <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 font-mono">
            MAX CLAIM MATRIX (M)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 text-[10px]">
                  <th className="pb-1.5 text-left font-semibold">JOB</th>
                  {resourceTypesList.map((rt) => (
                    <th key={rt} className="pb-1.5 text-center font-semibold">{rt.substring(0, 3)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {matrices.jobIds.map((id) => (
                  <tr key={id} className="hover:bg-slate-900/40">
                    <td className="py-1.5 font-bold text-slate-300">{id}</td>
                    {resourceTypesList.map((rt) => (
                      <td key={rt} className="py-1.5 text-center text-amber-300">
                        {matrices.max[id]?.[rt] || 0}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* NEED MATRIX */}
        <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3 font-mono">
            NEED MATRIX (N = M − A)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 text-[10px]">
                  <th className="pb-1.5 text-left font-semibold">JOB</th>
                  {resourceTypesList.map((rt) => (
                    <th key={rt} className="pb-1.5 text-center font-semibold">{rt.substring(0, 3)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {matrices.jobIds.map((id) => (
                  <tr key={id} className="hover:bg-slate-900/40">
                    <td className="py-1.5 font-bold text-slate-300">{id}</td>
                    {resourceTypesList.map((rt) => (
                      <td key={rt} className="py-1.5 text-center text-purple-300 font-bold">
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

      {/* 4. RESOURCE REQUEST TESTER & STEP TRACE (Section 13) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Step-by-Step Trace Left 6 Cols */}
        <div className="lg:col-span-6 bg-[#0e1422] border border-slate-800/90 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3 font-mono">
            SAFETY ALGORITHM STEP-BY-STEP TRACE
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {safetyResult.trace.map((t, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono"
              >
                <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                  <span className="font-bold text-cyan-400">Step {t.step}: {t.action}</span>
                  {t.jobId && <span className="text-slate-300">Workpiece: {t.jobId}</span>}
                </div>
                <div className="text-slate-300 text-[11px] leading-snug">
                  {t.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resource Request Tester Right 6 Cols */}
        <div className="lg:col-span-6 bg-[#0e1422] border border-slate-800/90 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1 font-mono">
              RESOURCE REQUEST TESTER
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Simulate dynamic claims against Banker's safety state (Need ≤ Work)
            </p>

            <div className="space-y-3">
              {/* Job Selector */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-300 font-bold font-mono">Process:</label>
                <select
                  value={testJobId}
                  onChange={(e) => setTestJobId(e.target.value)}
                  className="bg-slate-950 text-cyan-300 text-xs font-mono font-bold px-3 py-1.5 rounded-lg border border-slate-700"
                >
                  {matrices.jobIds.map((id) => (
                    <option key={id} value={id}>
                      {id} ({jobs[id]?.name || 'Workpiece'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Resource Vector Inputs */}
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">
                  Requested Vector (Units):
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {resourceTypesList.map((rt) => (
                    <div key={rt} className="text-center">
                      <span className="text-[10px] font-mono text-slate-500 block">
                        {rt.substring(0, 3)}
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="5"
                        value={testRequest[rt] || 0}
                        onChange={(e) =>
                          setTestRequest({
                            ...testRequest,
                            [rt]: Math.max(0, parseInt(e.target.value) || 0),
                          })
                        }
                        className="w-full bg-slate-950 text-amber-300 text-xs font-mono font-bold text-center rounded border border-slate-700 py-1"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleRunTest}
                className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs font-mono transition flex items-center justify-center gap-2 shadow-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>CHECK SAFETY</span>
              </button>

              {/* Test Result Display */}
              {testResult && (
                <div
                  className={`p-3 rounded-lg border text-xs font-mono space-y-1 ${
                    testResult.granted
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>RESULT: {testResult.granted ? 'SAFE — REQUEST GRANTED' : 'UNSAFE — REQUEST DENIED'}</span>
                  </div>
                  <div className="text-[11px] text-slate-300 leading-snug">
                    {testResult.reason}
                  </div>
                  {testResult.safeSequence && (
                    <div className="text-[10px] text-emerald-400 font-bold pt-1">
                      Sequence: {testResult.safeSequence.join(' → ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
