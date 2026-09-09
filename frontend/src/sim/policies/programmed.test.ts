import { describe, expect, it } from "vitest";
import { Input, INPUT_COUNT, IDLE_ACTION } from "../controller/contract";
import { programmedForager } from "./programmed";

function frame(values: Partial<Record<Input, number>>): Float32Array {
  const inputs = new Float32Array(INPUT_COUNT);
  for (const [input, value] of Object.entries(values)) inputs[Number(input)] = value;
  return inputs;
}

describe("stateless programmed forager", () => {
  it("releases only when its forward contact receptor touches cache material", () => {
    const action = programmedForager.act(
      frame({
        [Input.CARRYING]: 1,
        [Input.CONTACT_CACHE]: 1,
        [Input.OPEN_FORWARD]: 0,
      })
    );
    expect(action).toEqual({
      ...IDLE_ACTION,
      turn: 0,
      move: false,
      mandible: true,
      pheromoneA: 0,
      pheromoneB: 0,
    });
    expect(
      programmedForager.act(
        frame({
          [Input.CARRYING]: 1,
          [Input.NEST_CENTER]: 1,
          [Input.OPEN_FORWARD]: 0,
        })
      ).mandible
    ).toBe(false);
  });

  it("follows food rather than the entrance carrier after surface exposure", () => {
    const action = programmedForager.act(
      frame({
        [Input.SKY_LIGHT]: 1,
        [Input.PHEROMONE_A_CENTER]: 1,
        [Input.FOOD_CENTER]: 0.2,
        [Input.FOOD_FORWARD]: 0.4,
        [Input.OPEN_FORWARD]: 1,
      })
    );
    expect(action).toEqual({
      ...IDLE_ACTION,
      turn: 0,
      move: true,
      mandible: false,
      pheromoneA: 0,
      pheromoneB: 0,
    });
  });

  it("returns the same action for the same current frame", () => {
    const inputs = frame({
      [Input.CARRYING]: 1,
      [Input.NEST_CENTER]: 0.3,
      [Input.NEST_LEFT]: 0.5,
    });
    expect(programmedForager.act(inputs)).toEqual(programmedForager.act(inputs));
    expect("createState" in programmedForager).toBe(false);
  });
});
