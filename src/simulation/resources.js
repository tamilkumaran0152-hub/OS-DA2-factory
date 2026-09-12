import { ResourceType, ResourceState } from './types.js';

export const RESOURCE_DEFINITIONS = {
  [ResourceType.CNC]: {
    type: ResourceType.CNC,
    name: 'CNC Milling Workstation',
    shortName: 'CNC',
    capacity: 2,
    instances: ['CNC-01', 'CNC-02'],
    color: '#00f0ff', // Neon Cyan
    accentColor: 'rgba(0, 240, 255, 0.15)',
    description: 'High-precision computer numerical control machining for metal shaping',
  },
  [ResourceType.WELDING]: {
    type: ResourceType.WELDING,
    name: 'Robotic Welding Cell',
    shortName: 'Welding',
    capacity: 2,
    instances: ['WELD-01', 'WELD-02'],
    color: '#f59e0b', // Amber
    accentColor: 'rgba(245, 158, 11, 0.15)',
    description: 'Automated laser and MIG welding for structural fabrication',
  },
  [ResourceType.ASSEMBLY]: {
    type: ResourceType.ASSEMBLY,
    name: 'Automated Assembly Station',
    shortName: 'Assembly',
    capacity: 2,
    instances: ['ASSEMBLY-01', 'ASSEMBLY-02'],
    color: '#3b82f6', // Electric Blue
    accentColor: 'rgba(59, 130, 246, 0.15)',
    description: 'Robotic arms mounting gears, fasteners, and sub-assemblies',
  },
  [ResourceType.PAINTING]: {
    type: ResourceType.PAINTING,
    name: 'Electrostatic Painting Station',
    shortName: 'Painting',
    capacity: 1,
    instances: ['PAINT-01'],
    color: '#ec4899', // Pink / Magenta
    accentColor: 'rgba(236, 72, 153, 0.15)',
    description: 'Precision robotic paint booth with climate-controlled curing (single instance)',
  },
  [ResourceType.PACKAGING]: {
    type: ResourceType.PACKAGING,
    name: 'Automated Packaging Unit',
    shortName: 'Packaging',
    capacity: 2,
    instances: ['PACK-01', 'PACK-02'],
    color: '#10b981', // Emerald
    accentColor: 'rgba(16, 185, 129, 0.15)',
    description: 'Quality inspection, wrapping, boxing, and barcode labeling unit',
  },
};

export function createInitialResourceState() {
  const resourceTypes = {};
  const machineInstances = {};

  Object.values(RESOURCE_DEFINITIONS).forEach((def) => {
    resourceTypes[def.type] = {
      type: def.type,
      name: def.name,
      shortName: def.shortName,
      capacity: def.capacity,
      allocated: 0,
      available: def.capacity,
      waitingQueue: [], // Job IDs waiting in semaphore queue
      instances: [...def.instances],
      color: def.color,
    };

    def.instances.forEach((instId) => {
      machineInstances[instId] = {
        id: instId,
        type: def.type,
        state: ResourceState.IDLE,
        currentJobId: null,
        currentJobName: null,
        stageIndex: 0,
        progress: 0, // 0 to 100%
        currentBurstRemaining: 0,
        currentBurstTotal: 0,
        totalBusyTime: 0,
        history: [],
      };
    });
  });

  return { resourceTypes, machineInstances };
}
