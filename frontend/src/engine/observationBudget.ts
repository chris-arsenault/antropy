import { type ObservationDelta } from "./observationDelta";

const STATUS_KEYS = new Set([
  "kernelDigest",
  "workerWork",
  "summary",
  "chemicals",
  "running",
  "speed",
  "throughput",
  "recovery",
  "error",
  "memoryBytes",
  "population",
  "regions",
  "spatialEvents",
  "eventsDropped",
]);

/** Fail before structured clone. This is a display budget, never an ecology/population limit. */
export function checkObservationBudget(delta: ObservationDelta) {
  if (delta.status.chemicals && delta.status.chemicals.rows.length > 12)
    throw new Error("Chemical observation exceeds 12 rows");
  if (Object.keys(delta.status).some((key) => !STATUS_KEYS.has(key)))
    throw new Error("Data ownership contract: unsupported status field");
  let remaining = 400000;
  const visit = (value: unknown): void => {
    if (--remaining < 0) throw new Error("Observation display budget exceeded");
    if (value === null) return;
    if (typeof value === "string") remaining -= value.length;
    if (typeof value !== "object") return;
    visitChildren(value, visit);
  };
  visit(delta);
  if (remaining < 0) throw new Error("Observation display budget exceeded");
}

function visitChildren(value: object, visit: (value: unknown) => void) {
  if (Array.isArray(value)) {
    for (const child of value) visit(child);
    return;
  }
  if (Object.getPrototypeOf(value) !== Object.prototype)
    throw new Error("Data ownership contract: observation must not carry memory buffers");
  for (const key in value) visit((value as Record<string, unknown>)[key]);
}
