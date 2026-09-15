// @vitest-environment node
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { Engine } from "./client";
import { Renderer, type ViewOptions } from "./renderer";
import { SpriteBatch } from "./spriteBatch";

function graphics() {
  const uploads: ArrayBufferView[] = [],
    calls: string[] = [];
  const textures: unknown[][] = [];
  const completion = { ready: true };
  const gl = new Proxy(
    {},
    {
      get(_target, key: string) {
        if (key === "TIMEOUT_EXPIRED") return 1;
        if (key === "WAIT_FAILED") return 2;
        if (key === "clientWaitSync") return () => (completion.ready ? 3 : 1);
        if (key.toUpperCase() === key) return 0;
        return (...args: unknown[]) => {
          calls.push(key);
          if (["texImage2D", "texSubImage2D"].includes(key)) textures.push([key, ...args]);
          if (ArrayBuffer.isView(args[args.length - 1]))
            uploads.push(args[args.length - 1] as ArrayBufferView);
          if (key === "isContextLost") return false;
          if (key.startsWith("get")) return true;
          return {};
        };
      },
    }
  ) as WebGL2RenderingContext;
  const canvas = { width: 800, height: 600, getContext: () => gl } as unknown as OffscreenCanvas;
  return { canvas, gl, uploads, calls, completion, textures };
}
it("uploads borrowed WASM views and keeps field uploads independent from camera changes", async () => {
  const engine = await Engine.load(
    new Uint8Array(readFileSync(new URL("../../public/antropy-engine.wasm", import.meta.url)))
  );
  const world = engine.create(101, { width: 24, height: 24, founders: 2, sourceCount: 2 });
  const before = world.snapshot(),
    g = graphics(),
    renderer = new Renderer(g.canvas);
  const options: ViewOptions = {
    width: 800,
    height: 600,
    camera: { x: 12, y: 12, scale: 20 },
    field: 5,
    species: 0,
    color: 6,
    selected: -1,
    layers: [true, false, false, false, false],
    regions: true,
    sources: true,
    exposure: 4,
  };
  const view = world.render(5),
    buffer = view.cells.buffer;
  renderer.draw(world, [24, 24], options, true);
  expect(g.uploads.length).toBe(3);
  expect(g.uploads.every((v) => v.buffer === buffer)).toBe(true);
  expect(g.uploads[0].byteOffset).toBe(view.cells.byteOffset);
  expect(g.uploads[1].byteLength).toBe(12 * 12 * 8 * 4);
  const fieldUploads = () => g.uploads.filter((v) => v.byteOffset === view.field.byteOffset).length;
  const textures = fieldUploads();
  g.completion.ready = false;
  const uploads = g.uploads.length;
  for (let i = 0; i < 100; i++) expect(renderer.draw(world, [24, 24], options, false)).toBeNull();
  expect(g.uploads).toHaveLength(uploads);
  g.completion.ready = true;
  renderer.draw(world, [24, 24], { ...options, camera: { ...options.camera, scale: 30 } }, false);
  expect(fieldUploads()).toBe(textures);
  expect(g.calls).not.toContain("drawArraysInstanced");
  expect(world.snapshot()).toEqual(before);
  renderer.dispose();
  world.dispose();
});

it("tiles sprite records across rows without copying or uploading unused capacity", () => {
  const g = graphics(),
    batch = new SpriteBatch(g.gl);
  const records = new Float32Array(513 * 12);
  records[512 * 12] = 97;
  batch.upload(records);
  expect(g.uploads.map((v) => v.byteLength)).toEqual([512 * 48, 48]);
  expect(g.uploads.every((v) => v.buffer === records.buffer)).toBe(true);
  expect(g.uploads[1].byteOffset).toBe(512 * 48);
  expect((g.uploads[1] as Float32Array)[0]).toBe(97);
  expect(g.textures.map((args) => args.slice(3, 7))).toEqual([
    [0, 768, 3, 0],
    [0, 0, 768, 2],
    [0, 2, 3, 1],
  ]);
  batch.upload(records.subarray(0, 12));
  batch.upload(records.subarray(0, 0));
  expect(g.textures.filter(([name]) => name === "texImage2D")).toHaveLength(1);
  expect(g.uploads).toHaveLength(3);
  batch.dispose();
  expect(g.calls.filter((name) => name === "deleteTexture")).toHaveLength(1);
});
