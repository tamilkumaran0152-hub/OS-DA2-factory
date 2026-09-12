# Smart Factory OS: Operations Control Center & OS Resource Management Visualizer

**Course / Context**: VIT Chennai CSE — Operating Systems Digital Assignment 2  
**Developed by**: Antigravity Assistant Pair Programming  
**Stack**: React 19, Tailwind CSS v4, Vite 8, Lucide Icons, Modern SCADA Control Room Design System  

---

## Quick Start Guide

### 1. Run Development Server
```bash
npm install
npm run dev
```
Open **[http://localhost:5173/](http://localhost:5173/)** (or `http://127.0.0.1:5173/`) in your browser.

### 2. Build Production Bundle
```bash
npm run build
```

---

## System Architecture & Views

1. **Overview Dashboard**:
   - **KPI Strip**: Active Orders, Running Workcells, Waiting Queue, Completed Orders, Machine Utilization %, System Safety.
   - **Factory Floor**: 5 workstation bays (CNC, Welding, Assembly, Painting, Packaging) with capacity indicators (`1/2 AVAIL`), semaphore pills, and dedicated machine cards (`CNC-01`, etc.) with progress bars.
   - **OS Decision Engine**: Real-time reasoning explaining Current Event, Decision Taken, Why It Happened, OS Concept, and Factory Impact.
   - **Process Control Queues**: 4-column PCB queues (`READY`, `RUNNING`, `WAITING`, `COMPLETED`).
   - **Production Timeline (Gantt Chart)**: Real visual Gantt timeline with time grid and computed metrics ($WT, TAT, RT$).
   - **Event Stream**: Filterable chronological discrete event timeline.

2. **System Brain**:
   - Horizontal architectural pipeline: Process Manager $\to$ Scheduler $\to$ Resource Manager $\to$ Synchronization $\to$ Safety (Banker) $\to$ Deadlock $\to$ Recovery $\to$ Factory Execution.

3. **Synchronization**:
   - Dijkstra Counting Semaphores per resource type, atomic `wait(P)` and `signal(V)` operations, and FIFO waiting queues.

4. **Banker's Algorithm (Deadlock Avoidance)**:
   - Dynamic matrices: Allocation, Max, Need, Available.
   - Step-by-step $Need \le Work$ safety trace and interactive request sandbox.

5. **Resource Allocation Graph (RAG) & Deadlock Detection**:
   - Directed bipartite SVG graph with flashing crimson cycle detection.
   - Real-time verification of the 4 Coffman Conditions.

6. **Deadlock Recovery**:
   - Incident-response panel with victim candidate cost evaluation, preemption, and machine reclamation.

7. **Algorithm Comparison Lab**:
   - Side-by-side benchmark comparing FCFS, SJF, Priority, and Round Robin on identical batch workloads.

8. **System State Inspector**:
   - Live telemetry snapshot of all registers at simulation time $t$.
