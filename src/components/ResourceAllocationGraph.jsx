import React from 'react';
import { AlertOctagon, CheckCircle2, XCircle, ShieldAlert, Wrench, RefreshCw, Info } from 'lucide-react';

export default function ResourceAllocationGraph({
  deadlockInfo,
  onOpenRecoveryModal,
  jobs,
  resourceTypes,
}) {
  const { hasDeadlock, cycleNodes = [], cycleString, coffman, rag } = deadlockInfo;
  const nodes = rag?.nodes || [];
  const edges = rag?.edges || [];

  // Layout positions in SVG
  // Place Processes on the Left (x=160), Resources on the Right (x=480)
  const processNodes = nodes.filter((n) => n.type === 'PROCESS');
  const resourceNodes = nodes.filter((n) => n.type === 'RESOURCE');

  const svgWidth = 640;
  const svgHeight = Math.max(380, Math.max(processNodes.length, resourceNodes.length) * 65 + 60);

  const nodePositions = {};

  processNodes.forEach((p, idx) => {
    const y = 50 + idx * ((svgHeight - 100) / Math.max(1, processNodes.length - 1 || 1));
    nodePositions[p.id] = { x: 140, y, type: 'PROCESS', ...p };
  });

  resourceNodes.forEach((r, idx) => {
    const y = 50 + idx * ((svgHeight - 100) / Math.max(1, resourceNodes.length - 1 || 1));
    nodePositions[r.id] = { x: 500, y, type: 'RESOURCE', ...r };
  });

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="panel-industrial p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              RESOURCE ALLOCATION GRAPH (RAG) & DEADLOCK DETECTION
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Directed bipartite graph tracking allocations (Resource → Process) and claims (Process → Resource).
          </p>
        </div>

        {hasDeadlock ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold animate-pulse">
              <AlertOctagon className="w-4 h-4" />
              <span>DEADLOCK CONFIRMED (CYCLE DETECTED)</span>
            </div>
            <button
              onClick={onOpenRecoveryModal}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Resolve Deadlock</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>NO DEADLOCK (CYCLE-FREE RAG)</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Dynamic SVG RAG */}
        <div className="panel-industrial p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              ACTIVE GRAPH TOPOLOGY
            </span>
            <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-emerald-400 inline-block" /> Allocation (R → P)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 border-t border-dashed border-amber-400 inline-block" /> Request (P → R)
              </span>
              {hasDeadlock && (
                <span className="flex items-center gap-1 text-rose-400 font-bold">
                  <span className="w-3 h-1 bg-rose-500 inline-block animate-pulse" /> Deadlocked Cycle
                </span>
              )}
            </div>
          </div>

          <div className="bg-slate-950/80 rounded-xl border border-slate-800/80 p-2 overflow-x-auto flex justify-center">
            <svg width={svgWidth} height={svgHeight} className="overflow-visible select-none">
              <defs>
                {/* Standard Arrowheads */}
                <marker
                  id="arrow-alloc"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
                </marker>
                <marker
                  id="arrow-req"
                  viewBox="0 0 10 10"
                  refX="22"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
                </marker>
                <marker
                  id="arrow-cycle"
                  viewBox="0 0 10 10"
                  refX="20"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
                </marker>
              </defs>

              {/* Draw Edges */}
              {edges.map((edge, idx) => {
                const source = nodePositions[edge.from];
                const target = nodePositions[edge.to];
                if (!source || !target) return null;

                const isAlloc = edge.type === 'ALLOCATION';
                // Check if this edge is in the cycle
                const isInCycle =
                  hasDeadlock &&
                  cycleNodes.includes(edge.from) &&
                  cycleNodes.includes(edge.to);

                // Curve path
                const dx = target.x - source.x;
                const dy = target.y - source.y;
                const cx1 = source.x + dx * 0.4;
                const cy1 = source.y;
                const cx2 = source.x + dx * 0.6;
                const cy2 = target.y;

                const pathD = `M ${source.x} ${source.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${target.x} ${target.y}`;

                return (
                  <g key={idx}>
                    <path
                      d={pathD}
                      fill="none"
                      stroke={
                        isInCycle
                          ? '#f43f5e'
                          : isAlloc
                          ? '#10b981'
                          : '#f59e0b'
                      }
                      strokeWidth={isInCycle ? '3' : '1.8'}
                      strokeDasharray={isAlloc ? 'none' : '4,3'}
                      markerEnd={
                        isInCycle
                          ? 'url(#arrow-cycle)'
                          : isAlloc
                          ? 'url(#arrow-alloc)'
                          : 'url(#arrow-req)'
                      }
                      className={isInCycle ? 'animate-pulse' : ''}
                    />
                  </g>
                );
              })}

              {/* Draw Process Nodes (Circles on left) */}
              {processNodes.map((p) => {
                const pos = nodePositions[p.id];
                if (!pos) return null;
                const isInCycle = hasDeadlock && cycleNodes.includes(p.id);

                return (
                  <g key={p.id} className="cursor-pointer">
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="20"
                      fill={isInCycle ? 'rgba(244, 63, 94, 0.2)' : 'rgba(15, 23, 42, 0.9)'}
                      stroke={isInCycle ? '#f43f5e' : '#3b82f6'}
                      strokeWidth={isInCycle ? '2.5' : '1.5'}
                      className={isInCycle ? 'animate-pulse' : ''}
                    />
                    <text
                      x={pos.x}
                      y={pos.y + 4}
                      textAnchor="middle"
                      fill={isInCycle ? '#fb7185' : '#60a5fa'}
                      fontSize="10"
                      fontFamily="JetBrains Mono"
                      fontWeight="bold"
                    >
                      {p.label}
                    </text>
                    <text
                      x={pos.x - 28}
                      y={pos.y + 3}
                      textAnchor="end"
                      fill="#94a3b8"
                      fontSize="9"
                      fontFamily="Outfit"
                    >
                      {p.name}
                    </text>
                  </g>
                );
              })}

              {/* Draw Resource Nodes (Rectangles with capacity dots on right) */}
              {resourceNodes.map((r) => {
                const pos = nodePositions[r.id];
                if (!pos) return null;
                const isInCycle = hasDeadlock && cycleNodes.includes(r.id);

                return (
                  <g key={r.id}>
                    <rect
                      x={pos.x - 45}
                      y={pos.y - 18}
                      width="90"
                      height="36"
                      rx="6"
                      fill={isInCycle ? 'rgba(244, 63, 94, 0.2)' : 'rgba(15, 23, 42, 0.9)'}
                      stroke={isInCycle ? '#f43f5e' : r.color || '#f59e0b'}
                      strokeWidth={isInCycle ? '2.5' : '1.5'}
                      className={isInCycle ? 'animate-pulse' : ''}
                    />
                    <text
                      x={pos.x}
                      y={pos.y - 2}
                      textAnchor="middle"
                      fill={isInCycle ? '#fb7185' : '#f8fafc'}
                      fontSize="10"
                      fontFamily="Outfit"
                      fontWeight="bold"
                    >
                      {r.label}
                    </text>

                    {/* Capacity instance dots */}
                    <g transform={`translate(${pos.x - (r.capacity * 6)}, ${pos.y + 8})`}>
                      {Array.from({ length: r.capacity }).map((_, i) => (
                        <circle
                          key={i}
                          cx={i * 12 + 6}
                          cy="0"
                          r="3"
                          fill={i < r.allocated ? '#f43f5e' : '#10b981'}
                        />
                      ))}
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>

          {hasDeadlock && (
            <div className="mt-3 p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-xs font-mono text-rose-300 flex items-center justify-between">
              <span>CIRCULAR CHAIN: {cycleString}</span>
              <button
                onClick={onOpenRecoveryModal}
                className="underline hover:text-rose-100 font-bold"
              >
                Launch Recovery →
              </button>
            </div>
          )}
        </div>

        {/* Right Col: 4 Coffman Conditions Checklist */}
        <div className="panel-industrial p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-1 flex items-center gap-2">
              <span>THE 4 COFFMAN CONDITIONS</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Deadlock can only occur if ALL four conditions hold simultaneously.
            </p>

            <div className="space-y-2.5">
              {coffman?.conditions?.map((cond, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border text-xs transition ${
                    cond.satisfied
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                      {cond.satisfied ? (
                        <CheckCircle2 className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      )}
                      <span>{cond.name}</span>
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        cond.satisfied
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {cond.satisfied ? 'SATISFIED' : 'NOT MET'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug pl-5">
                    {cond.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              Breaking any ONE condition resolves or prevents deadlock.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
