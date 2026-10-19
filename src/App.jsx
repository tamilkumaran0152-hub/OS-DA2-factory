import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SimulationEngine } from './simulation/simulationEngine.js';
import { SCENARIO_TYPES } from './simulation/scenarios.js';
import { SchedulingAlgorithm, Subsystem, OSConcept } from './simulation/types.js';

// Clean Landing Page & Dedicated Workspaces
import HomePage from './components/redesign/HomePage.jsx';
import WorkspaceLayout from './components/workspaces/WorkspaceLayout.jsx';
import SchedulerWorkspace from './components/workspaces/SchedulerWorkspace.jsx';
import FactoryWorkspace from './components/workspaces/FactoryWorkspace.jsx';
import ResourcesWorkspace from './components/workspaces/ResourcesWorkspace.jsx';
import BankerWorkspace from './components/workspaces/BankerWorkspace.jsx';
import DeadlockWorkspace from './components/workspaces/DeadlockWorkspace.jsx';
import ConsoleWorkspace from './components/workspaces/ConsoleWorkspace.jsx';

// Theory & Viva Guide
import VivaGuideView from './components/views/VivaGuideView.jsx';

// Modals
import JobHistoryModal from './components/JobHistoryModal.jsx';
import DeadlockRecoveryModal from './components/DeadlockRecoveryModal.jsx';

