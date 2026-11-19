/* CORE TYPES */
export type DeviceStatus = 'ok' | 'warn' | 'crit' | 'unknown';
export type DeviceCriticality = 'productive' | 'support';
export type MetricPeriod = '1h' | '6h' | '24h' | '7d' | '30d';

export const STATUS_COLORS = {
  ok: 'hsl(var(--status-ok))',
  warn: 'hsl(var(--status-warn))',
  crit: 'hsl(var(--status-crit))',
  unknown: 'hsl(var(--status-unknown))',
};

export const STATUS_LABELS = {
  ok: 'Normal',
  warn: 'Advertencia',
  crit: 'Crítico',
  unknown: 'Sin datos',
};

export const CRITICALITY_LABELS = {
  productive: 'Productivo',
  support: 'Apoyo',
};

export const CRITICALITY_COLORS = {
  productive: 'hsl(var(--productive))',
  support: 'hsl(var(--support))',
};

export const SITE_COLORS = {
  avex: '#3b82f6',
  cresta: '#8b5cf6',
  sarmiento: '#f59e0b',
  pilar: '#ef4444',
  la_china: '#10b981',
  uruguay: '#06b6d4',
  capital: '#ec4899',
};

export const PERIOD_OPTIONS = [
  { value: '1h', label: '1 Hora', points: 60 },
  { value: '6h', label: '6 Horas', points: 72 },
  { value: '24h', label: '24 Horas', points: 96 },
  { value: '7d', label: '7 Días', points: 84 },
  { value: '30d', label: '30 Días', points: 90 },
];