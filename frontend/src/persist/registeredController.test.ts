import { expect, it } from "vitest";
import { type RegisteredModel, validateRegisteredModel } from "../sim/controller/registeredModel";
import {
  registeredAction,
  registeredLogits,
  createRegisteredState,
  registeredRandom,
} from "../sim/controller/registeredNetwork";
import { DIRECTION_GLOBALS } from "../sim/controller/directionalEncoding";
import { createRegisteredWorld, stepWorld } from "../sim/world";
import { createAnt } from "../sim/ant";
import { createCheckpoint, restoreCheckpoint } from "./checkpoint";

function fixture(): RegisteredModel {
  const layer = (rows: number, columns: number) => ({
    weight: Array<number>(rows * columns).fill(0),
    bias: Array<number>(rows).fill(0),
  });
  return {
    version: 5,
    observationContract: "colony-f32-v1",
    taskContract: "private-task-byte-v1",
    inputs: 113,
    hidden: 2,
    embedding: 2,
    history: 0,
    recurrent: true,
    globalInputs: DIRECTION_GLOBALS,
    tasks: 2,
    gated: true,
    temperature: 1,
    motorBias: [0, 0, 0],
    encoder: layer(2, 16),
    context: layer(2, 26),
    recurrence: layer(2, 2),
    scorer: layer(2, 11),
    direction: layer(1, 2),
    care: layer(7, 2),
    taskContext: { weight: [1, -1, 0, 0], bias: [0, 0] },
    taskGate: layer(26, 2),
    taskHead: layer(3, 2),
  };
}

it("uses the private register in recurrence and supports keep and numeric writes", () => {
  const model = validateRegisteredModel(fixture());
  const input = new Float32Array(model.inputs),
    state = createRegisteredState(model);
  input[111] = 1;
  registeredLogits(model, input, state);
  expect(state[0]).toBeCloseTo(Math.tanh(1));
  input[111] = 0;
  input[112] = 1;
  registeredLogits(model, input, state);
  expect(state[0]).toBeCloseTo(Math.tanh(-1));
  const logits = new Float32Array(13);
  logits[12] = 10;
  expect(registeredAction({ ...model, temperature: 0 }, logits, 0, 0).task).toBe(1);
  logits[10] = 20;
  expect(registeredAction({ ...model, temperature: 0 }, logits, 0, 0).task).toBeNull();
  expect(() => validateRegisteredModel({ ...model, tasks: 257 })).toThrow("contract");
});

it("continues stochastic neural worlds exactly through checkpoints and initializes newborn memory", () => {
  const model = fixture(),
    world = createRegisteredWorld(3, model, undefined, false);
  for (let i = 0; i < 5; i++) stepWorld(world);
  const restored = restoreCheckpoint(createCheckpoint(world));
  for (let i = 0; i < 5; i++) {
    stepWorld(world);
    stepWorld(restored);
  }
  expect(createCheckpoint(restored)).toEqual(createCheckpoint(world));
  const newborn = createAnt(world, 100);
  expect(newborn.task).toBe(0);
  expect(newborn.controllerState.length).toBe(4);
  const a = createRegisteredState(model, 1),
    b = createRegisteredState(model, 2);
  expect(registeredRandom(a)).not.toBe(registeredRandom(b));
  expect([...a]).not.toEqual([...b]);
});
