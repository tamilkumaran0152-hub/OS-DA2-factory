import React, { useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Cpu,
  Lock,
  ShieldCheck,
  AlertOctagon,
  RefreshCw,
  Factory,
  Search,
} from 'lucide-react';

const VIVA_CATEGORIES = [
  {
    id: 'PROCESS_MANAGEMENT',
    name: 'Process Management',
    icon: Cpu,
    color: 'text-cyan-400',
    questions: [
      {
        q: 'How does a manufacturing job map to an Operating System process (PCB)?',
        a: 'A manufacturing job (e.g., J101 Car Door Frame) maps directly to a Process Control Block (PCB). It possesses a unique PID (Job ID), arrival time, burst times for each machining stage, priority, dynamic state (CREATED, READY, RUNNING, WAITING, COMPLETED), and pointers to held and requested machine fixtures.',
      },
      {
        q: 'What are the workpiece lifecycle states in Smart Factory OS?',
        a: '1. CREATED: Initial job instantiation.\n2. READY: Workpiece waiting in queue for dispatcher allocation.\n3. RUNNING: Actively mounted on a physical machine cell.\n4. WAITING: Blocked on a counting semaphore due to full workstation capacity.\n5. COMPLETED: Finished all routing stages.',
      },
      {
        q: 'Why does each job contain multi-stage bursts instead of a single burst time?',
        a: 'In modern discrete manufacturing, a product requires sequential processing steps across different machine types (e.g. CNC → Welding → Painting → Packaging). This reflects multi-stage CPU-I/O burst cycles in operating systems.',
      },
    ],
  },
  {
    id: 'CPU_SCHEDULING',
    name: 'CPU Scheduling',
    icon: Factory,
    color: 'text-blue-400',
    questions: [
      {
        q: 'Why does SJF (Shortest Job First) achieve the lowest average waiting time?',
        a: 'SJF is mathematically optimal because dispatching jobs with the smallest remaining burst time clears the queue fastest, minimizing the waiting delay accumulated by subsequent jobs.',
      },
      {
        q: 'What is the primary drawback of SJF and how can it be mitigated?',
        a: 'Starvation: long-burst jobs (such as Vehicle Chassis J103) may wait indefinitely if shorter jobs continuously arrive. It can be mitigated using Aging (gradually increasing the priority of waiting jobs) or Round Robin time slicing.',
      },
      {
        q: 'How does Round Robin enforce fairness in our factory floor?',
        a: 'Round Robin allocates each job a fixed time slice (quantum q). When the quantum expires, a timer interrupt preempts the job back to the READY queue tail, preventing any single workpiece from monopolizing a workcell.',
      },
      {
        q: 'How are Turnaround Time (TAT) and Waiting Time (WT) calculated?',
        a: 'TAT = Completion Time − Arrival Time.\nWaiting Time (WT) = TAT − Total Burst Time across all stages.\nResponse Time (RT) = First Run Start Time − Arrival Time.\nCalculating WT as TAT minus burst time ensures execution time is never double-counted.',
      },
    ],
  },
  {
    id: 'SYNCHRONIZATION',
    name: 'Synchronization',
    icon: Lock,
    color: 'text-emerald-400',
    questions: [
      {
        q: 'Why is CNC represented using a counting semaphore?',
        a: 'Because two CNC machines (CNC-01 and CNC-02) are available in the pool. The counting semaphore tracks the number of currently available CNC instances and atomically blocks jobs when the count reaches zero.',
      },
      {
        q: 'What are Dijkstra wait(P) and signal(V) primitives in our shopfloor?',
        a: 'wait(P): If semaphore S > 0, decrement S and allocate machine fixture; if S == 0, suspend the workpiece into a FIFO waiting queue.\nsignal(V): When a job finishes a stage, if waiting queue is non-empty, wake the head workpiece; otherwise increment S.',
      },
      {
        q: 'What is the distinction between resource types and machine instances?',
        a: 'A resource type (e.g. CNC Milling) is an abstract class with total capacity N. Machine instances (CNC-01, CNC-02) are concrete physical fixtures. Algorithms track types; physical scheduling assigns instances.',
      },
    ],
  },
  {
    id: 'BANKERS_ALGORITHM',
    name: "Banker's Algorithm",
    icon: ShieldCheck,
    color: 'text-purple-400',
    questions: [
      {
        q: "What is Banker's Algorithm and how does it prevent deadlocks?",
        a: "Banker's Algorithm is a Deadlock AVOIDANCE algorithm. Before granting a resource claim, it simulates allocation and executes a safety test: it checks if there exists a safe execution sequence where Need ≤ Work for all processes. If unsafe, the claim is rejected beforehand.",
      },
      {
        q: 'What are the 4 fundamental matrices used in Banker’s Algorithm?',
        a: '1. Available Vector V: Free instances per resource type.\n2. Max Claim Matrix M: Maximum units each process may declare.\n3. Allocation Matrix A: Units currently allocated.\n4. Need Matrix N: Remaining units required (N = M − A).',
      },
      {
        q: 'What happens if a resource request leads to an UNSAFE state?',
        a: 'The resource manager denies or defers the request, rolling back the hypothetical allocation. The requesting workpiece is placed into a waiting state until resources free up to guarantee a safe sequence.',
      },
    ],
  },
  {
    id: 'DEADLOCK',
    name: 'Deadlock & RAG',
    icon: AlertOctagon,
    color: 'text-rose-400',
    questions: [
      {
        q: 'What are the 4 Coffman Conditions required for deadlock?',
        a: '1. Mutual Exclusion: Resources held in non-shareable mode.\n2. Hold and Wait: Process holds resources while requesting more.\n3. No Preemption: Resources cannot be forcibly seized.\n4. Circular Wait: A closed chain of processes each waiting for a resource held by the next.\nAll 4 must hold simultaneously for deadlock to occur.',
      },
      {
        q: 'How does the Resource Allocation Graph (RAG) detect deadlock?',
        a: 'The RAG is a directed bipartite graph with edges R → P (allocation) and P → R (claim). Smart Factory OS runs a Depth-First Search (DFS) cycle detector. When a closed cycle is found with single-instance resource dependencies, a deadlock is confirmed.',
      },
    ],
  },
  {
    id: 'RECOVERY',
    name: 'Recovery',
    icon: RefreshCw,
    color: 'text-pink-400',
    questions: [
      {
        q: 'How does Smart Factory OS select a deadlock victim?',
        a: 'The Recovery Advisor calculates a termination cost score based on process priority, sunk machining time, and how many other jobs will be unblocked. The process with the highest cost-benefit score is selected as the recommended victim.',
      },
      {
        q: 'What occurs during Deadlock Recovery execution?',
        a: '1. The victim workpiece is terminated/aborted.\n2. Its machine fixtures are unlocked and semaphores signaled.\n3. Head jobs in FIFO queues are unblocked.\n4. Scheduler re-evaluates ready jobs and safe factory execution resumes.',
      },
    ],
  },
  {
    id: 'FACTORY_MAPPING',
    name: 'Factory Mapping',
    icon: Factory,
    color: 'text-amber-400',
    questions: [
      {
        q: 'Provide a complete summary of the OS to Manufacturing mapping.',
        a: '• OS Process (PCB) ↔ Workpiece Production Order (Job ID)\n• CPU Core ↔ Workstation Cell (CNC, Welding, etc.)\n• CPU Burst ↔ Machining / Assembly Operation Burst\n• Preemption ↔ Re-routing or pausing on shopfloor conveyor\n• Counting Semaphore ↔ Machine cell availability interlock\n• Resource Allocation Graph ↔ Shopfloor tool/fixture dependency map\n• Deadlock ↔ Mutual circular conveyor blocking / gridlock',
      },
    ],
  },
];

