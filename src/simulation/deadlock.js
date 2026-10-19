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

    const hasCycle = cycleNodes.length > 0;
    const involvedJobIds = [];
    const involvedResourceTypes = [];

    if (hasCycle) {
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
      hasCycle,
      hasDeadlock: hasCycle, // Preserved for backwards compatibility with single-instance callers
      cycleNodes,
      cycleString: cycleNodes.map((n) => n.replace('P:', 'Job ').replace('R:', 'Res ')).join(' → '),
      involvedJobIds,
      involvedResourceTypes,
    };
  }

  /**
   * Multi-Instance Deadlock Detection Algorithm (Silberschatz et al.)
   * Evaluates the active system state using:
   * - Available vector: Work = Available
   * - Allocation matrix: Allocation[i][j]
   * - Request matrix: Request[i][j] (outstanding ungranted requests)
   * 
   * Iteratively finds an unfinished process i whose Request_i <= Work,
   * assumes it can run to completion, and reclaims its resources (Work = Work + Allocation_i).
   * Any process still unfinished at termination that holds resources is genuinely deadlocked.
   *
   * @param {Object} jobs - Map of jobId -> Job object
   * @param {Object} resourceTypes - Map of type -> ResourceType object
   * @returns {Object} { hasDeadlock, deadlockedJobIds, unblockedSequence, work, finish }
   */
  detectDeadlock(jobs, resourceTypes) {
    const activeJobs = Object.values(jobs).filter(
      (j) => j.state !== 'COMPLETED' && j.state !== 'TERMINATED'
    );
    const resTypes = Object.keys(resourceTypes);

    // 1. Work = Available vector
    const work = {};
    resTypes.forEach((rt) => {
      work[rt] = resourceTypes[rt]?.available ?? 0;
    });

    // 2. Build Allocation & Request matrices
    const allocation = {};
    const request = {};
    const holdsResourcesMap = {};

    activeJobs.forEach((job) => {
      allocation[job.id] = {};
      request[job.id] = {};
      let holdsAny = false;

      resTypes.forEach((rt) => {
        const alloc = job.currentAllocations?.[rt] || 0;
        allocation[job.id][rt] = alloc;
        if (alloc > 0) holdsAny = true;

        // An active process has an outstanding request if it is in WAITING state for this resource type
        // or queued in the resource's waitingQueue
        const isWaitingForRt =
          (job.state === 'WAITING' && job.waitingForResourceType === rt) ||
          Boolean(resourceTypes[rt]?.waitingQueue?.includes(job.id));

        request[job.id][rt] = isWaitingForRt ? 1 : 0;
      });

      holdsResourcesMap[job.id] = holdsAny;
    });

    // 3. Initialize Finish vector:
    // Standard textbook rule: if Allocation_i != 0, Finish[i] = false; otherwise Finish[i] = true.
    // If a process holds no resources, it cannot keep resources away from other processes.
    const finish = {};
    activeJobs.forEach((job) => {
      finish[job.id] = !holdsResourcesMap[job.id];
    });

    // 4. Repeatedly find an unfinished process whose Request_i <= Work
    const unblockedSequence = [];
    let foundProgress = true;

    while (foundProgress) {
      foundProgress = false;

      for (const job of activeJobs) {
        if (!finish[job.id]) {
          // Check if Request[job.id] <= Work
          const canProceed = resTypes.every(
            (rt) => request[job.id][rt] <= work[rt]
          );

          if (canProceed) {
            // Process can proceed to completion: reclaim held resources
            resTypes.forEach((rt) => {
              work[rt] += allocation[job.id][rt];
            });
            finish[job.id] = true;
            unblockedSequence.push(job.id);
            foundProgress = true;
            break; // Restart scan with updated Work vector
          }
        }
      }
    }

    // 5. Genuinely deadlocked processes are those that remain unfinished (holding resources)
    const deadlockedJobIds = activeJobs
      .filter((j) => !finish[j.id])
      .map((j) => j.id);

    return {
      hasDeadlock: deadlockedJobIds.length > 0,
      deadlockedJobIds,
      unblockedSequence,
      work,
      finish,
    };
  }

  /**
   * Evaluates the 4 Coffman Conditions based on ACTIVE simulation state & structural properties:
   * 1. Mutual Exclusion: Structural property — factory machine fixtures (CNC, Welding, etc.)
   *    are dedicated, non-shareable resources.
   * 2. Hold and Wait: State-dependent — active jobs holding machines while waiting for others.
   * 3. No Preemption: System policy property — mounted workpieces cannot be preempted
   *    without damaging the product.
   * 4. Circular Wait: State-dependent — closed directed cycle detected in the RAG.
   */
  evaluateCoffmanConditions(jobs, resourceTypes, cycleResult, deadlockResult = null) {
    const activeJobs = Object.values(jobs).filter(
      (j) => j.state !== 'COMPLETED' && j.state !== 'TERMINATED'
    );

    // 1. Mutual Exclusion: Factory machine fixtures are dedicated, non-shareable resources.
    const mutualExclusion = {
      name: 'Mutual Exclusion',
      satisfied: true,
      explanation:
        'Factory machine fixtures (CNC, Welding, Assembly, Painting, Packaging) are non-shareable resources; each physical machine instance can only process one workpiece fixture exclusively at a time.',
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

    // 3. No Preemption: In factory manufacturing, workpieces mounted in machines cannot be preempted.
    const noPreemption = {
      name: 'No Preemption',
      satisfied: true,
      explanation:
        'Workpieces mounted in active machine fixtures cannot be preempted or forcibly unloaded without damaging the product; resources are held until voluntary stage completion.',
    };

    // 4. Circular Wait: Closed directed loop in the bipartite RAG.
    const hasCycle = Boolean(cycleResult?.hasCycle ?? cycleResult?.hasDeadlock);
    const circularWait = {
      name: 'Circular Wait',
      satisfied: hasCycle,
      cyclePath: cycleResult?.cycleString || '',
      explanation: hasCycle
        ? `Circular dependency chain detected in RAG: ${cycleResult.cycleString}.`
        : 'No circular wait cycle detected in the Resource Allocation Graph.',
    };

    const allConditionsMet =
      mutualExclusion.satisfied &&
      holdAndWait.satisfied &&
      noPreemption.satisfied &&
      circularWait.satisfied;

    const isDeadlocked = deadlockResult
      ? Boolean(deadlockResult.hasDeadlock)
      : allConditionsMet;

    return {
      allConditionsMet,
      isDeadlocked,
      conditions: [mutualExclusion, holdAndWait, noPreemption, circularWait],
    };
  }
}
