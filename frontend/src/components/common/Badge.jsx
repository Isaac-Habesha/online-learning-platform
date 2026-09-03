import React from 'react';

const variants = {
  default: 'bg-slate-800 text-slate-300 border-slate-700',
  primary: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  danger: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
};

export const Badge = ({ children, variant = 'default', className = '', size = 'sm' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2.5 py-0.5',
    md: 'text-sm px-3 py-1',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variants[variant] || variants.default} ${sizeClasses[size] || sizeClasses.sm} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
