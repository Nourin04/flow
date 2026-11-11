import React from 'react';
import { AlertCircle, RotateCw } from 'lucide-react';

/** Banner shown when a page's data failed to load. */
export const LoadError: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-center justify-between gap-3">
    <div className="flex items-center gap-2 min-w-0">
      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
      <span className="truncate">{message}</span>
    </div>
    <button
      onClick={onRetry}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200 hover:bg-rose-100/60 shrink-0 cursor-pointer"
    >
      <RotateCw className="w-3 h-3" /> Retry
    </button>
  </div>
);

