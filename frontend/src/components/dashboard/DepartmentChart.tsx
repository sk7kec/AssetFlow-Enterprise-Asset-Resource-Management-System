import React from 'react';
import { ChartWrapper, CustomTooltip } from '../common/Charts';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { DashboardKPIs } from '../../types';

interface DepartmentChartProps {
  data: DashboardKPIs['charts']['assets_by_department'];
}

export const DepartmentChart: React.FC<DepartmentChartProps> = ({ data = [] }) => {
  // Vibrant gradients to color the bars
  const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];

  return (
    <ChartWrapper title="Assets Distributed by Department">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'var(--muted-foreground)', fontSize: 9, fontWeight: 500 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'var(--muted-foreground)', fontSize: 9, fontWeight: 500 }}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
        <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={38}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ChartWrapper>
  );
};
