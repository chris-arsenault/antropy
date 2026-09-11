import { type Config } from "./config";
import { wrap } from "./geometry";
import { type Point } from "./types";

export function stencil(p: Point, c: Config): [number, number][] {
  const x = wrap(p.x, c.width),
    y = wrap(p.y, c.height),
    ix = Math.floor(x),
    iy = Math.floor(y);
  const fx = x - ix,
    fy = y - iy;
  return [
    [iy * c.width + ix, (1 - fx) * (1 - fy)],
    [iy * c.width + ((ix + 1) % c.width), fx * (1 - fy)],
    [((iy + 1) % c.height) * c.width + ix, (1 - fx) * fy],
    [((iy + 1) % c.height) * c.width + ((ix + 1) % c.width), fx * fy],
  ];
}
export const sample = (field: Float64Array, p: Point, c: Config): number =>
  stencil(p, c).reduce((sum, [i, w]) => sum + field[i] * w, 0);
export function deposit(field: Float64Array, p: Point, amount: number, c: Config): void {
  for (const [i, w] of stencil(p, c)) field[i] += amount * w;
}

/** Symmetric face fluxes conserve material across unequal matrix permeabilities. */
export function diffuse(
  field: Float64Array,
  c: Config,
  diffusion: number,
  decay: number,
  matrix?: Float64Array
): number {
  const steps = Math.max(1, Math.ceil((diffusion * c.dt) / 0.24));
  const rate = (diffusion * c.dt) / steps,
    survival = Math.exp((-decay * c.dt) / steps);
  const scratch = new Float64Array(field.length);
  let loss = 0;
  for (let step = 0; step < steps; step++) {
    mix(field, c, rate, scratch, matrix);
    for (let i = 0; i < field.length; i++) {
      loss += scratch[i] * (1 - survival);
      field[i] = scratch[i] * survival;
    }
  }
  return loss;
}

function mix(
  field: Float64Array,
  c: Config,
  rate: number,
  scratch: Float64Array,
  matrix: Float64Array | undefined
): void {
  scratch.set(field);
  for (let y = 0; y < c.height; y++)
    for (let x = 0; x < c.width; x++) {
      const i = y * c.width + x;
      for (const j of [y * c.width + ((x + 1) % c.width), ((y + 1) % c.height) * c.width + x]) {
        const resistance = matrix ? 1 + c.matrixDrag * Math.max(matrix[i], matrix[j]) : 1;
        const flux = (rate * (field[i] - field[j])) / resistance;
        scratch[i] -= flux;
        scratch[j] += flux;
      }
    }
}
