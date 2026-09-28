import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="glass-panel w-full max-w-sm rounded-2xl border border-red-500/30 p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="rounded-xl border border-red-500/30 bg-red-500/15 p-2.5">
            <AlertTriangle size={22} className="text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-white">Delete?</h3>
            <p className="mt-1 text-sm text-slate-400">{message}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-xl bg-red-600 border border-red-400/30 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/30 transition hover:bg-red-500"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
