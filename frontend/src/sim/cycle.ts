/**
 * Cell-mediated element cycle. One element in two states: inorganic carbon in the `carbon`
 * field and organic material (food, reserve, structure, detritus). Light drives fixation by an
 * installed harvesting pathway, releasing oxygen; catabolism consumes oxygen and returns carbon.
 * Oxygen exchanges slowly with an atmosphere reservoir. Absent configuration disables the cycle:
 * no harvesting stock is built and metabolic waste leaves the world as before.
 */
import { type World, type Cell } from "./types";
import { sample, stencil, deposit } from "./fields";
import { wrap } from "./geometry";
import { effectiveStock, materialCapacity } from "./body";
import { flow } from "./observation";

export interface CycleConfig {
  /** Uniform light intensity; fixation scales linearly. */
  readonly light: number;
  /**
   * Fixation per raster cell per second that incident light can support. A harvester gathers it
   * evenly from every raster cell within `lightRadius`, and cells whose footprints overlap share
   * it in body order, so harvesting income falls with local crowding. Zero removes the limit.
   */
  readonly lightSupply: number;
  /** Radius, in raster cells, of the ground a harvester gathers light from. */
  readonly lightRadius: number;
  /** Organic material fixed per unit harvesting stock per second at saturating carbon, unit light. */
  readonly photoRate: number;
  /** Reference newborn harvesting stock relative to core. */
  readonly photoRatio: number;
  /** Maintenance energy per unit harvesting stock per second; pigments and repair are costly. */
  readonly photoMaintenance: number;
  /** Fraction of fixed material that leaks into the water as dissolved food instead of reserve. */
  readonly exudation: number;
  /** Half-saturation carbon concentration for fixation. */
  readonly carbonK: number;
  /** Half-saturation oxygen concentration for aerobic catabolism. */
  readonly oxygenK: number;
  /** Oxygen produced per organic unit fixed and consumed per organic unit fully respired. */
  readonly oxygenPerMaterial: number;
  /** Catabolic efficiency with no oxygen; `catabolicEfficiency` applies with full oxygen. */
  readonly anaerobicEfficiency: number;
  /** Atmosphere oxygen concentration the field relaxes toward. */
  readonly atmosphereOxygen: number;
  /** Atmosphere inorganic carbon concentration the field relaxes toward; bounds the pool. */
  readonly atmosphereCarbon: number;
  /** Relaxation rate toward the atmosphere per second, for both gases. */
  readonly exchangeRate: number;
  /** Initial inorganic carbon per raster cell. */
  readonly initialCarbon: number;
  readonly carbonDiffusion: number;
  readonly oxygenDiffusion: number;
}
export const DEFAULT_CYCLE: CycleConfig = {
  light: 0.5,
  lightSupply: 0.001,
  lightRadius: 2,
  photoRate: 0.3,
  photoRatio: 0.05,
  photoMaintenance: 0.05,
  exudation: 0.3,
  carbonK: 0.3,
  oxygenK: 0.05,
  oxygenPerMaterial: 1,
  anaerobicEfficiency: 0.25,
  atmosphereOxygen: 0.2,
  atmosphereCarbon: 1,
  exchangeRate: 0.0001,
  initialCarbon: 1,
  carbonDiffusion: 0.3,
  oxygenDiffusion: 0.5,
};

const nonNegative = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= 0;
export function validateCycle(value: unknown): void {
  if (value === undefined) return;
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid element cycle");
  const cycle = value as Record<string, unknown>;
  const bad = Object.keys(DEFAULT_CYCLE).find((key) => !nonNegative(cycle[key]));
  if (bad) throw new Error(`Invalid element cycle: ${bad}`);
  const overOne = ["anaerobicEfficiency", "exudation"].find((key) => (cycle[key] as number) > 1);
  if (overOne) throw new Error(`Invalid element cycle: ${overOne}`);
  const zeroK = ["carbonK", "oxygenK"].find((key) => (cycle[key] as number) <= 0);
  if (zeroK) throw new Error(`Invalid element cycle: ${zeroK}`);
}

/** Fraction of full aerobic efficiency a cell can reach for `demand` oxygen at its position. */
export function aerobicFraction(world: World, cell: Cell, demand: number): number {
  const cycle = world.config.cycle;
  if (!cycle) return 1;
  const oxygen = sample(world.oxygen, cell, world.config);
  const saturation = oxygen / (oxygen + cycle.oxygenK);
  return demand > 0 ? Math.min(1, saturation, oxygen / demand) : saturation;
}
/** Removes oxygen from the field around a cell after respiration; returns the amount taken. */
export function consumeOxygen(world: World, cell: Cell, amount: number): number {
  if (!world.config.cycle || amount <= 0) return 0;
  let taken = 0;
  for (const [i, w] of stencil(cell, world.config)) {
    const take = Math.min(world.oxygen[i], amount * w);
    world.oxygen[i] -= take;
    taken += take;
  }
  world.ledger.oxygenConsumed += taken;
  return taken;
}
/** Returns respired or repaired material to the inorganic pool, or to the sink when the cycle is off. */
export function returnCarbon(world: World, cell: Cell, material: number): void {
  if (world.config.cycle) deposit(world.carbon, cell, material, world.config);
  else world.ledger.metabolicWaste += material;
}

