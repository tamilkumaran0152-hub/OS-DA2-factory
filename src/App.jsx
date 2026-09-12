import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SimulationEngine } from './simulation/simulationEngine.js';
import { SCENARIO_TYPES } from './simulation/scenarios.js';
import { SchedulingAlgorithm, Subsystem, OSConcept } from './simulation/types.js';

// Layout Components
import Sidebar from './components/layout/Sidebar.jsx';
import TopHeader from './components/layout/TopHeader.jsx';

// Dedicated Page Views
import DashboardView from './components/views/DashboardView.jsx';
import FactoryFloorView from './components/views/FactoryFloorView.jsx';
import ProcessManagerView from './components/views/ProcessManagerView.jsx';
import ResourceManagerView from './components/views/ResourceManagerView.jsx';
import SystemBrainView from './components/views/SystemBrainView.jsx';
import SynchronizationView from './components/views/SynchronizationView.jsx';
import BankersSafetyView from './components/views/BankersSafetyView.jsx';
import DeadlockView from './components/views/DeadlockView.jsx';
import RecoveryView from './components/views/RecoveryView.jsx';
import GanttMetricsView from './components/views/GanttMetricsView.jsx';
import AlgorithmLabView from './components/views/AlgorithmLabView.jsx';
import EventStreamView from './components/views/EventStreamView.jsx';
import SystemStateView from './components/views/SystemStateView.jsx';
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

  // Global Navigation View State:
  // 'dashboard' | 'factory-floor' | 'processes' | 'resources' |
  // 'brain' | 'sync' | 'banker' | 'deadlock' | 'recovery' |
  // 'gantt' | 'algorithms' | 'events' | 'state' | 'viva'
  const [currentView, setCurrentView] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  // Configurations
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
    // Also navigate to dashboard or sync to show the explanation
    setCurrentView('dashboard');
  }, [syncSnapshot]);

  // Event stream item selected -> Load into Decision Engine
  const handleSelectEvent = useCallback((event) => {
    engineRef.current.lastDecision = {
      id: event.id,
      time: event.time,
      eventType: event.eventType,
      jobId: event.jobId,
      jobName: event.jobName,
      resourceType: event.resourceType,
      subsystem: event.subsystem,
      osConcept: event.osConcept,
      whatHappened: event.whatHappened || event.reason,
      whyItHappened: event.whyItHappened || 'Historical event from event stream',
      decision: event.decision || event.reason,
      manufacturingImpact: event.manufacturingImpact || 'Standard state transition.',
      explanationData: event.explanationData,
    };
    syncSnapshot();
    setCurrentView('dashboard');
  }, [syncSnapshot]);

  // Real-time discrete tick timer
  useEffect(() => {
    if (!snapshot.isRunning) return;

    const intervalMs = Math.max(100, Math.round(1000 / snapshot.speed));

    const timer = setInterval(() => {
      const res = engineRef.current.step();
      syncSnapshot();
      if (res.completed) {
        engineRef.current.isRunning = false;
        syncSnapshot();
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [snapshot.isRunning, snapshot.speed, syncSnapshot]);

  const inspectedJob = inspectedJobId ? snapshot.jobs[inspectedJobId] : null;

  // Compute live safety state from Banker's algorithm
  const matrices = engineRef.current.banker.buildMatrices(snapshot.jobs, snapshot.resourceTypes);
  const safetyCheck = engineRef.current.banker.runSafetyAlgorithm(matrices);

  const waitingCount = Object.values(snapshot.jobs).filter(
    (j) => j.state === 'WAITING'
  ).length;

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* 1. Permanent Left Navigation Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={setCurrentView}
        isRunning={snapshot.isRunning}
        time={snapshot.time}
        hasDeadlock={snapshot.deadlockInfo.hasDeadlock}
        waitingCount={waitingCount}
        activeSubsystem={snapshot.activeSubsystem}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* 2. Main Workspace Layout Area (Offset by lg:pl-64 for fixed sidebar) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header */}
        <TopHeader
          currentView={currentView}
          time={snapshot.time}
          isRunning={snapshot.isRunning}
          hasDeadlock={snapshot.deadlockInfo.hasDeadlock}
          bankerMode={snapshot.bankerMode}
          isSafe={safetyCheck.isSafe}
          algorithm={snapshot.algorithm}
          quantum={snapshot.quantum}
          speed={snapshot.speed}
          scenario={snapshot.scenario}
          onPlay={handlePlay}
          onPause={handlePause}
          onStep={handleStep}
          onReset={handleReset}
          onSpeedChange={handleSpeedChange}
          onAlgorithmChange={handleAlgorithmChange}
          onQuantumChange={handleQuantumChange}
          onBankerModeChange={handleBankerModeChange}
          onScenarioChange={handleScenarioChange}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onOpenVivaGuide={() => setCurrentView('viva')}
        />

        {/* Independently Scrollable Main Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <div className="max-w-[1680px] mx-auto">
            {/* VIEW 1: DASHBOARD */}
            {currentView === 'dashboard' && (
              <DashboardView
                snapshot={snapshot}
                onNavigateToView={setCurrentView}
                onInspectJob={(id) => setInspectedJobId(id)}
                onWhyWaiting={handleWhyWaiting}
              />
            )}

            {/* VIEW 2: FACTORY FLOOR */}
            {currentView === 'factory-floor' && (
              <FactoryFloorView
                resourceTypes={snapshot.resourceTypes}
                machineInstances={snapshot.machineInstances}
                jobs={snapshot.jobs}
                onInspectJob={(id) => setInspectedJobId(id)}
                onWhyWaiting={handleWhyWaiting}
              />
            )}

            {/* VIEW 3: PROCESS MANAGER */}
            {currentView === 'processes' && (
              <ProcessManagerView
                jobs={snapshot.jobs}
                onInspectJob={(id) => setInspectedJobId(id)}
                onWhyWaiting={handleWhyWaiting}
              />
            )}

            {/* VIEW 4: RESOURCE MANAGER */}
            {currentView === 'resources' && (
              <ResourceManagerView
                resourceTypes={snapshot.resourceTypes}
                machineInstances={snapshot.machineInstances}
                jobs={snapshot.jobs}
                semaphores={snapshot.semaphores}
                onInspectJob={(id) => setInspectedJobId(id)}
              />
            )}

            {/* VIEW 5: SYSTEM BRAIN */}
            {currentView === 'brain' && (
              <SystemBrainView
                activeSubsystem={snapshot.activeSubsystem}
                snapshot={snapshot}
              />
            )}

            {/* VIEW 6: SYNCHRONIZATION */}
            {currentView === 'sync' && (
              <SynchronizationView
                semaphores={snapshot.semaphores}
                resourceTypes={snapshot.resourceTypes}
                jobs={snapshot.jobs}
                eventLog={snapshot.eventLog}
                onInspectJob={(id) => setInspectedJobId(id)}
              />
            )}

            {/* VIEW 7: BANKER'S SAFETY */}
            {currentView === 'banker' && (
              <BankersSafetyView
                banker={engineRef.current.banker}
                jobs={snapshot.jobs}
                resourceTypes={snapshot.resourceTypes}
              />
            )}

            {/* VIEW 8: DEADLOCK & RAG */}
            {currentView === 'deadlock' && (
              <DeadlockView
                deadlockInfo={snapshot.deadlockInfo}
                jobs={snapshot.jobs}
                resourceTypes={snapshot.resourceTypes}
                onNavigateToRecovery={() => setCurrentView('recovery')}
              />
            )}

            {/* VIEW 9: DEADLOCK RECOVERY */}
            {currentView === 'recovery' && (
              <RecoveryView
                deadlockInfo={snapshot.deadlockInfo}
                jobs={snapshot.jobs}
                resourceTypes={snapshot.resourceTypes}
                onExecuteRecovery={handleExecuteRecovery}
              />
            )}

            {/* VIEW 10: GANTT & METRICS */}
            {currentView === 'gantt' && (
              <GanttMetricsView
                jobs={snapshot.jobs}
                ganttRecords={snapshot.ganttRecords}
                currentTime={snapshot.time}
                metrics={snapshot.metrics}
              />
            )}

            {/* VIEW 11: ALGORITHM LAB */}
            {currentView === 'algorithms' && (
              <AlgorithmLabView currentScenario={snapshot.scenario} />
            )}

            {/* VIEW 12: EVENT STREAM */}
            {currentView === 'events' && (
              <EventStreamView
                eventLog={snapshot.eventLog}
                onSelectEvent={handleSelectEvent}
              />
            )}

            {/* VIEW 13: SYSTEM STATE */}
            {currentView === 'state' && (
              <SystemStateView snapshot={snapshot} />
            )}

            {/* VIEW 14: VIVA GUIDE */}
            {currentView === 'viva' && <VivaGuideView />}
          </div>
        </main>
      </div>

      {/* PCB Inspection Modal */}
      <JobHistoryModal
        isOpen={!!inspectedJobId}
        onClose={() => setInspectedJobId(null)}
        job={inspectedJob}
      />

      {/* Pop-up Recovery Modal */}
      <DeadlockRecoveryModal
        isOpen={isRecoveryModalOpen}
        onClose={() => setIsRecoveryModalOpen(false)}
        deadlockInfo={snapshot.deadlockInfo}
        jobs={snapshot.jobs}
        resourceTypes={snapshot.resourceTypes}
        onExecuteRecovery={handleExecuteRecovery}
      />
    </div>
  );
}
