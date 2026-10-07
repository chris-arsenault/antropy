import { type DisplayFrame } from "./renderer";
import { type Definition, type LiveStatus } from "./types";
import { applyRemoteStatus } from "./remoteStatus";
import { SceneReader } from "./remoteSceneReader";
import { composeLight, type LightAxes } from "./remoteLight";

export interface RemoteFrame extends DisplayFrame {
  generation: number;
  sequence: number;
}
export interface RemoteTerrain {
  generation: number;
  revision: number;
  nx: number;
  ny: number;
  values: Float32Array<ArrayBuffer>;
}
export function isTerrainPacket(buffer: ArrayBuffer) {
  return buffer.byteLength >= 4 && new DataView(buffer).getUint32(0, true) === 0x42545452;
}
function validTerrainSize(nx: number, ny: number, length: number) {
  return nx > 0 && ny > 0 && nx <= 256 && ny <= 256 && length === nx * ny * 4;
}
export function decodeTerrain(buffer: ArrayBuffer): RemoteTerrain {
  if (buffer.byteLength < 32 || buffer.byteLength > 32 + 256 * 256 * 16)
    throw new Error("Remote terrain exceeds packet bounds");
  const d = new DataView(buffer);
  const word = (i: number) => d.getUint32(i * 4, true);
  if (word(0) !== 0x42545452 || word(1) !== 1) throw new Error("Incompatible remote terrain");
  const nx = word(4),
    ny = word(5),
    length = word(6);
  if (!validTerrainSize(nx, ny, length) || buffer.byteLength !== 32 + length * 4 || !word(3))
    throw new Error("Invalid remote terrain layout");
  return {
    generation: word(2),
    revision: word(3),
    nx,
    ny,
    values: new Float32Array(buffer, 32, length),
  };
}
function requireTerrain(terrain: RemoteTerrain | null, generation: number, revision: number) {
  if (!terrain || terrain.generation !== generation || terrain.revision !== revision)
    throw new Error("Missing terrain for remote display");
  return terrain;
}
export interface SceneMetadata {
  kind: "publication";
  version: 3;
  generation: number;
  sequence: number;
  base: number;
  tick: number;
  revision: number;
  operator: boolean;
  reset: boolean;
  nx: number;
  ny: number;
  extent: [number, number, number, number];
  terrainRevision: number;
  viewKind: number;
  solar: number[];
  axes: LightAxes | null;
  definition: Definition | null;
  status: Record<string, unknown>;
}
function envelope(buffer: ArrayBuffer) {
  if (buffer.byteLength < 16 || buffer.byteLength > 16 * 1024 * 1024)
    throw new Error("Remote scene exceeds packet bounds");
  const d = new DataView(buffer);
  if (d.getUint32(0, true) !== 0x4254494e || d.getUint32(4, true) !== 1)
    throw new Error("Incompatible remote scene");
  const jsonLength = d.getUint32(8, true),
    terrainLength = d.getUint32(12, true),
    start = 16 + jsonLength;
  if (jsonLength > 4 * 1024 * 1024 || start + terrainLength > buffer.byteLength)
    throw new Error("Invalid scene envelope");
  const metadata = JSON.parse(
    new TextDecoder().decode(new Uint8Array(buffer, 16, jsonLength))
  ) as SceneMetadata;
  validateMetadata(metadata);
  return { metadata, start, terrainLength };
}
function validateMetadata(m: SceneMetadata) {
  const integers = [
    m.generation,
    m.sequence,
    m.base,
    m.tick,
    m.revision,
    m.nx,
    m.ny,
    m.terrainRevision,
  ];
  if (
    m.version !== 3 ||
    m.kind !== "publication" ||
    !integers.every((n) => Number.isSafeInteger(n) && n >= 0)
  )
    throw new Error("Invalid scene metadata");
  if (
    typeof m.reset !== "boolean" ||
    typeof m.operator !== "boolean" ||
    !m.status ||
    typeof m.status !== "object" ||
    Array.isArray(m.status)
  )
    throw new Error("Invalid scene status");
  validateGeometry(m);
  validateSolar(m);
}
function validateSolar(m: SceneMetadata) {
  if (!Array.isArray(m.solar) || m.solar.length !== 7 || !m.solar.every(Number.isFinite))
    throw new Error("Invalid solar phases");
}
function validateGeometry(m: SceneMetadata) {
  if (
    !m.nx ||
    !m.ny ||
    m.nx * m.ny > 524288 ||
    !Array.isArray(m.extent) ||
    m.extent.length !== 4 ||
    !m.extent.every(Number.isFinite) ||
    m.extent[2] <= 0 ||
    m.extent[3] <= 0
  )
    throw new Error("Invalid scene geometry");
}

