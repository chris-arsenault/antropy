import { expect, it, vi } from "vitest";
import { createWorld } from "../sim/world";
import { DEFAULT_CONFIG } from "../sim/config";
import { observeSpatial } from "../observe/spatialHistory";
import { checkpointToJson } from "../persist/checkpoint";
import { drawPopulationCells, pickPopulation } from "./populationDrawing";
import { fitCamera, transform } from "./camera";

function fixture() {
  const w = createWorld(1, {
    ...DEFAULT_CONFIG,
    width: 80,
    height: 60,
    founders: 4,
    sourceCount: 0,
  });
  w.cells.forEach((c, i) => {
    c.x = i < 3 ? 20 + i : 65;
    c.y = 20;
  });
  observeSpatial(w);
  return w;
}
it("resolves soft regions into actual bodies while retaining every isolated cell", () => {
  const w = fixture(),
    before = checkpointToJson(w);
  const ctx = {
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    fillText: vi.fn(),
  };
  const canvas = ctx as unknown as CanvasRenderingContext2D;
  drawPopulationCells(canvas, w, 1, null, () => "#abc", { regions: true, selected: null });
  expect(ctx.createRadialGradient).toHaveBeenCalledTimes(3);
  expect(ctx.arc).toHaveBeenCalledTimes(4);
  expect(ctx.lineTo).not.toHaveBeenCalled();
  vi.clearAllMocks();
  drawPopulationCells(canvas, w, 10, null, () => "#abc", { regions: true, selected: null });
  expect(ctx.createRadialGradient).not.toHaveBeenCalled();
  expect(ctx.lineTo).toHaveBeenCalledTimes(4);
  expect(checkpointToJson(w)).toBe(before);
});
it("picks population members without claiming empty gaps or ungrouped cells", () => {
  const w = fixture(),
    camera = fitCamera(w.config),
    bounds = { width: 800, height: 600 };
  const t = transform(w.config, camera, bounds);
  const point = (x: number, y: number) => ({ x: t.left + x * t.scale, y: t.top + y * t.scale });
  expect(pickPopulation(w, camera, bounds, point(21, 20))).toBe(1);
  expect(pickPopulation(w, camera, bounds, point(45, 20))).toBeNull();
  expect(pickPopulation(w, camera, bounds, point(65, 20))).toBeNull();
  expect(pickPopulation(w, camera, bounds, point(-1, 20))).toBeNull();
});
