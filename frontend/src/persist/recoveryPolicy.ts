export interface RecoveryMetadata {
  id: string;
  runId: string;
  tick: number;
  seed: number;
  createdAt: number;
  reason: "manual" | "automatic";
  bytes: number;
  rawBytes: number;
}
export const RECOVERY_BYTES = 256 * 1024 * 1024;
export const CHECKPOINT_BYTES = 192 * 1024 * 1024;

/** Retention applies only to the new recovery store; the older manual-save store is untouched. */
export function retainedRecoveries(records: RecoveryMetadata[]): Set<string> {
  const sorted = [...records].sort((a, b) => b.createdAt - a.createdAt || b.id.localeCompare(a.id));
  const newest = sorted[0];
  if (!newest) return new Set();
  if (newest.bytes > RECOVERY_BYTES)
    throw new Error("Newest recovery exceeds the 256 MiB storage budget");
  const manual = sorted.filter((r) => r.reason === "manual").slice(0, 2);
  const automatic = sorted.filter((r) => r.reason === "automatic").slice(0, 6);
  // Always keep the latest state, then prefer manual points over older automatic saves.
  const keep = new Set<string>();
  let bytes = 0;
  for (const record of [newest, ...manual, ...automatic]) {
    if (keep.has(record.id) || bytes + record.bytes > RECOVERY_BYTES) continue;
    keep.add(record.id);
    bytes += record.bytes;
  }
  return keep;
}
