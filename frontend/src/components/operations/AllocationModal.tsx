import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { allocationsService } from '../../services/allocations.service';
import { organizationService } from '../../services/organization.service';
import { assetsService } from '../../services/assets.service';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { FormField, Input, Select } from '../common/FormField';
import { X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { parseApiError } from '../../utils';

const allocationSchema = zod.object({
  asset_id: zod.string().min(1, 'Asset is required'),
  employee_id: zod.string().min(1, 'Employee is required'),
  due_date: zod.string().optional().nullable(),
  notes: zod.string().optional(),
});

type AllocationFormValues = zod.infer<typeof allocationSchema>;

interface AllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AllocationModal: React.FC<AllocationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AllocationFormValues>({
    resolver: zodResolver(allocationSchema),
    defaultValues: {
      asset_id: '',
      employee_id: '',
      due_date: '',
      notes: '',
    },
  });

  // Query available assets
  const { data: assetsData } = useQuery({
    queryKey: ['available_assets_select'],
    queryFn: () => assetsService.list({ page: 1, page_size: 100, status: 'available' }),
  });

  // Query employees
  const { data: empsData } = useQuery({
    queryKey: ['employees_select'],
    queryFn: () => organizationService.listEmployees({ page: 1, page_size: 100 }),
  });

  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  // Mutate allocation
  const allocateMutation = useMutation({
    mutationFn: (values: AllocationFormValues) => {
      const payload = {
        ...values,
        due_date: values.due_date || undefined,
      };
      return allocationsService.allocate(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset allocated successfully');
      onSuccess();
      onClose();
    },
    onError: (err) => {
      toast.error(parseApiError(err));
    },
  });

  const onSubmit = (values: AllocationFormValues) => {
    allocateMutation.mutate(values);
  };

  const assetsOptions = [
    { value: '', label: 'Select Available Asset' },
    ...(assetsData?.items || []).map((a) => ({
      value: a.id,
      label: `${a.name} (${a.asset_tag})`,
    })),
  ];

  const empsOptions = [
    { value: '', label: 'Select Employee Staff' },
    ...(empsData?.items || []).map((e) => ({
      value: e.employee_id,
      label: `${e.full_name} (${e.employee_id})`,
    })),
  ];

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Overlay */}
              <Dialog.Overlay asChild>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50"
                />
              </Dialog.Overlay>

              {/* Form Content */}
              <Dialog.Content asChild>
                <div className="fixed inset-4 max-w-md mx-auto my-auto bg-card border border-border rounded-2xl p-6 shadow-2xl z-50 flex flex-col h-fit glass-panel focus:outline-none select-none">
                  <div className="flex items-center justify-between pb-4 border-b border-border">
                    <Dialog.Title className="text-sm font-bold text-foreground font-display">
                      Allocate Asset
                    </Dialog.Title>
                    <button
                      onClick={onClose}
                      className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
                    {/* Asset Selection */}
                    <FormField label="Asset to Assign" error={errors.asset_id} required>
                      <Select options={assetsOptions} disabled={allocateMutation.isPending} {...register('asset_id')} />
                    </FormField>

                    {/* Employee Selection */}
                    <FormField label="Target Employee" error={errors.employee_id} required>
                      <Select options={empsOptions} disabled={allocateMutation.isPending} {...register('employee_id')} />
                    </FormField>

                    {/* Due Date */}
                    <FormField label="Return Due Date (Optional)" error={errors.due_date}>
                      <Input type="date" disabled={allocateMutation.isPending} {...register('due_date')} />
                    </FormField>

                    {/* Notes */}
                    <FormField label="Allocation Notes (Optional)" error={errors.notes}>
                      <textarea
                        placeholder="Purpose of allocation, peripherals attached..."
                        disabled={allocateMutation.isPending}
                        className="w-full min-h-[60px] p-3 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground/50 resize-y"
                        {...register('notes')}
                      />
                    </FormField>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40 mt-6">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-xs font-semibold border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={allocateMutation.isPending}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-indigo-600 text-white shadow-md shadow-indigo-500/10 flex items-center gap-1.5 cursor-pointer"
                      >
                        {allocateMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>Allocate Asset</span>
                      </button>
                    </div>
                  </form>
                </div>
              </Dialog.Content>
            </>
          )}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
