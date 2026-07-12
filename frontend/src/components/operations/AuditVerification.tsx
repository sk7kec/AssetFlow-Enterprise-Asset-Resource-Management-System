import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { auditsService } from '../../services/audits.service';
import { AssetCondition, AuditVerificationStatus } from '../../constants';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { FormField, Input, Select } from '../common/FormField';
import { X, Loader2, ScanLine } from 'lucide-react';
import toast from 'react-hot-toast';
import { parseApiError } from '../../utils';

const verificationSchema = zod.object({
  asset_tag: zod.string().min(1, 'Asset Tag Code is required').toUpperCase(),
  status: zod.string(),
  condition: zod.string(),
  location_matched: zod.boolean(),
  notes: zod.string().optional(),
});

type VerificationFormValues = zod.infer<typeof verificationSchema>;

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  cycleId: string;
  onSuccess: () => void;
}

export const AuditVerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
  cycleId,
  onSuccess,
}) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      asset_tag: '',
      status: AuditVerificationStatus.VERIFIED,
      condition: AssetCondition.GOOD,
      location_matched: true,
      notes: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  // Mutate Verify Asset
  const verifyMutation = useMutation({
    mutationFn: (values: VerificationFormValues) => auditsService.verifyAsset(cycleId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit_verifications', cycleId] });
      toast.success('Asset verification logged successfully');
      onSuccess();
      onClose();
    },
    onError: (err) => {
      toast.error(parseApiError(err));
    },
  });

  const onSubmit = (values: VerificationFormValues) => {
    verifyMutation.mutate(values);
  };

  const conditionOptions = Object.values(AssetCondition).map((c) => ({
    value: c,
    label: c.toUpperCase(),
  }));

  const statusOptions = Object.values(AuditVerificationStatus).map((s) => ({
    value: s,
    label: s.toUpperCase(),
  }));

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
                      Scan / Log Asset Verification
                    </Dialog.Title>
                    <button
                      onClick={onClose}
                      className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
                    {/* Tag Scan Code */}
                    <FormField label="Asset Tag barcode / serial" error={errors.asset_tag} required>
                      <div className="relative">
                        <Input placeholder="e.g. AF-000001" disabled={verifyMutation.isPending} {...register('asset_tag')} />
                        <button
                          type="button"
                          onClick={() => {
                            const tag = window.prompt('Scan barcode / Enter Tag ID:');
                            if (tag) setValue('asset_tag', tag.toUpperCase().trim());
                          }}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-primary hover:text-indigo-600 cursor-pointer"
                        >
                          <ScanLine className="w-4 h-4" />
                        </button>
                      </div>
                    </FormField>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Condition Selection */}
                      <FormField label="Current Condition" error={errors.condition} required>
                        <Select options={conditionOptions} disabled={verifyMutation.isPending} {...register('condition')} />
                      </FormField>

                      {/* Status Selection */}
                      <FormField label="Audit Status Code" error={errors.status} required>
                        <Select options={statusOptions} disabled={verifyMutation.isPending} {...register('status')} />
                      </FormField>
                    </div>

                    {/* Location Verification check */}
                    <label className="flex items-center gap-2 pt-2 text-xs font-semibold text-muted-foreground cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="rounded bg-accent"
                        disabled={verifyMutation.isPending}
                        {...register('location_matched')}
                      />
                      <span>Physical storage location matches catalog record</span>
                    </label>

                    {/* Verification Notes */}
                    <FormField label="Verification comments (Optional)" error={errors.notes}>
                      <textarea
                        placeholder="e.g. Missing charger accessories, screen scratch..."
                        disabled={verifyMutation.isPending}
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
                        disabled={verifyMutation.isPending}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-indigo-600 text-white shadow-md shadow-indigo-500/10 flex items-center gap-1.5 cursor-pointer"
                      >
                        {verifyMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>Verify Asset</span>
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
