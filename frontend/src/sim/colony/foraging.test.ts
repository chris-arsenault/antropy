import { expect, it } from "vitest";
import { constructionFixture } from "../construction/fixture";
import { setBacking } from "../grid";
import { Material } from "../materials";
import { applyRequest } from "./resolve";
import { WAIT } from "./contract";
import { actColonyWorker } from "./actors";

it.each(["colony-programmed", "colony-lgp"] as const)(
  "%s keeps a viable food trip and changes it when depletion is observed",
  (driver) => {
    const { world } = constructionFixture(driver);
    world.ant.x = 45;
    for (let x = 44; x < 56; x++)
      for (let y = 21; y < 29; y++) setBacking(world.grid, x, y, Material.AIR);
    for (const [id, x] of [
      [11, 51],
      [12, 55],
    ])
      world.knowledge.locations.set(id, {
        id,
        x,
        y: 21,
        kind: "food",
        quantity: 8,
        observedAt: 0,
        backed: false,
      });
    applyRequest(world, world.ant, { ...WAIT, kind: "acquire", destination: 11 });
    actColonyWorker(world, world.ant);
    expect(world.ant.decision.history.at(-1)?.request.kind).toBe("forward");
    world.knowledge.locations.get(11)!.quantity = 0;
    actColonyWorker(world, world.ant);
    expect(world.ant.decision.history.at(-1)?.request).toMatchObject({
      kind: "acquire",
      destination: 12,
    });
  }
);
