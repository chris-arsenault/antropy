import { Renderer, type ViewOptions } from "./renderer";
import { ObservationPublisher } from "./observationPublisher";
import { type Definition, type LiveStatus, type Inspection } from "./types";
import { type Message, type Request } from "./protocol";
import { RemoteConnection } from "./remoteConnection";
import { decodeDisplay, type RemoteFrame } from "./remoteFrame";

const port = self as unknown as {
  postMessage(m: Message): void;
  onmessage: ((e: MessageEvent<Request>) => void) | null;
};
const send = (m: Message) => port.postMessage(m);
let connection: RemoteConnection;
let renderer: Renderer;
let definition: Definition | null = null;
let status: LiveStatus | null = null;
let inspection: Inspection | null = null;
let selected: number | null = null;
let view: ViewOptions | null = null;
let frame: RemoteFrame | null = null;
let revision = 0;
let generation = 0;
let sequence = 0;
let acceptedRevision = 0;
let operator = false;
let connected = false;
let framePending = false;
let drawDirty = false;
let queryPending = false;
let webQuery: Record<string, unknown> | null = null;
let viewKey = "";
let viewSending = false;
let viewDirty = false;
let inspectionRevision = "";
const publisher = new ObservationPublisher((sequence, value) =>
  send({ kind: "observation", sequence, value })
);

