import React, { useState } from 'react';
import { X, BookOpen, ChevronDown, ChevronUp, Cpu, Lock, ShieldAlert, BarChart3, HelpCircle } from 'lucide-react';

const VIVA_TOPICS = [
  {
    category: 'Process Management & Scheduling',
    icon: Cpu,
    questions: [
      {
        q: 'How does a Manufacturing Job map to an Operating System Process?',
        a: 'A manufacturing job (e.g. J101 Car Door) is an exact analog of an OS Process (PCB). It possesses a unique PID (Job ID), an arrival time, multi-stage burst times (CPU burst), a priority level, dynamic state transitions (CREATED → READY → RUNNING → WAITING → COMPLETED), and a set of requested/held resources.',
      },
      {
        q: 'Why does SJF achieve the lowest average waiting time, and what is its drawback?',
        a: 'Shortest Job First (SJF) is mathematically optimal for minimizing average waiting time because dispatching short bursts allows processes to finish rapidly, clearing the queue. Its primary drawback is Starvation: long-burst jobs (like Chassis J103) may wait indefinitely if short jobs keep arriving.',
      },
      {
        q: 'How does Round Robin enforce fairness in our factory?',
        a: 'Round Robin assigns each running job a fixed time quantum q (e.g. 2s). When the quantum expires, a timer interrupt preempts the job back to the tail of the READY queue, ensuring no single workpiece monopolizes a machine indefinitely. This dramatically reduces Response Time (RT).',
      },
      {
        q: 'How are Turnaround Time (TAT) and Waiting Time (WT) calculated?',
        a: 'TAT = Completion Time - Arrival Time. Waiting Time (WT) = TAT - Total Execution Burst Time across all stages. Response Time (RT) = First Machine Start Time - Arrival Time. By computing WT as TAT minus actual burst time, execution time is never double-counted.',
      },
    ],
  },
  {
    category: 'Synchronization & Semaphores',
    icon: Lock,
    questions: [
      {
        q: 'What is the distinction between Resource Types and Machine Instances?',
        a: 'A Resource Type (e.g. CNC Milling) represents the abstract class of resource with total capacity N (e.g. 2 instances). The individual machines (CNC-01, CNC-02) are physical instances. Resource management algorithms operate on resource types, while the physical dispatch assigns concrete machine instances.',
      },
      {
        q: 'How does a Counting Semaphore govern machine concurrency?',
        a: 'A Counting Semaphore S is initialized to resource capacity N (e.g. 2 for CNC). Operation wait(S) decrements S if S > 0, granting immediate machine access; if S == 0, the requesting job is suspended into a FIFO waiting queue. When a job completes a stage, operation signal(S) either unblocks the head of the queue or increments S.',
      },
    ],
  },
  {
    category: "Banker's Algorithm vs Deadlock Detection",
    icon: ShieldAlert,
    questions: [
      {
        q: "What is the critical difference between Banker's Algorithm and Deadlock Detection?",
        a: "Banker's Algorithm is Deadlock AVOIDANCE: it evaluates prospective resource requests BEFORE granting them, checking if Need <= Work leads to a guaranteed safe sequence. If unsafe, the request is rejected beforehand. Deadlock Detection (RAG) is a POST-MORTEM analysis: it detects if an already active system has entered circular wait, triggering recovery.",
      },
      {
        q: 'What are the 4 Coffman Conditions, and why are all 4 necessary?',
        a: '1. Mutual Exclusion (resources held exclusively).\n2. Hold and Wait (processes hold resources while requesting others).\n3. No Preemption (resources cannot be forcibly taken).\n4. Circular Wait (closed cycle of process-resource dependencies).\nAll 4 must hold simultaneously for a deadlock to exist; invalidating any one condition resolves the deadlock.',
      },
      {
        q: 'How does the Resource Allocation Graph (RAG) detect deadlock?',
        a: 'The RAG is a directed bipartite graph with edges R_j → P_i (allocation) and P_i → R_j (request). When resources have single instances, a cycle is necessary and sufficient for deadlock. Our system executes a clean DFS cycle detector; when a cycle is traced, Coffman conditions are verified and recovery is recommended.',
      },
      {
        q: 'How does Deadlock Recovery work in Smart Factory OS?',
        a: 'The Recovery Advisor analyzes deadlocked candidates using priority weights and sunk machining time. It recommends the optimal victim (e.g. J101), terminates the job, reclaims its physical machine fixtures, and signals semaphores to unblock the remaining jobs, resolving the deadlock.',
      },
    ],
  },
];

export default function VivaGuideModal({ isOpen, onClose }) {
  const [openTopic, setOpenTopic] = useState(0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0b101c] border border-indigo-500/40 rounded-2xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-[0_0_40px_rgba(99,102,241,0.25)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                OPERATING SYSTEMS VIVA & DEFENSE REVISION GUIDE
              </h2>
              <p className="text-xs text-indigo-300 font-mono">
                Smart Factory OS Conceptual Mapping for CSE OS Digital Assignment 2
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Accordion Topics */}
        <div className="my-5 space-y-3">
          {VIVA_TOPICS.map((topic, tIdx) => {
            const Icon = topic.icon;
            const isOpen = openTopic === tIdx;

            return (
              <div
                key={tIdx}
                className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60"
              >
                <button
                  onClick={() => setOpenTopic(isOpen ? -1 : tIdx)}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-900/60 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-slate-200">
                      {topic.category}
                    </span>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {isOpen && (
                  <div className="p-4 pt-1 space-y-4 border-t border-slate-800/80 bg-slate-950/90 text-xs">
                    {topic.questions.map((q, qIdx) => (
                      <div key={qIdx} className="space-y-1">
                        <div className="font-bold text-cyan-300 flex items-start gap-1.5">
                          <span className="text-indigo-400">Q:</span>
                          <span>{q.q}</span>
                        </div>
                        <div className="text-slate-300 leading-relaxed pl-4 border-l-2 border-slate-800 whitespace-pre-line">
                          {q.a}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="btn-industrial btn-ghost text-xs px-4 py-2"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
