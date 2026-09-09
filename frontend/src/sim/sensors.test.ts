import { describe, expect, it } from "vitest";
import { Input } from "./controller/contract";
import { setCell } from "./grid";
import { stepFrom } from "./geometry";
import { Material } from "./materials";
import { relativeChemicalContrast, sense } from "./sensors";
import { createWorld } from "./world";
import { FORAGER_CONFIG } from "./config";

describe("chemical receptor contrast", () => {
  it("reports only the signed relation between two local samples", () => {
    expect(relativeChemicalContrast(0, 0)).toBe(0);
    expect(relativeChemicalContrast(0.3, 0.3)).toBe(0);
    expect(relativeChemicalContrast(0.3, 0.1)).toBeCloseTo(0.5);
    expect(relativeChemicalContrast(0.1, 0.3)).toBeCloseTo(-0.5);
    expect(relativeChemicalContrast(1, 0)).toBe(1);
    expect(relativeChemicalContrast(0, 1)).toBe(-1);
  });
});

describe("physical contact receptors", () => {
  it("reports cache material only in the cell immediately ahead", () => {
    const world = createWorld(1, "programmed", FORAGER_CONFIG, false);
    const forward = stepFrom(world.ant, world.ant.heading);
    setCell(world.grid, forward.x, forward.y, Material.CACHE);

    expect(sense(world, world.ant)[Input.CONTACT_CACHE]).toBe(1);

    setCell(world.grid, forward.x, forward.y, Material.AIR);
    expect(sense(world, world.ant)[Input.CONTACT_CACHE]).toBe(0);
  });
});
