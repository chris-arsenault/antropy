import { type DisplayFrame } from "./renderer";

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
export function decodeDisplay(buffer: ArrayBuffer, terrain: RemoteTerrain | null): RemoteFrame {
  if (buffer.byteLength < 64 || buffer.byteLength > 16 * 1024 * 1024)
    throw new Error("Remote display exceeds packet bounds");
  const d = new DataView(buffer);
  const word = (i: number) => d.getUint32(i * 4, true);
  if (word(0) !== 0x42545250 || word(1) !== 2) throw new Error("Incompatible remote display");
  const ground = requireTerrain(terrain, word(2), word(11));
  const cells = word(8),
    field = word(9),
    markers = word(10);
  if (
    word(6) * word(7) === 0 ||
    cells % 12 ||
    markers % 12 ||
    field !== word(6) * word(7) * 8 ||
    64 + (cells + field + markers) * 4 !== buffer.byteLength
  )
    throw new Error("Invalid remote display layout");
  return {
    generation: word(2),
    terrain: ground,
    sequence: word(3),
    tick: word(4) + word(5) * 4294967296,
    nx: word(6),
    ny: word(7),
    count: cells / 12,
    markerCount: markers / 12,
    extent: [
      d.getFloat32(48, true),
      d.getFloat32(52, true),
      d.getFloat32(56, true),
      d.getFloat32(60, true),
    ],
    cells: new Float32Array(buffer, 64, cells),
    field: new Float32Array(buffer, 64 + cells * 4, field),
    markers: new Float32Array(buffer, 64 + (cells + field) * 4, markers),
  };
}
