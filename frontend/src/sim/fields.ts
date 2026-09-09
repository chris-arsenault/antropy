import { type Config } from "./config";
import { wrap, delta } from "./geometry";
import { nextRandom } from "./random";
import { type World, type Point, type Source } from "./types";

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
export function sample(field: Float64Array, p: Point, c: Config): number {
  return stencil(p, c).reduce((sum, [i, w]) => sum + field[i] * w, 0);
}
export function deposit(field: Float64Array, p: Point, amount: number, c: Config): void {
  for (const [i, w] of stencil(p, c)) field[i] += amount * w;
}

export function diffuse(field: Float64Array, c: Config, diffusion: number, decay: number): number {
  const steps = Math.max(1, Math.ceil((diffusion * c.dt) / 0.24)),
    rate = (diffusion * c.dt) / steps;
  const survival = Math.exp((-decay * c.dt) / steps),
    scratch = new Float64Array(field.length);
  let loss = 0;
  for (let step = 0; step < steps; step++) {
    for (let y = 0; y < c.height; y++)
      for (let x = 0; x < c.width; x++) {
        const i = y * c.width + x,
          before = field[i];
        const neighbors =
          field[y * c.width + ((x + 1) % c.width)] +
          field[y * c.width + wrap(x - 1, c.width)] +
          field[((y + 1) % c.height) * c.width + x] +
          field[wrap(y - 1, c.height) * c.width + x];
        const mixed = before + rate * (neighbors - 4 * before);
        scratch[i] = mixed * survival;
        loss += mixed * (1 - survival);
      }
    field.set(scratch);
  }
  return loss;
}

function feedSource(world: World, source: Source, amount: number): void {
  const c = world.config,
    reach = Math.ceil(c.sourceRadius * 2),
    entries: [number, number][] = [];
  let total = 0;
  for (let dy = -reach; dy <= reach; dy++)
    for (let dx = -reach; dx <= reach; dx++) {
      const x = wrap(Math.floor(source.x) + dx, c.width),
        y = wrap(Math.floor(source.y) + dy, c.height);
      const d = delta(x - source.x, c.width) ** 2 + delta(y - source.y, c.height) ** 2;
      const weight = Math.exp(-d / (2 * c.sourceRadius ** 2));
      entries.push([y * c.width + x, weight]);
      total += weight;
    }
  for (const [i, w] of entries) world.nutrient[i] += (amount * w) / total;
}

export function advanceFields(world: World): void {
  const c = world.config;
  for (const source of world.sources) {
    if (c.regime === "transient" && source.remaining <= 0) {
      source.x = nextRandom(world.environmentRng) * c.width;
      source.y = nextRandom(world.environmentRng) * c.height;
      source.remaining = c.sourceLifetime;
    }
    if (c.regime === "transient") source.remaining -= c.dt;
    feedSource(world, source, c.sourceRate * c.dt);
    world.ledger.supplied += c.sourceRate * c.dt;
  }
  world.ledger.nutrientLoss += diffuse(world.nutrient, c, c.nutrientDiffusion, c.nutrientDecay);
  world.ledger.chemicalLoss += diffuse(world.chemical, c, c.chemicalDiffusion, c.chemicalDecay);
}
