import React from 'react';
import { OperationalStatus } from '../../types/costi';
import { CheckCircle2, AlertTriangle, AlertOctagon, HelpCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: OperationalStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  switch (status) {
    case 'normal':
      return (
        <span
          className={`inline-flex items-center font-medium rounded-md bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 ${sizeClasses[size]} ${className}`}
        >
          <CheckCircle2 className={`${iconSizes[size]} text-emerald-400 shrink-0`} />
          {showLabel && <span>Normal</span>}
        </span>
      );
    case 'warning':
      return (
        <span
          className={`inline-flex items-center font-medium rounded-md bg-amber-950/60 text-amber-300 border border-amber-800/40 ${sizeClasses[size]} ${className}`}
        >
          <AlertTriangle className={`${iconSizes[size]} text-amber-400 shrink-0`} />
          {showLabel && <span>Advertencia</span>}
        </span>
      );
    case 'critical':
      return (
        <span
          className={`inline-flex items-center font-medium rounded-md bg-rose-950/70 text-rose-300 border border-rose-800/50 ${sizeClasses[size]} ${className}`}
        >
          <AlertOctagon className={`${iconSizes[size]} text-rose-400 shrink-0 animate-pulse`} />
          {showLabel && <span>Crítico</span>}
        </span>
      );
    case 'unknown':
    default:
      return (
        <span
          className={`inline-flex items-center font-medium rounded-md bg-slate-900/60 text-slate-400 border border-slate-800 ${sizeClasses[size]} ${className}`}
        >
          <HelpCircle className={`${iconSizes[size]} text-slate-500 shrink-0`} />
          {showLabel && <span>Sin Información</span>}
        </span>
      );
  }
};
