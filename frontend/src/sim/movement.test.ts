import { describe, expect, it } from "vitest";
import { getVoxel } from "./grid";
import { Material } from "./materials";
import { hasSupport, headingToDirection, isLegalPosition, stepCandidates } from "./movement";
import { createWorld, mutateVoxel, populateForagers, stepWorld } from "./world";

describe("headingToDirection", () => {
  it("maps the eight octants to unit horizontal directions", () => {
    expect(headingToDirection(0)).toEqual({ dx: 1, dz: 0 });
    expect(headingToDirection(Math.PI / 2)).toEqual({ dx: 0, dz: 1 });
    expect(headingToDirection(Math.PI)).toEqual({ dx: -1, dz: 0 });
    expect(headingToDirection(-Math.PI / 2)).toEqual({ dx: 0, dz: -1 });
    expect(headingToDirection(Math.PI * 2)).toEqual({ dx: 1, dz: 0 });
  });
});

describe("stepCandidates", () => {
  it("prefers the vertical level matching the bias", () => {
    expect(stepCandidates(0, 0.9)[0]).toEqual({ dx: 1, dy: 1, dz: 0 });
    expect(stepCandidates(0, -0.9)[0]).toEqual({ dx: 1, dy: -1, dz: 0 });
    expect(stepCandidates(0, 0)[0]).toEqual({ dx: 1, dy: 0, dz: 0 });
  });

  it("ends with a straight climb fallback", () => {
    const candidates = stepCandidates(0, 0.5);
    expect(candidates.at(-1)).toEqual({ dx: 0, dy: 1, dz: 0 });
  });
});

describe("walker population invariants", () => {
  function assertLegalPositions(world: ReturnType<typeof createWorld>): void {
    for (const ant of world.ants) {
      expect(getVoxel(world.grid, ant.x, ant.y, ant.z)).toBe(Material.AIR);
      if (!ant.falling && !hasSupport(world.grid, ant.x, ant.y, ant.z)) {
        // Terrain edits (eating, digging) can remove support mid-tick; the
        // ant must register as falling on its next motor application.
        const id = ant.id;
        stepWorld(world);
        const later = world.ants.find((a) => a.id === id);
        expect(
          later === undefined || later.falling || hasSupport(world.grid, later.x, later.y, later.z)
        ).toBe(true);
      }
    }
  }

  it("keeps every ant in legal positions over a long walk", { timeout: 30_000 }, () => {
    const world = createWorld(555);
    populateForagers(world, 40);
    expect(world.ants.length).toBeGreaterThan(30);

    for (let t = 0; t < 300; t++) {
      stepWorld(world);
      assertLegalPositions(world);
    }
  });

  it("is deterministic across identically seeded worlds", () => {
    const a = createWorld(777);
    const b = createWorld(777);
    populateForagers(a, 20);
    populateForagers(b, 20);
    for (let t = 0; t < 100; t++) {
      stepWorld(a);
      stepWorld(b);
    }
    expect(a.ants.map((ant) => [ant.id, ant.x, ant.y, ant.z, ant.heading])).toEqual(
      b.ants.map((ant) => [ant.id, ant.x, ant.y, ant.z, ant.heading])
    );
  });
});

function hollowBox(
  world: ReturnType<typeof createWorld>,
  cx: number,
  y0: number,
  y1: number,
  cz: number
): void {
  for (let y = y0; y <= y1; y++) {
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        mutateVoxel(world, cx + dx, y, cz + dz, Material.AIR);
      }
    }
  }
}

describe("falling", () => {
  it("drops an ant when its support is dug away", () => {
    const world = createWorld(901);
    populateForagers(world, 10);
    const ant = world.ants[0];

    // Hollow out a 26-neighborhood shell plus a drop column beneath the ant.
    hollowBox(world, ant.x, ant.y - 4, ant.y + 1, ant.z);

    expect(hasSupport(world.grid, ant.x, ant.y, ant.z)).toBe(false);
    const startY = ant.y;
    stepWorld(world);
    expect(ant.falling).toBe(true);
    expect(ant.y).toBe(startY - 1);

    for (let t = 0; t < 10; t++) {
      stepWorld(world);
    }
    expect(ant.falling).toBe(false);
    expect(isLegalPosition(world.grid, ant.x, ant.y, ant.z)).toBe(true);
  });
});
