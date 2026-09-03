import React from 'react';
import { Loader2 } from 'lucide-react';

export const Loader = ({ fullPage = false, message = 'Loading...', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
      <Loader2 className={`${sizeClasses[size] || sizeClasses.md} animate-spin text-sky-400`} />
      {message && <p className="text-sm font-medium text-slate-300">{message}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center w-full">
        {content}
      </div>
    );
  }

  return <div className="py-8 flex justify-center w-full">{content}</div>;
};

export default Loader;
