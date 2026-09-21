import { type DisplayFrame } from "./renderer";

export interface RemoteFrame extends DisplayFrame {
  generation: number;
  sequence: number;
}
export function decodeDisplay(buffer: ArrayBuffer): RemoteFrame {
  if (buffer.byteLength < 64 || buffer.byteLength > 16 * 1024 * 1024)
    throw new Error("Remote display exceeds packet bounds");
  const d = new DataView(buffer);
  const word = (i: number) => d.getUint32(i * 4, true);
  if (word(0) !== 0x42545250 || word(1) !== 1) throw new Error("Incompatible remote display");
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
