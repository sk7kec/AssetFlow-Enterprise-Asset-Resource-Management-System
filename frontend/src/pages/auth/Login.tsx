import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { FormField, Input } from '../../components/common/FormField';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { parseApiError } from '../../utils';

const loginSchema = zod.object({
  email: zod.string().min(1, 'Email is required').email('Invalid email address'),
  password: zod.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormValues = zod.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Determine redirect page after successful login
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const user = await login(values);
      toast.success('Welcome back!');
      
      if (from === '/dashboard') {
        const roleRedirects: Record<string, string> = {
          admin: '/admin/dashboard',
          asset_manager: '/asset-manager/dashboard',
          department_head: '/department-head/dashboard',
          employee: '/employee/dashboard',
        };
        const redirectPath = roleRedirects[user.role] || '/dashboard';
        navigate(redirectPath, { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      const parsed = parseApiError(err);
      setErrorMsg(parsed);
      toast.error('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Title */}
      <div className="text-center md:text-left space-y-1">
        <h2 className="text-xl font-bold font-display text-white">Sign In</h2>
        <p className="text-xs text-slate-500">Access the AssetFlow database portal</p>
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
        {/* Email */}
        <FormField label="Work Email Address" error={errors.email} required>
          <Input
            type="email"
            placeholder="e.g. manager@company.com"
            disabled={loading}
            className="bg-slate-900/60 border-slate-800 focus:border-indigo-500 text-white placeholder:text-slate-600"
            {...register('register' in register ? 'email' : 'email')}
          />
        </FormField>

        {/* Password */}
        <FormField label="Password" error={errors.password} required>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              disabled={loading}
              className="bg-slate-900/60 border-slate-800 focus:border-indigo-500 pr-10 text-white placeholder:text-slate-700"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </FormField>

        {/* Remember me & Forgot Password */}
        <div className="flex items-center justify-between text-xs pt-1 select-none">
          <label className="flex items-center gap-2 text-slate-500 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-slate-800 bg-slate-900/60 text-indigo-500 focus:ring-indigo-500"
            />
            <span>Remember me</span>
          </label>
          
          <Link
            to="/forgot-password"
            className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-10 rounded-xl bg-indigo-500 hover:bg-indigo-600 font-semibold text-xs text-white shadow-md shadow-indigo-500/10 hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-6"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>Sign In</span>
        </button>
      </form>

      {/* Redirect Footer */}
      <div className="text-center text-xs text-slate-500">
        <span>New to AssetFlow? </span>
        <Link
          to="/signup"
          className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Create account
        </Link>
      </div>
    </div>
  );
};
