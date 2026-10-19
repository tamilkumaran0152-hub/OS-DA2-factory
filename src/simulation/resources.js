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

export const DEFAULT_MACHINE_COUNTS = Object.freeze({
  [ResourceType.CNC]: 2,
  [ResourceType.WELDING]: 2,
  [ResourceType.ASSEMBLY]: 2,
  [ResourceType.PAINTING]: 1,
  [ResourceType.PACKAGING]: 2,
});

export const RESOURCE_PREFIXES = Object.freeze({
  [ResourceType.CNC]: 'CNC',
  [ResourceType.WELDING]: 'WELD',
  [ResourceType.ASSEMBLY]: 'ASSEMBLY',
  [ResourceType.PAINTING]: 'PAINT',
  [ResourceType.PACKAGING]: 'PACK',
});

/**
 * Normalizes and validates a user-provided machine count configuration.
 * Rejects non-integer, non-positive, or unknown configurations safely.
 *
 * @param {Object|null} config
 * @returns {Object} Full normalized machine counts map
 */
export function normalizeMachineConfig(config) {
  if (config === null || config === undefined) {
    return { ...DEFAULT_MACHINE_COUNTS };
  }

  if (typeof config !== 'object' || Array.isArray(config)) {
    throw new TypeError(`Invalid machine configuration: expected an object, received ${typeof config}.`);
  }

  const normalized = { ...DEFAULT_MACHINE_COUNTS };

  const nameToTypeMap = {
    cnc: ResourceType.CNC,
    welding: ResourceType.WELDING,
    weld: ResourceType.WELDING,
    assembly: ResourceType.ASSEMBLY,
    painting: ResourceType.PAINTING,
    paint: ResourceType.PAINTING,
    packaging: ResourceType.PACKAGING,
    pack: ResourceType.PACKAGING,
  };

  for (const [key, rawValue] of Object.entries(config)) {
    const lookupKey = String(key).trim().toLowerCase();
    const targetType =
      nameToTypeMap[lookupKey] ||
      (Object.values(ResourceType).includes(key) ? key : null);

    if (!targetType) {
      throw new Error(
        `Unknown workstation/machine type "${key}". Valid types: CNC, WELDING, ASSEMBLY, PAINTING, PACKAGING.`
      );
    }

    if (
      typeof rawValue !== 'number' ||
      !Number.isInteger(rawValue) ||
      Number.isNaN(rawValue) ||
      rawValue <= 0
    ) {
      throw new Error(
        `Invalid machine count for "${key}": ${rawValue}. Machine count must be a positive integer (>= 1).`
      );
    }

    normalized[targetType] = rawValue;
  }

  return normalized;
}

/**
 * Dynamically generates 2-digit zero-padded machine instance IDs.
 * e.g. CNC, 3 -> ['CNC-01', 'CNC-02', 'CNC-03']
 *
 * @param {string} resourceType
 * @param {number} count
 * @returns {Array<string>}
 */
export function generateMachineIds(resourceType, count) {
  const prefix = RESOURCE_PREFIXES[resourceType] || resourceType;
  const ids = [];
  for (let i = 1; i <= count; i++) {
    const pad = String(i).padStart(2, '0');
    ids.push(`${prefix}-${pad}`);
  }
  return ids;
}

/**
 * Returns dynamic resource definitions deriving from the provided machine configuration.
 *
 * @param {Object|null} machineConfig
 * @returns {Object} Map of ResourceType -> Resource definition
 */
export function getResourceDefinitions(machineConfig = null) {
  const counts = normalizeMachineConfig(machineConfig);
  const defs = {};

  Object.values(RESOURCE_DEFINITIONS).forEach((baseDef) => {
    const capacity = counts[baseDef.type];
    const instances = generateMachineIds(baseDef.type, capacity);
    defs[baseDef.type] = {
      ...baseDef,
      capacity,
      instances,
    };
  });

  return defs;
}

export function createInitialResourceState(machineConfig = null) {
  const defs = getResourceDefinitions(machineConfig);
  const resourceTypes = {};
  const machineInstances = {};

  Object.values(defs).forEach((def) => {
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

  return { resourceTypes, machineInstances, resourceDefinitions: defs };
}
