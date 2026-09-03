import React from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const variants = {
  primary: 'bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-white shadow-glow-sm hover:shadow-glow focus:ring-sky-500/50 border-transparent',
  secondary: 'bg-slate-800/90 hover:bg-slate-700/90 text-slate-100 border border-slate-700/80 hover:border-slate-600 focus:ring-slate-500/50',
  outline: 'bg-transparent hover:bg-sky-500/10 text-sky-400 hover:text-sky-300 border border-sky-500/30 hover:border-sky-500/60 focus:ring-sky-500/40',
  danger: 'bg-rose-600/90 hover:bg-rose-500 text-white border border-rose-500/40 shadow-sm focus:ring-rose-500/50',
  ghost: 'bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white border-transparent focus:ring-slate-500/40',
  success: 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/40 shadow-sm focus:ring-emerald-500/50',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs font-medium rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm font-semibold rounded-xl gap-2',
  lg: 'px-6 py-3.5 text-base font-semibold rounded-xl gap-2.5',
};

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  leftIcon,
  rightIcon,
  type = 'button',
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};

export default Button;
