import { CHECKPOINT_BYTES } from "../persist/recoveryPolicy";
import { type ObservationState } from "./types";
import { SOURCE_DIGEST } from "./runtimeIdentity";
import { validateObservation } from "./observationValidation";

const MAGIC = new TextEncoder().encode("ANTROPY-PACKAGE-11\0");
const OBSERVATION_BYTES = 8 * 1024 * 1024;
export interface PackageMetadata {
  version: 11;
  seed: number;
  tick: number;
  sourceDigest: string;
  observation: ObservationState;
}
const encoder = new TextEncoder(),
  decoder = new TextDecoder();

export async function encodePackage(
  snapshot: Uint8Array<ArrayBuffer>,
  metadata: Omit<PackageMetadata, "version" | "sourceDigest">
): Promise<Blob> {
  const json = encoder.encode(
    JSON.stringify({ ...metadata, version: 11, sourceDigest: SOURCE_DIGEST })
  );
  if (json.length > OBSERVATION_BYTES || snapshot.length + json.length > CHECKPOINT_BYTES)
    throw new Error("Checkpoint memory budget reached; export before continuing");
  const length = new Uint8Array(4);
  new DataView(length.buffer).setUint32(0, json.length, true);
  const raw = new Blob([MAGIC, length, json, snapshot]);
  return new Response(raw.stream().pipeThrough(new CompressionStream("gzip"))).blob();
}

async function readBounded(stream: ReadableStream<Uint8Array>): Promise<Uint8Array<ArrayBuffer>> {
  const reader = stream.getReader(),
    chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.length;
      if (size > CHECKPOINT_BYTES + MAGIC.length + 4) {
        await reader.cancel();
        throw new Error("Checkpoint exceeds the memory budget");
      }
      chunks.push(part.value);
    }
  } finally {
    reader.releaseLock();
  }
  const result = new Uint8Array(size);
  let at = 0;
  for (const chunk of chunks) {
    result.set(chunk, at);
    at += chunk.length;
  }
  return result;
}
function validateMetadata(value: unknown): asserts value is PackageMetadata {
  const m = value as PackageMetadata;
  if (
    !m ||
    m.version !== 11 ||
    !Number.isSafeInteger(m.seed) ||
    m.seed < 0 ||
    !Number.isSafeInteger(m.tick) ||
    m.tick < 0 ||
    typeof m.sourceDigest !== "string"
  )
    throw new Error("Invalid checkpoint metadata");
  validateObservation(m.observation, m.tick);
}
export async function decodePackage(blob: Blob) {
  if (blob.size > CHECKPOINT_BYTES) throw new Error("Checkpoint file exceeds the memory budget");
  const bytes = await readBounded(blob.stream().pipeThrough(new DecompressionStream("gzip")));
  if (bytes.length < MAGIC.length + 4 || MAGIC.some((b, i) => bytes[i] !== b))
    throw new Error("Incompatible observation package; version 11 required");
  const size = new DataView(bytes.buffer).getUint32(MAGIC.length, true),
    start = MAGIC.length + 4;
  if (size > OBSERVATION_BYTES || start + size >= bytes.length)
    throw new Error("Invalid checkpoint envelope");
  const metadata: unknown = JSON.parse(decoder.decode(bytes.subarray(start, start + size)));
  validateMetadata(metadata);
  return { metadata, snapshot: bytes.subarray(start + size) };
}
