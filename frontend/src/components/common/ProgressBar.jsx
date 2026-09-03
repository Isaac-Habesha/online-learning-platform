import React from 'react';

export const ProgressBar = ({
  progress = 0,
  showLabel = true,
  size = 'md',
  color = 'sky',
  className = '',
}) => {
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const colorGradients = {
    sky: 'bg-gradient-to-r from-cyan-500 to-sky-500',
    emerald: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    violet: 'bg-gradient-to-r from-violet-500 to-purple-500',
  };

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-xs font-semibold text-slate-300">
          <span>Progress</span>
          <span className="text-sky-400 font-bold">{clampedProgress}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-800 rounded-full overflow-hidden ${sizeClasses[size] || sizeClasses.md}`}>
        <div
          className={`${colorGradients[color] || colorGradients.sky} h-full rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
