/* COSTI - Minimal data generator */
export interface DeviceMetrics {
  cpu?: number;
  memory?: number;
}

export function genMetrics(_type: string, _name: string, r: () => number): DeviceMetrics {
  return { cpu: Math.round(r() * 34 + 18), memory: Math.round(r() * 40 + 38) };
}