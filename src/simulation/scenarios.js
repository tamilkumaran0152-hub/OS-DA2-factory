import { ResourceType, ProcessState, SchedulingAlgorithm } from './types.js';
import { createInitialJobs, JOB_TEMPLATES } from './jobs.js';
import { createInitialResourceState } from './resources.js';

export const SCENARIO_TYPES = {
  NORMAL_PRODUCTION: 'NORMAL_PRODUCTION',
  RESOURCE_CONTENTION: 'RESOURCE_CONTENTION',
  BANKER_SAFE_REQUEST: 'BANKER_SAFE_REQUEST',
  BANKER_UNSAFE_REQUEST: 'BANKER_UNSAFE_REQUEST',
  DEADLOCK_SCENARIO: 'DEADLOCK_SCENARIO',
  DEADLOCK_RECOVERY: 'DEADLOCK_RECOVERY',
  HEAVY_LOAD: 'HEAVY_LOAD',
};

export const SCENARIO_METADATA = {
  [SCENARIO_TYPES.NORMAL_PRODUCTION]: {
    id: SCENARIO_TYPES.NORMAL_PRODUCTION,
    title: '1. Normal Production Flow',
    subtitle: 'Standard Multi-Machine Scheduling',
    description:
      'Demonstrates baseline manufacturing operations with staggered job arrivals and standard multi-machine scheduling (FCFS / SJF / Priority).',
    osFocus: 'Process Lifecycle, Ready Queue, CPU/Workstation Scheduling',
    recommendedAlgorithm: SchedulingAlgorithm.FCFS,
    bankerMode: false,
  },
  [SCENARIO_TYPES.RESOURCE_CONTENTION]: {
    id: SCENARIO_TYPES.RESOURCE_CONTENTION,
    title: '2. Resource Contention & Semaphores',
    subtitle: 'Bottleneck Workstation & FIFO Waiting Queues',
    description:
      'Multiple jobs (J101, J102, J103, J104) arrive simultaneously competing for limited CNC instances (capacity 2). Demonstrates counting semaphores and blocking.',
    osFocus: 'Counting Semaphores, wait(P), signal(V), Process Blocking & Waking',
    recommendedAlgorithm: SchedulingAlgorithm.SJF,
    bankerMode: false,
  },
  [SCENARIO_TYPES.BANKER_SAFE_REQUEST]: {
    id: SCENARIO_TYPES.BANKER_SAFE_REQUEST,
    title: "3. Banker's Safe Request",
    subtitle: 'Deadlock Avoidance via Safety Algorithm',
    description:
      'Pre-allocated state where a new resource request is verified by the Banker’s Algorithm. A valid safe execution sequence is proven and the request is safely granted.',
    osFocus: "Banker's Algorithm, Safe State, Need <= Work Verification",
    recommendedAlgorithm: SchedulingAlgorithm.FCFS,
    bankerMode: true,
  },
  [SCENARIO_TYPES.BANKER_UNSAFE_REQUEST]: {
    id: SCENARIO_TYPES.BANKER_UNSAFE_REQUEST,
    title: "4. Banker's Unsafe Request",
    subtitle: 'Deadlock Avoidance — Request Denial',
    description:
      'A job requests resources that would leave available resources insufficient for remaining claims. The Banker detects an UNSAFE state, safely rejecting the request.',
    osFocus: "Banker's Algorithm, Unsafe State Prevention, Matrix Rollback",
    recommendedAlgorithm: SchedulingAlgorithm.FCFS,
    bankerMode: true,
  },
  [SCENARIO_TYPES.DEADLOCK_SCENARIO]: {
    id: SCENARIO_TYPES.DEADLOCK_SCENARIO,
    title: '5. Deadlock Detection Scenario',
    subtitle: 'Resource Allocation Graph Circular Wait',
    description:
      'A classic circular dependency: J101 holds CNC and requests Welding, while J102 holds Welding and requests CNC. DFS detects the cycle and validates all 4 Coffman conditions.',
    osFocus: 'Resource Allocation Graph (RAG), DFS Cycle Detection, 4 Coffman Conditions',
    recommendedAlgorithm: SchedulingAlgorithm.FCFS,
    bankerMode: false,
  },
  [SCENARIO_TYPES.DEADLOCK_RECOVERY]: {
    id: SCENARIO_TYPES.DEADLOCK_RECOVERY,
    title: '6. Deadlock Recovery Demonstration',
    subtitle: 'Victim Selection, Termination & Reclaim',
    description:
      'The system analyzes the deadlocked state, evaluates recovery costs, terminates the optimal victim process (J101), reclaims resources, and unblocks waiting jobs.',
    osFocus: 'Process Preemption, Resource Reclamation, State Recovery',
    recommendedAlgorithm: SchedulingAlgorithm.FCFS,
    bankerMode: false,
  },
  [SCENARIO_TYPES.HEAVY_LOAD]: {
    id: SCENARIO_TYPES.HEAVY_LOAD,
    title: '7. Heavy Production Load',
    subtitle: 'Full Factory Stress Test',
    description:
      'All 6 manufacturing jobs compete simultaneously across all 9 machines, providing a full workout for scheduling algorithms, semaphores, and utilization metrics.',
    osFocus: 'System Throughput, Workstation Utilization, Queue Management',
    recommendedAlgorithm: SchedulingAlgorithm.ROUND_ROBIN,
    bankerMode: false,
  },
};

