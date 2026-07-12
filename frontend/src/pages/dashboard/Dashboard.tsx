import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../../services/dashboard.service';
import { PageHeader } from '../../components/common/PageHeader';
import { KPIGrid } from '../../components/dashboard/KPIGrid';
import { QuickActions } from '../../components/dashboard/QuickActions';
import { RecentActivity } from '../../components/dashboard/RecentActivity';
import { DepartmentChart } from '../../components/dashboard/DepartmentChart';
import { CardSkeleton, ChartSkeleton } from '../../components/common/SkeletonLoader';
import { RefreshCw, CalendarDays, ClipboardCheck, LayoutGrid } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_LABELS } from '../../constants';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard_summary'],
    queryFn: () => dashboardService.getSummary(),
    refetchOnWindowFocus: false,
  });

  return (
    <div className="space-y-8 select-none">
      {/* Title */}
      <PageHeader
        title={`Welcome, ${user?.full_name || 'User'}`}
        description={`Account: ${user ? ROLE_LABELS[user.role] : 'Employee Portal'}. Track resources, allocations, and service tickets.`}
      >
        <button
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-card/65 text-xs font-semibold text-foreground hover:text-foreground hover:bg-accent transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
          <span>Refresh Analytics</span>
        </button>
      </PageHeader>

      {isLoading ? (
        <div className="space-y-6">
          <CardSkeleton count={4} />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ChartSkeleton />
            </div>
            <div>
              <ChartSkeleton />
            </div>
          </div>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Top Row: KPI Cards Grid */}
          <KPIGrid kpis={data.kpis} />

          {/* Middle Row: Charts, Quick Actions, and Timelines */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Department Chart */}
            <div className="lg:col-span-2">
              <DepartmentChart data={data.charts.assets_by_department} />
            </div>
            {/* Quick Actions Shortcuts */}
            <div>
              <QuickActions />
            </div>
          </div>

          {/* Bottom Row: Activities timeline & Overdue items list */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Activities Timeline */}
            <div className="lg:col-span-2">
              <RecentActivity activities={data.recent_activities} />
            </div>

            {/* Overdue/Outstanding Lists */}
            <div className="p-6 border border-border rounded-2xl bg-card/60 flex flex-col justify-between glass-card select-none">
              <h3 className="text-sm font-bold text-foreground font-display mb-5 uppercase tracking-wide flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-indigo-500" />
                <span>Outstanding Requests</span>
              </h3>

              <div className="flex-grow space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {data.overdue_allocations.length === 0 && data.upcoming_maintenance.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-12">
                    No outstanding overdue allocations or bookings.
                  </p>
                ) : (
                  <>
                    {/* Overdue Allocations */}
                    {data.overdue_allocations.map((alloc) => (
                      <div key={alloc.id} className="p-3 border border-rose-500/10 bg-rose-500/5 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <p className="font-semibold text-foreground">{alloc.asset_name}</p>
                          <p className="text-[10px] text-rose-500 font-medium mt-0.5">Overdue &bull; {alloc.employee_name}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-600 text-[10px] font-bold">
                          {alloc.days_overdue}d
                        </span>
                      </div>
                    ))}

                    {/* Upcoming Maintenance Tasks */}
                    {data.upcoming_maintenance.map((maint) => (
                      <div key={maint.id} className="p-3 border border-border bg-accent/20 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <p className="font-semibold text-foreground">{maint.asset_name}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Priority: {maint.priority}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {new Date(maint.scheduled_start).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-10">
          Failed to load dashboard metrics.
        </p>
      )}
    </div>
  );
};
