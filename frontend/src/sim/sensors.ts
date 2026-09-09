import { Input, INPUT_COUNT } from "./controller/contract";
import { cellIndex, getCell } from "./grid";
import { normalizeHeading, stepFrom } from "./geometry";
import { chemicalAccessible, skyLight } from "./terrain";
import { Material } from "./materials";
import { deterministicJitter } from "./random";
import { chemicalResponse, isWalkable, type ChemicalField } from "./scent";
import { type Ant, type World } from "./types";
import { foodAt } from "./resources";

interface FieldInputs {
  readonly center: Input;
  readonly forward: Input;
  readonly left: Input;
  readonly right: Input;
  readonly wideLeft: Input;
  readonly wideRight: Input;
}

const FOOD: FieldInputs = {
  center: Input.FOOD_CENTER,
  forward: Input.FOOD_FORWARD,
  left: Input.FOOD_LEFT,
  right: Input.FOOD_RIGHT,
  wideLeft: Input.FOOD_WIDE_LEFT,
  wideRight: Input.FOOD_WIDE_RIGHT,
};
const NEST: FieldInputs = {
  center: Input.NEST_CENTER,
  forward: Input.NEST_FORWARD,
  left: Input.NEST_LEFT,
  right: Input.NEST_RIGHT,
  wideLeft: Input.NEST_WIDE_LEFT,
  wideRight: Input.NEST_WIDE_RIGHT,
};
const PHEROMONE_A: FieldInputs = {
  center: Input.PHEROMONE_A_CENTER,
  forward: Input.PHEROMONE_A_FORWARD,
  left: Input.PHEROMONE_A_LEFT,
  right: Input.PHEROMONE_A_RIGHT,
  wideLeft: Input.PHEROMONE_A_WIDE_LEFT,
  wideRight: Input.PHEROMONE_A_WIDE_RIGHT,
};
const PHEROMONE_B: FieldInputs = {
  center: Input.PHEROMONE_B_CENTER,
  forward: Input.PHEROMONE_B_FORWARD,
  left: Input.PHEROMONE_B_LEFT,
  right: Input.PHEROMONE_B_RIGHT,
  wideLeft: Input.PHEROMONE_B_WIDE_LEFT,
  wideRight: Input.PHEROMONE_B_WIDE_RIGHT,
};

function sample(field: ChemicalField, world: World, ant: Ant, heading: number): number {
  const point = stepFrom(ant, heading);
  if (!chemicalAccessible(world.grid, world.config.environment.chemicalSensing, point.x, point.y))
    return 0;
  return chemicalResponse(field.values[cellIndex(world.grid, point.x, point.y)]);
}

export function relativeChemicalContrast(neighbor: number, center: number): number {
  const total = Math.abs(neighbor) + Math.abs(center);
  if (total <= Number.EPSILON) return 0;
  return (neighbor - center) / total;
}

function sampleField(
  field: ChemicalField,
  channels: FieldInputs,
  world: World,
  ant: Ant,
  inputs: Float32Array
): void {
  const center = chemicalResponse(field.values[cellIndex(world.grid, ant.x, ant.y)]);
  inputs[channels.center] = center;
  inputs[channels.forward] = relativeChemicalContrast(
    sample(field, world, ant, ant.heading),
    center
  );
  inputs[channels.left] = relativeChemicalContrast(
    sample(field, world, ant, normalizeHeading(ant.heading + 1)),
    center
  );
  inputs[channels.right] = relativeChemicalContrast(
    sample(field, world, ant, normalizeHeading(ant.heading - 1)),
    center
  );
  inputs[channels.wideLeft] = relativeChemicalContrast(
    sample(field, world, ant, normalizeHeading(ant.heading + 2)),
    center
  );
  inputs[channels.wideRight] = relativeChemicalContrast(
    sample(field, world, ant, normalizeHeading(ant.heading - 2)),
    center
  );
}

export function sense(world: World, ant: Ant): Float32Array {
  const inputs = new Float32Array(INPUT_COUNT);
  const forward = stepFrom(ant, ant.heading);
  const left = stepFrom(ant, normalizeHeading(ant.heading + 1));
  const right = stepFrom(ant, normalizeHeading(ant.heading - 1));
  inputs[Input.OPEN_FORWARD] = isWalkable(world.grid, forward.x, forward.y) ? 1 : 0;
  inputs[Input.OPEN_LEFT] = isWalkable(world.grid, left.x, left.y) ? 1 : 0;
  inputs[Input.OPEN_RIGHT] = isWalkable(world.grid, right.x, right.y) ? 1 : 0;
  sampleField(world.foodOdor, FOOD, world, ant, inputs);
  sampleField(world.nestOdor, NEST, world, ant, inputs);
  sampleField(world.pheromoneA, PHEROMONE_A, world, ant, inputs);
  sampleField(world.pheromoneB, PHEROMONE_B, world, ant, inputs);
  inputs[Input.CONTACT_FOOD] = Number(foodAt(world, forward.x, forward.y) > 0);
  inputs[Input.CONTACT_CACHE] =
    getCell(world.grid, forward.x, forward.y) === Material.CACHE ? 1 : 0;
  inputs[Input.CARRYING] = ant.cargo > 0 ? 1 : 0;
  inputs[Input.SKY_LIGHT] = skyLight(world.grid, ant.x, ant.y, world.config.environment.lightModel);
  inputs[Input.JITTER] = deterministicJitter(world.seed, world.tick, ant.id);
  inputs[Input.HANDEDNESS] = deterministicJitter(world.seed, 0, ant.id);
  return inputs;
}
