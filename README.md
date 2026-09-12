# Smart Factory OS: A Manufacturing Resource and Process Management System Based on Operating System Concepts

**Course / Context**: VIT Chennai CSE — Operating Systems Digital Assignment 2  
**Developed by**: Antigravity Assistant Pair Programming  

---

## Quick Start Guide

### 1. Run Development Server
```bash
npm install
npm run dev
```
Open **[http://localhost:5173/](http://localhost:5173/)** in your browser.

### 2. Build Production Bundle
```bash
npm run build
```

---

## System Features & Capabilities

1. **Discrete-Event Simulation Engine**:
   - Single-event **STEP**: Advances exactly one atomic event (`JOB_ARRIVED`, `SCHEDULER_SELECTED`, `RESOURCE_GRANTED`, `SEMAPHORE_WAIT`, `STAGE_COMPLETED`, etc.).
   - Speed controls: 0.5x, 1x, 2x, 5x, 10x.
   - START / PAUSE / RESET controls.

2. **CPU / Process Scheduling**:
   - **FCFS** (Non-preemptive First-Come, First-Served)
   - **SJF** (Shortest Job First by remaining burst)
   - **Priority** (Highest priority first, P1 > P2 > P3)
   - **Round Robin** (Preemptive with configurable time quantum $q$)

3. **Counting Semaphores & Concurrency Control**:
   - Counting semaphores per resource type (`CNC`: 2, `Welding`: 2, `Assembly`: 2, `Painting`: 1, `Packaging`: 2).
   - Atomic `wait(P)` and `signal(V)` mechanics with FIFO waiting queues.

4. **Banker's Algorithm (Deadlock Avoidance)**:
   - Dynamic matrices: Available, Max, Allocation, Need ($Need = Max - Allocation$).
   - Safety check algorithm producing step-by-step trace and safe execution sequence.
   - Interactive sandbox to test arbitrary resource requests.

5. **Resource Allocation Graph (RAG) & Deadlock Detection**:
   - Dynamic SVG graph with Process circles, Resource rectangles, allocation arrows, and request arrows.
   - DFS cycle detection flashing circular wait chains in crimson.
   - Real-time verification of the **4 Coffman Conditions**:
     1. Mutual Exclusion
     2. Hold and Wait
     3. No Preemption
     4. Circular Wait

6. **Deadlock Recovery Advisor**:
   - Evaluates victim candidates (sunk time, priority penalty, held resources, unblocked jobs).
   - Terminates selected victim, reclaims physical machine instances, signals semaphores, and resumes production.

7. **Algorithm Comparison Lab**:
   - Runs identical batch workloads across all 5 scheduling configurations.
   - Computes Average Waiting Time, Turnaround Time, Response Time, and Machine Utilization.
   - SVG bar charts and academic commentary explaining algorithm trade-offs.

8. **OS Viva Examination Revision Guide**:
   - Built-in interactive Q&A guide tailored for OS viva questions and manufacturing analogies.
