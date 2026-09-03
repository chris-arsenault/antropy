import { type Ant } from "../ant";
import { Output } from "../controller/contract";
import { Material } from "../materials";
import { headingToDirection } from "../movement";
import { steer, turnToward, type OraclePolicy } from "./policies";

export interface FoodPosition {
  x: number;
  y: number;
  z: number;
}

export interface FoodCarrierOptions {
  source: FoodPosition;
  destination: FoodPosition;
  /** Transit cells followed before pickup. */
  unloadedWaypoints: readonly FoodPosition[];
  /** Transit cells followed after pickup. */
  loadedWaypoints: readonly FoodPosition[];
}

function atPosition(ant: Ant, target: FoodPosition): boolean {
  return ant.x === target.x && ant.y === target.y && ant.z === target.z;
}

function moveTo(ant: Ant, target: FoodPosition): Float32Array {
  if (ant.x === target.x && ant.z === target.z && ant.y !== target.y) {
    const outputs = steer(0, 0.7);
    outputs[Output.VERTICAL_BIAS] = target.y > ant.y ? 1 : -1;
    return outputs;
  }
  return steer(turnToward(ant, target.x, target.z), 0.7);
}

function faces(ant: Ant, target: FoodPosition): boolean {
  const { dx, dz } = headingToDirection(ant.heading);
  return ant.x + dx === target.x && ant.y === target.y && ant.z + dz === target.z;
}

function useMandiblesAt(ant: Ant, target: FoodPosition): Float32Array {
  if (ant.x === target.x && ant.z === target.z && Math.abs(ant.y - target.y) === 1) {
    const outputs = steer(0, 0);
    outputs[Output.VERTICAL_BIAS] = target.y > ant.y ? 1 : -1;
    outputs[Output.DIG] = 1;
    return outputs;
  }
  if (ant.y !== target.y) {
    return moveTo(ant, target);
  }
  const adjacent = Math.max(Math.abs(ant.x - target.x), Math.abs(ant.z - target.z)) === 1;
  const outputs = steer(turnToward(ant, target.x, target.z), adjacent ? 0 : 0.7);
  if (adjacent && faces(ant, target)) {
    outputs[Output.DIG] = 1;
  }
  return outputs;
}

function nextWaypoint(
  ant: Ant,
  waypoints: readonly FoodPosition[],
  progress: Map<number, number>
): FoodPosition | null {
  let index = progress.get(ant.id) ?? 0;
  while (index < waypoints.length && atPosition(ant, waypoints[index])) {
    index += 1;
  }
  progress.set(ant.id, index);
  return waypoints[index] ?? null;
}

/** Appendix D step-11a oracle: choose a route; shared DIG performs pickup and deposit. */
export function makeFoodCarrier(options: FoodCarrierOptions): OraclePolicy {
  const unloadedProgress = new Map<number, number>();
  const loadedProgress = new Map<number, number>();
  return (_world, ant) => {
    const loaded = ant.carrying === Material.FOOD;
    const waypoint = nextWaypoint(
      ant,
      loaded ? options.loadedWaypoints : options.unloadedWaypoints,
      loaded ? loadedProgress : unloadedProgress
    );
    if (waypoint) {
      return moveTo(ant, waypoint);
    }
    return useMandiblesAt(ant, loaded ? options.destination : options.source);
  };
}
