export interface RngState {
  a: number;
  b: number;
  c: number;
  d: number;
}

export interface Rng {
  /** Uniform float in [0, 1). */
  next(): number;
  getState(): RngState;
  setState(state: RngState): void;
}

function splitmix32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x9e3779b9) | 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 16), 0x21f0aaad);
    z = Math.imul(z ^ (z >>> 15), 0x735a2d97);
    return (z ^ (z >>> 15)) >>> 0;
  };
}

/**
 * sfc32 PRNG (ADR-0002): the only randomness source inside the simulation.
 * State is four 32-bit words, fully serializable for checkpointing.
 */
export function createRng(seed: number): Rng {
  const mix = splitmix32(seed);
  let a = mix();
  let b = mix();
  let c = mix();
  let d = mix();

  const raw = (): number => {
    const t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    const out = (t + d) | 0;
    c = (c + out) | 0;
    return out >>> 0;
  };

  // Warm up past correlated early state.
  for (let i = 0; i < 12; i++) {
    raw();
  }

  return {
    next: () => raw() / 4294967296,
    getState: () => ({ a, b, c, d }),
    setState: (state) => {
      a = state.a | 0;
      b = state.b | 0;
      c = state.c | 0;
      d = state.d | 0;
    },
  };
}
