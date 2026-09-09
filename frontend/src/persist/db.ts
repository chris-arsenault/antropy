function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("antropy-bacteria", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("checkpoints");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function saveLocal(text: string): Promise<void> {
  const db = await open();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("checkpoints", "readwrite");
      tx.objectStore("checkpoints").put(text, "latest");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
export async function loadLocal(): Promise<string> {
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
