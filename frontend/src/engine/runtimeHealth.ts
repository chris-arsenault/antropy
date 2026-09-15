import { type LiveStatus } from "./types";

/** Small local breadcrumbs survive process loss without storing another physical world. */
export interface RuntimeHealth {
  runId: string;
  at: number;
  tick: number;
  state: string;
  error: string | null;
  digest: string;
  agent: string;
  memoryBytes: number;
  population: number;
  ancestors: number;
  genomes: number;
  historySamples: number;
  recovery: string;
  graphics: [number, number] | null;
}
function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("antropy-runtime-health", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("runs", { keyPath: "runId" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function readRuntimeHealth(): Promise<RuntimeHealth[]> {
  const db = await open();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction("runs").objectStore("runs").getAll();
      request.onsuccess = () =>
        resolve((request.result as RuntimeHealth[]).sort((a, b) => b.at - a.at));
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}
async function store(value: RuntimeHealth) {
  const db = await open();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("runs", "readwrite"),
        records = tx.objectStore("runs");
      records.put(value);
      const request = records.getAll();
      request.onsuccess = () => {
        const rows = (request.result as RuntimeHealth[]).sort((a, b) => b.at - a.at);
        rows.slice(8).forEach((row) => records.delete(row.runId));
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
export class HealthRecorder {
  private current: RuntimeHealth | null = null;
  private pending = false;
  private lastWrite = 0;
  observe(runId: string, s: LiveStatus, graphics: [number, number] | null) {
    const state = s.running ? "running" : "paused";
    this.current = {
      runId,
      at: Date.now(),
      tick: s.summary.tick,
      state: s.error ? "fault" : state,
      error: s.error,
      digest: s.kernelDigest,
      agent: navigator.userAgent,
      memoryBytes: s.memoryBytes,
      population: s.summary.population,
      ancestors: s.summary.ancestryRecords,
      genomes: s.summary.genomes,
      historySamples: s.history.length,
      recovery: s.recovery,
      graphics,
    };
    this.flush(!s.running);
  }
  fault(error: unknown) {
    if (!this.current) return;
    this.current = {
      ...this.current,
      at: Date.now(),
      state: "fault",
      error: String(error).slice(0, 2048),
    };
    this.flush(true);
  }
  private flush(force = false) {
    if (!this.current || this.pending || (!force && Date.now() - this.lastWrite < 5000)) return;
    const current = this.current;
    this.pending = true;
    this.lastWrite = Date.now();
    // Breadcrumb failure cannot recursively break reporting or pause a healthy simulation.
    store(current)
      .catch(() => {})
      .finally(() => {
        this.pending = false;
        if (this.current !== current && this.current?.state === "fault") this.flush(true);
      });
  }
}
