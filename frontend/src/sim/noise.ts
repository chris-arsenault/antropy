/**
 * Deterministic 2D value noise + fBm (MVP-PLAN: hand-rolled, no deps).
 * All values derive from the integer seed; no PRNG state is consumed, so
 * fields are pure functions of (seed, x, y).
 */

function hash2(seed: number, xi: number, yi: number): number {
  let h = seed ^ Math.imul(xi, 0x27d4eb2d) ^ Math.imul(yi, 0x165667b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function smooth(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Value noise in [0, 1] at a continuous 2D point. */
export function valueNoise2(seed: number, x: number, y: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = smooth(x - x0);
  const ty = smooth(y - y0);
  const v00 = hash2(seed, x0, y0);
  const v10 = hash2(seed, x0 + 1, y0);
  const v01 = hash2(seed, x0, y0 + 1);
  const v11 = hash2(seed, x0 + 1, y0 + 1);
  return lerp(lerp(v00, v10, tx), lerp(v01, v11, tx), ty);
}

/** Fractal Brownian motion over value noise, normalized to [0, 1]. */
export function fbm2(seed: number, x: number, y: number, octaves: number): number {
  let sum = 0;
  let amplitude = 1;
  let frequency = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amplitude * valueNoise2(seed + i * 0x9e37, x * frequency, y * frequency);
    norm += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return sum / norm;
}
