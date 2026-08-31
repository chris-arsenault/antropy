import { type Checkpoint } from "./checkpoint";

const DB_NAME = "antropy";
const STORE = "checkpoints";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

/** Store a checkpoint under a name (typed arrays clone natively). */
export async function saveCheckpoint(name: string, checkpoint: Checkpoint): Promise<void> {
  const db = await openDb();
  try {
    await requestToPromise(
      db.transaction(STORE, "readwrite").objectStore(STORE).put(checkpoint, name)
    );
  } finally {
    db.close();
  }
}

export async function loadCheckpoint(name: string): Promise<Checkpoint | null> {
  const db = await openDb();
  try {
    const result = await requestToPromise<Checkpoint | undefined>(
      db.transaction(STORE, "readonly").objectStore(STORE).get(name)
    );
    return result ?? null;
  } finally {
    db.close();
  }
}
