import { type Ant } from "./ant";
import { getVoxelSafe, type VoxelGrid } from "./grid";
import { Material } from "./materials";
import {
  MAX_STEPS_PER_TICK,
  TURN_RADIANS_PER_TICK,
  hasSupport,
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
  if (belowIsAir && (isLegalPosition(grid, ant.x, below, ant.z) || !hasSupport(grid, ant.x, below, ant.z))) {
    ant.y = below;
  }
  ant.falling = !hasSupport(grid, ant.x, ant.y, ant.z);
}

function tryStep(grid: VoxelGrid, ant: Ant, motor: MotorState): void {
  for (const candidate of stepCandidates(ant.heading, motor.verticalBias)) {
    const nx = ant.x + candidate.dx;
    const ny = ant.y + candidate.dy;
    const nz = ant.z + candidate.dz;
    if (isLegalPosition(grid, nx, ny, nz)) {
      ant.x = nx;
      ant.y = ny;
      ant.z = nz;
      return;
    }
  }
}

/**
 * Apply one tick of motor output to an ant on the lattice (design spec §5.3):
 * turn the continuous heading, accumulate thrust into whole steps, step to a
 * legal neighbor, and fall when nothing solid is in reach.
 */
export function applyMotor(grid: VoxelGrid, ant: Ant, motor: MotorState): void {
  beginTick(ant);

  if (!hasSupport(grid, ant.x, ant.y, ant.z)) {
    ant.falling = true;
    fall(grid, ant);
    return;
  }
  ant.falling = false;

  ant.heading += motor.turn * TURN_RADIANS_PER_TICK;
  // Leg length buys speed (spec §3.2); the energy side is in applyStepCost.
  ant.moveCharge += Math.max(0, Math.min(1, motor.forward)) * ant.traits.legLength;

  let steps = 0;
  while (ant.moveCharge >= 1 && steps < MAX_STEPS_PER_TICK) {
    ant.moveCharge -= 1;
    tryStep(grid, ant, motor);
    steps += 1;
  }
  ant.moveCharge = Math.min(ant.moveCharge, 1);
}
