import { createWorld } from "../../src/sim/world";
import { scenarioConfig } from "../../src/sim/scenarios";
import { localClimate, syncClimateGeometry } from "../../src/sim/climate/state";
import { stepClimate } from "../../src/sim/climate/transport";
import { type Flags, integerFlag, flag } from "../lib/flags";
import { openLedger, recordRun } from "../lib/ledger";
import { physicsDigest } from "../lib/colonyArtifacts";
import { type SimConfig } from "../../src/sim/config";

export function runClimatePanel(flags: Flags): void {
  const ticks = integerFlag(flags, "ticks", 8000),
    seed = integerFlag(flags, "seed", 101);
  const layout = flag(flags, "layout", "compact") === "tiered" ? "tiered" : "compact";
  const base = scenarioConfig("colony-programmed", layout),
    sourceDigest = physicsDigest();
  const rows = [1, 2, 4].map((cellSize) => measureResolution(base, seed, ticks, cellSize));
  const errors = rows.slice(1).map((row) => ({
    cellSize: row.cellSize,
    maxTemperatureDifference: Math.max(
      ...row.samples.flatMap((sample, t) =>
        sample.values.map((value, p) =>
          Math.abs(value.temperature - rows[0].samples[t].values[p].temperature)
        )
      )
    ),
    maxMoistureDifference: Math.max(
      ...row.samples.flatMap((sample, t) =>
        sample.values.map((value, p) =>
          Math.abs(value.moisture - rows[0].samples[t].values[p].moisture)
        )
      )
    ),
  }));
  const db = openLedger();
  const id = recordRun(db, {
    experiment: "microclimate-resolution",
    label: "fields only; not colony survival",
    driver: "material-fields",
    seed,
    ticks,
    params: { sourceDigest, base, layout },
    summary: { rows, errors },
    wallMs: rows.reduce((sum, row) => sum + row.wallMs, 0),
  });
  db.close();
  console.log(
    JSON.stringify({
      id,
      errors,
      budgets: rows.map(({ cellSize, wallMs, heatResidual, waterResidual }) => ({
        cellSize,
        wallMs,
        heatResidual,
        waterResidual,
      })),
    })
  );
}

function measureResolution(base: SimConfig, seed: number, ticks: number, cellSize: number) {
  const config = {
    ...base,
    environment: { ...base.environment, microclimate: true },
    climate: { ...base.climate, cellSize },
  };
  const world = createWorld(seed, "colony-programmed", config, false);
  const points = [
    world.nest.home,
    world.nest.entrance,
    { x: world.nest.entrance.x + 8, y: world.nest.entrance.y + 2 },
    { x: world.nest.entrance.x + 8, y: world.nest.entrance.y - 2 },
  ];
  const samples: { tick: number; values: ReturnType<typeof localClimate>[] }[] = [];
  const start = performance.now();
  for (let tick = config.climate.interval; tick <= ticks; tick += config.climate.interval) {
    world.tick = tick;
    stepClimate(world);
    if (tick % 200 === 0)
      samples.push({ tick, values: points.map((point) => localClimate(world, point)) });
  }
  syncClimateGeometry(world);
  const heat = world.climate.temperature.reduce(
    (sum, value, i) => sum + value * world.climate.heatCapacity[i],
    0
  );
  return {
    cellSize,
    samples,
    points,
    wallMs: Math.round(performance.now() - start),
    waterResidual:
      world.climate.initialWater +
      world.climate.boundaryWater -
      world.climate.water.reduce((a, b) => a + b, 0),
    heatResidual:
      world.climate.initialHeat + world.climate.heatExchange + world.climate.terrainHeat - heat,
  };
}
