import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { OperationalStatus, DeviceCriticality } from '../types/costi';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPct(n: number, d = 1): string {
  return `${n.toFixed(d)}%`;
}

export function formatDuration(durationMinutes: number): string {
  if (durationMinutes < 60) return `${durationMinutes}m`;
  const h = Math.floor(durationMinutes / 60);
  const m = durationMinutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function getStatusLabel(status: OperationalStatus): string {
  switch (status) {
    case 'normal':
      return 'Normal';
    case 'warning':
      return 'Advertencia';
    case 'critical':
      return 'Crítico';
    case 'unknown':
    default:
      return 'Sin Datos';
  }
}

export function getCriticalityLabel(crit: DeviceCriticality): string {
  return crit === 'productive' ? 'Productivo' : 'Apoyo';
}
