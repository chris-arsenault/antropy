import { type Ant } from "./ant";
import { headingToDirection, verticalBandOffset } from "./movement";

export interface TargetVoxel {
  x: number;
  y: number;
  z: number;
}

export interface TargetBand {
  readonly targets: readonly TargetVoxel[];
  count: number;
}

const TARGETS: TargetVoxel[] = [
  { x: 0, y: 0, z: 0 },
  { x: 0, y: 0, z: 0 },
  { x: 0, y: 0, z: 0 },
];
const BAND: TargetBand = { targets: TARGETS, count: 0 };

function setTarget(index: number, x: number, y: number, z: number): void {
  TARGETS[index].x = x;
  TARGETS[index].y = y;
  TARGETS[index].z = z;
}

/**
 * Resolve the mandible targets exposed by the active vertical band. Sensing,
 * eating, excavation, pickup, and deposit all consume this same ordering.
 * The returned scratch object is valid only until the next call.
 */
export function mandibleTargetBand(ant: Ant, verticalBias: number): TargetBand {
  const { dx, dz } = headingToDirection(ant.heading);
  const verticalBand = verticalBandOffset(verticalBias);
  if (verticalBand < 0) {
    setTarget(0, ant.x, ant.y - 1, ant.z);
    setTarget(1, ant.x + dx, ant.y - 1, ant.z + dz);
    BAND.count = 2;
    return BAND;
  }
  if (verticalBand > 0) {
    setTarget(0, ant.x + dx, ant.y + 1, ant.z + dz);
    setTarget(1, ant.x, ant.y + 1, ant.z);
    setTarget(2, ant.x + dx, ant.y, ant.z + dz);
    BAND.count = 3;
    return BAND;
  }
  setTarget(0, ant.x + dx, ant.y, ant.z + dz);
  setTarget(1, ant.x + dx, ant.y - 1, ant.z + dz);
  BAND.count = 2;
  return BAND;
}
