import React from 'react';
import { cn } from '../../utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const getBadgeStyles = (val: string) => {
    const formatted = val.toLowerCase().replace(/_/g, ' ');

    switch (formatted) {
      // Asset States
      case 'available':
      case 'verified':
      case 'active':
      case 'approved':
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      
      case 'allocated':
      case 'assigned':
      case 'in progress':
      case 'linear':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
      
      case 'maintenance':
      case 'pending':
      case 'pending transfer':
      case 'medium':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      
      case 'reserved':
      case 'room':
      case 'vehicle':
      case 'equipment':
        return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
      
      case 'disposed':
      case 'draft':
      case 'closed':
      case 'returned':
      case 'inactive':
      case 'low':
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
      
      case 'lost':
      case 'broken':
      case 'poor':
      case 'discrepancy':
      case 'missing':
      case 'overdue':
      case 'rejected':
      case 'cancelled':
      case 'high':
      case 'critical':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';

      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  const formattedLabel = status.replace(/_/g, ' ').toUpperCase();

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md border font-display text-[9px] font-bold tracking-wide select-none',
        getBadgeStyles(status),
        className
      )}
    >
      {formattedLabel}
    </span>
  );
};
