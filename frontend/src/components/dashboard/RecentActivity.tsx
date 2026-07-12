import React from 'react';
import { DashboardKPIs } from '../../types';
import { formatDateTime } from '../../utils';
import { 
  Sparkles, 
  UserPlus, 
  Wrench, 
  ClipboardCheck, 
  CalendarDays, 
  RefreshCw 
} from 'lucide-react';

interface RecentActivityProps {
  activities: DashboardKPIs['recent_activities'];
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  const getActivityIcon = (type?: string) => {
    const normalized = (type ?? '').toLowerCase();
    switch (normalized) {
      case 'allocation':
        return <UserPlus className="w-4 h-4 text-emerald-500" />;
      case 'maintenance':
        return <Wrench className="w-4 h-4 text-amber-500" />;
      case 'audit':
        return <ClipboardCheck className="w-4 h-4 text-indigo-500" />;
      case 'booking':
        return <CalendarDays className="w-4 h-4 text-cyan-500" />;
      case 'transfer':
        return <RefreshCw className="w-4 h-4 text-rose-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <div className="p-6 border border-border rounded-2xl bg-card/60 flex flex-col glass-card h-full select-none">
      <h3 className="text-sm font-bold text-foreground font-display mb-6 uppercase tracking-wide">
        Recent Activity
      </h3>

      <div className="flex-1 overflow-y-auto space-y-4 max-h-[340px] pr-2">
        {activities.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-10">
            No recent logs in database audit trial.
          </p>
        ) : (
          activities.map((act) => (
            <div key={act.id} className="flex gap-3 text-xs leading-normal">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
                {getActivityIcon(act.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">
                  {act.description}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  By {act.user_name} &bull; {formatDateTime(act.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
