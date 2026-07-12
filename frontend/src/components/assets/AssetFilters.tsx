import React from 'react';
import { AssetStatus, AssetCondition } from '../../constants';
import { X, RotateCcw } from 'lucide-react';

interface AssetFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  status: string;
  setStatus: (status: string) => void;
  condition: string;
  setCondition: (condition: string) => void;
  isShared: string;
  setIsShared: (shared: string) => void;
  onReset: () => void;
}

export const AssetFilters: React.FC<AssetFiltersProps> = ({
  isOpen,
  onClose,
  status,
  setStatus,
  condition,
  setCondition,
  isShared,
  setIsShared,
  onReset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex z-40 select-none">
      {/* Backdrop overlay */}
      <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm cursor-pointer" onClick={onClose} />

      {/* Slide sheet container */}
      <div className="relative ml-auto max-w-xs w-full h-full bg-card border-l border-border shadow-2xl p-6 flex flex-col z-50 glass-panel">
        <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
          <h3 className="text-sm font-bold text-foreground font-display uppercase tracking-wide">
            Filter Catalog
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer"
              title="Reset Filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto">
          {/* Status */}
          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Asset State Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-9 px-3 border border-border bg-card rounded-lg text-xs text-foreground focus:outline-none cursor-pointer"
            >
              <option value="">All States</option>
              {Object.values(AssetStatus).map((state) => (
                <option key={state} value={state} className="capitalize">
                  {state.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Condition */}
          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Hardware Condition
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full h-9 px-3 border border-border bg-card rounded-lg text-xs text-foreground focus:outline-none cursor-pointer"
            >
              <option value="">All Conditions</option>
              {Object.values(AssetCondition).map((cond) => (
                <option key={cond} value={cond} className="capitalize">
                  {cond}
                </option>
              ))}
            </select>
          </div>

          {/* Capability Shared */}
          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Allocation Group Type
            </label>
            <select
              value={isShared}
              onChange={(e) => setIsShared(e.target.value)}
              className="w-full h-9 px-3 border border-border bg-card rounded-lg text-xs text-foreground focus:outline-none cursor-pointer"
            >
              <option value="">All Types</option>
              <option value="true">Shared Pool (Reservable)</option>
              <option value="false">Individual Assignment</option>
            </select>
          </div>
        </div>

        {/* Action controls */}
        <div className="pt-4 border-t border-border/40 mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={onReset}
            className="h-10 rounded-xl text-xs font-semibold border border-border text-muted-foreground hover:bg-accent cursor-pointer"
          >
            Clear Filters
          </button>
          <button
            onClick={onClose}
            className="h-10 rounded-xl text-xs font-semibold bg-primary hover:bg-indigo-600 text-white shadow-md cursor-pointer"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};
