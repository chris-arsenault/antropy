export interface RandomState {
  value: number;
}

export function createRandomState(seed: number): RandomState {
  const normalized = (Math.trunc(seed) ^ 0x9e3779b9) >>> 0;
  return { value: normalized === 0 ? 0x6d2b79f5 : normalized };
}

export function nextRandom(state: RandomState): number {
  let value = state.value;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  state.value = value >>> 0;
  return state.value / 0x1_0000_0000;
}

export function deterministicJitter(seed: number, tick: number, identity: number): number {
  let value = (seed ^ Math.imul(tick + 1, 0x45d9f3b) ^ Math.imul(identity, 0x27d4eb2d)) >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d);
  value ^= value >>> 15;
  return ((value >>> 0) / 0xffff_ffff) * 2 - 1;
}
