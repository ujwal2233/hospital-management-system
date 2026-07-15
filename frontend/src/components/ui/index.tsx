import React from 'react';
import { clsx } from 'clsx';

// ── Spinner ──
export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };
  return (
    <div
      className={clsx(
        'animate-spin rounded-full border-primary-500 border-t-transparent',
        sizeClasses[size],
        className
      )}
    />
  );
};

// ── Button ──
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading,
  className,
  disabled,
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none shadow-xs active:scale-[0.98]';
  
  const variants = {
    primary: 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-sm hover:from-primary-700 hover:to-primary-800 active:from-primary-800 active:to-primary-900 border border-primary-600/20',
    secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 border border-slate-200/80',
    outline: 'border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400',
    danger: 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-sm hover:from-rose-700 hover:to-red-700 active:from-rose-800 active:to-red-800',
    ghost: 'text-slate-600 hover:bg-slate-100 active:bg-slate-200 shadow-none border-transparent',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs tracking-tight',
    md: 'px-4 py-2 text-sm tracking-tight',
    lg: 'px-6 py-3 text-base tracking-tight',
  };

  return (
    <button
      className={clsx(baseStyle, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner size="sm" className="mr-2 border-current" />}
      {children}
    </button>
  );
};

// ── Input ──
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: any;
}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    const errorMsg = error && (typeof error === 'object' ? error.message : error);
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && <label className="text-xs font-bold uppercase tracking-wider text-slate-600">{label}</label>}
        <input
          ref={ref}
          className={clsx(
            'w-full px-3.5 py-2.5 border rounded-xl shadow-xs focus:outline-none focus:ring-4 focus:ring-primary-500/15 focus:border-primary-600 text-sm transition-all duration-200 bg-white text-slate-800 placeholder:text-slate-400 font-medium',
            error ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/30' : 'border-slate-200 hover:border-slate-300',
            className
          )}
          {...props}
        />
        {errorMsg && <span className="text-xs text-rose-600 font-bold">{errorMsg}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';

// ── Select ──
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: any;
  options: Array<{ value: string | number; label: string }>;
}
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, ...props }, ref) => {
    const errorMsg = error && (typeof error === 'object' ? error.message : error);
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && <label className="text-xs font-bold uppercase tracking-wider text-slate-600">{label}</label>}
        <select
          ref={ref}
          className={clsx(
            'w-full px-3.5 py-2.5 border rounded-xl shadow-xs focus:outline-none focus:ring-4 focus:ring-primary-500/15 focus:border-primary-600 text-sm bg-white transition-all duration-200 text-slate-800 font-medium',
            error ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/30' : 'border-slate-200 hover:border-slate-300',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {errorMsg && <span className="text-xs text-rose-600 font-bold">{errorMsg}</span>}
      </div>
    );
  }
);
Select.displayName = 'Select';

// ── Badge ──
export const Badge: React.FC<{
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'gray';
  className?: string;
}> = ({ children, variant = 'gray', className }) => {
  const styles = {
    primary: 'bg-primary-50/80 text-primary-700 border-primary-200/80 font-bold',
    success: 'bg-emerald-50/90 text-emerald-700 border-emerald-200/80 font-bold',
    warning: 'bg-amber-50/90 text-amber-700 border-amber-200/80 font-bold',
    danger: 'bg-rose-50/90 text-rose-700 border-rose-200/80 font-bold',
    info: 'bg-sky-50/90 text-sky-700 border-sky-200/80 font-bold',
    gray: 'bg-slate-100 text-slate-700 border-slate-200/80 font-semibold',
  };
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs tracking-tight border shadow-2xs',
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

// ── Card ──
export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return (
    <div className={clsx('bg-white border border-slate-200/80 rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden', className)}>
      {children}
    </div>
  );
};

// ── Alert ──
export const Alert: React.FC<{
  variant?: 'success' | 'warning' | 'danger' | 'info';
  children: React.ReactNode;
  className?: string;
}> = ({ variant = 'info', children, className }) => {
  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    danger: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };
  return (
    <div className={clsx('p-4 border rounded-lg text-sm font-medium flex gap-2.5', styles[variant], className)}>
      {children}
    </div>
  );
};
