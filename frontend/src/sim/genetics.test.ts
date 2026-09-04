import { describe, expect, it } from "vitest";
import { NEST_CONFIG } from "./config";
import { rnnController } from "./controller/rnn";
import { seedFounderGenomes } from "./genetics";
import { createWorld } from "./world";

describe("founder variation gate", () => {
  it("uses the same founder genome in every fixed-genetics world", () => {
    const first = seedFounderGenomes(createWorld(1, rnnController, NEST_CONFIG), 1)[0];
    const second = seedFounderGenomes(createWorld(2, rnnController, NEST_CONFIG), 1)[0];
    expect(Array.from(rnnController.serializeGenome(first))).toEqual(
      Array.from(rnnController.serializeGenome(second))
    );
  });
});