function publish() {
  if (status) publisher.publish(() => ({ status, inspection }));
}
function connectionState(value: boolean) {
  connected = value;
  operator = false;
  framePending = false;
  if (status?.execution) {
    status = {
      ...status,
      error: value ? null : "Server disconnected; reconnecting. Observation history has a gap.",
      execution: { ...status.execution, connected: value, operator: false },
    };
    publish();
  } else if (!value) send({ kind: "fault", value: "Server disconnected; reconnecting…" });
}
function opened() {
  frame = null;
  definition = null;
  sequence = 0;
  viewKey = "";
  viewDirty = true;
  sendView();
}
function receive(data: string | ArrayBuffer) {
  if (typeof data !== "string") {
    const next = decodeDisplay(data);
    if (next.generation !== generation || next.sequence !== sequence)
      throw new Error("Stale display identity");
    if (acceptedRevision !== revision) {
      connection.call("ack", { sequence }).catch(() => {});
      return;
    }
    frame = next;
    framePending = true;
    drawDirty = true;
    draw();
    return;
  }
  const m = JSON.parse(data) as Record<string, unknown>;
  if (m.kind === "sample") {
    operator = m.operator === true;
    acceptedRevision = Number(m.revision);
    return;
  }
  if (m.kind !== "publication" || m.version !== 1) throw new Error("Incompatible server protocol");
  receivePublication(m);
}
function receivePublication(m: Record<string, unknown>) {
  const changed = generation !== m.generation;
  const replaced = changed || !definition;
  generation = Number(m.generation);
  connection.generation = generation;
  sequence = Number(m.sequence);
  if (replaced) {
    definition = m.definition as Definition;
    inspection = null;
    selected = null;
    frame = null;
    publisher.reset();
    send({ kind: "definition", value: definition });
  }
  updateStatus(m.status as LiveStatus, replaced);
  publish();
  refreshQueries();
}
function updateStatus(incoming: LiveStatus, changed: boolean) {
  const previous = changed ? null : status;
  const previousWeb = previous?.chemicalWeb ?? null;
  status = {
    ...incoming,
    history: reuseHistory(previous?.history ?? [], incoming.history),
    recent: reuseHistory(previous?.recent ?? [], incoming.recent),
    chemicalWeb: webQuery ? previousWeb : null,
    execution: { ...incoming.execution!, connected, operator },
  };
}
function reuseHistory<T extends { tick: number }>(before: T[], incoming: T[]) {
  const previous = new Map(before.map((p) => [p.tick, p]));
  return incoming.map((p) => previous.get(p.tick) ?? p);
}
function draw() {
  if (!drawDirty) return;
  if (!frame || !view || !definition) {
    acknowledgeFrame();
    return;
  }
  const result = renderer.draw(
    { render: () => frame! },
    [definition.config.width, definition.config.height],
    { ...view, selected: selected ?? -1 },
    framePending
  );
  if (!result && framePending) {
    setTimeout(draw, 16);
    return;
  }
  if (!result) return;
  drawDirty = false;
  acknowledgeFrame();
}
function acknowledgeFrame() {
  if (!framePending) return;
  framePending = false;
  connection.call("ack", { sequence }).catch(() => {});
}
async function sendView() {
  if (!view || !connected || viewSending || !viewDirty) return;
  viewDirty = false;
  viewSending = true;
  try {
    await connection.call("view", { ...view, selected: selected ?? -1, revision, ...viewport() });
  } catch (e) {
    send({ kind: "fault", value: String(e) });
  } finally {
    viewSending = false;
    if (viewDirty) sendView();
  }
}
function setView(p: Record<string, unknown>) {
  view = p as unknown as ViewOptions;
  drawDirty = true;
  const key = JSON.stringify([view.species, view.color, view.layers[6], selected, viewport()]);
  if (key !== viewKey) {
    viewKey = key;
    revision++;
    viewDirty = true;
    sendView();
  }
  // Camera, exposure and display toggles are local and remain responsive between updates.
  if (acceptedRevision === revision) draw();
}
function viewport() {
  if (!view || !definition || definition.config.width * definition.config.height <= 320 * 240)
    return {};
  // Snapped display windows share nearby cameras. Sampling density affects display only.
  const unit = 32,
    { camera, width, height } = view;
  const x = Math.floor((camera.x - width / camera.scale / 2) / unit) * unit;
  const y = Math.floor((camera.y - height / camera.scale / 2) / unit) * unit;
  return {
    viewport: [
      x,
      y,
      Math.ceil(width / camera.scale / unit + 2) * unit,
      Math.ceil(height / camera.scale / unit + 2) * unit,
    ],
  };
}
async function inspect(id: number | null) {
  selected = id;
  inspection = null;
  inspectionRevision = "";
  if (view) setView(view as unknown as Record<string, unknown>);
  await refreshQueries();
  publish();
  return id;
}
async function refreshQueries() {
  if (queryPending || !status || !connected) return;
  queryPending = true;
  const currentGeneration = generation,
    cell = selected,
    query = webQuery;
  try {
    if (cell !== null) await refreshInspection(cell, currentGeneration);
    if (query) await refreshWeb(query, currentGeneration);
    publish();
  } catch (e) {
    if (connected) send({ kind: "fault", value: String(e) });
  } finally {
    queryPending = false;
  }
}
async function refreshInspection(cell: number, currentGeneration: number) {
  const summary = status!.summary;
  const key = `${summary.ancestryRecords}/${summary.ledger.deaths}/${summary.ledger.transfers}`;
  const result = await connection.call<Partial<Inspection>>("inspectSelected", {
    cell,
    genealogy: key !== inspectionRevision,
    genome: inspection?.genotype?.id ?? null,
    machinery: inspection?.cell?.machineryRevision ?? null,
  });
  if (generation !== currentGeneration || selected !== cell) return;
  inspection = { ...inspection, ...result } as Inspection;
  inspectionRevision = key;
}
async function refreshWeb(query: Record<string, unknown>, currentGeneration: number) {
  const result = await connection.call<LiveStatus["chemicalWeb"]>("chemicalWeb", query);
  if (generation === currentGeneration && webQuery === query && status)
    status = { ...status, chemicalWeb: result };
}
async function handle(r: Request): Promise<unknown> {
  const p = r.payload;
  switch (r.op) {
    case "initialize":
      renderer = new Renderer(p.canvas as OffscreenCanvas);
      connection = new RemoteConnection(String(p.endpoint), receive, connectionState, opened);
      connection.connect();
      return;
    case "frame":
      return draw();
    case "observed":
      publisher.acknowledge(Number(p.sequence));
      return;
    case "view":
      return setView(p);
    case "pick":
      return inspect(await connection.call<number | null>("pick", p));
    case "inspect":
      return inspect(Number(p.cell));
    default:
      return control(r);
  }
}
async function control(r: Request) {
  const p = r.payload;
  if (r.op === "chemicalWeb") {
    webQuery = p.enabled === false ? null : p;
    if (status) status = { ...status, chemicalWeb: null };
    await refreshQueries();
    publish();
    return;
  }
  if (r.op === "phenotype" && p.action === "panel") return;
  if (r.op === "authenticate") {
    const value = await connection.call<{ operator: boolean }>("authenticate", p);
    operator = value.operator;
    if (status?.execution) status = { ...status, execution: { ...status.execution, operator } };
    publish();
    return;
  }
  return connection.call(r.op, p);
}
port.onmessage = (event: MessageEvent<Request>) => {
  const r = event.data;
  handle(r)
    .then((value) => send({ kind: "reply", id: r.id, ok: true, value }))
    .catch((e) => send({ kind: "reply", id: r.id, ok: false, error: String(e) }));
};
