import { type Engine, type EngineWorld } from "../../src/engine/client";
import { type Summary } from "../../src/engine/types";
import { emptySpatial, observe } from "../../src/engine/observation";

/** Includes the production census and packed render preparation; GPU execution is separate. */
export function measureOperating(
  world: EngineWorld,
  ticks: number,
  wallSeconds: number,
  sample?: () => void
) {
  const initial = world.command<Summary>("summary"),
    spatial = emptySpatial(),
    start = performance.now();
  const windows: number[] = [],
    tickMs: number[] = [],
    stages = { stepMs: 0, censusMs: 0, renderMs: 0, inspectionMs: 0 };
  let last = start,
    steps = 0,
    stop: string | null = null;
  const cells = world.command<{ cells: { id: number }[] }>("frame").cells,
    selected = cells[0]?.id;
  while (steps < ticks && performance.now() - start < wallSeconds * 1000) {
    const at = performance.now();
    const status = world.step();
    const duration = performance.now() - at;
    stages.stepMs += duration;
    tickMs.push(duration);
    steps++;
    observeOperating(world, steps, selected, spatial, stages, sample);
    if (steps % 20 === 0) {
      const now = performance.now();
      windows.push(20000 / (now - last));
      last = now;
    }
    if (status.stopReason) {
      stop = status.stopReason;
      break;
    }
  }
  const wallMs = performance.now() - start;
  tickMs.sort((a, b) => a - b);
  return {
    initial,
    summary: world.command<Summary>("summary"),
    steps,
    windows,
    stages,
    wallMs,
    ticksPerSecond: (steps * 1000) / wallMs,
    modelSecondsPerWallSecond:
      (steps * world.command<{ config: { dt: number } }>("definition").config.dt * 1000) / wallMs,
    maximumStepMs: tickMs.at(-1) ?? 0,
    p95StepMs: tickMs[Math.max(0, Math.ceil(tickMs.length * 0.95) - 1)] ?? 0,
    stop: stop ?? (steps < ticks ? "wall cap" : "horizon"),
  };
}
export function measureStorage(engine: Engine, world: EngineWorld) {
  const start = performance.now(),
    saved = world.snapshot(),
    saveMs = performance.now() - start,
    at = performance.now();
  const restored = engine.restore(saved),
    restoreMs = performance.now() - at;
  try {
    if (Buffer.compare(saved, restored.snapshot())) throw new Error("Checkpoint restore mismatch");
    world.step(3);
    restored.step(3);
    if (Buffer.compare(world.snapshot(), restored.snapshot()))
      throw new Error("Checkpoint continuation mismatch");
    return {
      saved,
      saveMs,
      restoreMs,
      checkpointBytes: saved.length,
      continuationMatches: true,
      memoryBytes: engine.memoryBytes,
    };
  } finally {
    restored.dispose();
  }
}

function observeOperating(
  world: EngineWorld,
  steps: number,
  selected: number | undefined,
  spatial: ReturnType<typeof emptySpatial>,
  stages: { censusMs: number; renderMs: number; inspectionMs: number },
  sample?: () => void
) {
  let at: number;
  if (steps % 4 === 0) {
    at = performance.now();
    world.render(5, 0, 6, steps % 20 === 0);
    stages.renderMs += performance.now() - at;
  }
  if (steps % 25 === 0) {
    at = performance.now();
    observe(world, spatial);
    stages.censusMs += performance.now() - at;
    if (selected) {
      at = performance.now();
      world.command("inspect", { cell: selected });
      stages.inspectionMs += performance.now() - at;
    }
  }
  if (steps % 200 === 0) sample?.();
}
