import { Engine } from "./client";
import { Renderer, type ViewOptions } from "./renderer";
import { Session } from "./session";
import { listRecoveries } from "./recovery";
import { SPEEDS, type Speed } from "../ui/pacing";
import { type Message, type Request } from "./protocol";
import { SelectedObservation } from "./selectedObservation";
import { ObservationPublisher } from "./observationPublisher";
import { HealthRecorder } from "./runtimeHealth";

const port = self as unknown as {
  postMessage(message: Message): void;
  onmessage: ((event: MessageEvent<Request>) => void) | null;
};
let session: Session | null = null,
  renderer: Renderer | null = null;
let view: ViewOptions | null = null,
  selected: number | null = null;
let lastDraw = 0,
  lastSummary = 0,
  lastSave = performance.now(),
  lastField = 0,
  fieldDirty = true,
  drawPending = false;
const send = (message: Message) => port.postMessage(message);
const inspection = new SelectedObservation();
const health = new HealthRecorder();
const work = { simulationMs: 0, renderMs: 0, observationMs: 0, frames: 0, skippedFrames: 0 };
const publisher = new ObservationPublisher((sequence, value) =>
  send({ kind: "observation", sequence, value })
);
const turns = new MessageChannel();
turns.port1.onmessage = loop;
function requireSession() {
  if (!session) throw new Error("Engine is still loading");
  return session;
}
function publish() {
  if (!session) return;
  const started = performance.now();
  publisher.publish(() => {
    const current = requireSession();
    const status = { ...current.status(), workerWork: { ...work } };
    health.observe(current.observation.runId, status, view ? [view.width, view.height] : null);
    return { status, inspection: inspection.read(current.world, status.summary, selected) };
  });
  work.observationMs += performance.now() - started;
  lastSummary = performance.now();
}
function draw(now: number) {
  if (!renderer || !view || !session) return;
  drawPending = true;
  const refresh = fieldDirty || now - lastField >= 200;
  const started = performance.now();
  const frame = renderer.draw(
    session.world,
    [session.definition.config.width, session.definition.config.height],
    view,
    refresh
  );
  work.renderMs += performance.now() - started;
  if (!frame) {
    work.skippedFrames++;
    return;
  }
  drawPending = false;
  work.frames++;
  lastDraw = now;
  if (refresh) {
    lastField = now;
    fieldDirty = false;
  }
}
function automaticSave() {
  if (!session) return;
  session.save("automatic").then(publishSafely).catch(publishSafely);
}
function loop() {
  try {
    advance();
  } catch (error) {
    session?.fail(error);
    health.fault(error);
    send({ kind: "fault", value: String(error) });
    // A rendering failure must not destroy the recoverable physical world.
    renderer?.dispose();
    renderer = null;
    publishSafely();
  }
  // One queued task yields to controls without putting active computation on timer throttles.
  if (session?.running && session.speed === "max") turns.port2.postMessage(null);
  else setTimeout(loop, session?.running ? 4 : 50);
}
function publishSafely() {
  try {
    publish();
  } catch (error) {
    health.fault(error);
    send({ kind: "fault", value: `Diagnostics failed: ${String(error)}` });
  }
}
function advance() {
  if (!session?.running) {
    if (drawPending) draw(performance.now());
    return;
  }
  const now = performance.now();
  const started = performance.now();
  session.advance(now);
  work.simulationMs += performance.now() - started;
  if (!session.running) {
    publish();
    automaticSave();
  }
  if (now - lastSummary >= 500) publish();
  if (now - lastSave >= 30000) {
    lastSave = now;
    automaticSave();
  }
}
function present() {
  try {
    const now = performance.now();
    if (session?.running && now - lastDraw >= 1000 / 30) draw(now);
  } catch (error) {
    session?.fail(error);
    health.fault(error);
    renderer?.dispose();
    renderer = null;
    publishSafely();
  }
}
async function initialize(payload: Record<string, unknown>) {
  if (session) throw new Error("Worker is already initialized");
  const response = await fetch(String(payload.wasmUrl), { cache: "no-store" });
  if (!response.ok) throw new Error(`Engine download failed: ${response.status}`);
  const engine = await Engine.load(new Uint8Array(await response.arrayBuffer()), true);
  session = new Session(engine);
  const canvas = payload.canvas as OffscreenCanvas;
  renderer = new Renderer(canvas);
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    session?.fail("Graphics context lost; physical state retained");
    health.fault("Graphics context lost; physical state retained");
    renderer = null;
    publishSafely();
  });
  canvas.addEventListener("webglcontextrestored", () => {
    try {
      renderer = new Renderer(canvas);
      fieldDirty = true;
      draw(performance.now());
      if (session?.error?.includes("Graphics context lost")) session.error = null;
      publishSafely();
    } catch (error) {
      session?.fail(error);
      publishSafely();
    }
  });
  send({ kind: "definition", value: session.definition });
  publish();
  loop();
}
function replacement() {
  const current = requireSession();
  selected = null;
  fieldDirty = true;
  if (view) view = { ...view, selected: -1 };
  publisher.reset();
  send({ kind: "definition", value: current.definition });
  publish();
  draw(performance.now());
}
async function storage(request: Request) {
  const s = requireSession(),
    p = request.payload;
  switch (request.op) {
    case "save":
      return s.save(p.reason === "automatic" ? "automatic" : "manual");
    case "export":
      return s.export();
    case "recoveries":
      return listRecoveries();
    case "import":
      s.setRunning(false);
      await s.restore(p.blob as Blob);
      replacement();
      return;
    case "recover":
      s.setRunning(false);
      await s.restoreLocal(p.id as string | undefined);
      replacement();
      return;
    default:
      throw new Error("Unknown storage operation");
  }
}
function select(id: number | null) {
  const current = requireSession();
  inspection.read(current.world, current.status().summary, id);
  selected = id;
  if (view) view = { ...view, selected: selected ?? -1 };
  publish();
  draw(performance.now());
  return selected;
}
function setView(p: Record<string, unknown>) {
  const next = p as unknown as ViewOptions;
  validateView(next);
  if (view && viewKey(view) === viewKey(next)) return;
  if (!view || view.field !== next.field || view.species !== next.species) fieldDirty = true;
  view = { ...next, selected: selected ?? -1 };
  draw(performance.now());
}
function viewKey(v: ViewOptions) {
  return [
    v.width,
    v.height,
    v.camera.x,
    v.camera.y,
    v.camera.scale,
    v.field,
    v.species,
    v.color,
    v.exposure,
    v.regions,
    v.sources,
    ...v.layers,
  ].join("/");
}
function validateView(next: ViewOptions) {
  validateLayers(next);
  const numbers = [
    next.width,
    next.height,
    next.camera?.x,
    next.camera?.y,
    next.camera?.scale,
    next.exposure,
  ];
  if (
    !numbers.every(Number.isFinite) ||
    next.width <= 0 ||
    next.height <= 0 ||
    next.camera.scale <= 0
  )
    throw new Error("Invalid view geometry");
}
function validateLayers(next: ViewOptions) {
  validateColor(next);
  if (
    !Array.isArray(next.layers) ||
    next.layers.length !== 6 ||
    next.layers.some((v) => typeof v !== "boolean")
  )
    throw new Error("Invalid field layers");
  if (next.field !== 5 || !Number.isInteger(next.species) || next.species < 0 || next.species > 255)
    throw new Error("Invalid chemical selection");
  if (typeof next.regions !== "boolean" || typeof next.sources !== "boolean")
    throw new Error("Invalid overlays");
}
function validateColor(next: ViewOptions) {
  if (!Number.isInteger(next.color) || next.color < 0 || next.color > 15 || next.exposure <= 0)
    throw new Error("Invalid color mapping");
}
const controls: Partial<Record<Request["op"], (p: Record<string, unknown>) => unknown>> = {
  observed(p) {
    publisher.acknowledge(Number(p.sequence));
  },
  view: setView,
  chemicalWeb(p) {
    requireSession().chemicalWeb.select(p);
    publish();
  },
  frame: present,
  running(p) {
    if (p.value && !renderer)
      throw new Error("Graphics is unavailable; physical state remains paused and can be exported");
    const s = requireSession();
    s.setRunning(Boolean(p.value));
    if (!s.running) automaticSave();
    publish();
  },
  speed(p) {
    if (!SPEEDS.includes(p.value as Speed)) throw new Error("Invalid simulation speed");
    requireSession().setSpeed(p.value as Speed);
    publish();
  },
  restart(p) {
    requireSession().restart(Number(p.seed), p.config as Record<string, unknown>);
    replacement();
  },
  step() {
    const s = requireSession();
    s.setRunning(false);
    s.step();
    fieldDirty = true;
    publish();
    draw(performance.now());
  },
  pick(p) {
    return select(requireSession().world.command<number | null>("pick", p));
  },
  inspect(p) {
    return select(Number(p.cell));
  },
  task(p) {
    requireSession().world.command("task", p);
    inspection.invalidate();
    publish();
  },
};
async function handle(request: Request): Promise<unknown> {
  if (request.op === "initialize") return initialize(request.payload);
  requireSession();
  const control = controls[request.op];
  return control ? control(request.payload) : storage(request);
}
port.onmessage = (event) => {
  const request = event.data;
  handle(request)
    .then((value) => send({ kind: "reply", id: request.id, ok: true, value }))
    .catch((error) => {
      send({ kind: "reply", id: request.id, ok: false, error: String(error) });
      publishSafely();
    });
};
