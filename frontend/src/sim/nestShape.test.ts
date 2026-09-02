import { appendFileSync, mkdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { surfaceSpawnY } from "./ant";
import { PHASE2_CONFIG } from "./config";
import { rnnController } from "./controller/rnn";
import { getVoxelSafe, voxelIndex } from "./grid";
import { Material } from "./materials";
import { makeBuilder, resetBuilderState } from "./oracles/builder";
import { createWorld, spawnAnt, stepWorld, type World } from "./world";

/**
 * Phase 2 step 4: rules 1+2 with a crew. The shape test — is the air
 * network still a line? Any branch or widening passes. A "line" is a
 * network one voxel wide at every level; a nest is not.
 */
const SITE = { x: 96, z: 96 };
const CREW = 8;

interface Shape {
  volume: number;
  levels: number;
  maxWidth: number;
  branchVoxels: number;
}

const NEIGHBOR_OFFSETS = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 0, 1],
  [0, 0, -1],
  [0, 1, 0],
  [0, -1, 0],
] as const;

/** Underground air voxel that is part of the excavation (not open sky). */
function isNestAir(world: World, x: number, y: number, z: number): boolean {
  if (getVoxelSafe(world.grid, x, y, z) !== Material.AIR) {
    return false;
  }
  // surfaceMap is the top SOLID voxel, so air at that level was excavated.
  return y <= world.surfaceMap[z * world.grid.sizeX + x];
}

/**
 * The largest excavated component near the nest site. Seeding from one
 * fixed voxel measures nothing when the crew opens the site elsewhere.
 */
type Cell = { x: number; y: number; z: number };

/** Flood one connected excavated component from a seed voxel. */
function floodComponent(world: World, seed: Cell, visited: Set<number>): Cell[] {
  const component: Cell[] = [];
  const stack = [seed];
  visited.add(voxelIndex(world.grid, seed.x, seed.y, seed.z));
  while (stack.length > 0) {
    const cell = stack.pop() as Cell;
    component.push(cell);
    for (const [ox, oy, oz] of NEIGHBOR_OFFSETS) {
      const n = { x: cell.x + ox, y: cell.y + oy, z: cell.z + oz };
      const key = voxelIndex(world.grid, n.x, n.y, n.z);
      if (!visited.has(key) && isNestAir(world, n.x, n.y, n.z)) {
        visited.add(key);
        stack.push(n);
      }
    }
  }
  return component;
}

/** Every voxel in the search box around the nest site. */
function searchBox(surfaceY: number): Cell[] {
  const cells: Cell[] = [];
  const radius = 12;
  for (let dy = -20; dy <= 0; dy++) {
    for (let dz = -radius; dz <= radius; dz++) {
      for (let dx = -radius; dx <= radius; dx++) {
        cells.push({ x: SITE.x + dx, y: surfaceY + dy, z: SITE.z + dz });
      }
    }
  }
  return cells;
}

/** The largest excavated component in the search box around the site. */
function largestComponent(world: World, surfaceY: number): Cell[] {
  const visited = new Set<number>();
  let best: Cell[] = [];
  for (const seed of searchBox(surfaceY)) {
    const key = voxelIndex(world.grid, seed.x, seed.y, seed.z);
    if (visited.has(key) || !isNestAir(world, seed.x, seed.y, seed.z)) {
      continue;
    }
    const component = floodComponent(world, seed, visited);
    if (component.length > best.length) {
      best = component;
    }
  }
  return best;
}

function nestShape(world: World, surfaceY: number): Shape {
  const cells = largestComponent(world, surfaceY);
  const seen = new Set(cells.map((c) => voxelIndex(world.grid, c.x, c.y, c.z)));
  const byLevel = new Map<number, number>();
  for (const cell of cells) {
    byLevel.set(cell.y, (byLevel.get(cell.y) ?? 0) + 1);
  }
  if (cells.length === 0) {
    return { volume: 0, levels: 0, maxWidth: 0, branchVoxels: 0 };
  }

  // A branch voxel has three or more open neighbours inside the network.
  let branchVoxels = 0;
  for (const cell of cells) {
    let open = 0;
    for (const [ox, oy, oz] of NEIGHBOR_OFFSETS) {
      if (seen.has(voxelIndex(world.grid, cell.x + ox, cell.y + oy, cell.z + oz))) {
        open += 1;
      }
    }
    if (open >= 3) {
      branchVoxels += 1;
    }
  }

  return {
    volume: cells.length,
    levels: byLevel.size,
    maxWidth: Math.max(0, ...byLevel.values()),
    branchVoxels,
  };
}

function crew(world: World, count: number): number {
  let surfaceY = 0;
  for (let i = 0; i < count; i++) {
    const x = SITE.x + ((i % 3) - 1);
    const z = SITE.z + (Math.floor(i / 3) - 1);
    const y = surfaceSpawnY(world.grid, x, z);
    if (y === null) {
      continue;
    }
    const genome = rnnController.seed(world.rng);
    spawnAnt(world, {
      x,
      y,
      z,
      heading: 0,
      energy: 1,
      lineageId: 0,
      patrilineId: 0,
      motherId: 0,
      fatherId: 0,
      genome,
      controllerState: rnnController.createState(),
      traits: rnnController.physical(genome),
    });
    if (x === SITE.x && z === SITE.z) {
      surfaceY = y;
    }
  }
  return surfaceY;
}

describe("nest shape with a crew (Phase 2 step 4)", () => {
  it("rules 1+2 produce a network that is not a line", () => {
    const world = createWorld(9900, rnnController, PHASE2_CONFIG);
    world.foodBase = 0;
    world.foodTarget = 0;
    const surfaceY = crew(world, CREW);
    resetBuilderState();
    world.policyOverride = makeBuilder({
      depth: 12,
      amplify: true,
      overflowCrowding: 2,
      column: SITE,
    });

    for (let t = 0; t < 3000; t++) {
      stepWorld(world);
    }

    const shape = nestShape(world, surfaceY);
    mkdirSync("test-results", { recursive: true });
    const slice: string[] = [];
    for (let y = surfaceY; y >= surfaceY - 14; y--) {
      let row = "";
      for (let x = SITE.x - 7; x <= SITE.x + 7; x++) {
        row += getVoxelSafe(world.grid, x, y, SITE.z) === Material.AIR ? "." : "#";
      }
      slice.push(`y=${y} ${row}`);
    }
    appendFileSync(
      "test-results/nest-shape.txt",
      `crew=${CREW} volume=${shape.volume} levels=${shape.levels} ` +
        `maxWidth=${shape.maxWidth} branchVoxels=${shape.branchVoxels}\n` +
        slice.join("\n") +
        "\n"
    );

    expect(shape.volume, "the crew excavated a network").toBeGreaterThan(CREW);
    // The shape test: any branch or widening beats a bare line.
    const notALine = shape.maxWidth > 1 || shape.branchVoxels > 0;
    expect(
      notALine,
      `volume=${shape.volume} levels=${shape.levels} maxWidth=${shape.maxWidth} branches=${shape.branchVoxels}`
    ).toBe(true);
  });
});
