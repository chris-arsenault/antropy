/** The native composed illumination law, applied to reduced optical inputs in the worker. */
export type LightAxes = [[number, number][], [number, number][]];
function subtract([a, b]: number[], [c, d]: number[]) {
  return [a * c + b * d, b * c - a * d];
}
function optical(lanes: Uint32Array[], lane: number, node: number, scratch: DataView) {
  scratch.setUint32(0, lanes[lane][node], true);
  scratch.setUint32(4, lanes[lane + 1][node], true);
  return scratch.getFloat64(0, true);
}
export function composeLight(
  field: Float32Array,
  nx: number,
  lanes: Uint32Array[],
  axes: LightAxes,
  solar: number[],
  kind: number
) {
  const x = axes[0].map((v) => subtract(v, solar.slice(0, 2))),
    y = axes[1].map((v) => subtract(v, solar.slice(2, 4))),
    modulation = solar.slice(4, 6),
    scratch = new DataView(new ArrayBuffer(8));
  const rotatedX = x.map((v) => subtract(v, modulation)[0]),
    rotatedY = y.map((v) => subtract(v, modulation)[0]);
  for (let node = 0; node < field.length / 8; node++) {
    const i = node % nx,
      j = Math.floor(node / nx);
    const sun = 1 + solar[6] * 0.5 * (x[i][0] * rotatedY[j] + y[j][0] * rotatedX[i]);
    const light = Math.fround(
      Math.min(sun * optical(lanes, 8, node, scratch), optical(lanes, 10, node, scratch)) *
        optical(lanes, 12, node, scratch) +
        optical(lanes, 14, node, scratch)
    );
    field[node * 8 + 2] = light;
    field[node * 8 + 7] *= light;
    if (kind === 6) field[node * 8] = light;
  }
}
