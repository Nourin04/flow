import React from 'react';

/** A single shimmering placeholder block. Size it with className. */
export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-100 rounded-lg ${className}`} />
);

/** Row of metric-card placeholders (matches the 4-up stat cards). */
export const StatCardsSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center gap-4">
        <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-2.5 w-16" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    ))}
  </div>
);

/** Card with a title and list-row placeholders (transactions, goals, etc.). */
export const ListSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-50">
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className="flex items-center justify-between p-4 gap-3">
        <div className="flex items-center gap-3 flex-1">
          <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-2.5 w-20 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-4 w-16" />
      </div>
    ))}
  </div>
);

/** Generic large-panel placeholders (charts, budget cards). */
export const PanelsSkeleton: React.FC<{ count?: number; className?: string }> = ({ count = 2, className = 'grid grid-cols-1 lg:grid-cols-2 gap-4' }) => (
  <div className={className}>
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4 min-h-[260px]">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-2.5 w-14" />
        </div>
        <Skeleton className="h-44 w-full rounded-xl" />
      </div>
    ))}
  </div>
);
