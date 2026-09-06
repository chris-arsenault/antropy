import { describe, expect, it } from "vitest";
import { PHASE2_CONFIG } from "./config";
import { Output, OUTPUT_COUNT } from "./controller/contract";
import { getVoxel } from "./grid";
import { Material } from "./materials";
import { applyMotor } from "./locomotion";
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
  it("distinguishes direct vertical movement from a diagonal climb", () => {
    const down = stepCandidates(0, -0.9);
    expect({ ...down[0] }).toEqual({ dx: 0, dy: -1, dz: 0 });
    expect({ ...down[1] }).toEqual({ dx: 1, dy: -1, dz: 0 });
    const up = stepCandidates(0, 0.9);
    expect(up[0]).toEqual({ dx: 0, dy: 1, dz: 0 });
    expect(up[1]).toEqual({ dx: 1, dy: 1, dz: 0 });

    expect(stepCandidates(0, 0.6)[0]).toEqual({ dx: 1, dy: 1, dz: 0 });
    expect(stepCandidates(0, -0.6)[0]).toEqual({ dx: 1, dy: -1, dz: 0 });
  });

  it("walks forward-level first under a neutral bias", () => {
    const candidates = stepCandidates(0, 0);
    expect(candidates[0]).toEqual({ dx: 1, dy: 0, dz: 0 });
    expect(candidates.at(-1)).toEqual({ dx: 0, dy: 1, dz: 0 });
  });

  it("does not spend a queued whole step after thrust stops", () => {
    const world = createWorld(779, undefined, PHASE2_CONFIG);
    populateForagers(world, 1);
    const ant = world.ants[0];
    ant.x = 20;
    ant.y = 20;
    ant.z = 20;
    ant.heading = 0;
    ant.traits = { ...ant.traits, legLength: 1.5 };
    for (let x = 19; x <= 23; x++) {
      mutateVoxel(world, x, 19, 20, Material.ROCK);
      mutateVoxel(world, x, 20, 20, Material.AIR);
    }

    applyMotor(world.grid, ant, { turn: 0, forward: 1, verticalBias: 0 });
    expect(ant.x).toBe(21);
    expect(ant.moveCharge).toBeCloseTo(0.5);

    applyMotor(world.grid, ant, { turn: 0, forward: 0, verticalBias: 0 });
    expect(ant.x).toBe(21);
    expect(ant.moveCharge).toBeCloseTo(0.5);
  });

  it("applies a vertical-band decision in the current sensor frame", () => {
    const world = createWorld(778, undefined, PHASE2_CONFIG);
    populateForagers(world, 1);
    const ant = world.ants[0];
    ant.x = 20;
    ant.y = 20;
    ant.z = 20;
    ant.heading = 0;
    ant.traits = { ...ant.traits, legLength: 1 };
    ant.verticalAttention = -0.8;
    mutateVoxel(world, 20, 19, 20, Material.AIR);
    mutateVoxel(world, 20, 20, 20, Material.AIR);
    mutateVoxel(world, 20, 21, 20, Material.AIR);
    mutateVoxel(world, 19, 20, 20, Material.ROCK);
    world.foodBase = 0;
    world.foodTarget = 0;
    const output = new Float32Array(OUTPUT_COUNT);
    output[Output.FORWARD] = 1;
    output[Output.VERTICAL_BIAS] = 0.8;
    world.policyOverride = () => output;

    stepWorld(world);

    expect(ant.y).toBe(21);
    expect(ant.verticalAttention).toBeCloseTo(0.8);
  });
});