/**
 * Factory to configure simulation state according to selected deterministic scenario
 */
export function buildScenarioState(scenarioType = SCENARIO_TYPES.NORMAL_PRODUCTION) {
  const { resourceTypes, machineInstances } = createInitialResourceState();
  const jobs = createInitialJobs();

  switch (scenarioType) {
    case SCENARIO_TYPES.NORMAL_PRODUCTION: {
      // Standard staggered arrivals
      return { jobs, resourceTypes, machineInstances, initialEvents: [] };
    }

    case SCENARIO_TYPES.RESOURCE_CONTENTION: {
      // Set J101, J102, J103, J104 to all arrive at t=0
      // All require CNC at stage 0, directly challenging the 2 CNC instances
      ['J101', 'J102', 'J103', 'J104'].forEach((id) => {
        if (jobs[id]) {
          jobs[id].arrivalTime = 0;
        }
      });
      return { jobs, resourceTypes, machineInstances, initialEvents: [] };
    }

    case SCENARIO_TYPES.BANKER_SAFE_REQUEST: {
      // Set up a classic textbook Banker's state
      // CNC(2), WELDING(2), ASSEMBLY(2), PAINTING(1), PACKAGING(2)
      // J101 holds CNC-01 (Alloc: CNC=1)
      // J102 holds ASSEMBLY-01 (Alloc: ASSEMBLY=1)
      // J104 holds PACK-01 (Alloc: PACK=1)
      // Available: CNC=1, WELDING=2, ASSEMBLY=1, PAINTING=1, PACKAGING=1
      jobs.J101.state = ProcessState.RUNNING;
      jobs.J101.currentAllocations[ResourceType.CNC] = 1;
      jobs.J101.assignedInstanceId = 'CNC-01';
      machineInstances['CNC-01'].state = 'RUNNING';
      machineInstances['CNC-01'].currentJobId = 'J101';
      machineInstances['CNC-01'].currentJobName = jobs.J101.name;

      jobs.J102.state = ProcessState.RUNNING;
      jobs.J102.currentAllocations[ResourceType.ASSEMBLY] = 1;
      jobs.J102.assignedInstanceId = 'ASSEMBLY-01';
      jobs.J102.currentStageIndex = 1;
      jobs.J102.currentStageBurstTotal = 2;
      jobs.J102.currentStageBurstRemaining = 2;
      machineInstances['ASSEMBLY-01'].state = 'RUNNING';
      machineInstances['ASSEMBLY-01'].currentJobId = 'J102';
      machineInstances['ASSEMBLY-01'].currentJobName = jobs.J102.name;

      jobs.J104.state = ProcessState.RUNNING;
      jobs.J104.currentAllocations[ResourceType.PACKAGING] = 1;
      jobs.J104.assignedInstanceId = 'PACK-01';
      jobs.J104.currentStageIndex = 2;
      jobs.J104.currentStageBurstTotal = 2;
      jobs.J104.currentStageBurstRemaining = 2;
      machineInstances['PACK-01'].state = 'RUNNING';
      machineInstances['PACK-01'].currentJobId = 'J104';
      machineInstances['PACK-01'].currentJobName = jobs.J104.name;

      // Update resource type counts
      resourceTypes[ResourceType.CNC].allocated = 1;
      resourceTypes[ResourceType.CNC].available = 1;
      resourceTypes[ResourceType.ASSEMBLY].allocated = 1;
      resourceTypes[ResourceType.ASSEMBLY].available = 1;
      resourceTypes[ResourceType.PACKAGING].allocated = 1;
      resourceTypes[ResourceType.PACKAGING].available = 1;

      // Other jobs in ready state
      jobs.J103.state = ProcessState.READY;
      jobs.J105.state = ProcessState.READY;

      return { jobs, resourceTypes, machineInstances, initialEvents: [] };
    }

    case SCENARIO_TYPES.BANKER_UNSAFE_REQUEST: {
      // Similar state, but tight resources
      // Both CNCs allocated (J101 holds CNC-01, J103 holds CNC-02)
      // Both Welders allocated (J105 holds WELD-01, J106 holds WELD-02)
      // Available: CNC=0, WELD=0, ASSEMBLY=2, PAINT=1, PACK=2
      jobs.J101.state = ProcessState.RUNNING;
      jobs.J101.currentAllocations[ResourceType.CNC] = 1;
      jobs.J101.assignedInstanceId = 'CNC-01';
      machineInstances['CNC-01'].state = 'RUNNING';
      machineInstances['CNC-01'].currentJobId = 'J101';
      machineInstances['CNC-01'].currentJobName = jobs.J101.name;

      jobs.J103.state = ProcessState.RUNNING;
      jobs.J103.currentAllocations[ResourceType.CNC] = 1;
      jobs.J103.assignedInstanceId = 'CNC-02';
      machineInstances['CNC-02'].state = 'RUNNING';
      machineInstances['CNC-02'].currentJobId = 'J103';
      machineInstances['CNC-02'].currentJobName = jobs.J103.name;

      jobs.J105.state = ProcessState.RUNNING;
      jobs.J105.currentAllocations[ResourceType.WELDING] = 1;
      jobs.J105.assignedInstanceId = 'WELD-01';
      machineInstances['WELD-01'].state = 'RUNNING';
      machineInstances['WELD-01'].currentJobId = 'J105';
      machineInstances['WELD-01'].currentJobName = jobs.J105.name;

      jobs.J106.state = ProcessState.RUNNING;
      jobs.J106.currentAllocations[ResourceType.WELDING] = 1;
      jobs.J106.assignedInstanceId = 'WELD-02';
      jobs.J106.currentStageIndex = 1;
      jobs.J106.currentStageBurstTotal = 2;
      jobs.J106.currentStageBurstRemaining = 2;
      machineInstances['WELD-02'].state = 'RUNNING';
      machineInstances['WELD-02'].currentJobId = 'J106';
      machineInstances['WELD-02'].currentJobName = jobs.J106.name;

      resourceTypes[ResourceType.CNC].allocated = 2;
      resourceTypes[ResourceType.CNC].available = 0;
      resourceTypes[ResourceType.WELDING].allocated = 2;
      resourceTypes[ResourceType.WELDING].available = 0;

      return { jobs, resourceTypes, machineInstances, initialEvents: [] };
    }

    case SCENARIO_TYPES.DEADLOCK_SCENARIO:
    case SCENARIO_TYPES.DEADLOCK_RECOVERY: {
      // Deterministic 2-Job Circular Dependency
      // J101 holds CNC-01 and is WAITING for WELDING
      // J102 holds WELD-01 and is WAITING for CNC
      // Other instances CNC-02 and WELD-02 are occupied by J103 and J105 to close the resource pool
      jobs.J101.state = ProcessState.WAITING;
      jobs.J101.currentAllocations[ResourceType.CNC] = 1;
      jobs.J101.assignedInstanceId = 'CNC-01';
      jobs.J101.waitingForResourceType = ResourceType.WELDING;
      machineInstances['CNC-01'].state = 'RUNNING';
      machineInstances['CNC-01'].currentJobId = 'J101';
      machineInstances['CNC-01'].currentJobName = jobs.J101.name;

      jobs.J102.state = ProcessState.WAITING;
      jobs.J102.currentAllocations[ResourceType.WELDING] = 1;
      jobs.J102.assignedInstanceId = 'WELD-01';
      jobs.J102.waitingForResourceType = ResourceType.CNC;
      machineInstances['WELD-01'].state = 'RUNNING';
      machineInstances['WELD-01'].currentJobId = 'J102';
      machineInstances['WELD-01'].currentJobName = jobs.J102.name;

      // Occupy remaining CNC and Weld instances so pool is 0
      jobs.J103.state = ProcessState.RUNNING;
      jobs.J103.currentAllocations[ResourceType.CNC] = 1;
      jobs.J103.assignedInstanceId = 'CNC-02';
      machineInstances['CNC-02'].state = 'RUNNING';
      machineInstances['CNC-02'].currentJobId = 'J103';
      machineInstances['CNC-02'].currentJobName = jobs.J103.name;

      jobs.J105.state = ProcessState.RUNNING;
      jobs.J105.currentAllocations[ResourceType.WELDING] = 1;
      jobs.J105.assignedInstanceId = 'WELD-02';
      machineInstances['WELD-02'].state = 'RUNNING';
      machineInstances['WELD-02'].currentJobId = 'J105';
      machineInstances['WELD-02'].currentJobName = jobs.J105.name;

      resourceTypes[ResourceType.CNC].allocated = 2;
      resourceTypes[ResourceType.CNC].available = 0;
      resourceTypes[ResourceType.CNC].waitingQueue = ['J102'];

      resourceTypes[ResourceType.WELDING].allocated = 2;
      resourceTypes[ResourceType.WELDING].available = 0;
      resourceTypes[ResourceType.WELDING].waitingQueue = ['J101'];

      return { jobs, resourceTypes, machineInstances, initialEvents: [] };
    }

    case SCENARIO_TYPES.HEAVY_LOAD: {
      // All 6 jobs arrive at t=0
      Object.values(jobs).forEach((j) => {
        j.arrivalTime = 0;
      });
      return { jobs, resourceTypes, machineInstances, initialEvents: [] };
    }

    default:
      return { jobs, resourceTypes, machineInstances, initialEvents: [] };
  }
}
