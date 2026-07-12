import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable } from '../components/common/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { Sparkles, CalendarDays, RefreshCw, UserPlus } from 'lucide-react';
import { formatDateTime } from '../utils';

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user_name: string;
}

export const ActivityLogs: React.FC = () => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(15);

  // Fetch summary to parse activities log
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard_summary_logs'],
    queryFn: () => dashboardService.getSummary(),
  });

  const logs = data?.recent_activities || [];

  const columns: ColumnDef<ActivityItem>[] = [
    {
      accessorKey: 'type',
      header: 'Operation Type',
      cell: ({ row }) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase border bg-accent/25 text-muted-foreground border-border/80">
          {row.original.type}
        </span>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Operation Description',
      cell: ({ row }) => <span className="font-semibold text-foreground">{row.original.description}</span>,
    },
    {
      accessorKey: 'user_name',
      header: 'Performed By',
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.user_name}</span>,
    },
    {
      accessorKey: 'timestamp',
      header: 'Audit Stamp Date',
      cell: ({ row }) => <span className="text-muted-foreground">{formatDateTime(row.original.timestamp)}</span>,
    },
  ];

  return (
    <div className="space-y-6 select-none">
      <PageHeader
        title="Database Audit Logs"
        description="Review historical asset life changes, allocations, transfers, and system registers events."
      />

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={logs}
        loading={isLoading}
        pageCount={1}
        pageIndex={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
};
