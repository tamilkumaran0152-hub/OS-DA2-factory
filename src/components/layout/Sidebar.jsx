import React from 'react';
import {
  LayoutDashboard,
  Factory,
  Layers,
  Box,
  Brain,
  Lock,
  ShieldCheck,
  AlertOctagon,
  RefreshCw,
  BarChart3,
  Sliders,
  Terminal,
  Database,
  BookOpen,
  Cpu,
  Activity,
} from 'lucide-react';

export default function Sidebar({
  currentView,
  onSelectView,
  isRunning,
  time,
  hasDeadlock,
  waitingCount = 0,
  activeSubsystem,
  isMobileOpen,
  onCloseMobile,
}) {
  const navSections = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Operations Overview', icon: LayoutDashboard },
      ],
    },
    {
      title: 'KERNEL MODULES',
      items: [
        {
          id: 'scheduler',
          label: 'Process Scheduler',
          icon: Layers,
          badge: waitingCount > 0 ? `${waitingCount} wait` : null,
          badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        },
        { id: 'simulator', label: 'Factory Simulator', icon: Factory },
        { id: 'resources', label: 'Resource Manager', icon: Box },
        { id: 'banker', label: "Banker's Safety Lab", icon: ShieldCheck },
        {
          id: 'deadlock',
          label: 'Deadlock Lab',
          icon: AlertOctagon,
          badge: hasDeadlock ? 'ALERT' : null,
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse',
        },
        { id: 'console', label: 'Kernel Console', icon: Terminal },
      ],
    },
    {
      title: 'REFERENCE',
      items: [
        { id: 'viva', label: 'Viva & Theory Guide', icon: BookOpen },
      ],
    },
  ];

  const isItemActive = (itemId) => {
    if (currentView === itemId) return true;
    if (itemId === 'scheduler' && ['processes', 'gantt', 'algorithms'].includes(currentView)) return true;
    if (itemId === 'simulator' && ['factory-floor', 'events', 'brain'].includes(currentView)) return true;
    if (itemId === 'resources' && ['sync', 'config'].includes(currentView)) return true;
    if (itemId === 'deadlock' && ['recovery'].includes(currentView)) return true;
    return false;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#090d16] border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Branding */}
        <div className="p-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.12)]">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-wider text-white">
                  SMART FACTORY
                </span>
                <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  OS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium leading-tight mt-0.5">
                Operations Control Center
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {navSections.map((section) => (
            <div key={section.title}>
              <div className="px-2.5 mb-1.5 text-[10px] font-bold font-mono uppercase tracking-wider text-slate-500">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = isItemActive(item.id);

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectView(item.id);
                        if (onCloseMobile) onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-cyan-500/12 text-cyan-300 font-semibold border-l-2 border-cyan-400'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 flex-shrink-0 ${
                            isActive ? 'text-cyan-400' : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                            item.badgeColor || 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Simulation Telemetry */}
        <div className="p-3 border-t border-slate-800/80 bg-[#070a12]">
          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-medium">SIMULATION STATUS</span>
              {hasDeadlock ? (
                <span className="flex items-center gap-1.5 text-rose-400 font-bold font-mono">
                  <span className="w-2 h-2 rounded-full bg-rose-500 status-dot-active" />
                  DEADLOCK
                </span>
              ) : isRunning ? (
                <span className="flex items-center gap-1.5 text-cyan-400 font-semibold font-mono">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 status-dot-active" />
                  RUNNING
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-400 font-medium font-mono">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  PAUSED
                </span>
              )}
            </div>

            <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 font-mono text-xs">
              <span className="text-slate-400">Simulation Time</span>
              <span className="font-bold text-slate-100">
                t = {time.toFixed(0)}s
              </span>
            </div>

            {activeSubsystem && (
              <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                <span className="text-slate-400">Subsystem</span>
                <span className="text-cyan-400/90 font-semibold truncate max-w-[110px]">
                  {activeSubsystem}
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
