/** Observer-only sampling stream. It never advances a world's random state. */
export function samplingRandom(seed: number) {
  let value = (Math.trunc(seed) ^ 0x9e3779b9) >>> 0;
  if (value === 0) value = 0x6d2b79f5;
  return () => {
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    value >>>= 0;
    return value / 0x1_0000_0000;
  };
}
