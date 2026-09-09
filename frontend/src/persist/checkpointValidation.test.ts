import { describe, expect, it } from "vitest";
import { createCheckpoint, restoreCheckpoint, type Checkpoint2D } from "./checkpoint";
import { FORAGER_CONFIG } from "../sim/config";
import { createWorld } from "../sim/world";

function checkpoint(): Checkpoint2D {
  return createCheckpoint(
    createWorld(
      9,
      "programmed",
      {
        ...FORAGER_CONFIG,
        width: 512,
        foodCount: 12,
      },
      false
    )
  );
}

describe("checkpoint import validation", () => {
  it.each([
    { active: [-1], values: [1] },
    { active: [512 * 128], values: [1] },
    { active: [1, 1], values: [1, 2] },
    { active: [1], values: [NaN] },
    { active: [1], values: [-1] },
    { active: [1], values: [] },
  ])("rejects invalid chemical state before restoring it: %j", (foodOdor) => {
    expect(() => restoreCheckpoint({ ...checkpoint(), foodOdor })).toThrow("chemical field");
  });

  it("rejects changed mechanism order and versions", () => {
    const original = checkpoint();
    expect(() =>
      restoreCheckpoint({
        ...original,
        mechanisms: [...original.mechanisms].reverse(),
      })
    ).toThrow();
    expect(() =>
      restoreCheckpoint({
        ...original,
        mechanisms: original.mechanisms.map((entry) => ({ ...entry, version: 99 })),
      })
    ).toThrow();
  });

  it("rejects duplicate worker and resource identities", () => {
    const original = checkpoint();
    expect(() =>
      restoreCheckpoint({ ...original, ants: [original.ants[0], original.ants[0]] })
    ).toThrow("worker state");
    expect(() =>
      restoreCheckpoint({ ...original, food: [original.food[0], original.food[0]] })
    ).toThrow("food quantity");
  });

  it("rejects nonfinite reserves and reused identities", () => {
    const original = checkpoint();
    expect(() =>
      restoreCheckpoint({
        ...original,
        queen: { ...original.queen, energy: Infinity },
      })
    ).toThrow("queen state");
    expect(() => restoreCheckpoint({ ...original, nextAntId: original.ants[0].id })).toThrow(
      "next identity"
    );
  });

  it("rejects invalid configuration before allocating the world", () => {
    const original = checkpoint();
    expect(() =>
      restoreCheckpoint({
        ...original,
        config: { ...original.config, width: Infinity },
      })
    ).toThrow();
  });
});
