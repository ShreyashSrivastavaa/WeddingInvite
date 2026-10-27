import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../../components/common/Header';
import {
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  Plus,
  Trash2,
  Sparkles,
  Download,
  Filter,
  ArrowRight,
  BookOpen,
  Heart,
  ChevronRight,
  Check,
  AlertCircle,
  Share2,
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  task: string;
  category: 'Venue & Planning' | 'Attire & Beauty' | 'Invitations & Paper' | 'Vendors & Music' | 'Ceremony & Reception';
  monthRange: '10-12 Months' | '6-8 Months' | '3-5 Months' | '1-2 Months' | 'Final Weeks';
  completed: boolean;
  notes?: string;
  priority?: 'High' | 'Normal';
}

const INITIAL_TASKS: ChecklistItem[] = [
  // 10-12 Months
  {
    id: 'c-1',
    task: 'Determine your wedding budget & funding expectations',
    category: 'Venue & Planning',
    monthRange: '10-12 Months',
    completed: true,
    priority: 'High',
  },
  {
    id: 'c-2',
    task: 'Draft initial guest list headcount & estimate catering size',
    category: 'Venue & Planning',
    monthRange: '10-12 Months',
    completed: true,
    priority: 'High',
  },
  {
    id: 'c-3',
    task: 'Tour and book your dream ceremony & reception venues',
    category: 'Venue & Planning',
    monthRange: '10-12 Months',
    completed: true,
    priority: 'High',
  },
  {
    id: 'c-4',
    task: 'Hire your wedding planner or lead coordinator',
    category: 'Venue & Planning',
    monthRange: '10-12 Months',
    completed: false,
    priority: 'Normal',
  },
  {
    id: 'c-5',
    task: 'Research and book lead photographer and videographer',
    category: 'Vendors & Music',
    monthRange: '10-12 Months',
    completed: true,
    priority: 'High',
  },

  // 6-8 Months
  {
    id: 'c-6',
    task: 'Create your free custom wedding website with online RSVP',
    category: 'Invitations & Paper',
    monthRange: '6-8 Months',
    completed: true,
    priority: 'High',
  },
  {
    id: 'c-7',
    task: 'Choose invitation style & order 3D digital save-the-dates',
    category: 'Invitations & Paper',
    monthRange: '6-8 Months',
    completed: false,
    priority: 'High',
  },
  {
    id: 'c-8',
    task: 'Shop for bridal lehenga/gown and groom sherwani/suit',
    category: 'Attire & Beauty',
    monthRange: '6-8 Months',
    completed: false,
    priority: 'High',
  },
  {
    id: 'c-9',
    task: 'Book caterer, schedule menu tasting & finalize dietary options (Jain/Vegan)',
    category: 'Ceremony & Reception',
    monthRange: '6-8 Months',
    completed: false,
    priority: 'High',
  },
  {
    id: 'c-10',
    task: 'Book DJ, live music band, and sound production team',
    category: 'Vendors & Music',
    monthRange: '6-8 Months',
    completed: false,
    priority: 'Normal',
  },

  // 3-5 Months
  {
    id: 'c-11',
    task: 'Finalize floral arrangements, mandap decor & stage lighting',
    category: 'Ceremony & Reception',
    monthRange: '3-5 Months',
    completed: false,
    priority: 'Normal',
  },
  {
    id: 'c-12',
    task: 'Send official digital & WhatsApp invitations with personal RSVP links',
    category: 'Invitations & Paper',
    monthRange: '3-5 Months',
    completed: false,
    priority: 'High',
  },
  {
    id: 'c-13',
    task: 'Reserve hotel room blocks for out-of-town guests',
    category: 'Venue & Planning',
    monthRange: '3-5 Months',
    completed: false,
    priority: 'High',
  },
  {
    id: 'c-14',
    task: 'Order wedding rings & schedule pre-wedding engagement shoot',
    category: 'Attire & Beauty',
    monthRange: '3-5 Months',
    completed: false,
    priority: 'Normal',
  },

  // 1-2 Months
  {
    id: 'c-15',
    task: 'Track RSVP deadlines and send automated WhatsApp reminders',
    category: 'Invitations & Paper',
    monthRange: '1-2 Months',
    completed: false,
    priority: 'High',
  },
  {
    id: 'c-16',
    task: 'Hair & makeup trials for bride and family members',
    category: 'Attire & Beauty',
    monthRange: '1-2 Months',
    completed: false,
    priority: 'Normal',
  },
  {
    id: 'c-17',
    task: 'Create detailed day-of event itinerary & share with vendors',
    category: 'Venue & Planning',
    monthRange: '1-2 Months',
    completed: false,
    priority: 'High',
  },
  {
    id: 'c-18',
    task: 'Confirm final headcount with venue and caterers',
    category: 'Ceremony & Reception',
    monthRange: '1-2 Months',
    completed: false,
    priority: 'High',
  },

  // Final Weeks
  {
    id: 'c-19',
    task: 'Final dress & sherwani fitting; pack wedding day emergency kit',
    category: 'Attire & Beauty',
    monthRange: 'Final Weeks',
    completed: false,
    priority: 'High',
  },
  {
    id: 'c-20',
    task: 'Assign day-of roles (guest greeter, transport coordinator, ring bearer)',
    category: 'Venue & Planning',
    monthRange: 'Final Weeks',
    completed: false,
    priority: 'High',
  },
  {
    id: 'c-21',
    task: 'Relax, celebrate at the Sangeet & Mehendi, and cherish every moment!',
    category: 'Ceremony & Reception',
    monthRange: 'Final Weeks',
    completed: false,
    priority: 'High',
  },
];

