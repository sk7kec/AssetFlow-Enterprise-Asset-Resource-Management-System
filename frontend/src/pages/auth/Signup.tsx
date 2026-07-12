import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { FormField, Input } from '../../components/common/FormField';
import { Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { parseApiError } from '../../utils';

const signupSchema = zod.object({
  full_name: zod.string().min(2, 'Name must be at least 2 characters'),
  email: zod.string().min(1, 'Email is required').email('Invalid email address'),
  password: zod
    .string()
    .min(8, 'Password must be at least 8 characters')
    .refine((val) => /[A-Z]/.test(val), { message: 'Must contain at least one uppercase letter' })
    .refine((val) => /[a-z]/.test(val), { message: 'Must contain at least one lowercase letter' })
    .refine((val) => /\d/.test(val), { message: 'Must contain at least one number' })
    .refine((val) => /[!@#$%^&*(),.?":{}|<>]/.test(val), { message: 'Must contain at least one special character' }),
  phone: zod.string().optional(),
});

type SignupFormValues = zod.infer<typeof signupSchema>;

export const Signup: React.FC = () => {
  const { signup, login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      phone: '',
    },
  });

  const onSubmit = async (values: SignupFormValues) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Sign up account
      await signup(values);
      toast.success('Registration successful!');
      
      // 2. Auto login on successful signup
      await login({ email: values.email, password: values.password });
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const parsed = parseApiError(err);
      setErrorMsg(parsed);
      toast.error('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Title */}
      <div className="text-center md:text-left space-y-1">
        <h2 className="text-xl font-bold font-display text-white">Create Account</h2>
        <p className="text-xs text-slate-500">Sign up for an employee portal profile</p>
      </div>

      {/* Error Alert Box */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex gap-2 text-xs text-rose-400 items-start">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{errorMsg}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name */}
        <FormField label="Full Name" error={errors.full_name} required>
          <Input
            placeholder="e.g. John Doe"
            disabled={loading}
            className="bg-slate-900/60 border-slate-800 focus:border-indigo-500 text-white placeholder:text-slate-600"
            {...register('full_name')}
          />
        </FormField>

        {/* Email */}
        <FormField label="Work Email Address" error={errors.email} required>
          <Input
            type="email"
            placeholder="e.g. john.doe@company.com"
            disabled={loading}
            className="bg-slate-900/60 border-slate-800 focus:border-indigo-500 text-white placeholder:text-slate-600"
            {...register('email')}
          />
        </FormField>

        {/* Phone */}
        <FormField label="Phone Number (Optional)" error={errors.phone}>
          <Input
            placeholder="e.g. +1 (555) 000-0000"
            disabled={loading}
            className="bg-slate-900/60 border-slate-800 focus:border-indigo-500 text-white placeholder:text-slate-600"
            {...register('phone')}
          />
        </FormField>

        {/* Password */}
        <FormField label="Password" error={errors.password} required>
          <Input
            type="password"
            placeholder="••••••••"
            disabled={loading}
            className="bg-slate-900/60 border-slate-800 focus:border-indigo-500 text-white placeholder:text-slate-700"
            {...register('password')}
          />
          {!errors.password && (
            <p className="text-[10px] text-slate-600 mt-1">
              Min 8 chars · uppercase · lowercase · number · special character (e.g. <span className="text-slate-500">Secure123!</span>)
            </p>
          )}
        </FormField>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-10 rounded-xl bg-indigo-500 hover:bg-indigo-600 font-semibold text-xs text-white shadow-md shadow-indigo-500/10 hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-6"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>Register Profile</span>
        </button>
      </form>

      {/* Redirect Footer */}
      <div className="text-center text-xs text-slate-500">
        <span>Already have an account? </span>
        <Link
          to="/login"
          className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
};
