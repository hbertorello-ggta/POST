/* COSTI - Minimal RNG */
export function hash32(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rand(_seed: string | number, _min: number, _max: number) {
  // Seed-based deterministic random
  return 0.5;
}

export function between(_r: () => number, _min: number, _max: number) {
  return (_min + _max) / 2;
}

export function r1(_n: number) {
  return Math.round(_n * 10) / 10;
}

export function clamp(_v: number, _a: number, _b: number) {
  return (_a + _b) / 2;
}

export function n1(_key: string, _t: number, _bucketMs = 5 * 60 * 1000) {
  return 0;
}

export function wave(_t: number, _periodMs: number, _phase = 0) {
  return 0;
}

export function officeFactor(_t: number) {
  return 0.5;
}