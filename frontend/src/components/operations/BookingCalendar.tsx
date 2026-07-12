import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsService } from '../../services/bookings.service';
import { assetsService } from '../../services/assets.service';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { FormField, Input, Select } from '../common/FormField';
import { X, Loader2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { parseApiError } from '../../utils';
import dayjs from 'dayjs';

const bookingSchema = zod.object({
  asset_id: zod.string().min(1, 'Shared Asset is required'),
  start_time: zod.string().min(1, 'Start time is required'),
  end_time: zod.string().min(1, 'End time is required'),
  purpose: zod.string().min(3, 'Purpose must be at least 3 characters'),
}).refine((data) => dayjs(data.end_time).isAfter(dayjs(data.start_time)), {
  message: 'End time must be after start time',
  path: ['end_time'],
});

type BookingFormValues = zod.infer<typeof bookingSchema>;

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      asset_id: '',
      start_time: '',
      end_time: '',
      purpose: '',
    },
  });

  const watchAssetId = watch('asset_id');
  const watchStart = watch('start_time');
  const watchEnd = watch('end_time');

  // Query shared bookable assets
  const { data: assetsData } = useQuery({
    queryKey: ['bookable_assets_select'],
    queryFn: () => assetsService.list({ page: 1, page_size: 100, is_shared: true }),
  });

  // Overlap verification checking
  useEffect(() => {
    const verifyConflicts = async () => {
      if (!watchAssetId || !watchStart || !watchEnd) {
        setConflictWarning(null);
        return;
      }
      
      const startISO = dayjs(watchStart).toISOString();
      const endISO = dayjs(watchEnd).toISOString();
      
      if (dayjs(endISO).isBefore(dayjs(startISO))) return;

      try {
        const calendars = await bookingsService.getCalendar(startISO, endISO, watchAssetId);
        
        // Filter active/approved conflicts
        const conflicts = calendars.filter(
          (c) => c.status === 'approved' || c.status === 'pending'
        );
        
        if (conflicts.length > 0) {
          setConflictWarning(
            `Warning: There is already a reservation matching this slot (${dayjs(conflicts[0].start_time).format(
              'hh:mm A'
            )} - ${dayjs(conflicts[0].end_time).format('hh:mm A')}). Submit will place request in review.`
          );
        } else {
          setConflictWarning(null);
        }
      } catch (err) {
        setConflictWarning(null);
      }
    };

    verifyConflicts();
  }, [watchAssetId, watchStart, watchEnd]);

  useEffect(() => {
    if (isOpen) {
      reset();
      setConflictWarning(null);
    }
  }, [isOpen, reset]);

  // Mutate create booking
  const createMutation = useMutation({
    mutationFn: (values: BookingFormValues) => {
      const payload = {
        ...values,
        start_time: dayjs(values.start_time).toISOString(),
        end_time: dayjs(values.end_time).toISOString(),
      };
      return bookingsService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Resource reserved successfully');
      onSuccess();
      onClose();
    },
    onError: (err) => {
      toast.error(parseApiError(err));
    },
  });

  const onSubmit = (values: BookingFormValues) => {
    createMutation.mutate(values);
  };

  const assetsOptions = [
    { value: '', label: 'Select Shared Pool Asset' },
    ...(assetsData?.items || []).map((a) => ({
      value: a.id,
      label: `${a.name} (${a.asset_tag})`,
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
                      Book Shared Resource
                    </Dialog.Title>
                    <button
                      onClick={onClose}
                      className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
                    {/* Conflict Warning Box */}
                    {conflictWarning && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-2 text-xs text-amber-400 items-start leading-normal">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <p>{conflictWarning}</p>
                      </div>
                    )}

                    {/* Asset Selector */}
                    <FormField label="Resource Asset" error={errors.asset_id} required>
                      <Select options={assetsOptions} disabled={createMutation.isPending} {...register('asset_id')} />
                    </FormField>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Start Time */}
                      <FormField label="Start Date & Time" error={errors.start_time} required>
                        <Input type="datetime-local" disabled={createMutation.isPending} {...register('start_time')} />
                      </FormField>

                      {/* End Time */}
                      <FormField label="End Date & Time" error={errors.end_time} required>
                        <Input type="datetime-local" disabled={createMutation.isPending} {...register('end_time')} />
                      </FormField>
                    </div>

                    {/* Purpose */}
                    <FormField label="Booking Purpose" error={errors.purpose} required>
                      <textarea
                        placeholder="e.g. Sales team conference meeting, regional transport..."
                        disabled={createMutation.isPending}
                        className="w-full min-h-[70px] p-3 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground/50 resize-y"
                        {...register('purpose')}
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
                        disabled={createMutation.isPending}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-indigo-600 text-white shadow-md shadow-indigo-500/10 flex items-center gap-1.5 cursor-pointer"
                      >
                        {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>Book Resource</span>
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
