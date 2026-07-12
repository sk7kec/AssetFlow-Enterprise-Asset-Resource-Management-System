import React from 'react';
import { AssetHistory } from '../../types';
import { formatDateTime } from '../../utils';
import { 
  Sparkles, 
  UserPlus, 
  UserMinus, 
  Wrench, 
  ShieldCheck, 
  RefreshCw, 
  Info 
} from 'lucide-react';

interface AssetTimelineProps {
  history: AssetHistory[];
  loading?: boolean;
}

export const AssetTimeline: React.FC<AssetTimelineProps> = ({ history, loading = false }) => {
  const getActionIcon = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('register') || act.includes('create')) {
      return <Sparkles className="w-3.5 h-3.5 text-emerald-500" />;
    }
    if (act.includes('allocate') || act.includes('assign')) {
      return <UserPlus className="w-3.5 h-3.5 text-indigo-500" />;
    }
    if (act.includes('return')) {
      return <UserMinus className="w-3.5 h-3.5 text-slate-500" />;
    }
    if (act.includes('maintenance') || act.includes('repair')) {
      return <Wrench className="w-3.5 h-3.5 text-amber-500" />;
    }
    if (act.includes('audit') || act.includes('verify')) {
      return <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />;
    }
    if (act.includes('transfer')) {
      return <RefreshCw className="w-3.5 h-3.5 text-rose-500" />;
    }
    return <Info className="w-3.5 h-3.5 text-slate-400" />;
  };

  if (loading) {
    return <p className="text-xs text-muted-foreground animate-pulse">Loading history logs...</p>;
  }

  if (history.length === 0) {
    return <p className="text-xs text-muted-foreground">No audit trail logs recorded for this asset.</p>;
  }

  return (
    <div className="relative pl-6 border-l border-border/80 space-y-6 select-none py-1">
      {history.map((item, index) => (
        <div key={item.id || index} className="relative group text-xs">
          {/* Node Icon Indicator */}
          <span className="absolute -left-[33px] top-0.5 flex items-center justify-center w-6 h-6 rounded-full bg-card border border-border shrink-0">
            {getActionIcon(item.action)}
          </span>

          {/* Node Metadata content */}
          <div className="space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="font-bold text-foreground capitalize">
                {item.action.replace(/_/g, ' ')}
              </span>
              <span className="text-[10px] text-muted-foreground/60">
                {formatDateTime(item.created_at)}
              </span>
            </div>
            
            <p className="text-muted-foreground/80 leading-normal">
              {item.notes || 'Asset details changed'}
            </p>

            <p className="text-[10px] text-muted-foreground/50">
              Performed by {item.performed_by_name} {item.ip_address && `• IP: ${item.ip_address}`}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