/** A worker-local observation cache; physical state and simulation remain native. */
export class RemoteScene {
  private sequence = 0;
  private generation = 0;
  private terrain: RemoteTerrain | null = null;
  private organisms = new Map<number, Uint32Array>();
  private markers = new Map<number, Uint32Array>();
  private environment: Uint32Array[] = [];
  private geometry = "";
  private axes: LightAxes | null = null;
  status: LiveStatus | null = null;
  definition: Definition | null = null;
  receive(buffer: ArrayBuffer) {
    const { metadata: m, start, terrainLength } = envelope(buffer);
    const replaced = m.generation !== this.generation || m.base === 0;
    this.validateBase(m, replaced);
    if (replaced) {
      this.status = null;
      this.definition = m.definition;
      this.terrain = null;
    }
    if (terrainLength) this.terrain = decodeTerrain(buffer.slice(start, start + terrainLength));
    const terrain = requireTerrain(this.terrain, m.generation, m.terrainRevision);
    const geometry = JSON.stringify([m.nx, m.ny, m.extent]);
    if (m.reset) {
      this.organisms.clear();
      this.markers.clear();
      this.environment = Array.from({ length: 16 }, () => new Uint32Array(m.nx * m.ny));
      this.axes = m.axes;
    } else if (geometry !== this.geometry) throw new Error("Missing scene geometry reset");
    const reader = new SceneReader(buffer, start + terrainLength);
    reader.records(this.organisms, 11);
    reader.records(this.markers, 12);
    this.environment.forEach((lane) => reader.environment(lane));
    reader.finish();
    this.status = applyRemoteStatus(this.status, m.status);
    this.generation = m.generation;
    this.sequence = m.sequence;
    this.geometry = geometry;
    return { metadata: m, replaced, frame: this.renderFrame(m, terrain) };
  }
  private validateBase(m: SceneMetadata, replaced: boolean) {
    if (replaced) {
      if (m.base !== 0 || !m.reset || !m.definition)
        throw new Error("Missing scene initialization");
    } else if (m.base !== this.sequence || m.sequence <= this.sequence)
      throw new Error("Missing scene baseline");
  }
  private renderFrame(m: SceneMetadata, terrain: RemoteTerrain): RemoteFrame {
    const field = new Float32Array(m.nx * m.ny * 8);
    this.environment.slice(0, 8).forEach((lane, k) => {
      const values = new Float32Array(lane.buffer);
      values.forEach((v, i) => {
        field[i * 8 + k] = v;
      });
    });
    if (!this.axes || this.axes[0].length !== m.nx || this.axes[1].length !== m.ny)
      throw new Error("Missing solar basis");
    composeLight(field, m.nx, this.environment, this.axes, m.solar, m.viewKind);
    return {
      generation: m.generation,
      sequence: m.sequence,
      tick: m.tick,
      nx: m.nx,
      ny: m.ny,
      extent: m.extent,
      terrain,
      field,
      cells: this.renderOrganisms(),
      count: this.organisms.size,
      markers: this.renderMarkers(),
      markerCount: this.markers.size,
    };
  }
  private renderOrganisms() {
    const cells = new Float32Array(this.organisms.size * 12);
    let i = 0;
    for (const [id, bits] of this.organisms) {
      const a = new Float32Array(bits.buffer);
      cells.set(a.subarray(0, 9), i);
      cells[i + 9] = id;
      cells[i + 10] = a[9];
      cells[i + 11] = a[10];
      i += 12;
    }
    return cells;
  }
  private renderMarkers() {
    const markers = new Float32Array(this.markers.size * 12);
    let i = 0;
    for (const bits of this.markers.values()) {
      markers.set(new Float32Array(bits.buffer), i);
      i += 12;
    }
    return markers;
  }
}
