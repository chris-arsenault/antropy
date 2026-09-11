import { afterEach, expect, it, vi } from "vitest";
import { createRenderer } from "./drawing";
import { createWorld } from "../sim/world";
import { DEFAULT_CONFIG } from "../sim/config";
import { toxinIntensity } from "./fieldRaster";

afterEach(() => vi.restoreAllMocks());
it("shows toxin pressure relative to repair capacity without changing the sensed concentration", () => {
  const c = DEFAULT_CONFIG;
  const injuryCapacity = c.damageRate / (1 + c.defenseStrength * c.defenseRatio);
  const threshold = (c.toxinK * c.repairRate) / (injuryCapacity - c.repairRate);
  expect(toxinIntensity(threshold, c)).toBeCloseTo(0.5, 12);
  expect(toxinIntensity(0, c)).toBe(0);
  expect(toxinIntensity(threshold, { ...c, repairRate: 0 })).toBe(1);
  expect(toxinIntensity(threshold, { ...c, damageRate: 0 })).toBe(0);
});
it("reuses field buffers across ticks and camera changes, reallocating only on dimension changes", () => {
  const ctx = {
    createImageData: vi.fn((w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) })),
    putImageData: vi.fn(),
    fillRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    drawImage: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    setLineDash: vi.fn(),
    arc: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn(),
    canvas: { width: 800, height: 600 },
  };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    ctx as unknown as CanvasRenderingContext2D
  );
  const canvas = document.createElement("canvas"),
    renderer = createRenderer(canvas);
  const world = createWorld(1, { ...DEFAULT_CONFIG, founders: 0 });
  const camera = { x: 40, y: 30, zoom: 1 },
    layers = { nutrient: true, chemical: true, toxin: true, matrix: true };
  renderer.render(world, camera, layers, null);
  expect(ctx.drawImage).toHaveBeenCalledTimes(1);
  expect(ctx.clip).toHaveBeenCalledTimes(1);
  renderer.render(world, { ...camera, zoom: 2 }, layers, null);
  expect(ctx.putImageData).toHaveBeenCalledTimes(1);
  world.tick++;
  renderer.render(world, camera, layers, null);
  expect(ctx.putImageData).toHaveBeenCalledTimes(2);
  expect(ctx.createImageData).toHaveBeenCalledTimes(1);
  renderer.render(world, camera, { ...layers, chemical: false }, null);
  expect(ctx.putImageData).toHaveBeenCalledTimes(3);
  renderer.render(
    createWorld(1, { ...DEFAULT_CONFIG, founders: 0, width: 16 }),
    camera,
    layers,
    null
  );
  expect(ctx.createImageData).toHaveBeenCalledTimes(2);
});
