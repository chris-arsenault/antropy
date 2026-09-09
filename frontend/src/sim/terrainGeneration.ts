import { type SimConfig } from "./config";
import { cellIndex, getCell, setCell, type Grid } from "./grid";
import { Material } from "./materials";
import { createRandomState, randomInt, type RandomState } from "./random";
import { type Point } from "./geometry";

/** A height profile is a generation tool only; queries use the resulting cells. */
function groundProfile(config: SimConfig, seed: number): Int16Array {
  const values = new Int16Array(config.width),
    random = createRandomState(seed);
  let height = config.surfaceBase;
  for (let x = 0; x < config.width; x++) {
    if (config.environment.surfaceProfile === "woodland") {
      const wave = Math.round(9 * Math.sin(x / 73) + 6 * Math.sin(x / 31));
      height = config.surfaceBase + wave;
    } else if (x > 0 && x % 17 === 0) {
      const step = ((Math.imul(x, 0x45d9f3b) >>> 29) % 3) - 1;
      height = Math.max(config.surfaceBase - 5, Math.min(config.surfaceBase + 5, height + step));
    }
    values[x] = height;
  }
  if (config.environment.surfaceProfile === "woodland") {
    const shift = randomInt(random, 0, 100);
    for (let x = 0; x < values.length; x++) values[x] += Math.round(3 * Math.sin((x + shift) / 19));
  }
  return values;
}

function pocket(grid: Grid, cx: number, cy: number, rx: number, ry: number, material: Material) {
  for (let y = Math.max(4, cy - ry); y <= cy + ry; y++)
    for (let x = Math.max(0, cx - rx); x <= Math.min(grid.width - 1, cx + rx); x++) {
      if (getCell(grid, x, y) === Material.AIR) continue;
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 > 1) continue;
      setCell(grid, x, y, material);
      grid.backing[cellIndex(grid, x, y)] = material;
    }
}

function wood(grid: Grid, from: Point, to: Point): void {
  const length = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y));
  for (let step = 0; step <= length; step++) {
    const x = Math.round(from.x + ((to.x - from.x) * step) / length);
    const y = Math.round(from.y + ((to.y - from.y) * step) / length);
    setCell(grid, x, y, Material.WOOD);
    setCell(grid, x, y + 1, Material.WOOD);
  }
}

function surfaceTiers(grid: Grid, ground: Int16Array, random: RandomState): void {
  for (let x = 90; x < grid.width - 120; x += 150) {
    if (Math.abs(x - grid.width / 2) < 100) continue;
    const rise = randomInt(random, 12, 30),
      base = ground[x];
    const peak = { x: x + 35, y: base + rise };
    wood(grid, { x, y: base }, peak);
    wood(grid, peak, { x: x + 85, y: base + rise - 3 });
    wood(grid, { x: x + 85, y: base + rise - 3 }, { x: x + 112, y: ground[x + 112] });
    wood(grid, { x: x + 48, y: base + rise }, { x: x + 74, y: base + rise + 20 });
    wood(grid, { x: x + 74, y: base + rise + 20 }, { x: x + 98, y: base + rise + 20 });
  }
}

function fillGround(grid: Grid, ground: Int16Array): void {
  for (let x = 0; x < grid.width; x++)
    for (let y = 0; y <= ground[x]; y++) {
      const material = y < 4 ? Material.ROCK : Material.SOIL;
      setCell(grid, x, y, material);
      grid.backing[cellIndex(grid, x, y)] = material;
    }
}

export function makeTerrain(grid: Grid, config: SimConfig, seed: number): Int16Array {
  const ground = groundProfile(config, seed),
    random = createRandomState(seed ^ 0x6248);
  fillGround(grid, ground);
  for (let i = 0; i < 160; i++) {
    const values = [
      randomInt(random, 8, grid.width - 8),
      randomInt(random, 12, config.surfaceBase - 8),
      randomInt(random, 8, 30),
      randomInt(random, 3, 11),
    ];
    if (config.environment.soilPockets)
      pocket(
        grid,
        values[0],
        values[1],
        values[2],
        values[3],
        i % 3 === 0 ? Material.CLAY : Material.LOOSE_SOIL
      );
  }
  if (config.environment.surfaceTiers) surfaceTiers(grid, ground, random);
  return ground;
}

export function placeTerrainFood(
  grid: Grid,
  ground: Int16Array,
  entrance: Point,
  config: SimConfig,
  random: RandomState
): Set<number> {
  const sources = new Set<number>(),
    margin = 8;
  const leftLength = entrance.x - config.foodClearance - margin;
  const available = leftLength + grid.width - margin - entrance.x - config.foodClearance;
  for (let slot = 0; slot < config.foodCount; slot++) {
    const lo = Math.floor((slot * available) / config.foodCount);
    const hi = Math.floor(((slot + 1) * available) / config.foodCount);
    const position = randomInt(random, lo, Math.max(lo + 1, hi));
    const x =
      position < leftLength
        ? margin + position
        : entrance.x + config.foodClearance + position - leftLength;
    const levels: number[] = [];
    for (let y = ground[x] + 1; y < grid.height - 1; y++)
      if (getCell(grid, x, y) === Material.AIR && getCell(grid, x, y - 1) !== Material.AIR)
        levels.push(y);
    // Deterministic level selection preserves the food-placement random stream across layouts.
    sources.add(cellIndex(grid, x, levels[slot % levels.length]));
  }
  return sources;
}
