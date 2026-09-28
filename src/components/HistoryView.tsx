import { useMemo, useState } from 'react';
import {
  History,
  MapPin,
  Calendar,
  CheckCircle2,
  Circle,
  Printer,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ExternalLink,
  Search,
  ChevronDown,
  ChevronUp,
  XCircle,
  Phone,
  Package,
} from 'lucide-react';
import type { Task } from '@/lib/types';
import { formatCurrency, formatDate, isPastEvent } from '@/lib/utils';

interface HistoryViewProps {
  tasks: Task[];
}

export default function HistoryView({ tasks }: HistoryViewProps) {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const pastTasks = useMemo(() => {
    // Include tasks that have past days OR are cancelled
    const past = tasks.filter((t) =>
      t.cancelled || t.days.some((d) => d.date && isPastEvent(d.date))
    );

    const filtered = search.trim()
      ? past.filter((t) => {
          const full = `${t.name} ${t.surname} ${(t.phoneNumbers || []).join(' ')}`.toLowerCase();
          return full.includes(search.toLowerCase());
        })
      : past;

    const sorted = [...filtered].sort((a, b) => {
      const aDate = a.days.map((d) => d.date).filter(Boolean).sort().reverse()[0] || '';
      const bDate = b.days.map((d) => d.date).filter(Boolean).sort().reverse()[0] || '';
      return bDate.localeCompare(aDate);
    });

    return sorted;
  }, [tasks, search]);

  const totals = useMemo(() => {
    // Exclude cancelled tasks from financial totals
    const activePast = pastTasks.filter((t) => !t.cancelled);
    const totalService = activePast.reduce((s, t) => s + t.servicePrice, 0);
    const totalCost = activePast.reduce((s, t) => s + t.cost, 0);
    const totalProfit = activePast.reduce((s, t) => s + t.profit, 0);
    return { totalService, totalCost, totalProfit };
  }, [pastTasks]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <History size={20} className="text-cyan-400" />
        <h2 className="text-lg font-bold text-white tracking-wide">Event History</h2>
        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/15 px-2.5 py-0.5 text-xs font-semibold text-cyan-300">
          {pastTasks.length} past
        </span>
      </div>

      {/* Summary */}
      {pastTasks.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card rounded-xl p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Total Service</p>
            <p className="mt-0.5 text-sm font-bold text-white">{formatCurrency(totals.totalService)}</p>
          </div>
          <div className="glass-card rounded-xl p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Total Cost</p>
            <p className="mt-0.5 text-sm font-bold text-white">{formatCurrency(totals.totalCost)}</p>
          </div>
          <div className={`glass-card rounded-xl p-3 ${
            totals.totalProfit > 0
              ? '!border-emerald-500/30 !bg-emerald-500/10'
              : '!border-red-500/30 !bg-red-500/10'
          }`}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Total Profit</p>
            <p className={`mt-0.5 flex items-center gap-1 text-sm font-bold ${
              totals.totalProfit > 0 ? 'text-emerald-300' : 'text-red-300'
            }`}>
              {totals.totalProfit > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {formatCurrency(totals.totalProfit)}
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      {tasks.length > 0 && (
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client name..."
            className="glass-input w-full rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500"
          />
        </div>
      )}

      {pastTasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-16 text-center backdrop-blur-md">
          <History size={36} className="mx-auto text-cyan-400/50" />
          <p className="mt-3 text-sm text-slate-400">
            {tasks.length === 0
              ? 'No events recorded yet.'
              : 'No past events found. Past events will appear here automatically.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5">
          {pastTasks.map((task) => {
            const expanded = expandedId === task.id;
            const pastDays = task.days
              .filter((d) => d.date && isPastEvent(d.date))
              .sort((a, b) => b.date.localeCompare(a.date));
            const latestDate = pastDays[0]?.date;
            const allWorkDone = pastDays.length > 0 && pastDays.every((d) => d.workDone);
            const isCancelled = task.cancelled;

            return (
              <div
                key={task.id}
                className={`glass-card overflow-hidden rounded-2xl ${isCancelled ? '!border-red-500/30 opacity-70' : ''}`}
              >
                {isCancelled && (
                  <div className="flex items-center gap-2 border-b border-red-500/20 bg-red-500/15 px-4 py-1.5 text-xs font-bold text-red-400">
                    <XCircle size={13} /> CANCELLED
                  </div>
                )}
                <button
                  onClick={() => setExpandedId(expanded ? null : task.id)}
                  className="flex w-full items-center justify-between p-4 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className={`truncate text-sm font-bold tracking-wide ${isCancelled ? 'text-slate-400 line-through' : 'text-white'}`}>
                        {task.name} {task.surname}
                      </h3>
                      {task.pack && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-300">
                          <Package size={10} className="text-cyan-400" />
                          {task.pack}
                        </span>
                      )}
                    </div>
                    {/* Phone numbers & Emails */}
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {task.phoneNumbers && task.phoneNumbers.map((phone, idx) => (
                        <span
                          key={`phone-${idx}`}
                          className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[11px] font-medium text-cyan-300"
                        >
                          <Phone size={10} className="text-cyan-400" />
                          {phone}
                        </span>
                      ))}
                      {task.emails && task.emails.map((email, idx) => (
                        <span
                          key={`email-${idx}`}
                          className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[11px] font-medium text-indigo-300"
                        >
                          {email}
                        </span>
                      ))}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      {latestDate && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={11} /> Last: {formatDate(latestDate)}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        {pastDays.length} past day{pastDays.length !== 1 ? 's' : ''}
                      </span>
                      {!isCancelled && (allWorkDone ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 size={11} /> Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-400">
                          <Circle size={11} /> Incomplete
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isCancelled ? (
                      <span className="text-sm font-bold text-red-400">—</span>
                    ) : (
                      <span className={`text-sm font-bold ${task.profit > 0 ? 'text-emerald-300' : task.profit < 0 ? 'text-red-300' : 'text-white'}`}>
                        {task.profit > 0 ? <TrendingUp size={12} className="inline" /> : task.profit < 0 ? <TrendingDown size={12} className="inline" /> : <DollarSign size={12} className="inline" />}
                        {' '}{formatCurrency(task.profit)}
                      </span>
                    )}
                    {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </div>
                </button>

                {expanded && (
                  <div className="border-t border-white/10 p-4 backdrop-blur-md">
                    {task.location && (
                      <a
                        href={task.location.startsWith('http') ? task.location : `https://maps.google.com/?q=${encodeURIComponent(task.location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mb-3 inline-flex items-center gap-1.5 text-xs text-cyan-400 transition hover:text-cyan-300 hover:underline"
                      >
                        <MapPin size={12} /> Location <ExternalLink size={10} />
                      </a>
                    )}
                    <div className="grid grid-cols-2 gap-2 mb-3 sm:grid-cols-4">
                      <div className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase text-slate-500">Service</p>
                        <p className="text-xs font-bold text-white">{formatCurrency(task.servicePrice)}</p>
                      </div>
                      <div className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase text-slate-500">Advance</p>
                        <p className="text-xs font-bold text-amber-300">{formatCurrency(task.advancePayment || 0)}</p>
                      </div>
                      <div className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase text-slate-500">Remaining</p>
                        <p className={`text-xs font-bold ${Math.max(0, task.servicePrice - (task.advancePayment || 0)) > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {formatCurrency(Math.max(0, task.servicePrice - (task.advancePayment || 0)))}
                        </p>
                      </div>
                      <div className={`rounded-xl border px-3 py-2 ${
                        task.profit > 0 ? 'border-emerald-500/20 bg-emerald-500/10' : task.profit < 0 ? 'border-red-500/20 bg-red-500/10' : 'border-white/5 bg-white/[0.03]'
                      }`}>
                        <p className="text-[10px] font-semibold uppercase text-slate-500">Profit</p>
                        <p className={`text-xs font-bold ${
                          task.profit > 0 ? 'text-emerald-300' : task.profit < 0 ? 'text-red-300' : 'text-white'
                        }`}>{formatCurrency(task.profit)}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {pastDays.map((day) => (
                        <div key={day.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-bold text-cyan-300">
                              {formatDate(day.date)}
                            </span>
                            {day.location && (
                              <a
                                href={day.location.startsWith('http') ? day.location : `https://maps.google.com/?q=${encodeURIComponent(day.location)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-cyan-400 transition hover:text-cyan-300 hover:underline"
                              >
                                <MapPin size={10} /> {day.location.length > 25 ? `${day.location.slice(0, 22)}...` : day.location}
                                <ExternalLink size={9} />
                              </a>
                            )}
                            <div className="flex items-center gap-2.5">
                              <span className={`flex items-center gap-1 text-xs ${
                                day.workDone ? 'text-emerald-400' : 'text-slate-500'
                              }`}>
                                {day.workDone ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                                Work
                              </span>
                              <span className={`flex items-center gap-1 text-xs ${
                                day.printingDone ? 'text-cyan-400' : 'text-slate-500'
                              }`}>
                                <Printer size={12} />
                                Print
                              </span>
                            </div>
                          </div>
                          {day.comments && (
                            <p className="mt-1.5 text-xs text-slate-400">{day.comments}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
