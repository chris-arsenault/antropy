import { afterEach, expect, it, vi } from "vitest";
import { Bridge } from "./bridge";
import { type Definition } from "./types";
import { type Message, type Request } from "./protocol";
import { type ViewOptions } from "./renderer";

class FakeWorker {
  private static current: FakeWorker;
  static get last() {
    return FakeWorker.current;
  }
  sent: { request: Request; transfer: Transferable[] }[] = [];
  onmessage: ((e: { data: Message }) => void) | null = null;
  onerror: ((e: { message: string }) => void) | null = null;
  terminated = false;
  constructor() {
    FakeWorker.current = this;
  }
  postMessage(request: Request, transfer: Transferable[]) {
    this.sent.push({ request, transfer });
  }
  emit(data: Message) {
    this.onmessage?.({ data });
  }
  terminate() {
    this.terminated = true;
  }
}
afterEach(() => vi.unstubAllGlobals());
const options: ViewOptions = {
  width: 800,
  height: 600,
  camera: { x: 160, y: 120, scale: 2 },
  field: 5,
  species: 0,
  color: 6,
  selected: -1,
  layers: [true, false, false, false, false, false],
  sources: true,
  regions: true,
  exposure: 4,
};
it("transfers the canvas once and coalesces camera updates while the worker is busy", async () => {
  vi.stubGlobal("Worker", FakeWorker);
  const bridge = new Bridge(),
    canvas = {} as OffscreenCanvas;
  bridge.start(canvas, "antropy-engine.wasm");
  const worker = FakeWorker.last;
  expect(worker.sent[0].transfer).toEqual([canvas]);
  bridge.view(options);
  expect(worker.sent).toHaveLength(1);
  worker.emit({ kind: "reply", id: worker.sent[0].request.id, ok: true, value: undefined });
  worker.emit({ kind: "definition", value: {} as Definition });
  expect(worker.sent).toHaveLength(2);
  bridge.view({ ...options, camera: { ...options.camera, x: 10 } });
  bridge.view({ ...options, camera: { ...options.camera, x: 20 } });
  expect(worker.sent).toHaveLength(2);
  worker.emit({ kind: "reply", id: worker.sent[1].request.id, ok: true, value: undefined });
  await vi.waitFor(() => expect(worker.sent).toHaveLength(3));
  expect((worker.sent[2].request.payload.camera as { x: number }).x).toBe(20);
  expect(worker.sent[2].transfer).toEqual([]);
  worker.emit({ kind: "reply", id: worker.sent[2].request.id, ok: true, value: undefined });
  bridge.stop();
  expect(worker.terminated).toBe(true);
});
it("rejects pending operations after a worker failure", async () => {
  vi.stubGlobal("Worker", FakeWorker);
  const bridge = new Bridge();
  bridge.start({} as OffscreenCanvas, "antropy-engine.wasm");
  const pending = bridge.call("export");
  FakeWorker.last.onerror?.({ message: "lost worker" });
  await expect(pending).rejects.toThrow("lost worker");
  expect(bridge.getSnapshot().error).toContain("lost worker");
  expect(FakeWorker.last.terminated).toBe(true);
  await expect(bridge.call("export")).rejects.toThrow("not running");
  bridge.stop();
});

it("bounds presentation requests to one empty command and cancels on stop", async () => {
  vi.stubGlobal("Worker", FakeWorker);
  let animate: FrameRequestCallback = () => {};
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    animate = callback;
    return 7;
  });
  const cancel = vi.fn();
  vi.stubGlobal("cancelAnimationFrame", cancel);
  const bridge = new Bridge();
  bridge.start({} as OffscreenCanvas, "antropy-engine.wasm");
  const worker = FakeWorker.last;
  worker.emit({ kind: "reply", id: worker.sent[0].request.id, ok: true, value: undefined });
  worker.emit({
    kind: "observation",
    sequence: 1,
    value: {
      status: { running: true },
      history: { keep: [], append: [] },
      recent: { keep: [], append: [] },
      inspection: null,
    },
  });
  for (let i = 0; i < 100; i++) animate(i * 16);
  const frames = worker.sent.filter((s) => s.request.op === "frame");
  expect(frames).toHaveLength(1);
  expect(frames[0].request.payload).toEqual({});
  expect(frames[0].transfer).toEqual([]);
  worker.emit({ kind: "reply", id: frames[0].request.id, ok: true, value: undefined });
  await vi.waitFor(() => {
    animate(2000);
    expect(worker.sent.filter((s) => s.request.op === "frame")).toHaveLength(2);
  });
  bridge.stop();
  expect(cancel).toHaveBeenCalledWith(7);
  animate(3000);
  expect(worker.sent.filter((s) => s.request.op === "frame")).toHaveLength(2);
});
