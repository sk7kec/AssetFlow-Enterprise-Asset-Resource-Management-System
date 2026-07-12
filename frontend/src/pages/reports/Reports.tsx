import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsService } from '../../services/reports.service';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../constants';
import { PageHeader } from '../../components/common/PageHeader';
import { ChartWrapper, CustomTooltip } from '../../components/common/Charts';
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { CardSkeleton, ChartSkeleton } from '../../components/common/SkeletonLoader';
import { FileDown, Download, BarChart2, CalendarRange, TrendingUp, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export const Reports: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.ASSET_MANAGER;

  const [exportLoading, setExportLoading] = useState(false);

  // Queries
  const { data: utilizationData, isLoading: utilLoading } = useQuery({
    queryKey: ['report_utilization'],
    queryFn: () => reportsService.getAssetUtilization(),
  });

  const { data: depreciationData, isLoading: depLoading } = useQuery({
    queryKey: ['report_depreciation'],
    queryFn: () => reportsService.getDepreciationValuation(),
  });

  const { data: heatmapData, isLoading: heatLoading } = useQuery({
    queryKey: ['report_heatmap'],
    queryFn: () => reportsService.getBookingHeatmap(),
  });

  const handleExport = async (
    module: 'assets' | 'allocations' | 'maintenance',
    format: 'csv' | 'xlsx' | 'pdf'
  ) => {
    setExportLoading(true);
    toast.loading(`Compiling export binary...`);
    try {
      await reportsService.downloadExport(module, format);
      toast.dismiss();
      toast.success('Document downloaded successfully');
    } catch (err) {
      toast.dismiss();
      toast.error('Failed to compile report export');
    } finally {
      setExportLoading(false);
    }
  };

  const isLoading = utilLoading || depLoading || heatLoading;

  return (
    <div className="space-y-6 select-none">
      <PageHeader
        title="Analytical Reports"
        description="Review inventory utilization grids, assets depreciation timelines, and export catalog tables."
      />

      {/* Export Section */}
      <div className="p-6 border border-border bg-card/65 rounded-2xl space-y-4 glass-panel">
        <h3 className="text-xs font-bold text-foreground font-display uppercase tracking-wide flex items-center gap-1.5">
          <FileDown className="w-4 h-4 text-indigo-500" />
          <span>Export Inventory Sheets</span>
        </h3>
        <p className="text-[11px] text-muted-foreground">
          Download real-time database registers formatted into CSV spreadsheets, Excel worksheets, or printable PDF sheets.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Assets export */}
          <div className="p-4 border border-border rounded-xl bg-accent/15 flex flex-col justify-between h-[120px]">
            <div>
              <h4 className="font-semibold text-xs text-foreground">Assets Catalog</h4>
              <p className="text-[10px] text-muted-foreground mt-0.5">Asset tags, conditions, purchase values</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleExport('assets', 'csv')}
                className="flex-1 py-1.5 rounded-lg border border-border text-[10px] font-bold hover:bg-accent cursor-pointer flex justify-center items-center gap-1"
              >
                <span>CSV</span>
              </button>
              <button
                onClick={() => handleExport('assets', 'xlsx')}
                className="flex-1 py-1.5 rounded-lg border border-border text-[10px] font-bold hover:bg-accent cursor-pointer flex justify-center items-center gap-1"
              >
                <span>Excel</span>
              </button>
            </div>
          </div>

          {/* Allocations export */}
          <div className="p-4 border border-border rounded-xl bg-accent/15 flex flex-col justify-between h-[120px]">
            <div>
              <h4 className="font-semibold text-xs text-foreground">Allocations Register</h4>
              <p className="text-[10px] text-muted-foreground mt-0.5">Assignment history, return dates, overdue tags</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleExport('allocations', 'csv')}
                className="flex-1 py-1.5 rounded-lg border border-border text-[10px] font-bold hover:bg-accent cursor-pointer flex justify-center items-center gap-1"
              >
                <span>CSV</span>
              </button>
              <button
                onClick={() => handleExport('allocations', 'xlsx')}
                className="flex-1 py-1.5 rounded-lg border border-border text-[10px] font-bold hover:bg-accent cursor-pointer flex justify-center items-center gap-1"
              >
                <span>Excel</span>
              </button>
            </div>
          </div>

          {/* Maintenance export */}
          <div className="p-4 border border-border rounded-xl bg-accent/15 flex flex-col justify-between h-[120px]">
            <div>
              <h4 className="font-semibold text-xs text-foreground">Maintenance Tickets</h4>
              <p className="text-[10px] text-muted-foreground mt-0.5">Repair requests, cost metrics, assignment logs</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleExport('maintenance', 'csv')}
                className="flex-1 py-1.5 rounded-lg border border-border text-[10px] font-bold hover:bg-accent cursor-pointer flex justify-center items-center gap-1"
              >
                <span>CSV</span>
              </button>
              <button
                onClick={() => handleExport('maintenance', 'xlsx')}
                className="flex-1 py-1.5 rounded-lg border border-border text-[10px] font-bold hover:bg-accent cursor-pointer flex justify-center items-center gap-1"
              >
                <span>Excel</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Depreciation Valuation projection chart */}
          {depreciationData && (
            <ChartWrapper title="Total Net Book Asset Value Projection">
              <AreaChart
                data={depreciationData.projections || []}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
                <XAxis
                  dataKey="year"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 9, fontWeight: 500 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 9, fontWeight: 500 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="book_value"
                  stroke="#6366f1"
                  fill="url(#colorVal)"
                  strokeWidth={2}
                />
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ChartWrapper>
          )}

          {/* Utilization Area summary */}
          {utilizationData && (
            <ChartWrapper title="Asset Utilization Rate Trends">
              <AreaChart
                data={utilizationData.trends || []}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 9, fontWeight: 500 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 9, fontWeight: 500 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="utilization"
                  stroke="#06b6d4"
                  fill="url(#colorUtil)"
                  strokeWidth={2}
                />
                <defs>
                  <linearGradient id="colorUtil" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ChartWrapper>
          )}
        </div>
      )}
    </div>
  );
};
