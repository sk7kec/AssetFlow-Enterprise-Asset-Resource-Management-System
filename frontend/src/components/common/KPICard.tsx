import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface KPICardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  color = 'primary',
  trend,
}) => {
  const getColorClasses = () => {
    switch (color) {
      case 'success':
        return {
          bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
          text: 'text-emerald-600 dark:text-emerald-400',
          border: 'border-emerald-500/20',
        };
      case 'warning':
        return {
          bg: 'bg-amber-500/10 dark:bg-amber-500/20',
          text: 'text-amber-600 dark:text-amber-400',
          border: 'border-amber-500/20',
        };
      case 'danger':
        return {
          bg: 'bg-rose-500/10 dark:bg-rose-500/20',
          text: 'text-rose-600 dark:text-rose-400',
          border: 'border-rose-500/20',
        };
      case 'info':
        return {
          bg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
          text: 'text-cyan-600 dark:text-cyan-400',
          border: 'border-cyan-500/20',
        };
      default:
        return {
          bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
          text: 'text-indigo-600 dark:text-indigo-400',
          border: 'border-indigo-500/20',
        };
    }
  };

  const colors = getColorClasses();

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={`p-6 rounded-2xl border border-border bg-card/60 hover:bg-card hover:shadow-lg transition-all flex flex-col justify-between glass-card`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            {title}
          </span>
          <span className="text-3xl font-display font-extrabold tracking-tight text-foreground">
            {value}
          </span>
        </div>
        <div className={`p-3 rounded-xl ${colors.bg} ${colors.text} shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtext || trend) && (
        <div className="mt-4 pt-3 border-t border-border/55 flex items-center justify-between text-xs text-muted-foreground">
          {trend ? (
            <div className="flex items-center gap-1">
              <span className={`font-bold ${trend.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                {trend.isPositive ? '+' : '-'}{trend.value}%
              </span>
              <span>vs last month</span>
            </div>
          ) : (
            <span className="truncate">{subtext}</span>
          )}
        </div>
      )}
    </motion.div>
  );
};
