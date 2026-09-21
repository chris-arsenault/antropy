// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { type Request, type Message } from "./protocol";
import { type ViewOptions } from "./renderer";

const graphics = vi.hoisted(() => ({ draw: vi.fn(), dispose: vi.fn() }));
vi.mock("./renderer", () => ({
  Renderer: class {
    draw = graphics.draw;
    dispose = graphics.dispose;
  },
}));
vi.mock("./client", () => ({ Engine: { loadBrowser: async () => ({}) } }));
vi.mock("./session", () => ({
  Session: class {
    running = false;
    world = { tick: 0 };
    definition = { config: { width: 24, height: 24 } };
    setRunning(value: boolean) {
      this.running = value;
    }
    step() {
      this.world.tick++;
    }
    advance() {
      throw new Error("Paused simulation advanced");
    }
  },
}));
vi.mock("./observationPublisher", () => ({
  ObservationPublisher: class {
    publish() {}
  },
}));

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.resetModules();
});

it("retries the latest paused view and manual step after GPU backpressure without more input", async () => {
  vi.useFakeTimers();
  const replies: Message[] = [];
  const port = {
    postMessage: (message: Message) => replies.push(message),
    onmessage: null as ((event: { data: Request }) => void) | null,
  };
  vi.stubGlobal("self", port);
  vi.stubGlobal(
    "MessageChannel",
    class {
      port1 = {};
      port2 = {};
    }
  );
  vi.stubGlobal("fetch", async () => new Response(new Uint8Array()));
  graphics.draw.mockReturnValue({ tick: 0 });
  await import("./worker");
  let id = 0;
  const call = async (op: Request["op"], payload: Record<string, unknown> = {}) => {
    port.onmessage!({ data: { id: ++id, op, payload } });
    await vi.advanceTimersByTimeAsync(0);
    expect(replies.find((r) => r.kind === "reply" && r.id === id)).toMatchObject({ ok: true });
  };
  await call("initialize", { wasmUrl: "unused", canvas: { addEventListener() {} } });
  const view: ViewOptions = {
    width: 800,
    height: 600,
    camera: { x: 12, y: 12, scale: 2 },
    field: 5,
    species: 0,
    color: 6,
    selected: -1,
    layers: [true, false, false, false, false, false, false, false],
    regions: true,
    sources: true,
    exposure: 4,
  };
  await call("view", { ...view });
  graphics.draw.mockReturnValue(null);
  await call("view", { ...view, species: 1 });
  await call("view", { ...view, species: 2 });
  graphics.draw.mockReturnValue({ tick: 0 });
  await vi.advanceTimersByTimeAsync(50);
  expect(graphics.draw).toHaveBeenLastCalledWith(
    { tick: 0 },
    [24, 24],
    expect.objectContaining({ species: 2 }),
    true
  );
  graphics.draw.mockReturnValue(null);
  await call("step");
  graphics.draw.mockReturnValue({ tick: 1 });
  await vi.advanceTimersByTimeAsync(50);
  expect(graphics.draw).toHaveBeenLastCalledWith(
    { tick: 1 },
    [24, 24],
    expect.objectContaining({ species: 2 }),
    true
  );
  const completed = graphics.draw.mock.calls.length;
  await vi.advanceTimersByTimeAsync(1000);
  expect(graphics.draw).toHaveBeenCalledTimes(completed);
});