export default function App() {
  const engineRef = useRef(null);
  if (!engineRef.current) {
    engineRef.current = new SimulationEngine({
      scenario: SCENARIO_TYPES.NORMAL_PRODUCTION,
      algorithm: SchedulingAlgorithm.FCFS,
    });
  }

  // Active snapshot for React reactivity
  const [snapshot, setSnapshot] = useState(() => engineRef.current.getSnapshot());

  // Global Navigation: 'home' (default) | 'scheduler' | 'simulator' | 'resources' | 'banker' | 'deadlock' | 'console' | 'viva'
  const [currentView, setCurrentView] = useState('home');
  const currentViewRef = useRef(currentView);
  currentViewRef.current = currentView;

  const [inspectedJobId, setInspectedJobId] = useState(null);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);

  const syncSnapshot = useCallback(() => {
    setSnapshot(engineRef.current.getSnapshot());
  }, []);

  // Discrete STEP (Single event)
  const handleStep = useCallback(() => {
    engineRef.current.step();
    syncSnapshot();
  }, [syncSnapshot]);

  // Play, Pause, Reset
  const handlePlay = useCallback(() => {
    engineRef.current.isRunning = true;
    syncSnapshot();
  }, [syncSnapshot]);

  const handlePause = useCallback(() => {
    engineRef.current.isRunning = false;
    syncSnapshot();
  }, [syncSnapshot]);

  const handleReset = useCallback(() => {
    engineRef.current.reset();
    syncSnapshot();
  }, [syncSnapshot]);

  const handleSpeedChange = useCallback((newSpeed) => {
    engineRef.current.speed = newSpeed;
    syncSnapshot();
  }, [syncSnapshot]);

  const handleAlgorithmChange = useCallback((algo) => {
    engineRef.current.setAlgorithm(algo);
    syncSnapshot();
  }, [syncSnapshot]);

  const handleQuantumChange = useCallback((q) => {
    engineRef.current.setQuantum(q);
    syncSnapshot();
  }, [syncSnapshot]);

  const handleBankerModeChange = useCallback((enabled) => {
    engineRef.current.setBankerMode(enabled);
    syncSnapshot();
  }, [syncSnapshot]);

  const handleScenarioChange = useCallback((scen) => {
    engineRef.current.setScenario(scen);
    syncSnapshot();
  }, [syncSnapshot]);

  // Machine Configuration Handler
  const handleApplyMachineConfig = useCallback((config) => {
    engineRef.current.setMachineConfig(config);
    syncSnapshot();
  }, [syncSnapshot]);

  // Deadlock Recovery Execution
  const handleExecuteRecovery = useCallback((victimJobId) => {
    engineRef.current.recoverFromDeadlock(victimJobId);
    syncSnapshot();
  }, [syncSnapshot]);

  // "WHY IS THIS JOB WAITING?" Interaction
  const handleWhyWaiting = useCallback((job) => {
    const resType = job.waitingForResourceType;
    const res = engineRef.current.resourceTypes[resType];
    const sem = engineRef.current.semaphores[resType];
    const allocatedJobs = sem?.allocatedJobs || [];

    engineRef.current.logEvent({
      eventType: 'WHY_WAITING_INSPECTED',
      time: engineRef.current.time,
      jobId: job.id,
      jobName: job.name,
      resourceType: resType,
      subsystem: Subsystem.SYNCHRONIZATION,
      osConcept: OSConcept.SEMAPHORE_SYNCHRONIZATION,
      whatHappened: `Operator queried WHY workpiece ${job.id} is blocked in WAITING state.`,
      whyItHappened: `${job.id} requires 1 instance of ${resType}. Total capacity = ${res?.capacity || 2}, currently available = ${res?.available || 0}. Machine cells are currently held by [${allocatedJobs.join(', ')}]. Semaphore value S = 0.`,
      decision: `${job.id} must remain suspended in ${resType} FIFO waiting queue until a running process invokes signal(V).`,
      manufacturingImpact: `Enforces mutual exclusion; prevents conflicting tooling setups on the shopfloor.`,
      explanationData: {
        jobId: job.id,
        requiredResource: resType,
        semaphoreCapacity: res?.capacity,
        semaphoreAvailable: res?.available,
        currentlyAllocatedTo: allocatedJobs,
        waitingQueue: res?.waitingQueue,
      },
    });

    syncSnapshot();
  }, [syncSnapshot]);

  // Main simulation tick loop
  useEffect(() => {
    let animId;
    let lastTickTime = performance.now();

    const tick = (now) => {
      if (engineRef.current.isRunning) {
        const intervalMs = 1000 / engineRef.current.speed;
        const elapsed = now - lastTickTime;

        if (elapsed >= intervalMs) {
          const res = engineRef.current.step();
          syncSnapshot();
          lastTickTime = now;

          if (res.completed) {
            engineRef.current.isRunning = false;
            syncSnapshot();
          } else if (res.deadlocked) {
            engineRef.current.isRunning = false;
            syncSnapshot();
            if (currentViewRef.current !== 'simulator') {
              setIsRecoveryModalOpen(true);
            }
          }
        }
      } else {
        lastTickTime = now;
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [syncSnapshot]);

  const inspectedJob = inspectedJobId ? snapshot.jobs[inspectedJobId] : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* 1. HOME LANDING PAGE */}
      {currentView === 'home' && (
        <HomePage
          onSelectModule={(modId) => setCurrentView(modId)}
          snapshot={snapshot}
          onReset={handleReset}
          onOpenViva={() => setCurrentView('viva')}
        />
      )}

      {/* 2. DEDICATED WORKSPACES */}
      {['scheduler', 'simulator', 'resources', 'banker', 'deadlock', 'console'].includes(currentView) && (
        <WorkspaceLayout
          activeModuleId={currentView}
          onNavigateModule={(modId) => setCurrentView(modId)}
          onGoHome={() => setCurrentView('home')}
          snapshot={snapshot}
          onReset={handleReset}
          onOpenViva={() => setCurrentView('viva')}
        >
          {currentView === 'scheduler' && (
            <SchedulerWorkspace
              snapshot={snapshot}
              onAlgorithmChange={handleAlgorithmChange}
              onQuantumChange={handleQuantumChange}
              onScenarioChange={handleScenarioChange}
              onPlay={handlePlay}
              onPause={handlePause}
              onStep={handleStep}
              onReset={handleReset}
              onInspectJob={(id) => setInspectedJobId(id)}
              onWhyWaiting={handleWhyWaiting}
            />
          )}

          {currentView === 'simulator' && (
            <FactoryWorkspace
              snapshot={snapshot}
              onScenarioChange={handleScenarioChange}
              onSpeedChange={handleSpeedChange}
              onPlay={handlePlay}
              onPause={handlePause}
              onStep={handleStep}
              onReset={handleReset}
              onInspectJob={(id) => setInspectedJobId(id)}
              onWhyWaiting={handleWhyWaiting}
              onSelectEvent={(evt) => evt.jobId && setInspectedJobId(evt.jobId)}
              onNavigateModule={(modId) => setCurrentView(modId)}
            />
          )}

          {currentView === 'resources' && (
            <ResourcesWorkspace
              snapshot={snapshot}
              onApplyMachineConfig={handleApplyMachineConfig}
              onInspectJob={(id) => setInspectedJobId(id)}
              onWhyWaiting={handleWhyWaiting}
            />
          )}

          {currentView === 'banker' && (
            <BankerWorkspace
              banker={engineRef.current.banker}
              snapshot={snapshot}
              onBankerModeChange={handleBankerModeChange}
            />
          )}

          {currentView === 'deadlock' && (
            <DeadlockWorkspace
              snapshot={snapshot}
              onScenarioChange={handleScenarioChange}
              onStep={handleStep}
              onReset={handleReset}
              onExecuteRecovery={handleExecuteRecovery}
            />
          )}

          {currentView === 'console' && (
            <ConsoleWorkspace
              engine={engineRef.current}
              snapshot={snapshot}
              onStateChange={syncSnapshot}
            />
          )}
        </WorkspaceLayout>
      )}

      {/* 3. VIVA & DEFENSE THEORY GUIDE VIEW */}
      {currentView === 'viva' && (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased">
          <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
              <button
                onClick={() => setCurrentView('home')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              >
                <span>← Return to Home</span>
              </button>
              <span className="text-xs font-mono font-bold text-slate-500">
                OS VIVA VOCE REFERENCE
              </span>
            </div>
          </header>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
            <VivaGuideView onBackToHome={() => setCurrentView('home')} />
          </main>
        </div>
      )}

      {/* PCB Inspection Modal */}
      <JobHistoryModal
        isOpen={!!inspectedJobId}
        onClose={() => setInspectedJobId(null)}
        job={inspectedJob}
      />

      {/* Pop-up Recovery Modal on automatic deadlock encounter */}
      <DeadlockRecoveryModal
        isOpen={isRecoveryModalOpen}
        onClose={() => setIsRecoveryModalOpen(false)}
        deadlockInfo={snapshot.deadlockInfo}
        jobs={snapshot.jobs}
        resourceTypes={snapshot.resourceTypes}
        onExecuteRecovery={(victimId) => {
          handleExecuteRecovery(victimId);
          setIsRecoveryModalOpen(false);
        }}
      />
    </div>
  );
}
