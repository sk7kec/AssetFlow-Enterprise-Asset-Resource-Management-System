import React from 'react';
import { FieldError } from 'react-hook-form';
import { cn } from '../../utils';

interface FormFieldProps {
  label: string;
  error?: FieldError;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  required = false,
  className,
  children,
}) => {
  return (
    <div className={cn('flex flex-col gap-1.5 select-none w-full', className)}>
      <label className="text-xs font-semibold text-foreground/80 font-display flex items-center gap-0.5">
        <span>{label}</span>
        {required && <span className="text-rose-500 font-bold">*</span>}
      </label>
      <div className="relative">
        {children}
      </div>
      {error && (
        <span className="text-[10px] font-medium text-rose-500 font-display leading-none mt-0.5">
          {error.message}
        </span>
      )}
    </div>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: FieldError;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full h-10 px-3.5 rounded-xl border bg-card text-xs text-foreground focus:outline-none focus:border-primary transition-all disabled:opacity-50 disabled:pointer-events-none placeholder:text-muted-foreground/50',
          error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : 'border-border',
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: FieldError;
  options: Array<{ value: string | number; label: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, options, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'w-full h-10 px-3.5 rounded-xl border bg-card text-xs text-foreground focus:outline-none focus:border-primary transition-all disabled:opacity-50 disabled:pointer-events-none appearance-none cursor-pointer',
          error ? 'border-rose-500 focus:border-rose-500' : 'border-border',
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-card">
            {opt.label}
          </option>
        ))}
      </select>
    );
  }
);
Select.displayName = 'Select';
