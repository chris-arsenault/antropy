import { surfaceSpawnY } from "../ant";
import { foundColony, type Colony } from "../colony";
import { voxelIndex } from "../grid";
import { Material } from "../materials";
import { ENERGY } from "../tunables";
import { createWorld, mutateVoxel, stepWorld, type World } from "../world";
import { resetOracleState, type OraclePolicy } from "./policies";
import { makeStrategy } from "./strategies";

/**
 * Strategy tournament harness (Appendix B §B.8): colony ledgers decide
 * whether the liability shapes make underground asset placement pay.
 * Scored on the §B.8.2 ledgers — worker-days lived, net nest energy
 * (crop + physical hoard), merit — never on adult death (Rule 6:
 * survivable-but-inferior). The fixed dig plan runs harness-side
 * (ADR-0009): the entrance shaft is extended downward into a brood vault
 * and the scripted queen descends with it; each layer costs stockpile
 * and takes time, and spoil lands on the surface (matter conserved).
 */
export interface StrategySpec {
  name: string;
  policy: OraclePolicy;
  /** Vault depth in layers dug below the founding chamber (0 = none). */
  vaultDepth: number;
  /** Surface living (§B.8.1 "rests, lays, stores on the surface"): the
   * queen sits in the open depression and her brood incubates exposed. */
  queenOnSurface: boolean;
}

export interface QuarterSample {
  ants: number;
  merit: number;
  nestEnergy: number;
}

export interface TournamentLedger {
  name: string;
  survived: boolean;
  ants: number;
  merit: number;
  workerDays: number;
  nestEnergy: number;
  vaultDepth: number;
  /** Fraction of laid eggs not lost to exposure (§B.8.2). */
  eggSurvival: number;
  quarters: QuarterSample[];
}

/** Ticks between vault layer excavations (Rule 7: construction takes time). */
const BUILD_INTERVAL = 400;
/** Stockpile bill per 2x2 layer: dig energy plus haul labor. */
const COST_PER_LAYER = 0.4;
/** The build never draws the stockpile below the queen's working reserve. */
const BUILD_RESERVE = 2;

export function makeContenders(): StrategySpec[] {
  return [
    {
      name: "O-surface",
      policy: makeStrategy({ cacheSite: "surface", retreat: false }),
      vaultDepth: 0,
      queenOnSurface: true,
    },
    {
      name: "O-shelter",
      policy: makeStrategy({ cacheSite: "chamber", retreat: true }),
      vaultDepth: 0,
      queenOnSurface: false,
    },
    {
      name: "O-architect",
      policy: makeStrategy({ cacheSite: "chamber", retreat: true }),
      vaultDepth: 10,
      queenOnSurface: false,
    },
  ];
}

/** The Rule 7 increment series: vault depth in construction increments. */
export function makeIncrements(): StrategySpec[] {
  return [0, 1, 4, 10].map((depth) => ({
    name: `O-dig${depth}`,
    policy: makeStrategy({ cacheSite: "chamber", retreat: true }),
    vaultDepth: depth,
    queenOnSurface: false,
  }));
}

/** Drop one spoil block on the surface west of the nest, never entombing. */
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

/** Dig the next 2x2 vault layer below the queen; she descends into it. */
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

function stepBuild(
  world: World,
  colony: Colony,
  spec: StrategySpec,
  baselineY: number
): void {
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

/** Crop plus every physical FOOD voxel hoarded near the nest (§B.8.2 net
 * nest energy). Rain deletes the surface share of this on its own. */
function nestEnergy(world: World, colony: Colony): number {
  let voxels = 0;
  for (const index of world.foodSources) {
    const x = index % world.grid.sizeX;
    const z = Math.floor(index / world.grid.sizeX) % world.grid.sizeZ;
    if (Math.abs(x - colony.x) <= 8 && Math.abs(z - colony.z) <= 8) {
      voxels += 1;
    }
  }
  return colony.stockpile + voxels * ENERGY.foodEnergy;
}

export function runTournamentColony(
  seed: number,
  spec: StrategySpec,
  ticks: number,
  trace?: (world: World, colony: Colony, t: number) => void
): TournamentLedger {
  resetOracleState();
  const world = createWorld(seed);
  const first = foundColony(world);
  if (spec.queenOnSurface) {
    // Surface living: the queen holds court in the open depression; her
    // eggs incubate exposed (climate-keyed exposure does the rest).
    // surfaceSpawnY would find the carved chamber airspace below, so use
    // the terrain surface itself.
    first.y = world.surfaceMap[first.z * world.grid.sizeX + first.x];
  }
  const baselineY = first.y;
  world.policyOverride = spec.policy;
  const quarters: QuarterSample[] = [];
  const quarter = Math.floor(ticks / 4);
  let workerTicks = 0;
  for (let t = 1; t <= ticks; t++) {
    stepWorld(world);
    stepBuild(world, first, spec, baselineY);
    workerTicks += world.ants.length;
    trace?.(world, first, t);
    if (t % quarter === 0) {
      quarters.push({
        ants: world.ants.length,
        merit: totalMerit(first),
        nestEnergy: nestEnergy(world, first),
      });
    }
  }
  return {
    name: spec.name,
    survived: world.colonies.length > 0,
    ants: world.ants.length,
    merit: totalMerit(first),
    workerDays: workerTicks / 1000,
    nestEnergy: nestEnergy(world, first),
    vaultDepth: baselineY - first.y,
    eggSurvival: world.eggsLaid === 0 ? 1 : 1 - world.eggsPerished / world.eggsLaid,
    quarters,
  };
}

function totalMerit(colony: Colony): number {
  let merit = 0;
  for (const credit of colony.patrilineDeliveries.values()) {
    merit += credit;
  }
  return merit;
}

export function formatTournamentLedger(ledger: TournamentLedger): string {
  const quarters = ledger.quarters
    .map(
      (q, i) =>
        `Q${i + 1}[ants=${q.ants} merit=${q.merit.toFixed(0)} nest=${q.nestEnergy.toFixed(1)}]`
    )
    .join(" ");
  return (
    `${ledger.name}: ${ledger.survived ? "survived" : "collapsed"}` +
    ` ants=${ledger.ants} workerDays=${ledger.workerDays.toFixed(0)}` +
    ` merit=${ledger.merit.toFixed(0)} nest=${ledger.nestEnergy.toFixed(1)}` +
    ` vault=${ledger.vaultDepth} eggSurvival=${(ledger.eggSurvival * 100).toFixed(0)}%` +
    ` ${quarters}`
  );
}
