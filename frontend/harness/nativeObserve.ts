import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { RemoteConnection } from "../src/engine/remoteConnection";
import {
  decodeDisplay,
  decodeTerrain,
  isTerrainPacket,
  type RemoteTerrain,
} from "../src/engine/remoteFrame";

// Registered all-off operating observation: one spectator, two hours, 128 MiB local cap.
const output = resolve(process.argv[2]);
mkdirSync(output, { recursive: false });
const started = Date.now();
let terrain: RemoteTerrain | null = null;
let publication: { generation: number; status: unknown; definition: unknown } | null = null;
let generation: number | null = null;
let lastTick = 0;
let lastStored = 0;
let samples = 0;
let bytes = 0;
let finished = false;
let connected = false;
const connection = new RemoteConnection(
  "ws://192.168.66.3:8095/stream",
  receive,
  (value) => {
    if (value) connected = true;
    else if (connected && !finished) finish("connection lost");
  },
  () => {}
);
const timer = setTimeout(() => finish("registered horizon complete"), 7200 * 1000);

function finish(reason: string) {
  if (finished) return;
  finished = true;
  clearTimeout(timer);
  connection.dispose();
  writeFileSync(
    resolve(output, "completion.json"),
    JSON.stringify({ reason, samples, lastTick, bytes, started, completed: Date.now() }),
    { flag: "wx" }
  );
  console.log(JSON.stringify({ reason, samples, lastTick }));
}

function receive(data: string | ArrayBuffer) {
  if (finished) return;
  if (typeof data === "string") {
    receivePublication(data);
    return;
  }
  if (isTerrainPacket(data)) {
    terrain = decodeTerrain(data);
    return;
  }
  const frame = decodeDisplay(data, terrain);
  if (!publication) return finish("missing publication");
  if (generation !== null && frame.generation !== generation) return finish("world replaced");
  if (frame.tick < lastTick) return finish("tick regression");
  generation = frame.generation;
  lastTick = frame.tick;
  if (Date.now() - lastStored >= 600 * 1000) sample(frame);
  setTimeout(() => {
    if (!finished)
      connection.call("ack", { sequence: frame.sequence }).catch((error) => finish(String(error)));
  }, 5000);
}

function receivePublication(data: string) {
  const value = JSON.parse(data);
  if (value.kind !== "publication") return;
  if (generation !== null && value.generation !== generation) return finish("world replaced");
  publication = value;
  connection.generation = value.generation;
}

function sample(frame: ReturnType<typeof decodeDisplay>) {
  const cells = Array.from({ length: frame.cells.length / 12 }, (_, index) => {
    const i = index * 12;
    return [frame.cells[i + 9], frame.cells[i], frame.cells[i + 1]];
  });
  const sources = Array.from({ length: frame.markers.length / 12 }, (_, index) => {
    const i = index * 12;
    return frame.markers[i + 8] === 0
      ? [frame.markers[i], frame.markers[i + 1], frame.markers[i + 2]]
      : null;
  }).filter((row) => row !== null);
  if (cells.some(([id]) => id >= 16777216)) return finish("display ID precision limit");
  const line =
    JSON.stringify({ at: Date.now(), tick: frame.tick, publication, cells, sources }) + "\n";
  bytes += Buffer.byteLength(line);
  if (bytes > 128 * 1024 ** 2) return finish("registered storage cap");
  appendFileSync(resolve(output, "samples.jsonl"), line);
  samples++;
  lastStored = Date.now();
  console.log(JSON.stringify({ sample: samples, tick: frame.tick, population: cells.length }));
  if (cells.length === 0) finish("extinction");
}

connection.connect();
