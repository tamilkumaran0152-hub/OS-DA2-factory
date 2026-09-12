/**
 * Manufacturing & Operating System Performance Metrics Engine
 * Strictly follows OS definitions without double counting.
 */

export function calculateMetrics(jobs, machineInstances, currentTime = 0) {
  const jobList = Object.values(jobs);
  const completedJobs = jobList.filter((j) => j.state === 'COMPLETED');
  const activeJobs = jobList.filter((j) => j.state !== 'COMPLETED' && j.state !== 'TERMINATED');
  const terminatedJobs = jobList.filter((j) => j.state === 'TERMINATED');

  // Multi-stage Job Metrics
  let totalWT = 0;
  let totalTAT = 0;
  let totalRT = 0;
  let responseTimeCount = 0;

  const jobMetrics = {};

  jobList.forEach((job) => {
    // Total Burst Time is the sum of execution bursts across all stages
    const totalBurst = job.totalBurst;
    
    // Response Time = First Start Time - Arrival Time
    let responseTime = null;
    if (job.firstStartTime !== null) {
      responseTime = Math.max(0, job.firstStartTime - job.arrivalTime);
      totalRT += responseTime;
      responseTimeCount += 1;
    }

    // Turnaround Time = Completion Time - Arrival Time (for completed jobs)
    // Or for running/waiting jobs: Current Time - Arrival Time
    let turnaroundTime = null;
    let waitingTime = null;

    if (job.state === 'COMPLETED' && job.completionTime !== null) {
      turnaroundTime = Math.max(0, job.completionTime - job.arrivalTime);
      // WT = TAT - Total Burst Time (Standard OS Textbook Formula)
      waitingTime = Math.max(0, turnaroundTime - totalBurst);
      totalTAT += turnaroundTime;
      totalWT += waitingTime;
    } else {
      // In-flight estimates for live dashboard
      const elapsedSinceArrival = Math.max(0, currentTime - job.arrivalTime);
      turnaroundTime = elapsedSinceArrival;
      waitingTime = Math.max(0, elapsedSinceArrival - (job.totalExecutionTime || 0));
    }

    jobMetrics[job.id] = {
      id: job.id,
      name: job.name,
      state: job.state,
      arrivalTime: job.arrivalTime,
      totalBurst,
      totalExecutionTime: job.totalExecutionTime || 0,
      firstStartTime: job.firstStartTime,
      completionTime: job.completionTime,
      responseTime,
      turnaroundTime,
      waitingTime,
      resourceWaitingTime: job.resourceWaitingTime || 0,
    };
  });

  const completedCount = completedJobs.length;
  const avgWaiting = completedCount > 0 ? (totalWT / completedCount).toFixed(2) : '0.00';
  const avgTurnaround = completedCount > 0 ? (totalTAT / completedCount).toFixed(2) : '0.00';
  const avgResponse = responseTimeCount > 0 ? (totalRT / responseTimeCount).toFixed(2) : '0.00';

  // Resource / Machine Utilization
  const machines = Object.values(machineInstances);
  const totalBusy = machines.reduce((acc, m) => acc + (m.totalBusyTime || 0), 0);
  const totalPossibleCapacityTime = machines.length * Math.max(1, currentTime);
  const overallUtilization = ((totalBusy / totalPossibleCapacityTime) * 100).toFixed(1);

  // Per-machine utilization
  const machineUtilization = {};
  machines.forEach((m) => {
    machineUtilization[m.id] = {
      id: m.id,
      type: m.type,
      totalBusyTime: m.totalBusyTime || 0,
      utilizationPercent: currentTime > 0 ? (((m.totalBusyTime || 0) / currentTime) * 100).toFixed(1) : '0.0',
    };
  });

  // Throughput (completed jobs per unit of time)
  const throughput = currentTime > 0 ? (completedCount / currentTime).toFixed(3) : '0.000';

  return {
    jobMetrics,
    summary: {
      totalJobs: jobList.length,
      completedCount,
      activeCount: activeJobs.length,
      waitingCount: jobList.filter((j) => j.state === 'WAITING').length,
      terminatedCount: terminatedJobs.length,
      avgWaitingTime: parseFloat(avgWaiting),
      avgTurnaroundTime: parseFloat(avgTurnaround),
      avgResponseTime: parseFloat(avgResponse),
      overallUtilization: parseFloat(overallUtilization),
      throughput: parseFloat(throughput),
    },
    machineUtilization,
  };
}
