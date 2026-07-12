import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { authService } from '../../services/auth.service';
import { PageHeader } from '../../components/common/PageHeader';
import { FormField, Input } from '../../components/common/FormField';
import { Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { parseApiError } from '../../utils';

const profileSchema = zod.object({
  full_name: zod.string().min(2, 'Name must be at least 2 characters'),
  phone: zod.string().optional(),
});

type ProfileFormValues = zod.infer<typeof profileSchema>;

export const ProfileSettings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      phone: user?.phone || '',
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    setLoading(true);
    try {
      const updated = await authService.updateProfile(values);
      updateUser(updated);
      toast.success('Profile details saved successfully');
    } catch (err) {
      toast.error(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl select-none">
      <PageHeader
        title="Personal Profile Details"
        description="Modify your account metadata display details, naming titles, and work phone numbers."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 border border-border bg-card/65 rounded-2xl space-y-4 glass-panel">
        <div className="grid grid-cols-2 gap-4">
          {/* Email read only */}
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-xs font-semibold text-muted-foreground/80 font-display">Work Email Address</label>
            <Input value={user?.email || ''} readOnly disabled className="bg-accent/40 text-muted-foreground select-none" />
          </div>

          {/* Role read only */}
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-xs font-semibold text-muted-foreground/80 font-display">System Permission Level</label>
            <Input value={user?.role.toUpperCase() || ''} readOnly disabled className="bg-accent/40 text-muted-foreground select-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Full Name */}
          <FormField label="Full Name" error={errors.full_name} required>
            <Input placeholder="John Doe" disabled={loading} {...register('full_name')} />
          </FormField>

          {/* Phone */}
          <FormField label="Work Phone (Optional)" error={errors.phone}>
            <Input placeholder="+1 (555) 000-0000" disabled={loading} {...register('phone')} />
          </FormField>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end pt-4 border-t border-border/40 mt-6">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-primary hover:bg-indigo-600 font-semibold text-xs text-white shadow-md shadow-indigo-500/10 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Profile</span>
          </button>
        </div>
      </form>
    </div>
  );
};
