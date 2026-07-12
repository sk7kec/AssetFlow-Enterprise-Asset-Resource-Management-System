import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { Department } from '../../types';
import { organizationService } from '../../services/organization.service';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { FormField, Input } from '../common/FormField';
import { X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { parseApiError } from '../../utils';

const departmentSchema = zod.object({
  name: zod.string().min(2, 'Name must be at least 2 characters'),
  code: zod.string().min(2, 'Code must be at least 2 characters').toUpperCase(),
  description: zod.string().optional(),
  manager_id: zod.string().optional().nullable(),
  parent_department_id: zod.string().optional().nullable(),
});

type DepartmentFormValues = zod.infer<typeof departmentSchema>;

interface DepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: Department | null; // null for Create
  onSuccess: () => void;
}

export const DepartmentModal: React.FC<DepartmentModalProps> = ({
  isOpen,
  onClose,
  department,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const isEdit = !!department;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
  });

  useEffect(() => {
    if (department) {
      reset({
        name: department.name,
        code: department.code,
        description: department.description || '',
        manager_id: department.manager_id || '',
        parent_department_id: department.parent_department_id || '',
      });
    } else {
      reset({
        name: '',
        code: '',
        description: '',
        manager_id: '',
        parent_department_id: '',
      });
    }
  }, [department, reset, isOpen]);

  const onSubmit = async (values: DepartmentFormValues) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        manager_id: values.manager_id || undefined,
        parent_department_id: values.parent_department_id || undefined,
      };

      if (isEdit && department) {
        await organizationService.updateDepartment(department.id, payload);
        toast.success('Department updated successfully');
      } else {
        await organizationService.createDepartment(payload);
        toast.success('Department registered successfully');
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

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
                <div className="fixed inset-4 max-w-lg mx-auto my-auto bg-card border border-border rounded-2xl p-6 shadow-2xl z-50 flex flex-col h-fit glass-panel focus:outline-none select-none">
                  <div className="flex items-center justify-between pb-4 border-b border-border">
                    <Dialog.Title className="text-sm font-bold text-foreground font-display">
                      {isEdit ? 'Modify Department Profile' : 'Register New Department'}
                    </Dialog.Title>
                    <button
                      onClick={onClose}
                      className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Name */}
                      <FormField label="Department Name" error={errors.name} required>
                        <Input placeholder="e.g. Information Technology" disabled={loading} {...register('name')} />
                      </FormField>

                      {/* Code */}
                      <FormField label="Department Code" error={errors.code} required>
                        <Input placeholder="e.g. DEPT-IT" disabled={loading} {...register('code')} />
                      </FormField>
                    </div>

                    {/* Description */}
                    <FormField label="Description (Optional)" error={errors.description}>
                      <textarea
                        placeholder="Purpose or asset storage specifications..."
                        disabled={loading}
                        className="w-full min-h-[80px] p-3 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground/50 resize-y"
                        {...register('description')}
                      />
                    </FormField>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Manager ID */}
                      <FormField label="Manager User Ref (Optional)" error={errors.manager_id}>
                        <Input placeholder="ObjectId reference" disabled={loading} {...register('manager_id')} />
                      </FormField>

                      {/* Parent Department */}
                      <FormField label="Parent Department Ref (Optional)" error={errors.parent_department_id}>
                        <Input placeholder="ObjectId reference" disabled={loading} {...register('parent_department_id')} />
                      </FormField>
                    </div>

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
                        disabled={loading}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-indigo-600 text-white shadow-md shadow-indigo-500/10 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>{isEdit ? 'Save Changes' : 'Register'}</span>
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
