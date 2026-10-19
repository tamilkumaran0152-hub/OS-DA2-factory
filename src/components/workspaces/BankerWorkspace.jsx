import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Send,
} from 'lucide-react';
import { ResourceType } from '../../simulation/types.js';

export default function BankerWorkspace({
  banker,
  snapshot,
  onBankerModeChange,
}) {
  const resourceTypesList = Object.values(ResourceType);
  const matrices = banker.buildMatrices(snapshot?.jobs || {}, snapshot?.resourceTypes || {});
  const safetyResult = banker.runSafetyAlgorithm(matrices);

  // Custom Request Sandbox State
  const [selectedJobId, setSelectedJobId] = useState(matrices.jobIds[0] || 'J101');
  const [requestedVector, setRequestedVector] = useState({
    [ResourceType.CNC]: 0,
    [ResourceType.WELDING]: 0,
    [ResourceType.ASSEMBLY]: 0,
    [ResourceType.PAINTING]: 0,
    [ResourceType.PACKAGING]: 0,
  });
  const [testResult, setTestResult] = useState(null);

  const handleVectorChange = (rType, val) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setRequestedVector((prev) => ({
      ...prev,
      [rType]: num,
    }));
  };

  const handleEvaluateRequest = (e) => {
    e?.preventDefault();
    const res = banker.evaluateRequest(selectedJobId, requestedVector, matrices);
    setTestResult(res);
  };

  const handleResetRequest = () => {
    setRequestedVector({
      [ResourceType.CNC]: 0,
      [ResourceType.WELDING]: 0,
      [ResourceType.ASSEMBLY]: 0,
      [ResourceType.PAINTING]: 0,
      [ResourceType.PACKAGING]: 0,
    });
    setTestResult(null);
  };

  const isGranted = testResult ? Boolean(testResult.granted ?? testResult.canGrant) : null;
  const resultSafeSequence = testResult?.safeSequence || testResult?.safetyResult?.safeSequence;

  return (
    <div className="space-y-4">
      {/* 1. CONFIGURATION & CUSTOM REQUEST SANDBOX */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-purple-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Banker's Deadlock Avoidance & Resource Request
            </h2>
          </div>

          {/* Avoidance Mode Toggle */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-mono">Avoidance:</span>
            <button
              onClick={() => onBankerModeChange(!snapshot?.bankerMode)}
              className={`px-2.5 py-1 rounded-lg font-bold font-mono text-xs transition border ${
                snapshot?.bankerMode
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
            >
              {snapshot?.bankerMode ? 'Enforced (Active)' : 'Monitor Only (Off)'}
            </button>
          </div>
        </div>

        {/* Sandbox Form */}
        <form onSubmit={handleEvaluateRequest} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-end">
            {/* Target Job */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Process
              </label>
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                {matrices.jobIds.map((jid) => (
                  <option key={jid} value={jid}>
                    {jid} ({snapshot?.jobs?.[jid]?.name?.slice(0, 14) || 'Job'})
                  </option>
                ))}
              </select>
            </div>

            {/* 5 Resource Quantity Inputs */}
            {resourceTypesList.map((rType) => {
              const avail = matrices.available[rType] || 0;
              const need = matrices.need[selectedJobId]?.[rType] || 0;

              return (
                <div key={rType} className="sm:col-span-1">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-semibold text-slate-700">{rType}</span>
                    <span className="text-slate-400 font-mono text-[10px]">Avail: {avail}</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={avail + 2}
                    value={requestedVector[rType]}
                    onChange={(e) => handleVectorChange(rType, e.target.value)}
                    className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-purple-500"
                  />
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">Need: {need}</div>
                </div>
              );
            })}
          </div>

          {/* Primary Action Button & Reset */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Evaluate Resource Request</span>
            </button>
            <button
              type="button"
              onClick={handleResetRequest}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </form>

        {/* Request Evaluation Result */}
        {testResult && (
          <div
            className={`mt-3 p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
              isGranted
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {isGranted ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="font-bold">
                {isGranted ? 'REQUEST SAFE — GRANTED' : 'REQUEST UNSAFE — DENIED'}
              </div>
              <p className="leading-relaxed">{testResult.reason}</p>
              {resultSafeSequence && resultSafeSequence.length > 0 && (
                <div className="font-mono font-bold text-[11px] bg-white px-2 py-1 rounded border border-emerald-300 text-emerald-800">
                  Safe Sequence: &lt; {resultSafeSequence.join(' → ')} &gt;
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* 2. RESULTS: SAFETY STATE, AVAILABLE VECTOR & MATRICES */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Banker's Safety Results & Matrix Registry
          </h2>
          <span className="text-xs font-mono text-slate-500">
            {matrices.jobIds.length} Active Processes
          </span>
        </div>

        {/* Safety Result Banner */}
        <div
          className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
            safetyResult.isSafe
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : 'bg-rose-50 border-rose-200 text-rose-950'
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className={`w-4 h-4 ${safetyResult.isSafe ? 'text-emerald-600' : 'text-rose-600'}`} />
            <div>
              <span className="font-bold">
                {safetyResult.isSafe ? 'SYSTEM STATUS: SAFE' : 'SYSTEM STATUS: UNSAFE'}
              </span>
              <span className="ml-2 text-slate-600">
                {safetyResult.isSafe
                  ? 'All processes can finish without deadlock.'
                  : 'Deadlock risk detected; insufficient resources to guarantee completion.'}
              </span>
            </div>
          </div>

          {safetyResult.isSafe && safetyResult.safeSequence?.length > 0 && (
            <div className="font-mono font-bold bg-white px-2.5 py-1 rounded border border-emerald-300 text-emerald-800">
              Safe Sequence: &lt; {safetyResult.safeSequence.join(' → ')} &gt;
            </div>
          )}
        </div>

        {/* Available Resource Vector */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <span className="font-semibold text-slate-700 font-sans">Available Vector (Work):</span>
          <div className="flex items-center gap-2">
            {resourceTypesList.map((r) => (
              <span key={r} className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                <span className="text-slate-500">{r}:</span> <strong>{matrices.available[r] || 0}</strong>
              </span>
            ))}
          </div>
        </div>

        {/* 3 Core Matrices: Allocation, Max, Need */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Allocation Matrix */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Allocation Matrix</span>
              <span className="text-[10px] text-slate-400">Currently Held</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-left">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500">
                  <tr>
                    <th className="py-1.5 px-2.5">PID</th>
                    {resourceTypesList.map((r) => (
                      <th key={r} className="py-1.5 px-1.5 text-center">{r.slice(0, 3)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {matrices.jobIds.map((jid) => (
                    <tr key={jid} className="hover:bg-slate-50">
                      <td className="py-1.5 px-2.5 font-bold text-slate-800">{jid}</td>
                      {resourceTypesList.map((r) => (
                        <td key={r} className="py-1.5 px-1.5 text-center text-slate-600">
                          {matrices.allocation[jid]?.[r] || 0}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Max Matrix */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Max Matrix</span>
              <span className="text-[10px] text-slate-400">Declared Peak</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-left">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500">
                  <tr>
                    <th className="py-1.5 px-2.5">PID</th>
                    {resourceTypesList.map((r) => (
                      <th key={r} className="py-1.5 px-1.5 text-center">{r.slice(0, 3)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {matrices.jobIds.map((jid) => (
                    <tr key={jid} className="hover:bg-slate-50">
                      <td className="py-1.5 px-2.5 font-bold text-slate-800">{jid}</td>
                      {resourceTypesList.map((r) => (
                        <td key={r} className="py-1.5 px-1.5 text-center text-slate-600">
                          {matrices.max[jid]?.[r] || 0}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Need Matrix */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Need Matrix</span>
              <span className="text-[10px] text-slate-400">Max - Allocation</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-left">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500">
                  <tr>
                    <th className="py-1.5 px-2.5">PID</th>
                    {resourceTypesList.map((r) => (
                      <th key={r} className="py-1.5 px-1.5 text-center">{r.slice(0, 3)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {matrices.jobIds.map((jid) => (
                    <tr key={jid} className="hover:bg-slate-50">
                      <td className="py-1.5 px-2.5 font-bold text-slate-800">{jid}</td>
                      {resourceTypesList.map((r) => (
                        <td key={r} className="py-1.5 px-1.5 text-center font-bold text-purple-700">
                          {matrices.need[jid]?.[r] || 0}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Step-by-Step Safety Explanation */}
        <div className="pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Step-by-Step Safety Algorithm Explanation
          </h3>
          <div className="space-y-1.5">
            {safetyResult.trace?.map((step, idx) => (
              <div
                key={idx}
                className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono flex items-start gap-2"
              >
                <span className="font-bold text-slate-500 min-w-[50px]">
                  Step {step.step}:
                </span>
                <span className="text-slate-700 font-sans leading-snug">
                  {step.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
