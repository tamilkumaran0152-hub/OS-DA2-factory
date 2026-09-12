/**
 * Deadlock Detection and Resource Allocation Graph (RAG)
 * Uses clean DFS-based cycle detection on the bipartite Process-Resource graph.
 * Evaluates the 4 Coffman Conditions strictly based on active state.
 */

export class DeadlockDetector {
  /**
   * Builds the Resource Allocation Graph (RAG) representation
   * 
   * @param {Object} jobs - Map of jobId -> Job object
   * @param {Object} resourceTypes - Map of type -> ResourceType object
   * @returns {Object} Graph representation { nodes, edges, adjacencyList }
   */
  buildRAG(jobs, resourceTypes) {
    const nodes = [];
    const edges = [];
    const adj = {}; // node -> array of target nodes

    // Process nodes (Jobs)
    Object.values(jobs).forEach((job) => {
      if (job.state !== 'COMPLETED' && job.state !== 'TERMINATED') {
        const nodeId = `P:${job.id}`;
        nodes.push({
          id: nodeId,
          type: 'PROCESS',
          label: job.id,
          name: job.name,
          state: job.state,
          color: job.color,
        });
        adj[nodeId] = [];
      }
    });

    // Resource nodes (Resource Types)
    Object.values(resourceTypes).forEach((res) => {
      const nodeId = `R:${res.type}`;
      nodes.push({
        id: nodeId,
        type: 'RESOURCE',
        label: res.shortName || res.type,
        resourceType: res.type,
        capacity: res.capacity,
        allocated: res.allocated,
        available: res.available,
        color: res.color,
      });
      adj[nodeId] = [];
    });

    // Allocation Edges: Resource -> Process (R_j -> P_i)
    Object.values(jobs).forEach((job) => {
      if (job.state !== 'COMPLETED' && job.state !== 'TERMINATED') {
        const pNode = `P:${job.id}`;
        Object.entries(job.currentAllocations || {}).forEach(([resType, count]) => {
          if (count > 0) {
            const rNode = `R:${resType}`;
            if (adj[rNode]) {
              edges.push({
                from: rNode,
                to: pNode,
                type: 'ALLOCATION',
                count,
                label: `Allocated (${count})`,
              });
              adj[rNode].push(pNode);
            }
          }
        });
      }
    });

    // Request Edges: Process -> Resource (P_i -> R_j)
    Object.values(jobs).forEach((job) => {
      if (job.state === 'WAITING' && job.waitingForResourceType) {
        const pNode = `P:${job.id}`;
        const rNode = `R:${job.waitingForResourceType}`;
        if (adj[pNode] && adj[rNode]) {
          edges.push({
            from: pNode,
            to: rNode,
            type: 'REQUEST',
            count: 1,
            label: 'Requesting',
          });
          adj[pNode].push(rNode);
        }
      }
    });

    return { nodes, edges, adjacencyList: adj };
  }

  /**
   * DFS Cycle Detection on the RAG
   * Returns whether a circular wait exists, the exact cycle path, and involved nodes
   */
  detectCycle(rag) {
    const { adjacencyList } = rag;
    const visited = new Set();
    const recursionStack = new Set();
    const parentMap = {};
    let cycleNodes = [];

    const dfs = (curr, path) => {
      visited.add(curr);
      recursionStack.add(curr);
      path.push(curr);

      const neighbors = adjacencyList[curr] || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          parentMap[neighbor] = curr;
          if (dfs(neighbor, [...path])) {
            return true;
          }
        } else if (recursionStack.has(neighbor)) {
          // Cycle detected! Extract the cycle path
          const cycleStartIndex = path.indexOf(neighbor);
          cycleNodes = path.slice(cycleStartIndex);
          cycleNodes.push(neighbor); // Close the loop visually
          return true;
        }
      }

      recursionStack.delete(curr);
      return false;
    };

    for (const node of Object.keys(adjacencyList)) {
      if (!visited.has(node)) {
        if (dfs(node, [])) {
          break;
        }
      }
    }

    const hasDeadlock = cycleNodes.length > 0;
    const involvedJobIds = [];
    const involvedResourceTypes = [];

    if (hasDeadlock) {
      cycleNodes.forEach((n) => {
        if (n.startsWith('P:')) {
          const jId = n.substring(2);
          if (!involvedJobIds.includes(jId)) involvedJobIds.push(jId);
        } else if (n.startsWith('R:')) {
          const rType = n.substring(2);
          if (!involvedResourceTypes.includes(rType)) involvedResourceTypes.push(rType);
        }
      });
    }

    return {
      hasDeadlock,
      cycleNodes,
      cycleString: cycleNodes.map((n) => n.replace('P:', 'Job ').replace('R:', 'Res ')).join(' → '),
      involvedJobIds,
      involvedResourceTypes,
    };
  }

  /**
   * Evaluates the 4 Coffman Conditions based on ACTIVE simulation state
   */
  evaluateCoffmanConditions(jobs, resourceTypes, cycleResult) {
    const activeJobs = Object.values(jobs).filter(
      (j) => j.state !== 'COMPLETED' && j.state !== 'TERMINATED'
    );

    // 1. Mutual Exclusion: Are any resources allocated exclusively?
    const hasExclusiveAllocation = Object.values(resourceTypes).some((r) => r.allocated > 0);
    const mutualExclusion = {
      name: 'Mutual Exclusion',
      satisfied: hasExclusiveAllocation,
      explanation: hasExclusiveAllocation
        ? 'Physical machines (CNC, Welding, etc.) are dedicated and cannot be shared concurrently by multiple jobs.'
        : 'No machines are currently allocated in exclusive mode.',
    };

    // 2. Hold and Wait: Is at least one process holding resources while waiting for more?
    const holdAndWaitJobs = activeJobs.filter((j) => {
      const holdsResources = Object.values(j.currentAllocations || {}).some((cnt) => cnt > 0);
      const isWaiting = j.state === 'WAITING' && j.waitingForResourceType;
      return holdsResources && isWaiting;
    });

    const holdAndWait = {
      name: 'Hold and Wait',
      satisfied: holdAndWaitJobs.length > 0,
      involvedJobs: holdAndWaitJobs.map((j) => j.id),
      explanation: holdAndWaitJobs.length > 0
        ? `Jobs [${holdAndWaitJobs.map((j) => j.id).join(', ')}] are holding machine allocations while blocked waiting for additional machines.`
        : 'No process is currently holding resources while simultaneously waiting for another.',
    };

    // 3. No Preemption: Can the system forcibly seize machines from running jobs?
    // In our standard factory operation, jobs hold machines until stage completion (non-preemptive resource lock)
    const noPreemption = {
      name: 'No Preemption',
      satisfied: true,
      explanation: 'Workpieces mounted in active machine fixtures cannot be preempted or forcibly unloaded without damaging the product.',
    };

    // 4. Circular Wait: Is there a closed directed chain in the RAG?
    const circularWait = {
      name: 'Circular Wait',
      satisfied: cycleResult.hasDeadlock,
      cyclePath: cycleResult.cycleString,
      explanation: cycleResult.hasDeadlock
        ? `Circular dependency chain confirmed: ${cycleResult.cycleString}.`
        : 'No circular wait cycle detected in the Resource Allocation Graph.',
    };

    const allConditionsMet =
      mutualExclusion.satisfied &&
      holdAndWait.satisfied &&
      noPreemption.satisfied &&
      circularWait.satisfied;

    return {
      allConditionsMet,
      isDeadlocked: allConditionsMet,
      conditions: [mutualExclusion, holdAndWait, noPreemption, circularWait],
    };
  }
}
