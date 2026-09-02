import { surfaceSpawnY } from "../../src/sim/ant";
import { foundColony, type Colony } from "../../src/sim/colony";
import { FULL_CONFIG, type SimConfig } from "../../src/sim/config";
import { voxelIndex } from "../../src/sim/grid";
import { Material } from "../../src/sim/materials";
import { resetOracleState } from "../../src/sim/oracles/policies";
import { ENERGY } from "../../src/sim/tunables";
import { surfaceStress } from "../../src/sim/weather";
import { createWorld, mutateVoxel, stepWorld, type World } from "../../src/sim/world";
import { type DriverSpec } from "./drivers";
import { type SeriesSample, type TraceSample } from "./ledger";

/**
 * One instrumented colony run: found a colony, drive it, sample the
 * standard metrics at a cadence, and summarize the §B.8.2 ledgers. The
 * brood-vault dig plan runs harness-side (ADR-0009): each 2x2 layer costs
 * stockpile and time, the scripted queen descends with it, spoil lands on
 * the surface.
 */
export interface ColonyRunConfig {
  driver: DriverSpec;
  seed: number;
  ticks: number;
  cadence: number;
  followAntId: number | null;
  /** Feature gates for the run (design spec §13); defaults to full. */
  simConfig?: SimConfig;
}

export interface ColonyRunResult {
  summary: Record<string, unknown>;
  series: SeriesSample[];
  trace: TraceSample[];
}

const BUILD_INTERVAL = 400;
const COST_PER_LAYER = 0.4;
const BUILD_RESERVE = 2;

function dropSpoil(world: World, colony: Colony, salt: number): void {
  const dz = (salt % 5) - 2;
  for (let r = 4; r <= 10; r++) {
    const sx = colony.x - r;
    const sz = colony.z + dz;
    const sy = surfaceSpawnY(world.grid, sx, sz);
    if (sy === null) {
      continue;
    }
    const occupied =
      world.eggIndex.has(voxelIndex(world.grid, sx, sy, sz)) ||
      world.ants.some((a) => a.alive && a.x === sx && a.y === sy && a.z === sz);
    if (!occupied) {
      mutateVoxel(world, sx, sy, sz, Material.LOOSE_FILL);
      return;
    }
  }
}

function digVaultLayer(world: World, colony: Colony): void {
  const y = colony.y - 1;
  if (y < 2) {
    return;
  }
  for (let dx = 0; dx <= 1; dx++) {
    for (let dz = 0; dz <= 1; dz++) {
      const material = world.grid.data[voxelIndex(world.grid, colony.x + dx, y, colony.z + dz)];
      if (material !== Material.AIR) {
        mutateVoxel(world, colony.x + dx, y, colony.z + dz, Material.AIR);
        dropSpoil(world, colony, y + dx + dz);
      }
    }
  }
  colony.y = y;
}

function stepBuild(world: World, colony: Colony, spec: DriverSpec, baselineY: number): void {
  if (spec.vaultDepth === 0 || baselineY - colony.y >= spec.vaultDepth) {
    return;
  }
  if (world.tick % BUILD_INTERVAL !== 0 || world.ants.length === 0) {
    return;
  }
  if (colony.stockpile < BUILD_RESERVE + COST_PER_LAYER) {
    return;
  }
  digVaultLayer(world, colony);
  colony.stockpile -= COST_PER_LAYER;
}

/** Physical FOOD voxels hoarded within 8 of the nest, as energy. */
function hoardEnergy(world: World, colony: Colony): number {
  let voxels = 0;
  for (const index of world.foodSources) {
    const x = index % world.grid.sizeX;
    const z = Math.floor(index / world.grid.sizeX) % world.grid.sizeZ;
    if (Math.abs(x - colony.x) <= 8 && Math.abs(z - colony.z) <= 8) {
      voxels += 1;
    }
  }
  return voxels * ENERGY.foodEnergy;
}

function totalMerit(colony: Colony): number {
  let merit = 0;
  for (const credit of colony.patrilineDeliveries.values()) {
    merit += credit;
  }
  return merit;
}

function sample(world: World, colony: Colony): SeriesSample {
  const ants = world.ants;
  const meanEnergy = ants.reduce((a, b) => a + b.energy, 0) / Math.max(1, ants.length);
  return {
    tick: world.tick,
    ants: ants.length,
    eggs: world.eggs.length,
    stockpile: colony.stockpile,
    hoard: hoardEnergy(world, colony),
    merit: totalMerit(colony),
    eggsLaid: world.eggsLaid,
    eggsPerished: world.eggsPerished,
    meanEnergy,
    rain: world.rainRemaining,
    stress: surfaceStress(world.tick),
  };
}

function followAnt(world: World, antId: number | null, tick: number, out: TraceSample[]): void {
  if (antId === null) {
    return;
  }
  const ant = world.ants.find((a) => a.id === antId);
  if (ant) {
    out.push({ tick, antId: ant.id, x: ant.x, y: ant.y, z: ant.z, energy: ant.energy });
  }
}

export function runColony(config: ColonyRunConfig): ColonyRunResult {
  resetOracleState();
  const world = createWorld(config.seed, undefined, config.simConfig ?? FULL_CONFIG);
  // Continuation would mask the collapse ledgers this harness measures.
  world.config.autoContinue = false;
  const colony = foundColony(world);
  if (config.driver.queenOnSurface) {
    colony.y = world.surfaceMap[colony.z * world.grid.sizeX + colony.x];
  }
  const baselineY = colony.y;
  if (config.driver.policy !== null) {
    world.policyOverride = config.driver.policy;
  }

  const series: SeriesSample[] = [];
  const trace: TraceSample[] = [];
  let workerTicks = 0;
  for (let t = 1; t <= config.ticks; t++) {
    stepWorld(world);
    stepBuild(world, colony, config.driver, baselineY);
    workerTicks += world.ants.length;
    if (t % config.cadence === 0) {
      series.push(sample(world, colony));
    }
    followAnt(world, config.followAntId, t, trace);
  }

  const summary = {
    survived: world.colonies.length > 0,
    ants: world.ants.length,
    workerDays: workerTicks / 1000,
    merit: totalMerit(colony),
    nestEnergy: colony.stockpile + hoardEnergy(world, colony),
    vaultDepth: baselineY - colony.y,
    eggsLaid: world.eggsLaid,
    eggsPerished: world.eggsPerished,
    eggSurvival: world.eggsLaid === 0 ? 1 : 1 - world.eggsPerished / world.eggsLaid,
    foundings: world.foundings,
    collapses: world.collapses,
  };
  return { summary, series, trace };
}

/** One line for the terminal after each run. */
export function formatSummary(driver: string, seed: number, s: Record<string, unknown>): string {
  const pct = ((s.eggSurvival as number) * 100).toFixed(0);
  return (
    `${driver} seed=${seed}: ${s.survived ? "survived" : "collapsed"}` +
    ` ants=${s.ants} workerDays=${(s.workerDays as number).toFixed(0)}` +
    ` merit=${(s.merit as number).toFixed(0)} nest=${(s.nestEnergy as number).toFixed(1)}` +
    ` eggSurvival=${pct}% vault=${s.vaultDepth}`
  );
}
