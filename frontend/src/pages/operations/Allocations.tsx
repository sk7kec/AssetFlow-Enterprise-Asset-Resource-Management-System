import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { allocationsService } from '../../services/allocations.service';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole, AssetCondition } from '../../constants';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { AllocationModal } from '../../components/operations/AllocationModal';
import { Allocation } from '../../types';
import { ColumnDef } from '@tanstack/react-table';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Plus, UserPlus, UserMinus, RefreshCw, ClipboardList, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils';

export const Allocations: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role;
  const isManager = role === UserRole.ADMIN || role === UserRole.ASSET_MANAGER;

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('active');

  // Modal open states
  const [allocateOpen, setAllocateOpen] = useState(false);

  // Query
  const { data, isLoading } = useQuery({
    queryKey: ['allocations', page, pageSize, statusFilter],
    queryFn: () =>
      allocationsService.list({
        page: page + 1,
        page_size: pageSize,
        status: statusFilter || undefined,
      }),
  });

  // Mutate Return
  const returnMutation = useMutation({
    mutationFn: ({ id, condition, notes }: { id: string; condition: string; notes?: string }) =>
      allocationsService.returnAsset(id, { condition_on_return: condition, return_notes: notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset returned to inventory catalog');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to process return');
    },
  });

  // Mutate Transfer
  const transferMutation = useMutation({
    mutationFn: ({ id, targetEmp, reason }: { id: string; targetEmp: string; reason?: string }) =>
      allocationsService.transfer({ allocation_id: id, target_employee_id: targetEmp, reason }),
    onSuccess: (resp) => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      toast.success(resp.message || 'Transfer request initiated');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to initiate transfer');
    },
  });

  const handleReturnPrompt = (alloc: Allocation) => {
    // Simple verification dialog flow
    const condition = window.prompt(
      `Enter return condition for ${alloc.asset_name}:\n(new, excellent, good, fair, poor, broken)`
    );
    if (!condition) return;

    const lowerCond = condition.toLowerCase().trim();
    const validConditions = Object.values(AssetCondition) as string[];
    if (!validConditions.includes(lowerCond)) {
      toast.error('Invalid condition label. Return cancelled.');
      return;
    }

    const notes = window.prompt('Return comments/notes (Optional):') || '';
    returnMutation.mutate({ id: alloc.id, condition: lowerCond, notes });
  };

  const handleTransferPrompt = (alloc: Allocation) => {
    const targetEmp = window.prompt('Enter target Employee ID code (e.g. EMP-002):');
    if (!targetEmp) return;

    const reason = window.prompt('Reason for asset transfer (Optional):') || '';
    transferMutation.mutate({ id: alloc.id, targetEmp: targetEmp.toUpperCase().trim(), reason });
  };

  const columns: ColumnDef<Allocation>[] = [
    {
      accessorKey: 'asset_name',
      header: 'Hardware Asset',
      cell: ({ row }) => (
        <div className="flex flex-col select-none">
          <span className="font-semibold text-foreground">{row.original.asset_name}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5 font-mono">{row.original.asset_tag}</span>
        </div>
      ),
    },
    {
      accessorKey: 'employee_name',
      header: 'Assigned User',
      cell: ({ row }) => (
        <div className="flex flex-col select-none">
          <span className="font-semibold text-foreground">{row.original.employee_name}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5 font-mono">{row.original.employee_id}</span>
        </div>
      ),
    },
    {
      accessorKey: 'allocated_at',
      header: 'Allocation Date',
      cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.allocated_at)}</span>,
    },
    {
      accessorKey: 'due_date',
      header: 'Return Due Date',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.due_date ? formatDate(row.original.due_date) : '-'}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Allocation Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: 'Actions Control',
      cell: ({ row }) => {
        const isActive = row.original.status === 'active' || row.original.status === 'overdue';
        if (!isActive || !isManager) return <span className="text-muted-foreground/40 text-[11px]">-</span>;

        return (
          <div className="flex items-center gap-1.5 select-none">
            {/* Return Asset */}
            <button
              onClick={() => handleReturnPrompt(row.original)}
              className="p-1.5 rounded-lg border border-border text-emerald-600 hover:bg-emerald-500/10 transition-all cursor-pointer flex items-center gap-1 text-[11px]"
              title="Return Asset"
            >
              <UserMinus className="w-3.5 h-3.5" />
              <span>Return</span>
            </button>

            {/* Transfer Asset */}
            <button
              onClick={() => handleTransferPrompt(row.original)}
              className="p-1.5 rounded-lg border border-border text-indigo-500 hover:bg-indigo-500/10 transition-all cursor-pointer flex items-center gap-1 text-[11px]"
              title="Transfer to Employee"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Transfer</span>
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 select-none">
      <PageHeader
        title="Asset Allocations"
        description="Track active hardware assignments, process asset returns, or request device transfers."
      >
        {isManager && (
          <button
            onClick={() => setAllocateOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-indigo-600 text-xs font-semibold text-white shadow-md shadow-indigo-500/10 hover:shadow-lg transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Allocate Asset</span>
          </button>
        )}
      </PageHeader>

      {/* Filter Header controls */}
      <div className="flex items-center gap-3 bg-card/45 p-4 border border-border rounded-2xl glass-card max-w-sm select-none">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
          className="h-9 px-3 border border-border bg-card rounded-lg text-xs text-foreground focus:outline-none cursor-pointer w-full"
        >
          <option value="">All Allocations</option>
          <option value="active">Active Allocations</option>
          <option value="returned">Returned Catalog</option>
          <option value="overdue">Overdue Assignments</option>
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

      {/* Modal alloc */}
      <AllocationModal
        isOpen={allocateOpen}
        onClose={() => setAllocateOpen(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['allocations'] })}
      />
    </div>
  );
};
