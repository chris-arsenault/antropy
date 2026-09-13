import { expect, it } from "vitest";
import { createWorld, stepWorld } from "../sim/world";
import { DEFAULT_CONFIG } from "../sim/config";
import { balance, materialBalance, total } from "../sim/accounting";
import { checkpointToJson, restoreWorld } from "../persist/checkpoint";
import { distance } from "../sim/geometry";
import { spatialGroups } from "../observe/spatialGroups";

it("places food locally in a larger world without adding material during priming", () => {
  const empty = createWorld(101, { ...DEFAULT_CONFIG, sourcePriming: 0 });
  const primed = createWorld(101);
  expect(primed.config.width).toBe(320);
  expect(primed.ledger.initialMaterial).toBeCloseTo(empty.ledger.initialMaterial, 8);
  expect(primed.ledger.initial).toBeCloseTo(empty.ledger.initial, 8);
  expect(total(primed.nutrient) + total(primed.nutrientB)).toBeGreaterThan(0);
  const occupied = primed.nutrient.filter((v, i) => v + primed.nutrientB[i] > 0).length;
  expect(occupied / primed.nutrient.length).toBeLessThan(0.25);
  expect(
    primed.cells.every((cell) =>
      primed.habitats.some((h) => distance(cell, h, primed.config) <= h.radius * 1.5)
    )
  ).toBe(true);
  expect(balance(primed)).toBeCloseTo(0, 8);
  expect(materialBalance(primed)).toBeCloseTo(0, 8);
});

it("renews abiotic sites independently of occupants and persists the renewal state", () => {
  const c = {
    ...DEFAULT_CONFIG,
    width: 40,
    height: 32,
    founders: 1,
    sourceCount: 3,
    sourceLifetime: 0.2,
    sourceGap: 0.2,
    landscapeSpread: 5,
  };
  const world = createWorld(13, c);
  const sites = structuredClone(world.habitats);
  for (let i = 0; i < 10; i++) stepWorld(world);
  const restored = restoreWorld(checkpointToJson(world));
  for (let i = 0; i < 10; i++) {
    stepWorld(world);
    stepWorld(restored);
  }
  expect(world.habitats).toEqual(sites);
  expect(world.sources.map(({ x, y }) => ({ x, y }))).toEqual(sites.map(({ x, y }) => ({ x, y })));
  expect(checkpointToJson(restored)).toBe(checkpointToJson(world));
  expect(materialBalance(world)).toBeCloseTo(0, 8);
});
it("keeps founder placement aligned with actual sites when food zones remap the landscape", () => {
  const world = createWorld(101, { ...DEFAULT_CONFIG, foodZones: { shares: [1, 0] } });
  expect(world.sources.map(({ x, y }) => ({ x, y }))).toEqual(
    world.habitats.map(({ x, y }) => ({ x, y }))
  );
  expect(
    world.cells.every((cell) =>
      world.sources.some((source) => distance(cell, source, world.config) <= source.radius * 1.5)
    )
  ).toBe(true);
});
it.each([101, 7, 19])(
  "starts seed %i with two separated, funded colonies of identical genotypes",
  (seed) => {
    const world = createWorld(seed);
    const groups = spatialGroups(world);
    expect(groups).toHaveLength(2);
    expect(groups.every((group) => group.length >= 3)).toBe(true);
    expect(groups.reduce((sum, group) => sum + group.length, 0)).toBe(48);
    const nearest = Math.min(
      ...groups[0].flatMap((a) => groups[1].map((b) => distance(a, b, world.config)))
    );
    expect(nearest).toBeGreaterThan(30);
    expect(new Set(world.cells.map((cell) => cell.genome)).size).toBe(1);
    const restored = restoreWorld(checkpointToJson(world));
    expect(restored.cells).toEqual(world.cells);
  }
);
