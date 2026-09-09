import { type Checkpoint2D } from "./checkpoint";

const DB_NAME = "antropy-2d";
const STORE_NAME = "checkpoints";

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
  });
}

export async function saveCheckpoint(checkpoint: Checkpoint2D): Promise<void> {
  const database = await openDatabase();
  try {
    const request = database
      .transaction(STORE_NAME, "readwrite")
      .objectStore(STORE_NAME)
      .put(checkpoint, "latest");
    await requestResult(request);
  } finally {
    database.close();
  }
}

export async function loadCheckpoint(): Promise<Checkpoint2D | null> {
  const database = await openDatabase();
  try {
    const request = database
      .transaction(STORE_NAME, "readonly")
      .objectStore(STORE_NAME)
      .get("latest");
    return (await requestResult<Checkpoint2D | undefined>(request)) ?? null;
  } finally {
    database.close();
  }
}
