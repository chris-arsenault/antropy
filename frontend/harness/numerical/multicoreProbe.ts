import { Engine } from "../../src/engine/client";
import { type Summary } from "../../src/engine/types";

/** Bounded operational measurement. No population trace or genome frames leave this worker. */
export async function multicoreProbe(workers: number, population: number, scale = 1) {
  const engine = await Engine.loadShared(`${location.origin}/antropy-engine.wasm`, workers);
  const dimensions = new Map([
    [1, [320, 240]],
    [10, [960, 800]],
    [20, [1600, 960]],
  ]).get(scale);
  if (!dimensions) throw new Error("Unsupported area scale");
  const world = engine.create(101, {
    founders: 0,
    sourceCount: 0,
    width: dimensions[0],
    height: dimensions[1],
  });
  world.command("loadFixture", { population, growth: false });
  world.step(10);
  const start = performance.now();
  let ticks = 0;
  for (; ticks < 100 && performance.now() - start < 60000; ticks++) world.step();
  const elapsed = performance.now() - start;
  const before = world.command<Summary>("summary");
  const steppingMemoryBytes = engine.memoryBytes;
  const saved = world.snapshot();
  const restored = engine.restore(saved);
  restored.step();
  const after = restored.command<Summary>("summary");
  const views = restored.render();
  const shared = views.field.buffer instanceof SharedArrayBuffer;
  const canvas = new OffscreenCanvas(32, 32);
  const gl = canvas.getContext("webgl2");
  if (!gl) throw new Error("WebGL2 unavailable");
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA32F,
    1,
    1,
    0,
    gl.RGBA,
    gl.FLOAT,
    views.field.subarray(0, 4)
  );
  const glError = gl.getError();
  gl.deleteTexture(texture);
  world.dispose();
  restored.dispose();
  const restarted = engine.create(102, { width: 24, height: 24, founders: 2, sourceCount: 2 });
  restarted.step();
  restarted.dispose();
  return {
    workers,
    population,
    scale,
    dimensions,
    steppingMemoryBytes,
    memoryHighWaterBytes: engine.memoryBytes,
    ticks,
    elapsed,
    tps: (ticks * 1000) / elapsed,
    shared,
    glError,
    checkpointBytes: saved.length,
    before,
    after,
    sourceDigest: engine.sourceDigest,
  };
}