describe("wall deflection", () => {
  it("takes an aligned slope before treating the forward solid as a wall", () => {
    const world = createWorld(782, undefined, PHASE2_CONFIG);
    populateForagers(world, 1);
    const ant = world.ants[0];
    ant.x = 20;
    ant.y = 20;
    ant.z = 20;
    ant.heading = 0;
    ant.traits = { ...ant.traits, legLength: 1 };
    mutateVoxel(world, 20, 19, 20, Material.ROCK);
    mutateVoxel(world, 21, 20, 20, Material.ROCK);
    mutateVoxel(world, 21, 21, 20, Material.AIR);

    applyMotor(world.grid, ant, { turn: 0, forward: 1, verticalBias: 0 });

    expect([ant.x, ant.y, ant.z]).toEqual([21, 21, 20]);
    expect(ant.heading).toBeCloseTo(0);
  });

  it("deflects a blocked forward intention into a persistent wall slide", () => {
    const world = createWorld(780, undefined, PHASE2_CONFIG);
    populateForagers(world, 1);
    const ant = world.ants[0];
    ant.x = 20;
    ant.y = 20;
    ant.z = 20;
    ant.heading = 0;
    ant.traits = { ...ant.traits, legLength: 1 };
    for (let z = 19; z <= 23; z++) {
      mutateVoxel(world, 20, 19, z, Material.ROCK);
      mutateVoxel(world, 20, 20, z, Material.AIR);
      mutateVoxel(world, 21, 20, z, Material.ROCK);
      mutateVoxel(world, 21, 21, z, Material.ROCK);
    }

    applyMotor(world.grid, ant, { turn: 0, forward: 1, verticalBias: 0 });

    expect([ant.x, ant.y, ant.z]).toEqual([20, 20, 21]);
    expect(ant.heading).toBeCloseTo(Math.PI / 2);

    applyMotor(world.grid, ant, { turn: 0, forward: 1, verticalBias: 0 });

    expect([ant.x, ant.y, ant.z]).toEqual([20, 20, 22]);
  });

  it("reverses only when every nearer yaw deflection is blocked", () => {
    const world = createWorld(781, undefined, PHASE2_CONFIG);
    populateForagers(world, 1);
    const ant = world.ants[0];
    ant.x = 20;
    ant.y = 20;
    ant.z = 20;
    ant.heading = 0;
    ant.traits = { ...ant.traits, legLength: 1 };
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        mutateVoxel(world, 20 + dx, 19, 20 + dz, Material.ROCK);
        const open = (dx === 0 && dz === 0) || (dx === -1 && dz === 0);
        mutateVoxel(world, 20 + dx, 20, 20 + dz, open ? Material.AIR : Material.ROCK);
        mutateVoxel(world, 20 + dx, 21, 20 + dz, Material.ROCK);
      }
    }

    applyMotor(world.grid, ant, { turn: 0, forward: 1, verticalBias: 0 });

    expect([ant.x, ant.y, ant.z]).toEqual([19, 20, 20]);
    expect(ant.heading).toBeCloseTo(Math.PI);
  });
});

describe("walker population invariants", () => {
  function assertLegalPositions(world: ReturnType<typeof createWorld>): void {
    // Assert positions first; never step the world mid-iteration (stepping
    // reaps dead ants and mutates the array being walked).
    for (const ant of world.ants) {
      if (!ant.alive) {
        continue;
      }
      expect(getVoxel(world.grid, ant.x, ant.y, ant.z)).toBe(Material.AIR);
    }
    // Terrain edits (eating, digging) can remove support mid-tick; such
    // ants must register as falling within a few motor applications. One
    // step is not enough under concurrent digging: a suspect can regain
    // support before its own motor and lose it again to a later ant's dig
    // in the same tick — the property is eventually-flagged, bounded here.
    let suspects = world.ants
      .filter((a) => a.alive && !a.falling && !hasSupport(world.grid, a.x, a.y, a.z))
      .map((a) => a.id);
    for (let attempt = 0; attempt < 3 && suspects.length > 0; attempt++) {
      stepWorld(world);
      suspects = suspects.filter((id) => {
        const later = world.ants.find((a) => a.id === id);
        return (
          later !== undefined &&
          !later.falling &&
          !hasSupport(world.grid, later.x, later.y, later.z)
        );
      });
    }
    expect(suspects).toEqual([]);
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