/** This tick's unclaimed light per raster cell, or null when light is unlimited or the cycle is off. */
export function lightField(world: World): Float64Array | null {
  const cycle = world.config.cycle;
  if (!cycle || cycle.lightSupply <= 0) return null;
  return new Float64Array(world.carbon.length).fill(cycle.lightSupply * world.config.dt);
}
const footprints = new Map<number, [number, number][]>();
/** Raster offsets within `radius` of a cell, the ground its pigment is spread over. */
export function footprint(radius: number): [number, number][] {
  let offsets = footprints.get(radius);
  if (!offsets) {
    offsets = [];
    const r = Math.floor(radius);
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++)
        if (dx * dx + dy * dy <= radius * radius) offsets.push([dx, dy]);
    footprints.set(radius, offsets);
  }
  return offsets;
}
/** Claims up to `need` light evenly across the cell's footprint; returns what was available. */
function claimLight(world: World, cell: Cell, light: Float64Array, need: number): number {
  const c = world.config,
    offsets = footprint(c.cycle!.lightRadius),
    share = need / offsets.length,
    x = Math.floor(wrap(cell.x, c.width)),
    y = Math.floor(wrap(cell.y, c.height));
  let claimed = 0;
  for (const [dx, dy] of offsets) {
    const i = wrap(y + dy, c.height) * c.width + wrap(x + dx, c.width);
    const take = Math.min(light[i], share);
    light[i] -= take;
    claimed += take;
  }
  return claimed;
}
/** Light-driven fixation of inorganic carbon into reserve, releasing oxygen. */
export function photosynthesize(world: World, cell: Cell, light: Float64Array | null): void {
  const c = world.config,
    cycle = c.cycle;
  if (!cycle || cell.body.photo <= 0) return;
  const carbon = sample(world.carbon, cell, c);
  const potential =
    cycle.photoRate *
    effectiveStock(cell.body, "photo", c) *
    cycle.light *
    (carbon / (carbon + cycle.carbonK)) *
    (1 - cell.damage) *
    c.dt;
  const need = Math.min(potential, Math.max(0, materialCapacity(cell.body, c) - cell.reserve));
  const lit = light ? claimLight(world, cell, light, need) : need;
  let fixed = 0;
  for (const [i, w] of stencil(cell, c)) {
    const take = Math.min(world.carbon[i], lit * w);
    world.carbon[i] -= take;
    fixed += take;
  }
  if (fixed <= 0) return;
  // Exudate is dissolved organic material any transporter can eat: the byproduct that feeds a
  // consumer guild, split across both foods so neither pathway is privileged.
  const exuded = fixed * cycle.exudation;
  cell.reserve += fixed - exuded;
  deposit(world.nutrient, cell, exuded / 2, c);
  deposit(world.nutrientB, cell, exuded / 2, c);
  deposit(world.oxygen, cell, fixed * cycle.oxygenPerMaterial, c);
  world.ledger.fixed += fixed;
  world.ledger.exuded += exuded;
  world.ledger.lightEnergy += fixed * c.nutrientEnergy;
  world.ledger.oxygenProduced += fixed * cycle.oxygenPerMaterial;
  flow(world, cell, "fixed", fixed);
  flow(world, cell, "exuded", exuded);
}

function relax(field: Float64Array, target: number, factor: number): number {
  let net = 0;
  for (let i = 0; i < field.length; i++) {
    const change = factor * (target - field[i]);
    field[i] += change;
    net += change;
  }
  return net;
}
/** Relaxes oxygen and inorganic carbon toward the atmosphere; net inflows are accounted. */
export function exchangeAtmosphere(world: World): void {
  const cycle = world.config.cycle;
  if (!cycle) return;
  const factor = 1 - Math.exp(-cycle.exchangeRate * world.config.dt);
  world.ledger.oxygenExchanged += relax(world.oxygen, cycle.atmosphereOxygen, factor);
  world.ledger.carbonExchanged += relax(world.carbon, cycle.atmosphereCarbon, factor);
}
/** Oxygen bookkeeping closure: initial + produced + exchanged − consumed − diffusion loss − held. */
export function oxygenBalance(world: World): number {
  const l = world.ledger;
  let held = 0;
  for (const v of world.oxygen) held += v;
  return l.initialOxygen + l.oxygenProduced + l.oxygenExchanged - l.oxygenConsumed - held;
}
