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
  const manual = sorted.filter((r) => r.reason === "manual").slice(0, 2);
  const automatic = sorted.filter((r) => r.reason === "automatic").slice(0, 6);
  const selected = [...manual, ...automatic];
  if (selected.reduce((sum, r) => sum + r.bytes, 0) > RECOVERY_BYTES)
    throw new Error("Recovery storage budget reached; export a checkpoint before continuing");
  return new Set(selected.map((r) => r.id));
}
