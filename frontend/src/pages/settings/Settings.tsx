import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useTheme } from '../../contexts/ThemeContext';
import { authService } from '../../services/auth.service';
import { PageHeader } from '../../components/common/PageHeader';
import { FormField, Input } from '../../components/common/FormField';
import { Loader2, Key, Sun, Moon } from 'lucide-react';
import toast from 'react-hot-toast';
import { parseApiError } from '../../utils';

const passwordSchema = zod
  .object({
    current_password: zod.string().min(1, 'Current password is required'),
    new_password: zod.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: zod.string().min(1, 'Confirm password is required'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'New passwords do not match',
    path: ['confirm_password'],
  });

type PasswordFormValues = zod.infer<typeof passwordSchema>;

export const Settings: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: '', new_password: '', confirm_password: '' },
  });

  const onSubmit = async (values: PasswordFormValues) => {
    setLoading(true);
    try {
      await authService.changePassword({
        current_password: values.current_password,
        new_password: values.new_password,
      });
      toast.success('Password changed successfully');
      reset();
    } catch (err) {
      toast.error(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl select-none">
      <PageHeader
        title="Preferences & Credentials"
        description="Alter security parameters, set light/dark theme attributes, and configure local settings."
      />

      {/* Theme */}
      <div className="p-6 border border-border bg-card/65 rounded-2xl space-y-4 glass-panel">
        <h3 className="text-xs font-bold text-foreground font-display uppercase tracking-wide flex items-center gap-1.5">
          {theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
          <span>UI Workspace Theme</span>
        </h3>
        <p className="text-[11px] text-muted-foreground">
          Choose light or dark visual environment.
        </p>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => theme === 'light' && toggleTheme()}
            className={`flex-1 py-3 rounded-xl border border-border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              theme === 'dark' ? 'bg-primary text-white border-primary/20 shadow-md' : 'bg-card text-muted-foreground hover:bg-accent'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span className="text-[10px] font-bold">DARK MODE</span>
          </button>
          <button
            onClick={() => theme === 'dark' && toggleTheme()}
            className={`flex-1 py-3 rounded-xl border border-border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              theme === 'light' ? 'bg-primary text-white border-primary/20 shadow-md' : 'bg-card text-muted-foreground hover:bg-accent'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span className="text-[10px] font-bold">LIGHT MODE</span>
          </button>
        </div>
      </div>

      {/* Password Change */}
      <div className="p-6 border border-border bg-card/65 rounded-2xl space-y-4 glass-panel">
        <h3 className="text-xs font-bold text-foreground font-display uppercase tracking-wide flex items-center gap-1.5">
          <Key className="w-4 h-4 text-indigo-500" />
          <span>Update Security Credentials</span>
        </h3>
        <p className="text-[11px] text-muted-foreground">
          Update password values. Must contain at least 8 characters.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Current Password */}
          <FormField label="Current Password" error={errors.current_password} required>
            <Input type="password" placeholder="••••••••" disabled={loading} {...register('current_password')} />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            {/* New Password */}
            <FormField label="New Password" error={errors.new_password} required>
              <Input type="password" placeholder="••••••••" disabled={loading} {...register('new_password')} />
            </FormField>

            {/* Confirm Password */}
            <FormField label="Confirm Password" error={errors.confirm_password} required>
              <Input type="password" placeholder="••••••••" disabled={loading} {...register('confirm_password')} />
            </FormField>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end pt-4 border-t border-border/40 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-primary hover:bg-indigo-600 font-semibold text-xs text-white shadow-md shadow-indigo-500/10 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
              <span>Change Password</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