export default function VivaGuideView() {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [openQuestions, setOpenQuestions] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const toggleQuestion = (catId, qIdx) => {
    const key = `${catId}-${qIdx}`;
    setOpenQuestions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredCategories = VIVA_CATEGORIES.map((cat) => {
    if (selectedCategory !== 'ALL' && cat.id !== selectedCategory) return null;
    if (!searchQuery.trim()) return cat;
    const q = searchQuery.toLowerCase();
    const matchingQuestions = cat.questions.filter(
      (item) => item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
    );
    if (matchingQuestions.length === 0) return null;
    return { ...cat, questions: matchingQuestions };
  }).filter(Boolean);

  return (
    <div className="space-y-5">
      {/* 1. Header Banner */}
      <div className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
              OPERATING SYSTEMS VIVA & DEFENSE GUIDE
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Concise conceptual defense answers mapping OS textbook theory to Smart Factory implementations
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px]">
          <input
            type="text"
            placeholder="Search OS questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 text-slate-200 text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-400 font-mono"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* 2. Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
            selectedCategory === 'ALL'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
              : 'bg-[#0e1422] text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          ALL TOPICS
        </button>

        {VIVA_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              selectedCategory === cat.id
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'bg-[#0e1422] text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* 3. Questions Accordion by Category */}
      <div className="space-y-4">
        {filteredCategories.map((cat) => {
          const Icon = cat.icon;

          return (
            <div key={cat.id} className="bg-[#0e1422] border border-slate-800/90 rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-xs font-bold font-mono">
                <Icon className={`w-4 h-4 ${cat.color}`} />
                <span className="text-slate-200 uppercase tracking-wider">{cat.name}</span>
                <span className="text-slate-500 text-[10px]">({cat.questions.length} questions)</span>
              </div>

              <div className="space-y-2">
                {cat.questions.map((item, qIdx) => {
                  const key = `${cat.id}-${qIdx}`;
                  const isOpen = openQuestions[key];

                  return (
                    <div
                      key={qIdx}
                      className="rounded-lg bg-slate-950 border border-slate-800 overflow-hidden transition"
                    >
                      <button
                        onClick={() => toggleQuestion(cat.id, qIdx)}
                        className="w-full p-3 text-left text-xs font-semibold text-slate-200 hover:text-cyan-300 flex items-center justify-between gap-3 transition"
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-cyan-400 font-mono">Q{qIdx + 1}:</span>
                          <span>{item.q}</span>
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="p-3.5 pt-0 text-xs text-slate-300 leading-relaxed border-t border-slate-900 bg-[#0c121e]">
                          <div className="whitespace-pre-line pl-6 relative">
                            <span className="absolute left-0 top-0 text-emerald-400 font-mono font-bold">
                              A:
                            </span>
                            {item.a}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
