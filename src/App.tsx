import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Plus,
  ClipboardList,
  ListChecks,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Wallet,
  Users,
  History,
  Send,
  Printer,
  XCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Search,
  X,
  Cloud,
} from 'lucide-react';
import type { Task, Client, FilterType, SortType, TabType } from '@/lib/types';
import { loadTasks, saveTasks, loadClients, saveClients } from '@/lib/storage';
import { syncService, type SyncState } from '@/lib/syncService';
import { getUrgentLabel, formatCurrency, generateId } from '@/lib/utils';
import TaskForm from '@/components/TaskForm';
import TaskCard from '@/components/TaskCard';
import EmptyState from '@/components/EmptyState';
import ConfirmDialog from '@/components/ConfirmDialog';
import HistoryView from '@/components/HistoryView';
import ClientsView from '@/components/ClientsView';
import SyncModal from '@/components/SyncModal';
import logoImg from '@/assets/ahmed1.png';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [tab, setTab] = useState<TabType>('tasks');
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('date');
  const [taskSearch, setTaskSearch] = useState<string>('');
  const [presetClientId, setPresetClientId] = useState<string | null>(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>(syncService.state);

  // Calendar month navigation state
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth()); // 0 = Jan, 11 = Dec

  const months = [
    { index: 0, name: 'January', short: 'Jan' },
    { index: 1, name: 'February', short: 'Feb' },
    { index: 2, name: 'March', short: 'Mar' },
    { index: 3, name: 'April', short: 'Apr' },
    { index: 4, name: 'May', short: 'May' },
    { index: 5, name: 'June', short: 'Jun' },
    { index: 6, name: 'July', short: 'Jul' },
    { index: 7, name: 'August', short: 'Aug' },
    { index: 8, name: 'September', short: 'Sep' },
    { index: 9, name: 'October', short: 'Oct' },
    { index: 10, name: 'November', short: 'Nov' },
    { index: 11, name: 'December', short: 'Dec' },
  ];

  // Helper: does a task have any event day in the given year & month?
  function taskBelongsToMonth(t: Task, year: number, monthIndex: number): boolean {
    if (t.days && t.days.length > 0) {
      return t.days.some((d) => {
        if (!d.date) return false;
        const [y, m] = d.date.split('-').map(Number);
        return y === year && m === monthIndex + 1;
      });
    }
    if (t.createdAt) {
      const d = new Date(t.createdAt);
      return d.getFullYear() === year && d.getMonth() === monthIndex;
    }
    return false;
  }

  // Count scheduled tasks for each month in the selected year
  const monthTaskCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (let m = 0; m < 12; m++) {
      counts[m] = tasks.filter((t) => taskBelongsToMonth(t, selectedYear, m)).length;
    }
    return counts;
  }, [tasks, selectedYear]);

  // Tasks belonging to the currently selected month
  const monthTasks = useMemo(() => {
    return tasks.filter((t) => taskBelongsToMonth(t, selectedYear, selectedMonth));
  }, [tasks, selectedYear, selectedMonth]);

  // 1. Initial load from local cache
  useEffect(() => {
    setTasks(loadTasks());
    setClients(loadClients());
  }, []);

  // 2. Real-time Firebase synchronization
  const restartSync = useCallback(() => {
    return syncService.startSync(
      (remoteTasks) => setTasks(remoteTasks),
      (remoteClients) => setClients(remoteClients)
    );
  }, []);

  useEffect(() => {
    const unsubStatus = syncService.onStatusChange((s) => setSyncState(s));
    const stopSync = restartSync();

    return () => {
      stopSync();
      unsubStatus();
    };
  }, [restartSync]);

  // Keep local storage synced as fallback offline cache
  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    saveClients(clients);
  }, [clients]);

  function handleSaveTask(task: Task) {
    const updatedTask: Task = {
      ...task,
      phoneNumbers: task.phoneNumbers ?? [],
      workDone: task.workDone ?? false,
      workSent: task.workSent ?? false,
      printingDone: task.printingDone ?? false,
      cancelled: task.cancelled ?? false,
    };

    setTasks((prev) => {
      const exists = prev.some((t) => t.id === updatedTask.id);
      if (exists) return prev.map((t) => (t.id === updatedTask.id ? updatedTask : t));
      return [...prev, updatedTask];
    });

    // Cloud sync
    syncService.saveTask(updatedTask);

    // Auto-create client if name is filled and no client selected
    if (!task.clientId && task.name.trim()) {
      const existing = clients.find(
        (c) =>
          c.name.toLowerCase() === task.name.toLowerCase() &&
          c.surname.toLowerCase() === task.surname.toLowerCase()
      );
      if (!existing && task.name.trim()) {
        const newClient: Client = {
          id: generateId(),
          name: task.name.trim(),
          surname: task.surname.trim(),
          phoneNumbers: task.phoneNumbers ?? [],
          location: task.location.trim(),
          createdAt: new Date().toISOString(),
        };
        setClients((prev) => [...prev, newClient]);
        syncService.saveClient(newClient);
      }
    }

    setShowForm(false);
    setEditingTask(null);
    setPresetClientId(null);
  }

  function handleDeleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setDeleteId(null);
    syncService.deleteTask(id);
  }

  function openEdit(task: Task) {
    setEditingTask(task);
    setPresetClientId(null);
    setShowForm(true);
  }

  function openNew() {
    setEditingTask(null);
    setPresetClientId(null);
    setShowForm(true);
  }

  function openNewForClient(client: Client) {
    setEditingTask(null);
    setPresetClientId(client.id);
    setShowForm(true);
    setTab('tasks');
  }

  function handleSaveClient(client: Client) {
    setClients((prev) => {
      const exists = prev.some((c) => c.id === client.id);
      if (exists) return prev.map((c) => (c.id === client.id ? client : c));
      return [...prev, client];
    });
    syncService.saveClient(client);
  }

  function handleUpdateTask(task: Task) {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    syncService.saveTask(task);
  }

  function handleDeleteClient(id: string) {
    setClients((prev) => prev.filter((c) => c.id !== id));
    syncService.deleteClient(id);

    // Unlink tasks from deleted client
    setTasks((prev) =>
      prev.map((t) => {
        if (t.clientId === id) {
          const updated = { ...t, clientId: null };
          syncService.saveTask(updated);
          return updated;
        }
        return t;
      })
    );
  }

  // If presetClientId is set, create a synthetic editing task with client info
  const formTask: Task | null = useMemo(() => {
    if (editingTask) return editingTask;
    if (presetClientId) {
      const client = clients.find((c) => c.id === presetClientId);
      if (client) {
        return {
          id: '',
          clientId: client.id,
          name: client.name,
          surname: client.surname,
          phoneNumbers: client.phoneNumbers || [],
          location: client.location,
          days: [],
          servicePrice: 0,
          cost: 0,
          profit: 0,
          workDone: false,
          workSent: false,
          printingDone: false,
          cancelled: false,
          createdAt: new Date().toISOString(),
        };
      }
    }
    return null;
  }, [editingTask, presetClientId, clients]);

  const filteredTasks = useMemo(() => {
    let result = [...monthTasks];

    // Search filter (client name, surname, phone, email, pack, or event dates)
    if (taskSearch.trim()) {
      const q = taskSearch.trim().toLowerCase();
      result = result.filter((t) => {
        const nameMatch = `${t.name} ${t.surname}`.toLowerCase().includes(q);
        const packMatch = (t.pack || '').toLowerCase().includes(q);
        const phoneMatch = (t.phoneNumbers || []).some((p) => p.toLowerCase().includes(q));
        const emailMatch = (t.emails || []).some((e) => e.toLowerCase().includes(q));
        const dateMatch = (t.days || []).some((d) => {
          if (!d.date) return false;
          // check ISO format: 2026-09-24
          if (d.date.includes(q)) return true;
          // check dd/mm/yyyy formatted string:
          const formatted = formatDate(d.date);
          return formatted.toLowerCase().includes(q);
        });
        return nameMatch || packMatch || phoneMatch || emailMatch || dateMatch;
      });
    }

    if (filter === 'workDone') {
      result = result.filter((t) => t.workDone && !t.cancelled);
    } else if (filter === 'workSent') {
      result = result.filter((t) => t.workSent && !t.cancelled);
    } else if (filter === 'printingDone') {
      result = result.filter((t) => t.printingDone && !t.cancelled);
    } else if (filter === 'pending') {
      result = result.filter((t) => (!t.workDone || !t.printingDone || !t.workSent) && !t.cancelled);
    } else if (filter === 'cancelled') {
      result = result.filter((t) => t.cancelled);
    }

    if (sort === 'date') {
      result.sort((a, b) => {
        const ad = a.days.map((d) => d.date).filter(Boolean).sort()[0] || '9999';
        const bd = b.days.map((d) => d.date).filter(Boolean).sort()[0] || '9999';
        return ad.localeCompare(bd);
      });
    } else if (sort === 'name') {
      result.sort((a, b) => (a.name + a.surname).localeCompare(b.name + b.surname));
    } else if (sort === 'profit') {
      result.sort((a, b) => b.profit - a.profit);
    }

    return result;
  }, [monthTasks, taskSearch, filter, sort]);

  const stats = useMemo(() => {
    const total = monthTasks.length;
    const workDone = monthTasks.filter((t) => t.workDone && !t.cancelled).length;
    const workSent = monthTasks.filter((t) => t.workSent && !t.cancelled).length;
    const printingDone = monthTasks.filter((t) => t.printingDone && !t.cancelled).length;
    const cancelled = monthTasks.filter((t) => t.cancelled).length;
    // Exclude cancelled tasks from profit/service totals
    const totalProfit = monthTasks.filter((t) => !t.cancelled).reduce((sum, t) => sum + t.profit, 0);
    const totalService = monthTasks.filter((t) => !t.cancelled).reduce((sum, t) => sum + t.servicePrice, 0);
    return { total, workDone, workSent, printingDone, cancelled, totalProfit, totalService };
  }, [monthTasks]);

  const filterButtons: { key: FilterType; label: string; icon: typeof ClipboardList; activeClass: string }[] = [
    { key: 'all', label: 'All', icon: ClipboardList, activeClass: 'border-white/30 bg-white/10 text-white' },
    { key: 'workDone', label: 'Work Done', icon: CheckCircle2, activeClass: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]' },
    { key: 'workSent', label: 'Work Sent', icon: Send, activeClass: 'border-violet-500/40 bg-violet-500/20 text-violet-300 shadow-[0_0_12px_rgba(139,92,246,0.2)]' },
    { key: 'printingDone', label: 'Printing Done', icon: Printer, activeClass: 'border-cyan-500/40 bg-cyan-500/20 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]' },
    { key: 'pending', label: 'Pending', icon: Clock, activeClass: 'border-amber-500/40 bg-amber-500/20 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]' },
    { key: 'cancelled', label: 'Cancelled', icon: XCircle, activeClass: 'border-red-500/40 bg-red-500/20 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.2)]' },
  ];

  const tabs: { key: TabType; label: string; icon: typeof ListChecks }[] = [
    { key: 'tasks', label: 'Tasks', icon: ListChecks },
    { key: 'clients', label: 'Clients', icon: Users },
    { key: 'history', label: 'History', icon: History },
  ];

  return (
    <div className="relative min-h-screen bg-black text-slate-100 selection:bg-cyan-500/30">
      {/* Black Ambient Glass Background */}
      <div className="glass-ambient-bg" />

      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-30 glass-header">
          <div className="w-full px-4 py-3 sm:px-8 xl:px-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={logoImg}
                  alt="Logo"
                  className="h-10 sm:h-24 md:h-32 lg:h-36 w-auto object-contain drop-shadow-[0_0_28px_rgba(255,255,255,0.35)] transition-all"
                />
              </div>
              <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowSyncModal(true)}
                  className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-semibold border transition-all active:scale-95 shadow-sm ${
                    syncState.status === 'connected'
                      ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 shadow-emerald-500/10'
                      : syncState.status === 'syncing' || syncState.status === 'connecting'
                      ? 'border-blue-500/40 bg-blue-500/15 text-blue-300 hover:bg-blue-500/25 shadow-blue-500/10'
                      : syncState.status === 'error'
                      ? 'border-red-500/40 bg-red-500/15 text-red-300 hover:bg-red-500/25 shadow-red-500/10'
                      : 'border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 shadow-amber-500/10'
                  }`}
                  title="Cloud Sync (Synchronize Phone & Desktop)"
                >
                  <Cloud size={16} className={`shrink-0 ${syncState.status === 'syncing' ? 'animate-pulse' : ''}`} />
                  <span className="font-semibold text-xs sm:text-sm">
                    {syncState.status === 'connected'
                      ? 'Synced'
                      : syncState.status === 'syncing'
                      ? 'Syncing'
                      : syncState.status === 'connecting'
                      ? 'Connecting'
                      : syncState.status === 'error'
                      ? 'Error'
                      : 'Sync'}
                  </span>
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      syncState.status === 'connected'
                        ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                        : syncState.status === 'syncing' || syncState.status === 'connecting'
                        ? 'bg-blue-400 animate-ping'
                        : syncState.status === 'error'
                        ? 'bg-red-400'
                        : 'bg-amber-400'
                    }`}
                  />
                </button>

                {tab === 'tasks' && (
                  <button
                    onClick={openNew}
                    className="glass-button-primary flex items-center gap-1.5 sm:gap-2 rounded-xl px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white active:scale-95 shrink-0"
                  >
                    <Plus size={16} /> <span className="hidden xs:inline">New Task</span><span className="xs:hidden">New</span>
                  </button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-4 flex gap-1.5">
              {tabs.map((t) => {
                const Icon = t.icon;
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                      active
                        ? 'border border-cyan-500/40 bg-cyan-500/15 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                        : 'border border-transparent text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-slate-200'
                    }`}
                  >
                    <Icon size={16} /> {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        <main className="w-full px-4 py-6 sm:px-8 xl:px-12">
          {tab === 'tasks' && (
            <>
              {/* Month Calendar Navigation */}
              <div className="mb-6 glass-card rounded-2xl p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                      <CalendarDays size={20} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white tracking-wide">
                        {months[selectedMonth]?.name} {selectedYear}
                      </h2>
                      <p className="text-xs text-slate-400">
                        {monthTasks.length} task{monthTasks.length !== 1 ? 's' : ''} scheduled this month
                      </p>
                    </div>
                  </div>

                  {/* Year Switcher */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setSelectedYear((y) => y - 1)}
                      className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-slate-300 transition hover:border-cyan-500/30 hover:bg-cyan-500/10 hover:text-white"
                      title="Previous Year"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="min-w-[65px] text-center font-bold text-sm text-cyan-300">
                      {selectedYear}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedYear((y) => y + 1)}
                      className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-slate-300 transition hover:border-cyan-500/30 hover:bg-cyan-500/10 hover:text-white"
                      title="Next Year"
                    >
                      <ChevronRight size={16} />
                    </button>
                    {(selectedYear !== currentDate.getFullYear() || selectedMonth !== currentDate.getMonth()) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedYear(currentDate.getFullYear());
                          setSelectedMonth(currentDate.getMonth());
                        }}
                        className="ml-2 rounded-xl border border-cyan-500/30 bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/25"
                      >
                        Current Month
                      </button>
                    )}
                  </div>
                </div>

                {/* 12 Months Grid */}
                <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12">
                  {months.map((m) => {
                    const isSelected = selectedMonth === m.index;
                    const count = monthTaskCounts[m.index] || 0;
                    const isCurrent =
                      currentDate.getFullYear() === selectedYear && currentDate.getMonth() === m.index;

                    return (
                      <button
                        key={m.index}
                        type="button"
                        onClick={() => setSelectedMonth(m.index)}
                        className={`group relative flex flex-col items-center justify-center rounded-xl py-2.5 px-2 transition-all duration-200 ${
                          isSelected
                            ? 'border border-cyan-500/50 bg-cyan-500/20 text-white shadow-[0_0_15px_rgba(6,182,212,0.25)] font-bold'
                            : 'border border-white/5 bg-white/[0.02] text-slate-400 hover:border-white/15 hover:bg-white/[0.06] hover:text-white'
                        }`}
                      >
                        {isCurrent && (
                          <span className="absolute top-1 right-1.5 h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        )}
                        <span className="text-xs uppercase tracking-wider font-semibold">
                          {m.short}
                        </span>
                        <span
                          className={`mt-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                            isSelected
                              ? 'bg-cyan-400/20 text-cyan-200'
                              : count > 0
                                ? 'bg-white/10 text-cyan-300'
                                : 'text-slate-600'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stats */}
              <div className="mb-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
                <div className="glass-card rounded-2xl p-3.5">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <ClipboardList size={15} />
                    <span className="text-[11px] font-semibold uppercase tracking-wide">Total</span>
                  </div>
                  <p className="mt-1 text-xl font-bold text-white">{stats.total}</p>
                </div>
                <div className="glass-card rounded-2xl p-3.5">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 size={15} />
                    <span className="text-[11px] font-semibold uppercase tracking-wide">Work Done</span>
                  </div>
                  <p className="mt-1 text-xl font-bold text-emerald-300">{stats.workDone}</p>
                </div>
                <div className="glass-card rounded-2xl p-3.5">
                  <div className="flex items-center gap-1.5 text-violet-400">
                    <Send size={15} />
                    <span className="text-[11px] font-semibold uppercase tracking-wide">Work Sent</span>
                  </div>
                  <p className="mt-1 text-xl font-bold text-violet-300">{stats.workSent}</p>
                </div>
                <div className="glass-card rounded-2xl p-3.5">
                  <div className="flex items-center gap-1.5 text-cyan-400">
                    <Printer size={15} />
                    <span className="text-[11px] font-semibold uppercase tracking-wide">Printed</span>
                  </div>
                  <p className="mt-1 text-xl font-bold text-cyan-300">{stats.printingDone}</p>
                </div>
                <div className="glass-card rounded-2xl p-3.5">
                  <div className="flex items-center gap-1.5 text-red-400">
                    <XCircle size={15} />
                    <span className="text-[11px] font-semibold uppercase tracking-wide">Cancelled</span>
                  </div>
                  <p className="mt-1 text-xl font-bold text-red-300">{stats.cancelled}</p>
                </div>
                <div className="glass-card rounded-2xl p-3.5">
                  <div className="flex items-center gap-1.5 text-cyan-400">
                    <TrendingUp size={15} />
                    <span className="text-[11px] font-semibold uppercase tracking-wide">Profit</span>
                  </div>
                  <p className="mt-1 text-base font-bold text-cyan-300 truncate">{formatCurrency(stats.totalProfit)}</p>
                </div>
              </div>

              {tasks.length === 0 ? (
                <EmptyState onAdd={openNew} />
              ) : (
                <>
                  {/* Search Bar + Filters & Sort */}
                  <div className="mb-5 space-y-3">
                    {/* Search Input for Client Name or Date */}
                    <div className="relative">
                      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        value={taskSearch}
                        onChange={(e) => setTaskSearch(e.target.value)}
                        placeholder="Search tasks by client name, pack, or date (e.g. 24/09/2026 or 2026-09)..."
                        className="glass-input w-full rounded-xl py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500"
                      />
                      {taskSearch && (
                        <button
                          type="button"
                          onClick={() => setTaskSearch('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                          title="Clear search"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap gap-2">
                        {filterButtons.map((btn) => {
                          const Icon = btn.icon;
                          const active = filter === btn.key;
                          return (
                            <button
                              key={btn.key}
                              onClick={() => setFilter(btn.key)}
                              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                                active
                                  ? btn.activeClass
                                  : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:bg-white/[0.07] hover:text-white'
                              }`}
                            >
                              <Icon size={14} /> {btn.label}
                            </button>
                          );
                        })}
                      </div>
                      <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value as SortType)}
                        className="glass-input rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-200 cursor-pointer"
                      >
                        <option value="date" className="bg-neutral-900 text-white">Sort: Date</option>
                        <option value="name" className="bg-neutral-900 text-white">Sort: Name</option>
                        <option value="profit" className="bg-neutral-900 text-white">Sort: Profit</option>
                      </select>
                    </div>
                  </div>

                  {/* Task List */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredTasks.length === 0 ? (
                      <div className="col-span-full rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-14 text-center backdrop-blur-md">
                        <CalendarDays size={36} className="mx-auto text-cyan-400/40" />
                        <h3 className="mt-3 text-sm font-bold text-white">
                          No tasks for {months[selectedMonth]?.name} {selectedYear}
                        </h3>
                        <p className="mt-1 text-xs text-slate-400">
                          {filter !== 'all'
                            ? `No tasks match the filter "${filter}" in this month.`
                            : `There are currently no tasks scheduled in ${months[selectedMonth]?.name}.`}
                        </p>
                        <button
                          type="button"
                          onClick={openNew}
                          className="glass-button-primary mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white"
                        >
                          <Plus size={15} /> Add Task in {months[selectedMonth]?.name}
                        </button>
                      </div>
                    ) : (
                      filteredTasks.map((task) => (
                        <TaskCard key={task.id} task={task} onEdit={openEdit} onDelete={(id) => setDeleteId(id)} onUpdate={handleUpdateTask} />
                      ))
                    )}
                  </div>
                </>
              )}

              {tasks.length > 0 && (
                <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-500">
                  <Wallet size={14} />
                  Total service value: <span className="font-semibold text-slate-300">{formatCurrency(stats.totalService)}</span>
                </div>
              )}
            </>
          )}

          {tab === 'clients' && (
            <ClientsView
              clients={clients}
              tasks={tasks}
              onSaveClient={handleSaveClient}
              onDeleteClient={handleDeleteClient}
              onAddTaskForClient={openNewForClient}
            />
          )}

          {tab === 'history' && <HistoryView tasks={tasks} />}
        </main>
      </div>

      {/* Modals */}
      {showForm && (
        <TaskForm
          task={formTask}
          clients={clients}
          onSave={handleSaveTask}
          onClose={() => {
            setShowForm(false);
            setEditingTask(null);
            setPresetClientId(null);
          }}
        />
      )}

      {deleteId && (
        <ConfirmDialog
          message="This task and all its days will be permanently removed."
          onConfirm={() => handleDeleteTask(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {/* Cloud Synchronization Settings Modal */}
      <SyncModal
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        tasks={tasks}
        clients={clients}
        onConfigSaved={() => {
          restartSync();
        }}
      />
    </div>
  );
}
