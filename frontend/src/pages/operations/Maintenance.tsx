import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceService } from '../../services/maintenance.service';
import { organizationService } from '../../services/organization.service';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../constants';
import { PageHeader } from '../../components/common/PageHeader';
import { MaintenanceKanban } from '../../components/operations/MaintenanceKanban';
import { TableSkeleton } from '../../components/common/SkeletonLoader';
import { MaintenanceRequest } from '../../types';
import { Plus, Wrench, Loader2, Info } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { FormField, Input, Select } from '../../components/common/FormField';
import toast from 'react-hot-toast';
import { parseApiError } from '../../utils';
import { assetsService } from '../../services/assets.service';

const ticketSchema = zod.object({
  asset_id: zod.string().min(1, 'Asset is required'),
  priority: zod.string().min(1, 'Priority is required'),
  issue_description: zod.string().min(5, 'Description must be at least 5 characters'),
});

type TicketFormValues = zod.infer<typeof ticketSchema>;

export const Maintenance: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isManager = user?.role === UserRole.ADMIN || user?.role === UserRole.ASSET_MANAGER;

  // Modals state
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: { asset_id: '', priority: 'medium', issue_description: '' },
  });

  // Query tickets
  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['maintenance_tickets'],
    queryFn: () => maintenanceService.list({ page: 1, page_size: 100 }),
  });

  // Query assets catalog for dropdown selection
  const { data: assetsData } = useQuery({
    queryKey: ['assets_select_maintenance'],
    queryFn: () => assetsService.list({ page: 1, page_size: 100 }),
  });

  // Mutate Raise Ticket
  const createMutation = useMutation({
    mutationFn: (values: TicketFormValues) => maintenanceService.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance_tickets'] });
      toast.success('Maintenance ticket raised');
      setCreateOpen(false);
      reset();
    },
    onError: (err) => {
      toast.error(parseApiError(err));
    },
  });

  // Mutate Status Update
  const statusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      maintenanceService.updateStatus(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance_tickets'] });
      toast.success('Kanban ticket state updated');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to update ticket');
    },
  });

  // Mutate Technician Assignment
  const assignMutation = useMutation({
    mutationFn: ({ id, techId }: { id: string; techId: string }) =>
      maintenanceService.assignTechnician(id, techId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance_tickets'] });
      toast.success('Technician assigned successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to assign technician');
    },
  });

  const handleStatusChange = (id: string, newStatus: string) => {
    let notes: string | undefined = undefined;
    if (newStatus === 'resolved') {
      const promptNotes = window.prompt('Enter repair resolution notes (Optional):');
      if (promptNotes === null) return; // cancel return
      notes = promptNotes;
    }
    statusMutation.mutate({ id, status: newStatus, notes });
  };

  const handleAssignTechnician = (id: string) => {
    const techId = window.prompt('Enter target Technician User ObjectId ref:');
    if (!techId) return;
    assignMutation.mutate({ id, techId: techId.trim() });
  };

  const onSubmit = (values: TicketFormValues) => {
    createMutation.mutate(values);
  };

  const assetsOptions = [
    { value: '', label: 'Select Asset Hardware' },
    ...(assetsData?.items || []).map((a) => ({
      value: a.id,
      label: `${a.name} (${a.asset_tag})`,
    })),
  ];

  return (
    <div className="space-y-6 select-none">
      <PageHeader
        title="Maintenance Board"
        description="Track active repair tickets, assign service technicians, and log resolved device issues."
      >
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-indigo-600 text-xs font-semibold text-white shadow-md shadow-indigo-500/10 hover:shadow-lg transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Raise Ticket</span>
        </button>
      </PageHeader>

      {/* Kanban Board Container */}
      {isLoading ? (
        <TableSkeleton rows={4} cols={5} />
      ) : (
        <MaintenanceKanban
          tickets={ticketsData?.items || []}
          onStatusChange={handleStatusChange}
          onAssignTechnician={handleAssignTechnician}
          isManager={isManager}
        />
      )}

      {/* Create Modal Dialog Box */}
      {createOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm cursor-pointer" onClick={() => setCreateOpen(false)} />
          
          <div className="relative max-w-md w-full bg-card border border-border rounded-2xl p-6 shadow-2xl z-50 flex flex-col h-fit glass-panel">
            <h2 className="text-sm font-bold text-foreground font-display pb-4 border-b border-border mb-4">
              Raise Maintenance Ticket
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Asset selection */}
              <FormField label="Asset Hardware Reference" error={errors.asset_id} required>
                <Select options={assetsOptions} disabled={createMutation.isPending} {...register('asset_id')} />
              </FormField>

              {/* Priority */}
              <FormField label="Severity Priority" error={errors.priority} required>
                <Select
                  options={[
                    { value: 'low', label: 'LOW' },
                    { value: 'medium', label: 'MEDIUM' },
                    { value: 'high', label: 'HIGH' },
                    { value: 'critical', label: 'CRITICAL' },
                  ]}
                  disabled={createMutation.isPending}
                  {...register('priority')}
                />
              </FormField>

              {/* Issue Description */}
              <FormField label="Issue Description" error={errors.issue_description} required>
                <textarea
                  placeholder="Details of hardware malfunctions or error codes..."
                  className="w-full min-h-[90px] p-3 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground/50 resize-y"
                  {...register('issue_description')}
                />
              </FormField>

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
                  <span>Submit Ticket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
