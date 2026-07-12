import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsService } from '../../services/bookings.service';
import { useAuth } from '../../contexts/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { BookingModal } from '../../components/operations/BookingCalendar';
import { Booking } from '../../types';
import { ColumnDef } from '@tanstack/react-table';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CalendarPlus, Trash2, CalendarDays, ClipboardCheck, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDateTime } from '../../utils';

export const Bookings: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  
  // Filter types
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);

  // Query Bookings
  const { data, isLoading } = useQuery({
    queryKey: ['bookings', page, pageSize, typeFilter, statusFilter],
    queryFn: () =>
      bookingsService.list({
        page: page + 1,
        page_size: pageSize,
        booking_type: typeFilter || undefined,
        status: statusFilter || undefined,
      }),
  });

  // Mutate Cancel
  const cancelMutation = useMutation({
    mutationFn: (id: string) => bookingsService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking cancelled successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to cancel booking');
    },
  });

  const handleCancel = (id: string) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      cancelMutation.mutate(id);
    }
  };

  const columns: ColumnDef<Booking>[] = [
    {
      accessorKey: 'asset_name',
      header: 'Reserved Resource',
      cell: ({ row }) => (
        <div className="flex flex-col select-none">
          <span className="font-semibold text-foreground">{row.original.asset_name}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5 font-mono">{row.original.asset_tag}</span>
        </div>
      ),
    },
    {
      accessorKey: 'user_name',
      header: 'Reserved By',
      cell: ({ row }) => <span className="font-semibold text-foreground">{row.original.user_name}</span>,
    },
    {
      accessorKey: 'start_time',
      header: 'Reservation Start',
      cell: ({ row }) => <span className="text-muted-foreground">{formatDateTime(row.original.start_time)}</span>,
    },
    {
      accessorKey: 'end_time',
      header: 'Reservation End',
      cell: ({ row }) => <span className="text-muted-foreground">{formatDateTime(row.original.end_time)}</span>,
    },
    {
      accessorKey: 'purpose',
      header: 'Purpose Details',
      cell: ({ row }) => (
        <span className="text-muted-foreground truncate max-w-[140px] sm:max-w-xs block">
          {row.original.purpose}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const canCancel =
          row.original.status === 'pending' || row.original.status === 'approved';
        const isOwner = row.original.user_id === user?.id;
        
        if (!canCancel || (!isOwner && user?.role !== 'admin')) {
          return <span className="text-muted-foreground/35 text-[10px]">-</span>;
        }

        return (
          <button
            onClick={() => handleCancel(row.original.id)}
            className="p-1.5 rounded-lg border border-border text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-all cursor-pointer"
            title="Cancel Booking"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 select-none">
      <PageHeader
        title="Resource Bookings"
        description="Book conference rooms, pool vehicles, or laboratory equipment."
      >
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-indigo-600 text-xs font-semibold text-white shadow-md shadow-indigo-500/10 hover:shadow-lg transition-all cursor-pointer"
        >
          <CalendarPlus className="w-4 h-4" />
          <span>Book Resource</span>
        </button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-card/45 p-4 border border-border rounded-2xl glass-card select-none">
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(0);
          }}
          className="h-9 px-3 border border-border bg-card rounded-lg text-xs text-foreground focus:outline-none cursor-pointer min-w-[140px]"
        >
          <option value="">All Resource Types</option>
          <option value="room">Conference Rooms</option>
          <option value="vehicle">Pool Vehicles</option>
          <option value="equipment">Lab/Audio Hardware</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
          className="h-9 px-3 border border-border bg-card rounded-lg text-xs text-foreground focus:outline-none cursor-pointer min-w-[140px]"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending Approvals</option>
          <option value="approved">Approved Slots</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={data?.items || []}
        loading={isLoading}
        pageCount={data?.total_pages || 1}
        pageIndex={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      {/* Booking Modal dialogue */}
      <BookingModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['bookings'] })}
      />
    </div>
  );
};
