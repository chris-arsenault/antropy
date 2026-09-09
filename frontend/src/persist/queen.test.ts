import { expect, it } from "vitest";
import { constructionFixture } from "../sim/construction/fixture";
import {
  createCheckpoint,
  encodeCheckpoint,
  decodeCheckpoint,
  restoreCheckpoint,
} from "./checkpoint";
import { actColonyWorker } from "../sim/colony/actors";
import { applyRequest } from "../sim/colony/resolve";
import { WAIT } from "../sim/colony/contract";
import { totalEnergy, energyResidual } from "../sim/resources";

it.each(["colony-programmed", "colony-lgp"] as const)(
  "%s restores independent queen memory, crop and route and continues identically",
  (driver) => {
    const { world, source } = constructionFixture(driver);
    world.queen.cargo = 1;
    world.queen.task = 233;
    world.queen.decision.registers[27] = 0.125;
    world.economy.initial = totalEnergy(world);
    applyRequest(world, world.queen, { ...WAIT, kind: "acquire", destination: source });
    const saved = createCheckpoint(world);
    const restored = decodeCheckpoint(encodeCheckpoint(world));
    expect(createCheckpoint(restored)).toEqual(saved);
    for (let i = 0; i < 8; i++) {
      world.tick++;
      restored.tick++;
      actColonyWorker(world, world.queen);
      actColonyWorker(restored, restored.queen);
    }
    expect(createCheckpoint(restored)).toEqual(createCheckpoint(world));
    expect(restored.queen.decision.registers[27]).toBe(0.125);
    expect(energyResidual(restored)).toBeCloseTo(0, 8);
    saved.queen.decision.registers[27] = Infinity;
    expect(() => restoreCheckpoint(saved)).toThrow("decision state");
  }
);

it("rejects a duplicate queen identity and worker-shaped reproductive body", () => {
  const { world } = constructionFixture();
  const saved = createCheckpoint(world);
  expect(() =>
    restoreCheckpoint({ ...saved, queen: { ...saved.queen, id: saved.ants[0].id } })
  ).toThrow("worker state");
  expect(() => restoreCheckpoint({ ...saved, queen: { ...saved.queen, caste: "worker" } })).toThrow(
    "queen state"
  );
});
