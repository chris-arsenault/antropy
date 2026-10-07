import { afterEach, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { Engine } from "./client";
import { Session } from "./session";
import { type Message, type Request } from "./protocol";
import { chemicalLayers, initialChemicalDisplay } from "./chemicalDisplay";
import { scenePacket } from "./testing/remotePacket";

const transport = vi.hoisted(() => ({
  receive: (_data: string | ArrayBuffer) => {},
  state: (_connected: boolean) => {},
  open: () => {},
  call: vi.fn(async () => null),
  draw: vi.fn(() => ({ tick: 0, uploadedBytes: 32 })),
  active: vi.fn(),
}));
vi.mock("./remoteConnection", () => ({
  RemoteConnection: class {
    generation = 0;
    constructor(
      _url: string,
      receive: typeof transport.receive,
      state: typeof transport.state,
      open: () => void
    ) {
      transport.receive = receive;
      transport.state = state;
      transport.open = open;
    }
    connect() {
      transport.state(true);
      transport.open();
    }
    call = transport.call;
    setActive = transport.active;
  },
}));
vi.mock("./renderer", () => ({
  Renderer: class {
    draw = transport.draw;
    resetTerrain = vi.fn();
  },
}));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  vi.clearAllMocks();
});

it("publishes incremental status through the existing budget and renders scene data inside the worker", async () => {
  const bytes = new Uint8Array(readFileSync("public/antropy-engine.wasm"));
  const session = new Session(await Engine.load(bytes), {
    width: 24,
    height: 24,
    founders: 2,
    sourceCount: 2,
  });
  const sent: Message[] = [];
  const worker = {
    postMessage: (m: Message) => sent.push(m),
    onmessage: null as ((e: MessageEvent<Request>) => void) | null,
  };
  vi.stubGlobal("self", worker);
  await import("./remoteWorker");
  worker.onmessage!({
    data: { id: 1, op: "initialize", payload: { endpoint: "ws://localhost/stream", canvas: {} } },
  } as MessageEvent<Request>);
  const status = session.status();
  status.execution = { location: "server", threads: 32, operator: false, connected: true };
  transport.receive(
    scenePacket({
      definition: session.definition,
      status: {
        ...status,
        history: { keep: [], append: status.history },
        recent: { keep: [], append: status.recent },
      },
    })
  );
  expect(sent.some((m) => m.kind === "definition")).toBe(true);
  const observations = sent.filter((m) => m.kind === "observation");
  expect(observations).toHaveLength(1);
  expect(observations[0].value.status.execution?.threads).toBe(32);
  expect(transport.call).toHaveBeenCalledWith("ack", { sequence: 1 });
  expect(JSON.stringify(sent)).not.toContain('cells":{');
  expect(sent.every((m) => !("buffer" in m))).toBe(true);
  session.world.dispose();
});

it("forwards hidden and visible state to the remote socket lifecycle", async () => {
  const worker = {
    postMessage: vi.fn(),
    onmessage: null as ((e: MessageEvent<Request>) => void) | null,
  };
  vi.stubGlobal("self", worker);
  await import("./remoteWorker");
  worker.onmessage!({
    data: {
      id: 1,
      op: "initialize",
      payload: { endpoint: "ws://localhost/stream", canvas: {}, visible: false },
    },
  } as MessageEvent<Request>);
  expect(transport.active).toHaveBeenLastCalledWith(false);
  worker.onmessage!({
    data: { id: 2, op: "visibility", payload: { visible: true } },
  } as MessageEvent<Request>);
  expect(transport.active).toHaveBeenLastCalledWith(true);
});

it("forwards selected reservoir inspection without publishing physical arrays", async () => {
  const worker = {
    postMessage: vi.fn(),
    onmessage: null as ((e: MessageEvent<Request>) => void) | null,
  };
  vi.stubGlobal("self", worker);
  await import("./remoteWorker");
  worker.onmessage!({
    data: { id: 1, op: "initialize", payload: { endpoint: "ws://localhost/stream", canvas: {} } },
  } as MessageEvent<Request>);
  worker.onmessage!({
    data: { id: 2, op: "inspectReservoir", payload: { source: 3 } },
  } as MessageEvent<Request>);
  await vi.waitFor(() =>
    expect(transport.call).toHaveBeenCalledWith("inspectReservoir", { source: 3 })
  );
});

it("requests fresh remote projections when switching terrain, film and emitted light", async () => {
  const worker = {
    postMessage: vi.fn(),
    onmessage: null as ((e: MessageEvent<Request>) => void) | null,
  };
  vi.stubGlobal("self", worker);
  await import("./remoteWorker");
  worker.onmessage!({
    data: { id: 1, op: "initialize", payload: { endpoint: "ws://localhost/stream", canvas: {} } },
  } as MessageEvent<Request>);
  for (const [index, base] of (
    ["terrain", "cover", "emission", "height", "landscape"] as const
  ).entries()) {
    const layers = chemicalLayers({ ...initialChemicalDisplay, base });
    worker.onmessage!({
      data: {
        id: index + 2,
        op: "view",
        payload: { species: 0, color: 3, layers },
      },
    } as MessageEvent<Request>);
    await vi.waitFor(() => expect(transport.call).toHaveBeenCalledTimes(index + 1));
    expect(transport.call).toHaveBeenLastCalledWith(
      "view",
      expect.objectContaining({ layers, revision: index + 1 })
    );
  }
});
