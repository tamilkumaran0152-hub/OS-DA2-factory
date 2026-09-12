import { ProcessState, ResourceType } from './types.js';

export const JOB_TEMPLATES = [
  {
    id: 'J101',
    name: 'Car Door Frame',
    category: 'Body Subassembly',
    arrivalTime: 0,
    priority: 2, // 1 = Highest, 5 = Lowest
    color: '#00f0ff',
    stages: [
      { stageName: 'Milling & Contour', resourceType: ResourceType.CNC, burst: 3 },
      { stageName: 'Frame Seam Welding', resourceType: ResourceType.WELDING, burst: 2 },
      { stageName: 'Primer & Topcoat', resourceType: ResourceType.PAINTING, burst: 2 },
      { stageName: 'Final Packaging', resourceType: ResourceType.PACKAGING, burst: 1 },
    ],
    maxClaims: {
      [ResourceType.CNC]: 1,
      [ResourceType.WELDING]: 1,
      [ResourceType.ASSEMBLY]: 0,
      [ResourceType.PAINTING]: 1,
      [ResourceType.PACKAGING]: 1,
    },
  },
  {
    id: 'J102',
    name: 'Precision Drive Gear',
    category: 'Powertrain',
    arrivalTime: 1,
    priority: 1, // Highest priority
    color: '#3b82f6',
    stages: [
      { stageName: 'Gear Tooth Hobbing', resourceType: ResourceType.CNC, burst: 2 },
      { stageName: 'Pinion & Bearing Assembly', resourceType: ResourceType.ASSEMBLY, burst: 2 },
      { stageName: 'Protective Crate Packaging', resourceType: ResourceType.PACKAGING, burst: 1 },
    ],
    maxClaims: {
      [ResourceType.CNC]: 1,
      [ResourceType.WELDING]: 0,
      [ResourceType.ASSEMBLY]: 1,
      [ResourceType.PAINTING]: 0,
      [ResourceType.PACKAGING]: 1,
    },
  },
  {
    id: 'J103',
    name: 'Vehicle Chassis Bed',
    category: 'Heavy Structural',
    arrivalTime: 2,
    priority: 3,
    color: '#f59e0b',
    stages: [
      { stageName: 'Bed Plate Slotting', resourceType: ResourceType.CNC, burst: 3 },
      { stageName: 'Robotic Cross-Member Welding', resourceType: ResourceType.WELDING, burst: 3 },
      { stageName: 'Axle Mounting Assembly', resourceType: ResourceType.ASSEMBLY, burst: 2 },
      { stageName: 'Anti-Corrosion Painting', resourceType: ResourceType.PAINTING, burst: 2 },
    ],
    maxClaims: {
      [ResourceType.CNC]: 1,
      [ResourceType.WELDING]: 1,
      [ResourceType.ASSEMBLY]: 1,
      [ResourceType.PAINTING]: 1,
      [ResourceType.PACKAGING]: 0,
    },
  },
  {
    id: 'J104',
    name: 'Engine Cylinder Block',
    category: 'Powertrain Core',
    arrivalTime: 3,
    priority: 2,
    color: '#a855f7',
    stages: [
      { stageName: 'Bore Boring & Honing', resourceType: ResourceType.CNC, burst: 2 },
      { stageName: 'Piston & Crank Assembly', resourceType: ResourceType.ASSEMBLY, burst: 3 },
      { stageName: 'Preservation Packaging', resourceType: ResourceType.PACKAGING, burst: 2 },
    ],
    maxClaims: {
      [ResourceType.CNC]: 1,
      [ResourceType.WELDING]: 0,
      [ResourceType.ASSEMBLY]: 1,
      [ResourceType.PAINTING]: 0,
      [ResourceType.PACKAGING]: 1,
    },
  },
  {
    id: 'J105',
    name: 'Hydraulic Brake Assembly',
    category: 'Safety Subsystem',
    arrivalTime: 4,
    priority: 1, // High priority
    color: '#ec4899',
    stages: [
      { stageName: 'Caliper Seam Welding', resourceType: ResourceType.WELDING, burst: 2 },
      { stageName: 'Piston & Seal Assembly', resourceType: ResourceType.ASSEMBLY, burst: 2 },
      { stageName: 'Heat-Resistant Enamel Painting', resourceType: ResourceType.PAINTING, burst: 1 },
    ],
    maxClaims: {
      [ResourceType.CNC]: 0,
      [ResourceType.WELDING]: 1,
      [ResourceType.ASSEMBLY]: 1,
      [ResourceType.PAINTING]: 1,
      [ResourceType.PACKAGING]: 0,
    },
  },
  {
    id: 'J106',
    name: 'Transmission Casing',
    category: 'Drivetrain',
    arrivalTime: 5,
    priority: 4,
    color: '#10b981',
    stages: [
      { stageName: 'Flange & Face Milling', resourceType: ResourceType.CNC, burst: 3 },
      { stageName: 'Torque Arm Welding', resourceType: ResourceType.WELDING, burst: 2 },
      { stageName: 'Export Seal Packaging', resourceType: ResourceType.PACKAGING, burst: 2 },
    ],
    maxClaims: {
      [ResourceType.CNC]: 1,
      [ResourceType.WELDING]: 1,
      [ResourceType.ASSEMBLY]: 0,
      [ResourceType.PAINTING]: 0,
      [ResourceType.PACKAGING]: 1,
    },
  },
];

export function createInitialJobs(templates = JOB_TEMPLATES) {
  const jobs = {};

  templates.forEach((tmpl) => {
    const totalBurst = tmpl.stages.reduce((acc, s) => acc + s.burst, 0);

    jobs[tmpl.id] = {
      id: tmpl.id,
      name: tmpl.name,
      category: tmpl.category,
      arrivalTime: tmpl.arrivalTime,
      priority: tmpl.priority,
      color: tmpl.color,
      stages: tmpl.stages.map((s) => ({ ...s })),
      maxClaims: { ...tmpl.maxClaims },
      currentAllocations: {
        [ResourceType.CNC]: 0,
        [ResourceType.WELDING]: 0,
        [ResourceType.ASSEMBLY]: 0,
        [ResourceType.PAINTING]: 0,
        [ResourceType.PACKAGING]: 0,
      },
      currentStageIndex: 0,
      currentStageBurstTotal: tmpl.stages[0]?.burst || 0,
      currentStageBurstRemaining: tmpl.stages[0]?.burst || 0,
      totalBurst: totalBurst,
      remainingBurstTotal: totalBurst,
      
      // Process State & Assignment
      state: ProcessState.CREATED,
      assignedInstanceId: null,
      waitingForResourceType: null,
      
      // Timeline & Metrics
      firstStartTime: null,
      completionTime: null,
      totalWaitingTime: 0,
      resourceWaitingTime: 0,
      totalExecutionTime: 0,
      quantumRemaining: 0, // For Round Robin
      
      // PCB History Log
      history: [
        {
          time: tmpl.arrivalTime,
          state: ProcessState.CREATED,
          description: `Job created with ${tmpl.stages.length} production stages (Total Burst: ${totalBurst}s)`,
        },
      ],
    };
  });

  return jobs;
}
