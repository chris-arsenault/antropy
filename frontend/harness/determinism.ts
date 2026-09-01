import { foundColony } from "../src/sim/colony";
import { createWorld, stepWorld, type World } from "../src/sim/world";
import { deserializeWorld, serializeWorld } from "../src/persist/checkpoint";
import { intFlag, type Flags } from "./lib/flags";

/**
 * Determinism checker: run to a warmup tick, checkpoint, then advance the
 * original and the restored world separately and compare per-tick
 * checksums — reporting the first divergent tick and which component
 * (grid / energy / rng / weather / brood) moved. The productized form of
 * the ghost-egg hunt.
 */
function checksum(world: World): Record<string, string | number> {
  let grid = 0;
  for (let i = 0; i < world.grid.data.length; i++) {
    grid = (grid + world.grid.data[i] * (i % 997)) % 1_000_000_007;
  }
  let energy = 0;
  for (const ant of world.ants) {
    energy += ant.energy;
  }
  return {
    grid,
    energy: energy.toFixed(12),
    ants: world.ants.length,
    eggs: world.eggs.length,
    rain: world.rainRemaining,
    rng: JSON.stringify(world.rng.getState()),
    weather: JSON.stringify(world.weatherRng.getState()),
  };
}

function diffKeys(a: Record<string, unknown>, b: Record<string, unknown>): string[] {
  return Object.keys(a).filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]));
}

export function runDeterminism(flags: Flags): void {
  const seed = intFlag(flags, "seed", 8001);
  const warmup = intFlag(flags, "warmup", 700);
  const span = intFlag(flags, "span", 500);

  const original = createWorld(seed);
  foundColony(original);
  for (let t = 0; t < warmup; t++) {
    stepWorld(original);
  }
  const restored = deserializeWorld(serializeWorld(original));

  const seriesA: Record<string, unknown>[] = [];
  for (let t = 0; t < span; t++) {
    stepWorld(original);
    seriesA.push(checksum(original));
  }
  for (let t = 0; t < span; t++) {
    stepWorld(restored);
    const b = checksum(restored);
    const bad = diffKeys(seriesA[t], b);
    if (bad.length > 0) {
      console.log(`DIVERGED at tick ${warmup + t + 1}: ${bad.join(", ")}`);
      for (const key of bad) {
        console.log(`  ${key}: original=${seriesA[t][key]} restored=${b[key]}`);
      }
      process.exitCode = 1;
      return;
    }
  }
  console.log(`deterministic: seed=${seed} warmup=${warmup} span=${span} — no divergence`);
}
