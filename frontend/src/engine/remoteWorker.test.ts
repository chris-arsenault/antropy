import { afterEach, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { Engine } from "./client";
import { Session } from "./session";
import { type Message, type Request } from "./protocol";
import { chemicalLayers, initialChemicalDisplay } from "./chemicalDisplay";

const transport = vi.hoisted(() => ({
  receive: (_data: string | ArrayBuffer) => {},
  state: (_connected: boolean) => {},
  open: () => {},
  call: vi.fn(async () => null),
  draw: vi.fn(() => ({ tick: 0, uploadedBytes: 32 })),
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
  },
}));
vi.mock("./renderer", () => ({
  Renderer: class {
    draw = transport.draw;
  },
}));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  vi.clearAllMocks();
});

it("publishes remote status through the existing budget and keeps binary frames inside the worker", async () => {
  const bytes = new Uint8Array(readFileSync("public/antropy-engine.wasm"));
  const session = new Session(await Engine.load(bytes));
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
  transport.receive(JSON.stringify({ kind: "sample", revision: 0, operator: false }));
  transport.receive(
    JSON.stringify({
      kind: "publication",
      version: 1,
      generation: 1,
      sequence: 1,
      definition: session.definition,
      status,
    })
  );
  const packet = new ArrayBuffer(96);
  new Uint32Array(packet, 0, 12).set([0x42545250, 1, 1, 1, 0, 0, 1, 1, 0, 8, 0, 0]);
  new Float32Array(packet, 48, 4).set([0, 0, 2, 2]);
  transport.receive(packet);
  expect(sent.some((m) => m.kind === "definition")).toBe(true);
  const observations = sent.filter((m) => m.kind === "observation");
  expect(observations).toHaveLength(1);
  expect(observations[0].value.status.execution?.threads).toBe(32);
  expect(transport.call).toHaveBeenCalledWith("ack", { sequence: 1 });
  expect(JSON.stringify(sent)).not.toContain('cells":{');
  expect(sent.every((m) => !("buffer" in m))).toBe(true);
  session.world.dispose();
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
  for (const [index, base] of (["terrain", "cover", "emission", "potential"] as const).entries()) {
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
