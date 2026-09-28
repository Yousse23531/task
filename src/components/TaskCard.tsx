import { useState } from 'react';
import {
  MapPin,
  Calendar,
  CheckCircle2,
  Circle,
  Printer,
  Pencil,
  Trash2,
  AlertTriangle,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Send,
  XCircle,
  Phone,
  Mail,
  CreditCard,
  Package,
} from 'lucide-react';
import type { Task } from '@/lib/types';
import { formatCurrency, formatDate, getUrgentLabel } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onUpdate: (task: Task) => void;
}

export default function TaskCard({ task, onEdit, onDelete, onUpdate }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);

  const earliestDate = task.days.map((d) => d.date).filter(Boolean).sort()[0];
  const urgentLabel = earliestDate ? getUrgentLabel(earliestDate) : null;
  const sortedDays = [...task.days].sort((a, b) => a.date.localeCompare(b.date));

  const isCancelled = task.cancelled;

  const advance = task.advancePayment || 0;
  const remaining = Math.max(0, task.servicePrice - advance);

  function toggleWorkDone() {
    if (isCancelled) return;
    const next = !task.workDone;
    onUpdate({
      ...task,
      workDone: next,
      days: task.days.map((d) => ({ ...d, workDone: next })),
    });
  }

  function toggleWorkSent() {
    if (isCancelled) return;
    onUpdate({ ...task, workSent: !task.workSent });
  }

  function togglePrintingDone() {
    if (isCancelled) return;
    const next = !task.printingDone;
    onUpdate({
      ...task,
      printingDone: next,
      days: task.days.map((d) => ({ ...d, printingDone: next })),
    });
  }

  function toggleCancelled() {
    onUpdate({ ...task, cancelled: !task.cancelled });
  }

  return (
    <div
      className={`glass-card group relative overflow-hidden rounded-2xl ${
        isCancelled
          ? '!border-red-500/40 !bg-red-950/20 shadow-[0_0_25px_rgba(239,68,68,0.1)] opacity-75'
          : urgentLabel
          ? '!border-amber-500/40 !bg-amber-950/20 shadow-[0_0_25px_rgba(245,158,11,0.12)]'
          : ''
      }`}
    >
      {/* Cancelled banner */}
      {isCancelled && (
        <div className="flex items-center gap-2 border-b border-red-500/30 bg-red-500/20 px-4 py-2 text-sm font-bold text-red-300 backdrop-blur-md">
          <XCircle size={16} />
          CANCELLED — Profit excluded
        </div>
      )}

      {/* Urgent banner (only if not cancelled) */}
      {!isCancelled && urgentLabel && (
        <div className="flex items-center gap-2 border-b border-amber-500/20 bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-300 backdrop-blur-md">
          <AlertTriangle size={16} className="animate-pulse" />
          {urgentLabel}
        </div>
      )}

      <div className="p-5">
        {/* Header: Name + Pack + Actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={`truncate text-base font-bold tracking-wide ${isCancelled ? 'text-slate-400 line-through' : 'text-white'}`}>
                {task.name} {task.surname}
              </h3>
              {task.pack && (
                <span className="inline-flex items-center gap-1 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-xs font-semibold text-cyan-300">
                  <Package size={11} className="text-cyan-400" />
                  {task.pack}
                </span>
              )}
            </div>

            {/* Phone numbers & Emails */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {task.phoneNumbers && task.phoneNumbers.map((phone, idx) => (
                <a
                  key={`phone-${idx}`}
                  href={`tel:${phone}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs font-medium text-cyan-300 transition hover:border-cyan-500/40 hover:bg-cyan-500/15"
                  title="Call"
                >
                  <Phone size={11} className="text-cyan-400" />
                  {phone}
                </a>
              ))}
              {task.emails && task.emails.map((email, idx) => (
                <a
                  key={`email-${idx}`}
                  href={`mailto:${email}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs font-medium text-indigo-300 transition hover:border-indigo-500/40 hover:bg-indigo-500/15"
                  title="Email"
                >
                  <Mail size={11} className="text-indigo-400" />
                  {email}
                </a>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {!isCancelled && (
              <button
                onClick={() => onEdit(task)}
                className="rounded-xl border border-transparent p-2 text-slate-400 transition-all duration-200 hover:border-white/10 hover:bg-white/10 hover:text-cyan-300"
                title="Edit Task"
              >
                <Pencil size={16} />
              </button>
            )}
            <button
              onClick={() => onDelete(task.id)}
              className="rounded-xl border border-transparent p-2 text-slate-400 transition-all duration-200 hover:border-red-500/20 hover:bg-red-500/15 hover:text-red-400"
              title="Delete Task"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Location & days row */}
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-400">
          {task.location && (
            <a
              href={task.location.startsWith('http') ? task.location : `https://maps.google.com/?q=${encodeURIComponent(task.location)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-cyan-400 transition-colors hover:text-cyan-300 hover:underline"
            >
              <MapPin size={14} /> Main Location
              <ExternalLink size={11} />
            </a>
          )}
          {task.days.length > 0 && (
            <span className="inline-flex items-center gap-1.5 text-slate-300 font-medium">
              <Calendar size={14} className="text-cyan-400" />
              {task.days.length === 1
                ? formatDate(task.days[0].date)
                : `${task.days.length} days (${formatDate(sortedDays[0]?.date)}${sortedDays.length > 1 ? ` - ${formatDate(sortedDays[sortedDays.length - 1]?.date)}` : ''})`}
            </span>
          )}
        </div>

        {/* Financials with Advance Payment and Remaining Balance */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Service</p>
            <p className="mt-0.5 text-sm font-bold text-white">{formatCurrency(task.servicePrice)}</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Advance</p>
            <p className="mt-0.5 text-sm font-bold text-amber-300">
              {formatCurrency(advance)}
            </p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Remaining</p>
            <p className={`mt-0.5 text-sm font-bold ${remaining > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {formatCurrency(remaining)}
            </p>
          </div>
          <div
            className={`rounded-xl border px-3 py-2 ${
              isCancelled
                ? 'border-red-500/20 bg-red-500/10'
                : task.profit > 0
                ? 'border-emerald-500/20 bg-emerald-500/10'
                : task.profit < 0
                ? 'border-red-500/20 bg-red-500/10'
                : 'border-white/5 bg-white/[0.03]'
            }`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Profit</p>
            {isCancelled ? (
              <p className="mt-0.5 text-sm font-bold text-red-400">—</p>
            ) : (
              <p className={`mt-0.5 flex items-center gap-1 text-sm font-bold ${task.profit > 0 ? 'text-emerald-300' : task.profit < 0 ? 'text-red-300' : 'text-white'}`}>
                {task.profit > 0 ? <TrendingUp size={12} /> : task.profit < 0 ? <TrendingDown size={12} /> : <DollarSign size={12} />}
                {formatCurrency(task.profit)}
              </p>
            )}
          </div>
        </div>

        {/* ── Action Checkboxes (Only 4 Checkboxes) ── */}
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/5 pt-3 sm:grid-cols-4">
          {/* 1. Work Done */}
          <button
            type="button"
            onClick={toggleWorkDone}
            disabled={isCancelled}
            className={`flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-semibold transition-all duration-200 ${
              isCancelled
                ? 'cursor-not-allowed border-white/5 bg-white/[0.02] text-slate-600'
                : task.workDone
                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-300'
            }`}
          >
            {task.workDone ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Circle size={14} />}
            Work Done
          </button>

          {/* 2. Work Sent */}
          <button
            type="button"
            onClick={toggleWorkSent}
            disabled={isCancelled}
            className={`flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-semibold transition-all duration-200 ${
              isCancelled
                ? 'cursor-not-allowed border-white/5 bg-white/[0.02] text-slate-600'
                : task.workSent
                ? 'border-violet-500/40 bg-violet-500/15 text-violet-300 shadow-[0_0_12px_rgba(139,92,246,0.2)]'
                : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-violet-300'
            }`}
          >
            {task.workSent ? <Send size={13} className="text-violet-400" /> : <Circle size={14} />}
            Work Sent
          </button>

          {/* 3. Printing Done */}
          <button
            type="button"
            onClick={togglePrintingDone}
            disabled={isCancelled}
            className={`flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-semibold transition-all duration-200 ${
              isCancelled
                ? 'cursor-not-allowed border-white/5 bg-white/[0.02] text-slate-600'
                : task.printingDone
                ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-300'
            }`}
          >
            {task.printingDone ? <Printer size={13} className="text-cyan-400" /> : <Circle size={14} />}
            Printing Done
          </button>

          {/* 4. Cancelled */}
          <button
            type="button"
            onClick={toggleCancelled}
            className={`flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-semibold transition-all duration-200 ${
              isCancelled
                ? 'border-red-500/50 bg-red-500/20 text-red-300 shadow-[0_0_14px_rgba(239,68,68,0.25)]'
                : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300'
            }`}
          >
            {isCancelled ? <XCircle size={14} className="text-red-400" /> : <Circle size={14} />}
            Cancelled
          </button>
        </div>

        {/* Days expand */}
        {task.days.length > 0 && (
          <>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-3 flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2 text-xs font-semibold text-slate-400 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.06] hover:text-slate-200"
            >
              <span>View {task.days.length} day{task.days.length !== 1 ? 's' : ''}</span>
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {expanded && (
              <div className="mt-2 space-y-2">
                {sortedDays.map((day, idx) => (
                  <div
                    key={day.id}
                    className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 backdrop-blur-md"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-cyan-300">
                        Day {idx + 1} — {formatDate(day.date)}
                      </span>
                      {day.location && (
                        <a
                          href={day.location.startsWith('http') ? day.location : `https://maps.google.com/?q=${encodeURIComponent(day.location)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-cyan-400 transition hover:text-cyan-300 hover:underline"
                        >
                          <MapPin size={11} /> {day.location.length > 28 ? `${day.location.slice(0, 25)}...` : day.location}
                          <ExternalLink size={9} />
                        </a>
                      )}
                    </div>
                    {day.comments && (
                      <p className="mt-1.5 text-xs text-slate-400">{day.comments}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
