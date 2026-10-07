import { type SceneMetadata } from "../remoteFrame";

/** Construct a zero-valued scene for worker/lifecycle tests; native fixtures test the codec. */
export function scenePacket(patch: Partial<SceneMetadata> = {}, body?: Uint8Array) {
  const metadata: SceneMetadata = {
    kind: "publication",
    version: 3,
    generation: 1,
    sequence: 1,
    base: 0,
    tick: 0,
    revision: 0,
    operator: false,
    reset: true,
    nx: 1,
    ny: 1,
    extent: [0, 0, 2, 2],
    terrainRevision: 7,
    viewKind: 5,
    solar: [1, 0, 1, 0, 1, 0, 0],
    axes: [[[1, 0]], [[1, 0]]],
    definition: {} as SceneMetadata["definition"],
    status: { history: { keep: [], append: [] }, recent: { keep: [], append: [] } },
    ...patch,
  };
  const json = new TextEncoder().encode(JSON.stringify(metadata));
  const terrain = metadata.base === 0 ? new Uint8Array(48) : new Uint8Array();
  if (terrain.length)
    new Uint32Array(terrain.buffer, 0, 8).set([0x42545452, 1, metadata.generation, 7, 1, 1, 4, 0]);
  const changes = body ?? new Uint8Array(20);
  const packet = new Uint8Array(16 + json.length + terrain.length + changes.length);
  new DataView(packet.buffer).setUint32(0, 0x4254494e, true);
  new DataView(packet.buffer).setUint32(4, 1, true);
  new DataView(packet.buffer).setUint32(8, json.length, true);
  new DataView(packet.buffer).setUint32(12, terrain.length, true);
  packet.set(json, 16);
  packet.set(terrain, 16 + json.length);
  packet.set(changes, 16 + json.length + terrain.length);
  return packet.buffer;
}
