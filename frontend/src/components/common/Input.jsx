import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      className = '',
      id,
      name,
      type = 'text',
      required = false,
      ...props
    },
    ref
  ) => {
    const inputId = id || name || Math.random().toString(36).substring(7);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            {label}
            {required && <span className="text-rose-400 ml-1">*</span>}
          </label>
        )}
        <div className="relative rounded-xl">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            name={name}
            type={type}
            required={required}
            className={cn(
              'w-full bg-slate-900/90 text-slate-100 placeholder-slate-500 rounded-xl border border-slate-700/80 px-3.5 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 disabled:opacity-50 disabled:bg-slate-950',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/20 text-rose-100',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-rose-400 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
