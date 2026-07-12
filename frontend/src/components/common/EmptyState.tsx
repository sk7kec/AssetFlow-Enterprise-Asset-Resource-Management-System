import React from 'react';
import { LucideIcon, FolderOpen } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = FolderOpen,
  action,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-8 md:p-12 border border-dashed border-border rounded-2xl bg-card/15 flex flex-col items-center text-center max-w-lg mx-auto select-none"
    >
      <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-muted-foreground mb-4">
        <Icon className="w-5 h-5" />
      </div>
      
      <h3 className="font-display font-bold text-sm text-foreground">
        {title}
      </h3>
      
      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
        {description}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-indigo-600 text-white shadow-md shadow-indigo-500/10 hover:shadow-lg transition-all cursor-pointer"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
};
