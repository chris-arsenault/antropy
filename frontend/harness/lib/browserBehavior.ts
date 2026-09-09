import { restoreCheckpoint } from "../../src/persist/checkpoint";
import { drawWorld } from "../../src/ui/worldDrawing";
import { fitCamera, viewTransform, colonyBounds } from "../../src/ui/camera";
import { type Ant, type Brood, type Queen, type World } from "../../src/sim/types";
import { type Material } from "../../src/sim/materials";

interface Frame {
  tick: number;
  ants: (Pick<Ant, "id" | "x" | "y" | "cargo" | "heading" | "spoil" | "task"> & {
    focus: Ant["decision"]["focus"];
  })[];
  queen: Queen;
  brood: Brood[];
  food: [number, number][];
  loose: [number, Material[]][];
  terrain: [number, number][];
}
interface Trace {
  arena: boolean;
  initialGrid: number[];
  frames: Frame[];
}

function applyFrame(world: World, trace: Trace, frame: Frame, template: Ant): void {
  world.grid.cells.set(trace.initialGrid);
  for (const [cell, material] of frame.terrain) world.grid.cells[cell] = material;
  world.grid.revision++;
  world.tick = frame.tick;
  world.ants.splice(
    0,
    world.ants.length,
    ...frame.ants.map((ant) => ({
      ...template,
      ...ant,
      decision: { ...template.decision, route: null, focus: ant.focus },
    }))
  );
  world.brood.splice(0, world.brood.length, ...frame.brood);
  Object.assign(world.queen, frame.queen);
  world.food.clear();
  world.foodSources.clear();
  for (const [cell, quantity] of frame.food) {
    world.food.set(cell, quantity);
    world.foodSources.add(cell);
  }
  world.construction.loose = new Map(frame.loose);
  world.construction.jobs = [];
}

/** Sampled spatial replay through the production renderer. It never advances the simulation. */
export async function reviewBrowserBehavior(path: string) {
  if (!path.startsWith("/harness/artifacts/")) throw new Error("expected a local harness artifact");
  const [checkpoint, trace] = await Promise.all([
    fetch(path).then((r) => {
      if (!r.ok) throw new Error(`checkpoint HTTP ${r.status}`);
      return r.json();
    }),
    fetch(`${path.slice(0, path.lastIndexOf("/"))}/behavior.json`).then((r) => {
      if (!r.ok) throw new Error(`trace HTTP ${r.status}`);
      return r.json() as Promise<Trace>;
    }),
  ]);
  if (!trace.initialGrid || !trace.frames.length) throw new Error("trace lacks sampled terrain");
  const world = restoreCheckpoint(checkpoint),
    template = world.ant;
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 900;
  const tile = document.createElement("canvas");
  tile.width = 400;
  tile.height = 450;
  const context = canvas.getContext("2d")!,
    painter = tile.getContext("2d")!;
  const bounds = trace.arena
    ? { x: world.queen.x - 8, y: world.queen.y - 4, width: 42, height: 32 }
    : colonyBounds(world);
  const camera = fitCamera(bounds, tile.width, tile.height);
  const layers = {
    temperature: false,
    moisture: false,
    routes: false,
    foodOdor: false,
    nestOdor: false,
    pheromoneA: false,
    pheromoneB: false,
    freshAir: false,
  };
  const indices = Array.from({ length: 6 }, (_, n) =>
    Math.round((n * (trace.frames.length - 1)) / 5)
  );
  indices.forEach((index, i) => {
    const frame = trace.frames[index];
    applyFrame(world, trace, frame, template);
    drawWorld(painter, world, viewTransform(camera, tile.width, tile.height), layers);
    painter.fillStyle = "#ffffff";
    painter.font = "16px sans-serif";
    painter.fillText(`Tick ${frame.tick} · ${frame.ants.length} workers`, 12, 24);
    context.drawImage(tile, (i % 3) * 400, Math.floor(i / 3) * 450);
  });
  return {
    source: path,
    sampledEvery: 20,
    motionCertification: false,
    ticks: indices.map((i) => trace.frames[i].tick),
    image: canvas.toDataURL("image/png").split(",")[1],
  };
}
