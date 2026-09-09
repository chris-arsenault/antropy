import { expect, it } from "vitest";
import { constructionFixture } from "./fixture";
import { setCell, getCell } from "../grid";
import { Material } from "../materials";
import { maintainColony } from "../lifecycle";
import { applyRequest } from "../colony/resolve";
import { WAIT } from "../colony/contract";
import { energyResidual } from "../resources";
import { layEgg } from "../reproduction";

it("permits a funded egg only after excavation opens a supported nursery cell", () => {
  const { world } = constructionFixture("colony-programmed", 1, { reproductionEnabled: true });
  for (let y = 18; y <= 25; y++)
    for (let x = 21; x <= 29; x++) setCell(world.grid, x, y, Material.SOIL);
  world.ant.x = 24;
  setCell(world.grid, 24, 21, Material.AIR);
  setCell(world.grid, 25, 21, Material.AIR);
  world.queen.layingAge = world.config.layingInterval;
  maintainColony(world);
  expect(layEgg(world, world.queen, 4)).toBe("blocked");
  expect(world.brood).toHaveLength(0);
  const reserve = world.queen.energy;
  for (let i = 0; i < 20 && getCell(world.grid, 23, 21) !== Material.AIR; i++)
    applyRequest(world, world.ant, { ...WAIT, kind: "dig", heading: 4 });
  expect(getCell(world.grid, 23, 21)).toBe(Material.AIR);
  expect(world.ant.spoil).not.toBeNull();
  world.queen.x = 24;
  world.ant.y = 22;
  maintainColony(world);
  expect(layEgg(world, world.queen, 4)).toBe("success");
  expect(world.brood).toHaveLength(1);
  expect(world.brood[0]).toMatchObject({ x: 23, y: 21, stage: "egg" });
  expect(world.queen.energy).toBeCloseTo(
    reserve - world.config.workerEggCost - world.config.mandibleCost,
    10
  );
  expect(energyResidual(world)).toBeCloseTo(0, 8);
});
