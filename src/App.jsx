import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SimulationEngine } from './simulation/simulationEngine.js';
import { SCENARIO_TYPES } from './simulation/scenarios.js';
import { SchedulingAlgorithm, Subsystem, OSConcept, EventType } from './simulation/types.js';

// Components
import Header from './components/Header.jsx';
import ControlBar from './components/ControlBar.jsx';
import SystemBrain from './components/SystemBrain.jsx';
import DecisionEngine from './components/DecisionEngine.jsx';
import FactoryFloor from './components/FactoryFloor.jsx';
import ProcessManager from './components/ProcessManager.jsx';
import GanttChart from './components/GanttChart.jsx';
import EventLog from './components/EventLog.jsx';
import BankersPanel from './components/BankersPanel.jsx';
import ResourceAllocationGraph from './components/ResourceAllocationGraph.jsx';
import DeadlockRecoveryModal from './components/DeadlockRecoveryModal.jsx';
import AlgorithmComparisonLab from './components/AlgorithmComparisonLab.jsx';
import SystemStateInspector from './components/SystemStateInspector.jsx';
import JobHistoryModal from './components/JobHistoryModal.jsx';
import VivaGuideModal from './components/VivaGuideModal.jsx';

export default function App() {
  // Initialize Engine in ref to persist across renders
  const engineRef = useRef(null);
  if (!engineRef.current) {
    engineRef.current = new SimulationEngine({
      scenario: SCENARIO_TYPES.NORMAL_PRODUCTION,
      algorithm: SchedulingAlgorithm.FCFS,
    });
  }

  // Active snapshot for React reactivity
  const [snapshot, setSnapshot] = useState(() => engineRef.current.getSnapshot());

  // UI Navigation & Modals
  const [activeTab, setActiveTab] = useState('floor'); // 'floor' | 'deepdive' | 'benchmark'
  const [inspectedJobId, setInspectedJobId] = useState(null);
  const [isVivaModalOpen, setIsVivaModalOpen] = useState(false);
  const [isStateSnapshotOpen, setIsStateSnapshotOpen] = useState(false);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);

  // Sync snapshot helper
  const syncSnapshot = useCallback(() => {
    setSnapshot(engineRef.current.getSnapshot());
  }, []);

  // Discrete STEP Handler (Single event executed)
  const handleStep = useCallback(() => {
    engineRef.current.step();
    syncSnapshot();
  }, [syncSnapshot]);

  // PLAY / PAUSE Handlers
  const handlePlay = useCallback(() => {
    engineRef.current.isRunning = true;
    syncSnapshot();
  }, [syncSnapshot]);

  const handlePause = useCallback(() => {
    engineRef.current.isRunning = false;
    syncSnapshot();
  }, [syncSnapshot]);

  // RESET Handler
  const handleReset = useCallback(() => {
    engineRef.current.reset();
    syncSnapshot();
  }, [syncSnapshot]);

  // Configuration Handlers
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
      whyItHappened: `${job.id} requires 1 instance of ${resType}. Total capacity = ${res?.capacity || 2}, currently available = ${res?.available || 0}. Instances are currently held by [${allocatedJobs.join(', ')}]. Semaphore value S = 0.`,
      decision: `${job.id} must remain suspended in ${resType} FIFO waiting queue until a running process invokes signal(V).`,
      manufacturingImpact: `Ensures physical machines are not overloaded or subjected to tool collisions.`,
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

  // Event stream item clicked -> Load into Decision Engine
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
  }, [syncSnapshot]);

  // Real-time discrete tick timer
  useEffect(() => {
    if (!snapshot.isRunning) return;

    // Interval derived from simulation speed: 1000ms / speed (e.g. at 2x = 500ms)
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

  return (
    <div className="min-h-screen flex flex-col bg-[#070b12] text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* Top Industrial Header */}
      <Header
        time={snapshot.time}
        activeSubsystem={snapshot.activeSubsystem}
        hasDeadlock={snapshot.deadlockInfo.hasDeadlock}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenVivaGuide={() => setIsVivaModalOpen(true)}
        onOpenStateSnapshot={() => setIsStateSnapshotOpen(true)}
      />

      {/* Primary Simulation Control Bar */}
      <ControlBar
        isRunning={snapshot.isRunning}
        onPlay={handlePlay}
        onPause={handlePause}
        onStep={handleStep}
        onReset={handleReset}
        speed={snapshot.speed}
        onSpeedChange={handleSpeedChange}
        algorithm={snapshot.algorithm}
        onAlgorithmChange={handleAlgorithmChange}
        quantum={snapshot.quantum}
        onQuantumChange={handleQuantumChange}
        bankerMode={snapshot.bankerMode}
        onBankerModeChange={handleBankerModeChange}
        scenario={snapshot.scenario}
        onScenarioChange={handleScenarioChange}
      />

      {/* Main Workspace View */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto px-6 py-4 space-y-4">
        {/* System Brain Architecture Pipeline */}
        <SystemBrain activeSubsystem={snapshot.activeSubsystem} />

        {/* Tab 1: Operations Floor & Core Internals */}
        {activeTab === 'floor' && (
          <div className="space-y-4">
            {/* Signature OS Decision Engine */}
            <DecisionEngine
              lastDecision={snapshot.lastDecision}
              onInspectJob={(id) => setInspectedJobId(id)}
            />

            {/* Shopfloor Physical Workstations */}
            <FactoryFloor
              resourceTypes={snapshot.resourceTypes}
              machineInstances={snapshot.machineInstances}
              jobs={snapshot.jobs}
              onInspectJob={(id) => setInspectedJobId(id)}
            />

            {/* Process Queues & PCB */}
            <ProcessManager
              jobs={snapshot.jobs}
              onInspectJob={(id) => setInspectedJobId(id)}
              onWhyWaiting={handleWhyWaiting}
            />

            {/* Gantt Timeline & Discrete Event Stream */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <GanttChart
                  jobs={snapshot.jobs}
                  ganttRecords={snapshot.ganttRecords}
                  currentTime={snapshot.time}
                  metrics={snapshot.metrics}
                />
              </div>

              <div>
                <EventLog
                  eventLog={snapshot.eventLog}
                  onSelectEvent={handleSelectEvent}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: OS Deep Dive (RAG Deadlock & Banker's Algorithm) */}
        {activeTab === 'deepdive' && (
          <div className="space-y-4">
            <ResourceAllocationGraph
              deadlockInfo={snapshot.deadlockInfo}
              onOpenRecoveryModal={() => setIsRecoveryModalOpen(true)}
              jobs={snapshot.jobs}
              resourceTypes={snapshot.resourceTypes}
            />

            <BankersPanel
              banker={engineRef.current.banker}
              jobs={snapshot.jobs}
              resourceTypes={snapshot.resourceTypes}
            />
          </div>
        )}

        {/* Tab 3: Algorithm Comparison Lab */}
        {activeTab === 'benchmark' && (
          <AlgorithmComparisonLab currentScenario={snapshot.scenario} />
        )}
      </main>

      {/* Deadlock Recovery Modal */}
      <DeadlockRecoveryModal
        isOpen={isRecoveryModalOpen || snapshot.deadlockInfo.hasDeadlock}
        onClose={() => setIsRecoveryModalOpen(false)}
        deadlockInfo={snapshot.deadlockInfo}
        jobs={snapshot.jobs}
        resourceTypes={snapshot.resourceTypes}
        onExecuteRecovery={handleExecuteRecovery}
      />

      {/* System State Snapshot Modal */}
      <SystemStateInspector
        isOpen={isStateSnapshotOpen}
        onClose={() => setIsStateSnapshotOpen(false)}
        snapshot={snapshot}
      />

      {/* Click-to-Inspect Job History PCB Modal */}
      <JobHistoryModal
        isOpen={!!inspectedJobId}
        onClose={() => setInspectedJobId(null)}
        job={inspectedJob}
      />

      {/* OS Viva Revision Guide Modal */}
      <VivaGuideModal
        isOpen={isVivaModalOpen}
        onClose={() => setIsVivaModalOpen(false)}
      />
    </div>
  );
}
