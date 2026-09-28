import { ClipboardList, Plus } from 'lucide-react';

interface EmptyStateProps {
  onAdd: () => void;
}

export default function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-20 text-center backdrop-blur-md">
      <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-5 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
        <ClipboardList size={40} className="text-cyan-400" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-white tracking-wide">No tasks yet</h3>
      <p className="mt-1 max-w-xs text-sm text-slate-400">
        Create your first task to start tracking events, work status, and profits.
      </p>
      <button
        onClick={onAdd}
        className="glass-button-primary mt-5 flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
      >
        <Plus size={18} /> Add First Task
      </button>
    </div>
  );
}
