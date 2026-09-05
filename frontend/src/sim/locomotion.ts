import { type Ant } from "./ant";
import { getVoxelSafe, type VoxelGrid } from "./grid";
import { Material } from "./materials";
import {
  MAX_STEPS_PER_TICK,
  TURN_RADIANS_PER_TICK,
  hasSupport,
  headingToDirection,
  isLegalPosition,
  stepCandidates,
  type MotorState,
} from "./movement";

function beginTick(ant: Ant): void {
  ant.prevX = ant.x;
  ant.prevY = ant.y;
  ant.prevZ = ant.z;
}

function fall(grid: VoxelGrid, ant: Ant): void {
  const below = ant.y - 1;
  if (below < 0) {
    ant.falling = false;
    return;
  }
  // An ant can only ever fall into AIR — a solid below (even an
  // unsupported floating one, e.g. dropped biomass) arrests the fall.
  const belowIsAir = getVoxelSafe(grid, ant.x, below, ant.z) === Material.AIR;
  if (
    belowIsAir &&
    (isLegalPosition(grid, ant.x, below, ant.z) || !hasSupport(grid, ant.x, below, ant.z))
  ) {
    ant.y = below;
  }
  ant.falling = !hasSupport(grid, ant.x, ant.y, ant.z);
}

/**
 * Resolve loss of support immediately after terrain changes. Excavating a
 * load-bearing voxel drops its occupant exactly one voxel; later ticks keep
 * applying the ordinary falling rule until support is regained.
 */
export function dropUnsupportedOneVoxel(grid: VoxelGrid, ant: Ant): boolean {
  if (hasSupport(grid, ant.x, ant.y, ant.z)) {
    ant.falling = false;
    return false;
  }
  ant.falling = true;
  fall(grid, ant);
  return true;
}

function moveIfLegal(
  grid: VoxelGrid,
  ant: Ant,
  candidate: { dx: number; dy: number; dz: number }
): boolean {
  const nx = ant.x + candidate.dx;
  const ny = ant.y + candidate.dy;
  const nz = ant.z + candidate.dz;
  if (!isLegalPosition(grid, nx, ny, nz)) return false;
  ant.x = nx;
  ant.y = ny;
  ant.z = nz;
  return true;
}

function moveToFirstLegal(
  grid: VoxelGrid,
  ant: Ant,
  candidates: readonly { dx: number; dy: number; dz: number }[],
  start = 0,
  end = candidates.length
): boolean {
  for (let index = start; index < end; index++) {
    if (moveIfLegal(grid, ant, candidates[index])) return true;
  }
  return false;
}

function normalizedHeadingResidual(heading: number, quantized: number): number {
  let residual = heading - quantized;
  while (residual > Math.PI) residual -= Math.PI * 2;
  while (residual < -Math.PI) residual += Math.PI * 2;
  return residual;
}

/**
 * Resolve blocked thrust through local contact mechanics. Try the smallest
 * yaw deflection first, keep the first legal heading, and reverse only at a
 * true dead end. The continuous sub-octant heading orders symmetric choices,
 * so deterministic motor jitter separates colocated ants without a remembered
 * wall side or a world-selected destination.
 */
function tryDeflectionAtDistance(
  grid: VoxelGrid,
  ant: Ant,
  verticalBias: number,
  quantized: number,
  preferredSign: number,
  distance: number
): boolean {
  for (let attempt = 0; attempt < 2; attempt++) {
    const sign = attempt === 0 ? preferredSign : -preferredSign;
    const candidateHeading = quantized + sign * distance * TURN_RADIANS_PER_TICK;
    const candidate = stepCandidates(candidateHeading, verticalBias)[0];
    if (!moveIfLegal(grid, ant, candidate)) continue;
    ant.heading = candidateHeading;
    return true;
  }
  return false;
}

function tryContactDeflection(grid: VoxelGrid, ant: Ant, verticalBias: number): boolean {
  const { dx, dz } = headingToDirection(ant.heading);
  const quantized = Math.atan2(dz, dx);
  const preferredSign = normalizedHeadingResidual(ant.heading, quantized) >= 0 ? 1 : -1;
  for (let distance = 1; distance <= 3; distance++) {
    if (tryDeflectionAtDistance(grid, ant, verticalBias, quantized, preferredSign, distance))
      return true;
  }
  const reverse = quantized + Math.PI;
  const candidate = stepCandidates(reverse, verticalBias)[0];
  if (!moveIfLegal(grid, ant, candidate)) return false;
  ant.heading = reverse;
  return true;
}

function tryStep(grid: VoxelGrid, ant: Ant, motor: MotorState): void {
  const candidates = stepCandidates(ant.heading, motor.verticalBias);
  if (moveToFirstLegal(grid, ant, candidates)) return;
  tryContactDeflection(grid, ant, motor.verticalBias);
}

/**
 * Apply one tick of motor output to an ant on the lattice (design spec §5.3):
 * turn the continuous heading, accumulate thrust into whole steps, step to a
 * legal neighbor, and fall when nothing solid is in reach.
 */
export function applyMotor(grid: VoxelGrid, ant: Ant, motor: MotorState): void {
  beginTick(ant);

  if (dropUnsupportedOneVoxel(grid, ant)) {
    return;
  }

  ant.heading += motor.turn * TURN_RADIANS_PER_TICK;
  // Leg length buys speed (spec §3.2); the energy side is in applyStepCost.
  ant.moveCharge += Math.max(0, Math.min(1, motor.forward)) * ant.traits.legLength;

  let steps = 0;
  while (ant.moveCharge >= 1 && steps < MAX_STEPS_PER_TICK) {
    ant.moveCharge -= 1;
    tryStep(grid, ant, motor);
    steps += 1;
  }
  // The per-tick step cap drops whole queued steps but preserves fractional
  // progress. Retaining a charge of exactly one makes an ant coast on the
  // next tick after it has commanded zero thrust, which can move it away
  // from a contact target between sensing and the shared action resolver.
  if (ant.moveCharge >= 1) ant.moveCharge %= 1;
}
