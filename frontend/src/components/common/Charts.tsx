import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface ChartWrapperProps {
  title: string;
  children: React.ReactNode;
  height?: number;
}

export const ChartWrapper: React.FC<ChartWrapperProps> = ({
  title,
  children,
  height = 300,
}) => {
  return (
    <div className="p-6 border border-border rounded-2xl bg-card/60 flex flex-col justify-between glass-card">
      <h3 className="text-sm font-bold text-foreground font-display mb-6 select-none uppercase tracking-wide">
        {title}
      </h3>
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Tooltip custom style helper matching dark theme
export const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 dark:bg-slate-950/95 border border-slate-800 p-3 rounded-xl shadow-2xl text-[11px] text-slate-200">
        {label && <p className="font-semibold mb-1">{label}</p>}
        {payload.map((p: any, idx: number) => (
          <p key={idx} className="flex items-center gap-1.5 mt-0.5">
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: p.color }}
            />
            <span>{p.name}:</span>
            <span className="font-semibold">{p.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};
