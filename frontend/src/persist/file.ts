import { type Checkpoint } from "./checkpoint";

/**
 * File codec: the checkpoint object with every typed array encoded as
 * base64. One intermediate (Checkpoint), two carriers (IndexedDB, file).
 */

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToBytes(encoded: string): Uint8Array {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function encodeValue(value: unknown): unknown {
  if (value instanceof Uint8Array) {
    return { __u8: bytesToBase64(value) };
  }
  if (value instanceof Uint32Array) {
    return {
      __u32: bytesToBase64(new Uint8Array(value.buffer, value.byteOffset, value.byteLength)),
    };
  }
  if (value instanceof Float32Array) {
    return {
      __f32: bytesToBase64(new Uint8Array(value.buffer, value.byteOffset, value.byteLength)),
    };
  }
  if (Array.isArray(value)) {
    return value.map(encodeValue);
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, encodeValue(v)]));
  }
  return value;
}

function decodeValue(value: unknown): unknown {
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.__u8 === "string") {
      return base64ToBytes(record.__u8);
    }
    if (typeof record.__u32 === "string") {
      const bytes = base64ToBytes(record.__u32);
      return new Uint32Array(bytes.buffer, 0, bytes.byteLength / 4);
    }
    if (typeof record.__f32 === "string") {
      const bytes = base64ToBytes(record.__f32);
      return new Float32Array(bytes.buffer, 0, bytes.byteLength / 4);
    }
    if (Array.isArray(value)) {
      return value.map(decodeValue);
    }
    return Object.fromEntries(Object.entries(record).map(([k, v]) => [k, decodeValue(v)]));
  }
  return value;
}

export function checkpointToJson(checkpoint: Checkpoint): string {
  return JSON.stringify(encodeValue(checkpoint));
}

export function checkpointFromJson(json: string): Checkpoint {
  return decodeValue(JSON.parse(json)) as Checkpoint;
}