export const ChecklistPage: React.FC = () => {
  const [tasks, setTasks] = useState<ChecklistItem[]>(() => {
    const saved = localStorage.getItem('knot_wedding_checklist');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [activeTab, setActiveTab] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<ChecklistItem['category']>('Venue & Planning');
  const [newTaskRange, setNewTaskRange] = useState<ChecklistItem['monthRange']>('6-8 Months');
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedTip, setCopiedTip] = useState(false);

  useEffect(() => {
    localStorage.setItem('knot_wedding_checklist', JSON.stringify(tasks));
  }, [tasks]);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const newItem: ChecklistItem = {
      id: `custom-${Date.now()}`,
      task: newTaskText.trim(),
      category: newTaskCategory,
      monthRange: newTaskRange,
      completed: false,
      priority: 'Normal',
    };

    setTasks((prev) => [newItem, ...prev]);
    setNewTaskText('');
    setShowAddModal(false);
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100) || 0;

  const monthRanges = ['All', '10-12 Months', '6-8 Months', '3-5 Months', '1-2 Months', 'Final Weeks'];
  const categories = ['All', 'Venue & Planning', 'Attire & Beauty', 'Invitations & Paper', 'Vendors & Music', 'Ceremony & Reception'];

  const filteredTasks = tasks.filter((item) => {
    const matchMonth = activeTab === 'All' || item.monthRange === activeTab;
    const matchCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchMonth && matchCategory;
  });

  return (
    <div className="min-h-screen bg-[#faf5eb] text-[#484036] flex flex-col font-sans">
      <Header />

      {/* Top Banner Hero inspired by The Knot Checklist */}
      <section className="bg-[#ecece4] border-b border-[#cacab0] py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-maroon-700/10 text-maroon-800 text-xs font-semibold uppercase tracking-wider">
                <Sparkles size={14} className="text-maroon-700" />
                <span>The Knot-Inspired Wedding Checklist</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#33302c] tracking-tight">
                Your Month-by-Month Wedding Checklist
              </h1>
              <p className="text-sm sm:text-base text-[#666e72] max-w-2xl leading-relaxed">
                Stay effortlessly organized from your first engagement champagne toast to your final reception dance. Check off items, add custom to-dos, and keep stress at zero.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2.5 bg-maroon-700 hover:bg-maroon-800 text-white rounded-xl text-sm font-medium shadow-sm transition-all flex items-center gap-2"
              >
                <Plus size={16} />
                <span>Add Custom Task</span>
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 rounded-xl text-sm font-medium shadow-sm transition-all flex items-center gap-2 no-print"
              >
                <Download size={16} />
                <span>Print Checklist</span>
              </button>
            </div>
          </div>

          {/* Progress Card */}
          <div className="mt-8 p-6 bg-white rounded-2xl border border-[#cacab0] shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-stone-500">
                  Overall Planning Completion
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-3xl font-bold text-maroon-700">
                    {progressPercent}%
                  </span>
                  <span className="text-xs text-stone-500">
                    ({completedCount} of {tasks.length} tasks completed)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs px-3 py-1 rounded-full bg-saffron-100 text-saffron-800 font-medium">
                  {tasks.length - completedCount} tasks remaining
                </span>
                <Link
                  to="/weddings"
                  className="text-xs font-semibold text-maroon-700 hover:underline flex items-center gap-1"
                >
                  <span>Sync with Wedding</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
              <div
                className="h-full bg-gradient-to-r from-maroon-700 to-saffron-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Checklist Body */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Timeline Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-stone-200 no-print">
          {monthRanges.map((m) => (
            <button
              key={m}
              onClick={() => setActiveTab(m)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === m
                  ? 'bg-maroon-700 text-white shadow-sm'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Secondary Category Filter */}
        <div className="flex items-center justify-between flex-wrap gap-4 py-4">
          <div className="flex items-center gap-2 overflow-x-auto text-xs text-stone-600">
            <span className="font-semibold text-stone-500 uppercase tracking-wider text-[11px] shrink-0">
              Category:
            </span>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  selectedCategory === c
                    ? 'bg-[#ecece4] text-[#33302c] font-bold border border-stone-300'
                    : 'hover:bg-stone-200/50 text-stone-600'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <span className="text-xs text-stone-500">
            Showing {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>

        {/* Tasks List */}
        <div className="space-y-3 mt-2">
          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-stone-300">
              <CheckCircle2 size={36} className="mx-auto text-stone-300 mb-2" />
              <p className="font-serif text-lg text-stone-700">All tasks in this section completed!</p>
              <p className="text-xs text-stone-500 mt-1">
                Take a moment to enjoy your progress or browse upcoming milestones.
              </p>
            </div>
          ) : (
            filteredTasks.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all flex items-start gap-3.5 group ${
                  item.completed
                    ? 'bg-stone-50/70 border-stone-200 text-stone-400'
                    : 'bg-white border-[#cacab0] hover:border-maroon-700 shadow-sm'
                }`}
              >
                <button
                  onClick={() => toggleTask(item.id)}
                  className={`mt-0.5 shrink-0 rounded-full transition-transform active:scale-90 ${
                    item.completed ? 'text-emerald-600' : 'text-stone-300 hover:text-maroon-700'
                  }`}
                  aria-label={item.completed ? 'Mark incomplete' : 'Mark complete'}
                >
                  {item.completed ? (
                    <CheckCircle2 size={22} className="fill-emerald-100" />
                  ) : (
                    <Circle size={22} />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className={`text-sm font-medium transition-all cursor-pointer ${
                        item.completed
                          ? 'line-through text-stone-400'
                          : 'text-stone-900 font-semibold'
                      }`}
                      onClick={() => toggleTask(item.id)}
                    >
                      {item.task}
                    </p>
                    {item.priority === 'High' && !item.completed && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        Priority
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-1.5 text-xs text-stone-500">
                    <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-600 font-medium">
                      {item.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {item.monthRange}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => deleteTask(item.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-stone-100 transition-all no-print shrink-0"
                  aria-label="Delete task"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Planner Pro Tip Card */}
        <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-cream-100 to-saffron-50 border border-saffron-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-saffron-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900">
                The Knot Planner Tip: Send RSVPs 8–10 Weeks Prior
              </h3>
              <p className="text-xs text-stone-600 mt-1 max-w-xl leading-relaxed">
                Indian weddings and destination celebrations have higher attendance when digital reminders are sent via WhatsApp with personalized guest links. You will cut follow-up time by 75%!
              </p>
            </div>
          </div>

          <Link
            to="/weddings"
            className="px-4 py-2.5 bg-maroon-700 hover:bg-maroon-800 text-white rounded-xl text-xs font-semibold shrink-0 shadow-sm transition-all"
          >
            Manage Guest RSVPs →
          </Link>
        </div>
      </main>

      {/* Add Custom Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-stone-200 p-6 shadow-2xl animate-fade-in">
            <h3 className="font-serif text-xl font-bold text-stone-900 mb-1">Add a Wedding To-Do</h3>
            <p className="text-xs text-stone-500 mb-4">
              Add custom items for your specific cultural traditions or destination needs.
            </p>

            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Task Description
                </label>
                <input
                  type="text"
                  required
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  placeholder="e.g. Order customized safas & turbans for baraat"
                  className="w-full px-3.5 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-maroon-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Category
                </label>
                <select
                  value={newTaskCategory}
                  onChange={(e) => setNewTaskCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-maroon-700 focus:outline-none bg-white"
                >
                  <option value="Venue & Planning">Venue & Planning</option>
                  <option value="Attire & Beauty">Attire & Beauty</option>
                  <option value="Invitations & Paper">Invitations & Paper</option>
                  <option value="Vendors & Music">Vendors & Music</option>
                  <option value="Ceremony & Reception">Ceremony & Reception</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Timeline Milestone
                </label>
                <select
                  value={newTaskRange}
                  onChange={(e) => setNewTaskRange(e.target.value as any)}
                  className="w-full px-3.5 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-maroon-700 focus:outline-none bg-white"
                >
                  <option value="10-12 Months">10-12 Months</option>
                  <option value="6-8 Months">6-8 Months</option>
                  <option value="3-5 Months">3-5 Months</option>
                  <option value="1-2 Months">1-2 Months</option>
                  <option value="Final Weeks">Final Weeks</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-maroon-700 hover:bg-maroon-800 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
