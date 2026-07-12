import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auditsService } from '../../services/audits.service';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../constants';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { AuditVerificationModal } from '../../components/operations/AuditVerification';
import { AuditCycle, AuditVerification } from '../../types';
import { ColumnDef } from '@tanstack/react-table';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Plus, ClipboardCheck, Play, ShieldAlert, Sparkles, FolderDown, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { FormField, Input } from '../../components/common/FormField';
import toast from 'react-hot-toast';
import { parseApiError, formatDate } from '../../utils';

const cycleSchema = zod.object({
  name: zod.string().min(2, 'Name must be at least 2 characters'),
  description: zod.string().optional(),
  start_date: zod.string().min(1, 'Start date is required'),
  end_date: zod.string().min(1, 'End date is required'),
});

type CycleFormValues = zod.infer<typeof cycleSchema>;

export const Audits: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  
  // Modals state
  const [createOpen, setCreateOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  
  // Discrepancy details display
  const [discrepancyData, setDiscrepancyData] = useState<any | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CycleFormValues>({
    resolver: zodResolver(cycleSchema),
    defaultValues: { name: '', description: '', start_date: '', end_date: '' },
  });

  // Query Cycles
  const { data, isLoading } = useQuery({
    queryKey: ['audit_cycles', page, pageSize],
    queryFn: () => auditsService.listCycles({ page: page + 1, page_size: pageSize }),
  });

  // Mutate create cycle
  const createMutation = useMutation({
    mutationFn: (values: CycleFormValues) => auditsService.createCycle(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit_cycles'] });
      toast.success('Audit cycle created');
      setCreateOpen(false);
      reset();
    },
    onError: (err) => {
      toast.error(parseApiError(err));
    },
  });

  // Mutate Start Cycle
  const startMutation = useMutation({
    mutationFn: (id: string) => auditsService.startCycle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit_cycles'] });
      toast.success('Audit cycle transitioned to ACTIVE');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to start cycle');
    },
  });

  // Mutate Close Cycle
  const closeMutation = useMutation({
    mutationFn: (id: string) => auditsService.closeCycle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit_cycles'] });
      toast.success('Audit cycle CLOSED successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to close cycle');
    },
  });

  const handleStart = (id: string) => {
    if (window.confirm('Start this audit cycle? This transitions status state to active.')) {
      startMutation.mutate(id);
    }
  };

  const handleCloseCycle = (id: string) => {
    if (window.confirm('Close this audit cycle? This finalizes verifying metrics.')) {
      closeMutation.mutate(id);
    }
  };

  const handleOpenVerify = (id: string) => {
    setSelectedCycleId(id);
    setVerifyOpen(true);
  };

  const handleDiscrepancyReport = async (id: string) => {
    toast.promise(
      auditsService.getDiscrepancyReport(id),
      {
        loading: 'Compiling discrepancy report...',
        success: (report) => {
          setDiscrepancyData(report);
          return 'Discrepancy report compiled';
        },
        error: 'Failed to generate report',
      }
    );
  };

  const onSubmit = (values: CycleFormValues) => {
    createMutation.mutate(values);
  };

  const columns: ColumnDef<AuditCycle>[] = [
    {
      accessorKey: 'name',
      header: 'Audit Campaign Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center">
            <ClipboardCheck className="w-4 h-4" />
          </div>
          <span className="font-semibold text-foreground">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'start_date',
      header: 'Duration',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatDate(row.original.start_date)} - {formatDate(row.original.end_date)}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Audit Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: 'Lifecycle Actions',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <div className="flex items-center gap-1.5 select-none text-xs">
            {/* Start Cycle */}
            {status === 'draft' && isAdmin && (
              <button
                onClick={() => handleStart(row.original.id)}
                className="p-1.5 rounded-lg border border-border text-emerald-600 hover:bg-emerald-500/10 transition-all cursor-pointer flex items-center gap-1 text-[11px]"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Start</span>
              </button>
            )}

            {/* Verify Assets */}
            {status === 'active' && (
              <button
                onClick={() => handleOpenVerify(row.original.id)}
                className="p-1.5 rounded-lg border border-border text-indigo-500 hover:bg-indigo-500/10 transition-all cursor-pointer flex items-center gap-1 text-[11px]"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Verify</span>
              </button>
            )}

            {/* Discrepancy report */}
            {(status === 'active' || status === 'completed' || status === 'closed') && (
              <button
                onClick={() => handleDiscrepancyReport(row.original.id)}
                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all cursor-pointer flex items-center gap-1 text-[11px]"
              >
                <FolderDown className="w-3.5 h-3.5" />
                <span>Discrepancies</span>
              </button>
            )}

            {/* Close Cycle */}
            {status === 'active' && isAdmin && (
              <button
                onClick={() => handleCloseCycle(row.original.id)}
                className="p-1.5 rounded-lg border border-border text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-all cursor-pointer flex items-center gap-1 text-[11px]"
              >
                <span>Close</span>
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 select-none">
      <PageHeader
        title="Physical Audits"
        description="Verify hardware placements, check status records accuracy, and review missing discrepancies."
      >
        {isAdmin && (
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-indigo-600 text-xs font-semibold text-white shadow-md shadow-indigo-500/10 hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Cycle</span>
          </button>
        )}
      </PageHeader>

      {/* Discrepancy Report Summary Display */}
      {discrepancyData && (
        <div className="p-6 border border-border rounded-2xl bg-card/65 glass-panel space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h3 className="text-sm font-bold text-foreground font-display flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>Discrepancy Report Summary ({discrepancyData.cycle_name})</span>
            </h3>
            <button
              onClick={() => setDiscrepancyData(null)}
              className="p-1 rounded-lg text-muted-foreground hover:bg-accent text-xs"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs font-semibold leading-normal">
            <div className="p-3 rounded-xl border border-border bg-accent/20">
              <p className="text-[10px] text-muted-foreground/60 uppercase">Total Verified Assets</p>
              <p className="text-lg font-extrabold text-foreground">{discrepancyData.verified} / {discrepancyData.total_assets}</p>
            </div>
            <div className="p-3 rounded-xl border border-rose-500/10 bg-rose-500/5">
              <p className="text-[10px] text-rose-500/70 uppercase">Discrepancies Flagged</p>
              <p className="text-lg font-extrabold text-rose-600 dark:text-rose-400">{discrepancyData.discrepancies?.length || 0}</p>
            </div>
          </div>

          {/* Table-like row summary list */}
          {discrepancyData.discrepancies?.length > 0 && (
            <div className="space-y-2 mt-4 max-h-[180px] overflow-y-auto pr-1 text-xs">
              {discrepancyData.discrepancies.map((disc: AuditVerification) => (
                <div key={disc.id} className="p-2.5 border border-border bg-card/45 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{disc.asset_name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{disc.asset_tag} &bull; Condition: {disc.condition}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 text-[10px] font-bold">
                    {disc.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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

      {/* Create Modal Dialog Box */}
      {createOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm cursor-pointer" onClick={() => setCreateOpen(false)} />
          
          <div className="relative max-w-md w-full bg-card border border-border rounded-2xl p-6 shadow-2xl z-50 flex flex-col h-fit glass-panel">
            <h2 className="text-sm font-bold text-foreground font-display pb-4 border-b border-border mb-4">
              Add Audit Campaign
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FormField label="Campaign Title" error={errors.name} required>
                <Input placeholder="e.g. Q3 Hardware Audit 2026" {...register('name')} />
              </FormField>

              <FormField label="Description (Optional)" error={errors.description}>
                <textarea
                  placeholder="Audit campaign specifications..."
                  className="w-full min-h-[60px] p-3 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground/50 resize-y"
                  {...register('description')}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Start Date" error={errors.start_date} required>
                  <Input type="date" {...register('start_date')} />
                </FormField>
                <FormField label="End Date" error={errors.end_date} required>
                  <Input type="date" {...register('end_date')} />
                </FormField>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40 mt-4">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-border text-muted-foreground hover:bg-accent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-indigo-600 text-white shadow-md cursor-pointer flex items-center gap-1"
                >
                  {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Register Campaign</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auditor verification Scanner Dialog */}
      <AuditVerificationModal
        isOpen={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        cycleId={selectedCycleId || ''}
        onSuccess={() => {}}
      />
    </div>
  );
};
