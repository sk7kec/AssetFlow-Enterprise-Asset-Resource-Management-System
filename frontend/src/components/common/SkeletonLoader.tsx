import React from 'react';
import { cn } from '../../utils';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
  <div className={cn('animate-pulse bg-slate-200 dark:bg-slate-800 rounded-md', className)} />
);

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 4 }) => (
  <div className="w-full border border-border rounded-2xl overflow-hidden bg-card/40">
    <div className="h-12 border-b border-border bg-accent/20 flex items-center px-4 gap-4">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
    <div className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="h-14 flex items-center px-4 gap-4">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <Skeleton key={cIdx} className={cn('h-3.5 flex-1', cIdx === 0 && 'max-w-[140px]', cIdx === cols - 1 && 'max-w-[80px]')} />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="grid md:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="p-6 border border-border rounded-2xl bg-card/45 flex flex-col justify-between h-[140px]">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-28" />
          </div>
          <Skeleton className="w-10 h-10 rounded-xl" />
        </div>
        <Skeleton className="h-3 w-40 mt-4" />
      </div>
    ))}
  </div>
);

export const ChartSkeleton: React.FC = () => (
  <div className="p-6 border border-border rounded-2xl bg-card/45 flex flex-col h-[320px]">
    <div className="flex justify-between items-center mb-6">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-3 w-20" />
    </div>
    <div className="flex-1 flex items-end gap-4 px-2 pb-2">
      <Skeleton className="h-[40%] flex-1" />
      <Skeleton className="h-[75%] flex-1" />
      <Skeleton className="h-[50%] flex-1" />
      <Skeleton className="h-[90%] flex-1" />
      <Skeleton className="h-[60%] flex-1" />
      <Skeleton className="h-[80%] flex-1" />
    </div>
  </div>
);

export const DetailsSkeleton: React.FC = () => (
  <div className="grid md:grid-cols-3 gap-8">
    <div className="md:col-span-2 space-y-6">
      <div className="p-6 border border-border rounded-2xl bg-card/45 space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="p-6 border border-border rounded-2xl bg-card/45 space-y-4">
        <Skeleton className="h-5 w-1/4" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
    <div className="space-y-6">
      <div className="p-6 border border-border rounded-2xl bg-card/45 flex flex-col items-center gap-4">
        <Skeleton className="w-32 h-32 rounded-2xl" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  </div>
);
