import { createWorld, stepWorld } from "../../src/sim/world";
import { scenarioConfig } from "../../src/sim/scenarios";
import { drawWorld } from "../../src/ui/worldDrawing";
import { colonyBounds, fitCamera, viewTransform } from "../../src/ui/camera";
import { spreadCapacityFounders, timingSummary } from "./colonyCapacity";

/** Real Canvas calls in an isolated browser page; no development server is started. */
export function measureBrowserCapacity(count: number) {
  const world = createWorld(101, "colony-programmed", {
    ...scenarioConfig("colony-programmed", "compact"),
    workerCount: count,
  });
  spreadCapacityFounders(world);
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 800;
  document.body.replaceChildren(canvas);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas unavailable");
  const view = viewTransform(fitCamera(colonyBounds(world, true), 1280, 800), 1280, 800, 1);
  const layers = {
    routes: true,
    temperature: false,
    moisture: false,
    foodOdor: false,
    nestOdor: false,
    pheromoneA: false,
    pheromoneB: false,
    freshAir: false,
  };
  const ticks: number[] = [],
    frames: number[] = [];
  for (let i = 0; i < 10; i++) {
    const start = performance.now();
    stepWorld(world);
    if (i >= 3) ticks.push(performance.now() - start);
    drawWorld(context, world, view, layers);
  }
  for (let i = 0; i < 30; i++) {
    const start = performance.now();
    drawWorld(context, world, view, layers);
    // Force completion of Canvas work rather than measure only command submission.
    context.getImageData(0, 0, 1, 1);
    frames.push(performance.now() - start);
  }
  return {
    kind: "isolated headless Canvas capacity fixture, not application FPS or survival",
    workers: count,
    finalWorkers: world.ants.length,
    viewport: [1280, 800],
    layers,
    tick: timingSummary(ticks),
    draw: timingSummary(frames),
    userAgent: navigator.userAgent,
  };
}
