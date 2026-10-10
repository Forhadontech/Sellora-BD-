import React from 'react';

export const Loader: React.FC<{ size?: 'sm' | 'md' | 'lg'; text?: string }> = ({
  size = 'md',
  text,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-7 h-7 border-2',
    lg: 'w-12 h-12 border-3',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-6 text-emerald-800">
      <div
        className={`${sizeClasses[size]} border-emerald-700/20 border-t-emerald-700 rounded-full animate-spin`}
        role="status"
        aria-label="Loading"
      />
      {text && <span className="text-sm font-medium text-slate-600">{text}</span>}
    </div>
  );
};
