/**
 * Kernel Console Command Processor
 * Authoritative OS command-line interface directly connected to SimulationEngine.
 */

/**
 * Parses and executes a kernel command against the authoritative SimulationEngine instance.
 *
 * @param {string} rawInput - Command string entered by user or test
 * @param {Object} engine - The authoritative SimulationEngine instance
 * @param {Object} options - { onStateChange: Function }
 * @returns {Object} Structured execution response
 */
export function executeKernelCommand(rawInput, engine, options = {}) {
  if (!engine) {
    throw new Error('Kernel console requires an active SimulationEngine instance.');
  }

  const trimmed = (rawInput || '').trim();
  if (!trimmed) {
    return {
      success: true,
      command: '',
      actionType: 'empty',
      output: [],
      rawText: '',
    };
  }

  // Parse command and arguments
  const parts = trimmed.split(/\s+/);
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  const onStateChange = typeof options.onStateChange === 'function' ? options.onStateChange : null;

  switch (command) {
    case 'help': {
      const lines = [
        { type: 'banner', text: '================ SMART FACTORY OS - KERNEL CONSOLE ================' },
        { type: 'info', text: 'Authoritative OS command-line interface for inspection & execution control.' },
        { type: 'header', text: 'Supported Commands:' },
        { type: 'info', text: '  help              Show this command reference guide' },
        { type: 'info', text: '  ps, jobs          Display process table: PID, state, stage, remaining bursts' },
        { type: 'info', text: '  resources, sem    Display workstation capacities, machine ownership & wait queues' },
        { type: 'info', text: '  step [n]          Advance simulation by n discrete events (default: 1)' },
        { type: 'info', text: '  run               Start continuous simulation clock execution' },
        { type: 'info', text: '  pause             Pause continuous simulation clock execution' },
        { type: 'info', text: '  reset             Reset simulation to initial scenario configuration' },
        { type: 'info', text: '  deadlock inspect  Evaluate bipartite RAG and 4 Coffman conditions for deadlocks' },
        { type: 'info', text: "  banker check      Execute Banker's safety algorithm on current resource matrices" },
        { type: 'info', text: '  clear             Clear console output history buffer' },
        { type: 'info', text: '--------------------------------------------------------------------' },
        { type: 'info', text: `System Status: Scenario="${engine.scenario}", Algorithm=${engine.algorithm}, Clock t=${engine.time}s` },
      ];
      return makeResponse(true, trimmed, 'help', lines);
    }

    case 'ps':
    case 'jobs': {
      const jobList = Object.values(engine.jobs || {});
      const lines = [
        { type: 'header', text: `PROCESS TABLE (${jobList.length} total processes at t=${engine.time}s):` },
        {
          type: 'table-header',
          text: `${pad('PID', 6)} ${pad('STATE', 11)} ${pad('PRIO', 6)} ${pad('BURST (REM/TOT)', 17)} ${pad('CURRENT OPERATION', 28)} ${pad('MACHINE / WAIT', 16)}`,
        },
        {
          type: 'divider',
          text: '----------------------------------------------------------------------------------------',
        },
      ];

      let runningCount = 0;
      let readyCount = 0;
      let waitingCount = 0;
      let completedCount = 0;
      let terminatedCount = 0;

      jobList.forEach((j) => {
        if (j.state === 'RUNNING') runningCount++;
        else if (j.state === 'READY') readyCount++;
        else if (j.state === 'WAITING') waitingCount++;
        else if (j.state === 'COMPLETED') completedCount++;
        else if (j.state === 'TERMINATED') terminatedCount++;

        const currentStage = j.stages?.[j.currentStageIndex];
        const stageDesc =
          j.state === 'COMPLETED'
            ? 'All Operations Complete'
            : j.state === 'TERMINATED'
            ? 'Terminated by Operator'
            : currentStage
            ? `${currentStage.stageName} (${j.currentStageIndex + 1}/${j.stages.length})`
            : 'Staging Intake';

        const burstDesc =
          j.state === 'COMPLETED'
            ? '0s / 0s'
            : `${j.currentStageBurstRemaining ?? 0}s / ${j.currentStageBurstTotal ?? (currentStage?.burst || 0)}s`;

        let allocDesc = '-';
        if (j.assignedInstanceId) {
          allocDesc = j.assignedInstanceId;
        } else if (j.waitingForResourceType) {
          allocDesc = `[WAIT] ${j.waitingForResourceType}`;
        }

        const lineType =
          j.state === 'RUNNING'
            ? 'success'
            : j.state === 'WAITING'
            ? 'warn'
            : j.state === 'READY'
            ? 'info'
            : 'dim';

        lines.push({
          type: lineType,
          text: `${pad(j.id, 6)} ${pad(j.state, 11)} ${pad(`P${j.priority}`, 6)} ${pad(burstDesc, 17)} ${pad(stageDesc, 28)} ${pad(allocDesc, 16)}`,
        });
      });

      lines.push({
        type: 'divider',
        text: '----------------------------------------------------------------------------------------',
      });
      lines.push({
        type: 'info',
        text: `Summary: ${runningCount} Running | ${readyCount} Ready | ${waitingCount} Waiting | ${completedCount} Completed | ${terminatedCount} Terminated`,
      });

      return makeResponse(true, trimmed, 'ps', lines, { jobList });
    }

    case 'resources':
    case 'sem': {
      const rtList = Object.values(engine.resourceTypes || {});
      const lines = [
        { type: 'header', text: `RESOURCE & SEMAPHORE INVENTORY (Clock t=${engine.time}s):` },
      ];

      let totalCapacity = 0;
      let totalAllocated = 0;

      rtList.forEach((rt) => {
        const sem = engine.semaphores?.[rt.type];
        const cap = rt.capacity;
        const avail = rt.available;
        const alloc = rt.allocated;
        totalCapacity += cap;
        totalAllocated += alloc;

        const queueDesc =
          sem?.waitingQueue && sem.waitingQueue.length > 0
            ? `[${sem.waitingQueue.join(', ')}]`
            : 'Empty';

        lines.push({
          type: 'info',
          text: `[${rt.type}] ${rt.name}: Capacity=${cap} | Available=${avail} | Allocated=${alloc} | Semaphore S=${sem?.value ?? avail}`,
        });
        lines.push({
          type: sem?.waitingQueue?.length > 0 ? 'warn' : 'dim',
          text: `  Waiting Queue: ${queueDesc}`,
        });

        // Machines of this type
        const machinesOfType = Object.values(engine.machineInstances || {}).filter(
          (m) => m.type === rt.type
        );

        if (machinesOfType.length > 0) {
          machinesOfType.forEach((m) => {
            const isBusy = m.state === 'RUNNING' && m.currentJobId !== null;
            const statusText = isBusy
              ? `RUNNING -> Job ${m.currentJobId} (${m.currentJobName || ''}) [Rem: ${m.currentBurstRemaining}s, ${m.progress || 0}%]`
              : 'IDLE (Standby)';
            lines.push({
              type: isBusy ? 'success' : 'dim',
              text: `    • ${pad(m.id, 12)} : ${statusText}`,
            });
          });
        }
      });

      lines.push({
        type: 'info',
        text: `Active Allocations: ${totalAllocated} / ${totalCapacity} machines currently engaged.`,
      });

      return makeResponse(true, trimmed, 'resources', lines, {
        resourceTypes: engine.resourceTypes,
        machineInstances: engine.machineInstances,
      });
    }

    case 'step': {
      let stepCount = 1;
      if (args.length > 0) {
        const parsed = Number(args[0]);
        if (!Number.isInteger(parsed) || isNaN(parsed) || parsed <= 0) {
          return makeResponse(false, trimmed, 'error', [
            {
              type: 'error',
              text: `Error: 'step' argument must be a positive integer (e.g. 'step 5'). Received: "${args[0]}".`,
            },
          ]);
        }
        stepCount = parsed;
      }

      let executed = 0;
      let lastRes = null;
      for (let i = 0; i < stepCount; i++) {
        lastRes = engine.step();
        executed++;
        if (lastRes.completed || lastRes.deadlocked || lastRes.stalled) {
          break;
        }
      }

      if (onStateChange) onStateChange();

      const lines = [
        {
          type: 'success',
          text: `Advanced ${executed} discrete event step(s). Current clock: t = ${engine.time}s.`,
        },
      ];

      if (lastRes?.completed) {
        lines.push({
          type: 'success',
          text: '[SYSTEM HALT] All scheduled manufacturing orders reached COMPLETED state.',
        });
      } else if (lastRes?.deadlocked) {
        lines.push({
          type: 'warn',
          text: '[ALERT] Deadlock detected during stepping. Workstations halted.',
        });
      } else if (lastRes?.stalled) {
        lines.push({
          type: 'warn',
          text: '[ALERT] Simulation stalled (NO PROGRESS DETECTED - unresolvable waiting).',
        });
      }

      return makeResponse(true, trimmed, 'step', lines, {
        executed,
        lastResult: lastRes,
        time: engine.time,
      });
    }

    case 'run': {
      engine.isRunning = true;
      if (onStateChange) onStateChange();
      const lines = [
        {
          type: 'success',
          text: `Simulation execution started (Running at ${engine.speed}x speed, clock t=${engine.time}s).`,
        },
      ];
      return makeResponse(true, trimmed, 'run', lines, { isRunning: true });
    }

    case 'pause': {
      engine.isRunning = false;
      if (onStateChange) onStateChange();
      const lines = [
        {
          type: 'info',
          text: `Simulation execution paused at clock t=${engine.time}s.`,
        },
      ];
      return makeResponse(true, trimmed, 'pause', lines, { isRunning: false });
    }

    case 'reset': {
      engine.reset();
      if (onStateChange) onStateChange();
      const lines = [
        {
          type: 'info',
          text: `Simulation reset to initial scenario baseline: "${engine.scenario}" under ${engine.algorithm}. Clock: t=0s.`,
        },
      ];
      return makeResponse(true, trimmed, 'reset', lines, { time: 0 });
    }

    case 'deadlock': {
      if (args.length === 0 || args[0].toLowerCase() !== 'inspect') {
        return makeResponse(false, trimmed, 'error', [
          {
            type: 'error',
            text: `Invalid deadlock command "${trimmed}". Supported command: 'deadlock inspect'.`,
          },
        ]);
      }

      engine.updateDeadlockState();
      const dInfo = engine.deadlockInfo || {};
      const lines = [
        { type: 'header', text: `DEADLOCK DETECTION & RAG AUDIT (Clock t=${engine.time}s):` },
      ];

      if (dInfo.hasDeadlock) {
        lines.push({
          type: 'error',
          text: `STATUS: DEADLOCK DETECTED! Circular dependency confirmed in Resource Allocation Graph.`,
        });
        lines.push({
          type: 'warn',
          text: `Cycle Chain: ${dInfo.cycleString || dInfo.cycleNodes?.join(' → ') || 'Cycle detected'}`,
        });
        lines.push({
          type: 'info',
          text: `Involved Processes: [${(dInfo.involvedJobIds || []).join(', ')}]`,
        });

        if (dInfo.coffman) {
          lines.push({ type: 'header', text: 'Coffman Conditions Evaluation:' });
          const conds = dInfo.coffman.conditions || [];
          const me = conds.find((c) => c.name === 'Mutual Exclusion') || dInfo.coffman.mutualExclusion;
          const hw = conds.find((c) => c.name === 'Hold and Wait') || dInfo.coffman.holdAndWait;
          const np = conds.find((c) => c.name === 'No Preemption') || dInfo.coffman.noPreemption;
          const cw = conds.find((c) => c.name === 'Circular Wait') || dInfo.coffman.circularWait;

          lines.push({
            type: me?.satisfied ? 'warn' : 'info',
            text: `  1. Mutual Exclusion: ${me?.satisfied ? 'SATISFIED' : 'NOT SATISFIED'} (${me?.explanation || ''})`,
          });
          lines.push({
            type: hw?.satisfied ? 'warn' : 'info',
            text: `  2. Hold and Wait:    ${hw?.satisfied ? 'SATISFIED' : 'NOT SATISFIED'} (${hw?.explanation || ''})`,
          });
          lines.push({
            type: np?.satisfied ? 'warn' : 'info',
            text: `  3. No Preemption:    ${np?.satisfied ? 'SATISFIED' : 'NOT SATISFIED'} (${np?.explanation || ''})`,
          });
          lines.push({
            type: cw?.satisfied ? 'warn' : 'info',
            text: `  4. Circular Wait:    ${cw?.satisfied ? 'SATISFIED' : 'NOT SATISFIED'} (${cw?.explanation || ''})`,
          });
        }
      } else {
        const activeJobsCount = Object.values(engine.jobs).filter(
          (j) => j.state !== 'COMPLETED' && j.state !== 'TERMINATED'
        ).length;
        lines.push({
          type: 'success',
          text: `STATUS: NO DEADLOCK DETECTED. Bipartite RAG is acyclic.`,
        });
        lines.push({
          type: 'info',
          text: `Evaluated ${activeJobsCount} active processes across 5 workstation types; 0 circular wait cycles.`,
        });
      }

      return makeResponse(true, trimmed, 'deadlock', lines, { deadlockInfo: dInfo });
    }

    case 'banker': {
      if (args.length === 0 || args[0].toLowerCase() !== 'check') {
        return makeResponse(false, trimmed, 'error', [
          {
            type: 'error',
            text: `Invalid banker command "${trimmed}". Supported command: 'banker check'.`,
          },
        ]);
      }

      const matrices = engine.banker.buildMatrices(engine.jobs, engine.resourceTypes);
      const safety = engine.banker.runSafetyAlgorithm(matrices);

      const lines = [
        { type: 'header', text: `BANKER'S SAFETY ALGORITHM CHECK (Clock t=${engine.time}s):` },
      ];

      const availVec = Object.entries(matrices.available)
        .map(([rt, val]) => `${rt}:${val}`)
        .join(', ');

      if (safety.isSafe) {
        lines.push({
          type: 'success',
          text: `SAFETY STATUS: SAFE STATE`,
        });
        lines.push({
          type: 'success',
          text: `Safe Sequence: < ${safety.safeSequence.join(' → ')} >`,
        });
        lines.push({
          type: 'info',
          text: `Available Vector: [${availVec}]`,
        });
        lines.push({
          type: 'dim',
          text: 'Verified: For every active workpiece in sequence, Need ≤ Available Work. Deadlock impossible.',
        });
      } else {
        lines.push({
          type: 'error',
          text: `SAFETY STATUS: UNSAFE STATE (Deadlock Risk)`,
        });
        lines.push({
          type: 'warn',
          text: `Unfinished / At-Risk Processes: [${(safety.unfinished || []).join(', ')}]`,
        });
        lines.push({
          type: 'info',
          text: `Available Vector: [${availVec}]`,
        });
        lines.push({
          type: 'dim',
          text: 'Notice: Remaining claims exceed available capacity. Resource request denial recommended.',
        });
      }

      return makeResponse(true, trimmed, 'banker', lines, { safety, matrices });
    }

    case 'clear': {
      return {
        success: true,
        command: trimmed,
        actionType: 'clear',
        output: [],
        rawText: 'Console cleared.',
      };
    }

    default: {
      return makeResponse(false, trimmed, 'error', [
        {
          type: 'error',
          text: `Command not recognized: "${command}". Type 'help' to inspect available commands.`,
        },
      ]);
    }
  }
}

function pad(str, len) {
  const s = String(str ?? '');
  return s.length >= len ? s : s + ' '.repeat(len - s.length);
}

function makeResponse(success, command, actionType, output, data = null) {
  return {
    success,
    command,
    actionType,
    output,
    rawText: output.map((o) => o.text).join('\n'),
    data,
  };
}
