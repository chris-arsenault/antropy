import { type Action, IDLE_ACTION, Input, type SensorPolicy } from "../controller/contract";

const EPSILON = Math.fround(0.000_01);
const SURFACE_LIGHT = 0.5;
const RANDOM_TURN_THRESHOLD = Math.fround(0.985);

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

const HOME: FieldInputs = {
  center: Input.NEST_CENTER,
  forward: Input.NEST_FORWARD,
  left: Input.NEST_LEFT,
  right: Input.NEST_RIGHT,
  wideLeft: Input.NEST_WIDE_LEFT,
  wideRight: Input.NEST_WIDE_RIGHT,
};

const EXIT: FieldInputs = {
  center: Input.PHEROMONE_A_CENTER,
  forward: Input.PHEROMONE_A_FORWARD,
  left: Input.PHEROMONE_A_LEFT,
  right: Input.PHEROMONE_A_RIGHT,
  wideLeft: Input.PHEROMONE_A_WIDE_LEFT,
  wideRight: Input.PHEROMONE_A_WIDE_RIGHT,
};

function handedTurn(inputs: Float32Array): -1 | 1 {
  return inputs[Input.HANDEDNESS] >= 0 ? 1 : -1;
}

function followUp(inputs: Float32Array, field: FieldInputs): Action | null {
  const center = inputs[field.center];
  const choices = [
    { signal: inputs[field.forward], turn: 0 as const, open: inputs[Input.OPEN_FORWARD] > 0 },
    { signal: inputs[field.left], turn: 1 as const, open: inputs[Input.OPEN_LEFT] > 0 },
    { signal: inputs[field.right], turn: -1 as const, open: inputs[Input.OPEN_RIGHT] > 0 },
  ];
  const visible = choices
    .filter((choice) => choice.open && (choice.signal > EPSILON || center > EPSILON))
    .sort((left, right) => right.signal - left.signal)[0];
  if (visible) {
    return visible.turn === 0
      ? { ...IDLE_ACTION, move: true }
      : { ...IDLE_ACTION, turn: visible.turn };
  }
  const wideLeft = inputs[field.wideLeft];
  const wideRight = inputs[field.wideRight];
  if (wideLeft <= EPSILON && wideRight <= EPSILON) return null;
  return { ...IDLE_ACTION, turn: wideLeft >= wideRight ? 1 : -1 };
}

function explore(inputs: Float32Array): Action {
  if (inputs[Input.OPEN_FORWARD] > 0 && Math.abs(inputs[Input.JITTER]) < RANDOM_TURN_THRESHOLD) {
    return { ...IDLE_ACTION, move: true };
  }
  const preferred = handedTurn(inputs);
  if (inputs[Input.OPEN_LEFT] > 0) return { ...IDLE_ACTION, turn: 1 };
  if (inputs[Input.OPEN_RIGHT] > 0) return { ...IDLE_ACTION, turn: -1 };
  return { ...IDLE_ACTION, turn: preferred };
}

function returnFood(inputs: Float32Array): Action {
  if (inputs[Input.CONTACT_CACHE] > 0) return { ...IDLE_ACTION, mandible: true };
  const homeward = followUp(inputs, HOME);
  if (homeward) return homeward.move ? { ...homeward, pheromoneB: 1 } : homeward;
  const exitward = followUp(inputs, EXIT);
  if (exitward) return exitward.move ? { ...exitward, pheromoneB: 1 } : exitward;
  return explore(inputs);
}

function seekFood(inputs: Float32Array): Action {
  if (inputs[Input.CONTACT_FOOD] > 0) return { ...IDLE_ACTION, mandible: true };
  const field = inputs[Input.SKY_LIGHT] < SURFACE_LIGHT ? EXIT : FOOD;
  return followUp(inputs, field) ?? explore(inputs);
}

export const programmedForager: SensorPolicy = Object.freeze({
  id: "programmed-2d-forager",
  act(inputs: Float32Array) {
    return inputs[Input.CARRYING] > 0 ? returnFood(inputs) : seekFood(inputs);
  },
});
