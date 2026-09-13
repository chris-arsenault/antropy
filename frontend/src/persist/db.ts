import { CHECKPOINT_BYTES, retainedRecoveries, type RecoveryMetadata } from "./recoveryPolicy";
import { localIdentity } from "./identity";

interface Recovery extends RecoveryMetadata {
  blob: Blob;
}
export interface SaveMetadata {
  runId: string;
  tick: number;
  seed: number;
  reason: "manual" | "automatic";
}
function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let blocked = false;
    const request = indexedDB.open("antropy-bacteria", 2);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains("checkpoints"))
        request.result.createObjectStore("checkpoints");
      if (!request.result.objectStoreNames.contains("recovery"))
        request.result.createObjectStore("recovery", { keyPath: "id" });
    };
    request.onsuccess = () => {
      if (blocked) request.result.close();
      else resolve(request.result);
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () => {
      blocked = true;
      reject(new Error("Recovery database upgrade blocked by another open Antropy tab"));
    };
  });
}
export async function saveLocal(text: string, metadata: SaveMetadata): Promise<void> {
  const raw = new Blob([text]);
  if (raw.size > CHECKPOINT_BYTES)
    throw new Error("Checkpoint memory budget reached; export before continuing");
  const blob = await new Response(raw.stream().pipeThrough(new CompressionStream("gzip"))).blob();
  const record: Recovery = {
    ...metadata,
    id: localIdentity(),
    createdAt: Date.now(),
    bytes: blob.size,
    rawBytes: raw.size,
    blob,
  };
  const db = await open();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("recovery", "readwrite"),
        store = tx.objectStore("recovery");
      const read = store.getAll();
      read.onsuccess = () => {
        try {
          const existing = read.result as Recovery[];
          record.createdAt = Math.max(record.createdAt, ...existing.map((r) => r.createdAt + 1));
          const keep = retainedRecoveries([...existing, record]);
          store.put(record);
          for (const old of existing) if (!keep.has(old.id)) store.delete(old.id);
        } catch (error) {
          tx.abort();
          reject(error);
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
export async function listRecoveries(): Promise<RecoveryMetadata[]> {
  const db = await open();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction("recovery").objectStore("recovery").getAll();
      request.onsuccess = () =>
        resolve(
          (request.result as Recovery[])
            .map(({ blob: _blob, ...meta }) => meta)
            .sort((a, b) => b.createdAt - a.createdAt)
        );
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}
export async function loadLocal(id?: string): Promise<string> {
  const latest = id ?? (await listRecoveries())[0]?.id;
  if (!latest) return loadLegacy();
  const db = await open();
  try {
    const record = await new Promise<Recovery>((resolve, reject) => {
      const request = db.transaction("recovery").objectStore("recovery").get(latest);
      request.onsuccess = () =>
        request.result ? resolve(request.result) : reject(new Error("Recovery not found"));
      request.onerror = () => reject(request.error);
    });
    const text = await new Response(
      record.blob.stream().pipeThrough(new DecompressionStream("gzip"))
    ).text();
    if (new Blob([text]).size !== record.rawBytes) throw new Error("Recovery size mismatch");
    return text;
  } finally {
    db.close();
  }
}
async function loadLegacy(): Promise<string> {
  const db = await open();
  try {
    return await new Promise<string>((resolve, reject) => {
      const request = db.transaction("checkpoints").objectStore("checkpoints").get("latest");
      request.onsuccess = () =>
        typeof request.result === "string"
          ? resolve(request.result)
          : reject(new Error("No bacterial checkpoint saved"));
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}
