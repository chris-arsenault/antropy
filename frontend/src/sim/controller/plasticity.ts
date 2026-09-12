export const PLASTIC_LOCI = 9;
export interface PlasticState {
  traces: Float32Array;
  lastReserve: number | null;
}
export interface LearningContext {
  dt: number;
  plastic: boolean;
  learn: boolean;
}
export const DEFAULT_LEARNING: LearningContext = { dt: 0.2, plastic: true, learn: true };
export const seedPlasticity = (): Float32Array => Float32Array.of(0.1, 0.02, 1, 0, 0, 0, 1, 0, 1);

/** Traces are acquired state. Updating never writes the inherited coefficients or weights. */
export function updateTraces(
  genes: Float32Array,
  state: PlasticState,
  before: Float32Array,
  after: Float32Array,
  observation: Float32Array,
  context: LearningContext
): void {
  const delta = state.lastReserve === null ? 0 : observation[8] - state.lastReserve;
  state.lastReserve = observation[8];
  if (!context.plastic || !context.learn) return;
  const modulation = Math.tanh(
    genes[6] * observation[1] + genes[7] * observation[5] + genes[8] * delta
  );
  const rate = Math.abs(genes[1]) * context.dt,
    traces = state.traces,
    n = before.length;
  const g2 = genes[2],
    g3 = genes[3],
    g4 = genes[4],
    g5 = genes[5];
  for (let i = 0; i < after.length; i++) {
    const y = after[i],
      yy = y * y,
      row = i * n;
    for (let j = 0; j < n; j++) {
      const index = row + j,
        x = before[j],
        h = traces[index];
      const hebbian = g2 * x * y + g3 * x + g4 * y + g5;
      traces[index] = Math.max(-1, Math.min(1, h + rate * (modulation * hebbian - yy * h)));
    }
  }
}
