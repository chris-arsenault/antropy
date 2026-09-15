import { localIdentity } from "../persist/identity";
import { retainedRecoveries, type RecoveryMetadata } from "../persist/recoveryPolicy";

interface Record extends RecoveryMetadata {
  blob: Blob;
}
function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("antropy-chemistry-v11", 1);
    let blocked = false;
    request.onupgradeneeded = () => request.result.createObjectStore("recovery", { keyPath: "id" });
    request.onsuccess = () => {
      if (blocked) request.result.close();
      else resolve(request.result);
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () => {
      blocked = true;
      reject(new Error("Recovery database upgrade blocked by another Antropy tab"));
    };
  });
}
export async function storeRecovery(
  blob: Blob,
  metadata: Pick<RecoveryMetadata, "seed" | "tick" | "runId" | "reason" | "rawBytes">
) {
  const record: Record = {
    ...metadata,
    blob,
    id: localIdentity(),
    createdAt: Date.now(),
    bytes: blob.size,
  };
  const db = await open();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("recovery", "readwrite"),
        store = tx.objectStore("recovery");
      const read = store.getAll();
      read.onsuccess = () => {
        try {
          const existing = read.result as Record[];
          record.createdAt = Math.max(record.createdAt, ...existing.map((r) => r.createdAt + 1));
          const keep = retainedRecoveries([...existing, record]);
          store.put(record);
          existing.filter((r) => !keep.has(r.id)).forEach((r) => store.delete(r.id));
        } catch (error) {
          tx.abort();
          reject(error);
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    return record.id;
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
          (request.result as Record[])
            .map(({ blob: _blob, ...metadata }) => metadata)
            .sort((a, b) => b.createdAt - a.createdAt)
        );
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}
export async function loadRecovery(id?: string): Promise<Blob> {
  const selected = id ?? (await listRecoveries())[0]?.id;
  if (!selected) throw new Error("No numerical-chemistry recovery saved");
  const db = await open();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction("recovery").objectStore("recovery").get(selected);
      request.onsuccess = () =>
        request.result
          ? resolve((request.result as Record).blob)
          : reject(new Error("Recovery not found"));
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}
