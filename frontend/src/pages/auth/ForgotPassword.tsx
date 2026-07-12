import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { FormField, Input } from '../../components/common/FormField';
import { Loader2, AlertCircle, CheckCircle2, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import { parseApiError } from '../../utils';

const emailSchema = zod.object({
  email: zod.string().min(1, 'Email is required').email('Invalid email address'),
});

const resetSchema = zod.object({
  token: zod.string().min(32, 'Token must be at least 32 characters'),
  new_password: zod
    .string()
    .min(8, 'Password must be at least 8 characters')
    .refine((val) => /[A-Z]/.test(val), { message: 'Must contain at least one uppercase letter' })
    .refine((val) => /[a-z]/.test(val), { message: 'Must contain at least one lowercase letter' })
    .refine((val) => /\d/.test(val), { message: 'Must contain at least one number' }),
});

type EmailFormValues = zod.infer<typeof emailSchema>;
type ResetFormValues = zod.infer<typeof resetSchema>;

export const ForgotPassword: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);
  const navigate = useNavigate();

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const resetForm = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { token: '', new_password: '' },
  });

  const onEmailSubmit = async (values: EmailFormValues) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const resp = await authService.forgotPassword(values);
      toast.success('Password reset token generated!');
      
      // Save dev token for easy copy-paste in dev environment
      if (resp.reset_token) {
        setDevToken(resp.reset_token);
        // Pre-fill token field in step 2 for convenience
        resetForm.setValue('token', resp.reset_token);
      }
      setStep(2);
    } catch (err: any) {
      setErrorMsg(parseApiError(err));
      toast.error('Failed to generate reset link');
    } finally {
      setLoading(false);
    }
  };

  const onResetSubmit = async (values: ResetFormValues) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await authService.resetPassword(values);
      toast.success('Password changed successfully');
      navigate('/login');
    } catch (err: any) {
      setErrorMsg(parseApiError(err));
      toast.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Title */}
      <div className="text-center md:text-left space-y-1">
        <h2 className="text-xl font-bold font-display text-white">Reset Password</h2>
        <p className="text-xs text-slate-500">
          {step === 1 ? 'Enter your email to get a reset token' : 'Verify reset token and input password'}
        </p>
      </div>

      {/* Error Alert Box */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex gap-2 text-xs text-rose-400 items-start">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{errorMsg}</p>
        </div>
      )}

      {/* STEP 1: Enter Email */}
      {step === 1 && (
        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
          <FormField label="Work Email Address" error={emailForm.formState.errors.email} required>
            <Input
              type="email"
              placeholder="e.g. john@company.com"
              disabled={loading}
              className="bg-slate-900/60 border-slate-800 focus:border-indigo-500 text-white placeholder:text-slate-600"
              {...emailForm.register('email')}
            />
          </FormField>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-xl bg-indigo-500 hover:bg-indigo-600 font-semibold text-xs text-white shadow-md shadow-indigo-500/10 hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-6"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Get Reset Code</span>
          </button>
        </form>
      )}

      {/* STEP 2: Input Reset Token & Password */}
      {step === 2 && (
        <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
          {/* Dev Mode Notification Token Banner */}
          {devToken && (
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-2 text-xs text-indigo-300">
              <div className="flex gap-2 items-center">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                <span className="font-bold">Dev Sandbox Notice</span>
              </div>
              <p className="leading-normal">
                An email token was generated successfully on the backend:
              </p>
              <div className="p-2 rounded bg-slate-950 font-mono text-[9px] text-indigo-400 break-all select-all flex items-center justify-between gap-2">
                <span>{devToken}</span>
                <Key className="w-3.5 h-3.5 shrink-0" />
              </div>
            </div>
          )}

          <FormField label="Reset Token (Hex)" error={resetForm.formState.errors.token} required>
            <Input
              placeholder="e.g. 32-character hexadecimal token"
              disabled={loading}
              className="bg-slate-900/60 border-slate-800 focus:border-indigo-500 text-white placeholder:text-slate-700"
              {...resetForm.register('token')}
            />
          </FormField>

          <FormField label="New Security Password" error={resetForm.formState.errors.new_password} required>
            <Input
              type="password"
              placeholder="••••••••"
              disabled={loading}
              className="bg-slate-900/60 border-slate-800 focus:border-indigo-500 text-white placeholder:text-slate-700"
              {...resetForm.register('new_password')}
            />
          </FormField>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-xl bg-indigo-500 hover:bg-indigo-600 font-semibold text-xs text-white shadow-md shadow-indigo-500/10 hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-6"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Change Password</span>
          </button>
        </form>
      )}

      {/* Redirect Footer */}
      <div className="text-center text-xs text-slate-500">
        <Link
          to="/login"
          className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
};
