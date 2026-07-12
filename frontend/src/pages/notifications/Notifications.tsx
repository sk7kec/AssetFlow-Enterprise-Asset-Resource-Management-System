import React, { useState } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { PageHeader } from '../../components/common/PageHeader';
import { formatDateTime } from '../../utils';
import { 
  CheckCheck, 
  Trash2, 
  Bell, 
  Info, 
  AlertTriangle, 
  AlertCircle, 
  Sparkles, 
  BellOff 
} from 'lucide-react';
import { DataTable } from '../../components/common/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { Notification } from '../../types';
import toast from 'react-hot-toast';

export const Notifications: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <Sparkles className="w-4 h-4 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'danger':
        return <AlertCircle className="w-4 h-4 text-rose-500" />;
      default:
        return <Info className="w-4 h-4 text-indigo-500" />;
    }
  };

  const columns: ColumnDef<Notification>[] = [
    {
      id: 'icon',
      header: '',
      cell: ({ row }) => <div className="shrink-0">{getIcon(row.original.type)}</div>,
    },
    {
      accessorKey: 'title',
      header: 'Alert Notification',
      cell: ({ row }) => (
        <div className="flex flex-col select-none max-w-sm sm:max-w-lg">
          <span className={`font-semibold ${row.original.is_read ? 'text-muted-foreground' : 'text-foreground'}`}>
            {row.original.title}
          </span>
          <span className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
            {row.original.message}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Date & Time',
      cell: ({ row }) => <span className="text-muted-foreground">{formatDateTime(row.original.created_at)}</span>,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        if (row.original.is_read) {
          return <span className="text-muted-foreground/30 text-[10px]">-</span>;
        }
        return (
          <button
            onClick={() => {
              markAsRead(row.original.id);
              toast.success('Marked as read');
            }}
            className="px-2.5 py-1 rounded-lg border border-border text-xs text-indigo-500 hover:bg-indigo-500/10 cursor-pointer"
          >
            Mark Read
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 select-none">
      <PageHeader
        title="Notifications Center"
        description="Review alerts history, system logs notifications, and approval actions requests."
      >
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-card/65 text-xs font-semibold text-foreground hover:text-foreground hover:bg-accent transition-all cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All as Read</span>
          </button>
        )}
      </PageHeader>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={notifications}
        loading={false}
        pageCount={1}
        pageIndex={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
};
