import { readdirSync, statSync, statfsSync } from "node:fs";
import { join } from "node:path";
import { type Engine } from "../../src/engine/client";
import { type Summary } from "../../src/engine/types";

const GiB = 1024 ** 3;
export const studyLimits = {
  rss: 3 * GiB,
  wasm: 1.5 * GiB,
  caseBytes: GiB,
  studyBytes: 11 * GiB,
  freeBytes: 20 * GiB,
  exportReserve: GiB,
};
export function directoryBytes(path: string): number {
  return readdirSync(path, { withFileTypes: true }).reduce(
    (total, entry) =>
      total +
      (entry.isDirectory()
        ? directoryBytes(join(path, entry.name))
        : statSync(join(path, entry.name)).size),
    0
  );
}
export function resourceSample(engine: Engine, directory: string, study: string) {
  const disk = statfsSync(study);
  return {
    rss: process.memoryUsage().rss,
    wasm: engine.memoryBytes,
    caseBytes: directoryBytes(directory),
    studyBytes: directoryBytes(study),
    freeBytes: disk.bavail * disk.bsize,
  };
}
export function resourceStop(sample: ReturnType<typeof resourceSample>): string | null {
  for (const key of ["rss", "wasm", "caseBytes", "studyBytes"] as const)
    if (sample[key] >= studyLimits[key]) return `resource limit: ${key}`;
  return sample.freeBytes < studyLimits.freeBytes ? "resource limit: free disk" : null;
}
export function studyGuard(engine: Engine, directory: string, study: string, deadline: number) {
  let nextCheck = 0;
  return () => {
    const now = Date.now();
    if (now >= deadline) return "study wall cap";
    if (now < nextCheck) return null;
    nextCheck = now + 1000;
    return resourceStop(resourceSample(engine, directory, study));
  };
}
export function validateAccounts(s: Summary) {
  const scalars = [
    s.heldMaterial,
    s.heldEnergy,
    s.cellEnergy,
    s.biomass,
    s.materialResidual,
    s.energyResidual,
    ...Object.entries(s.ledger)
      .filter(([k]) => k !== "flows")
      .map(([, v]) => v),
    ...Object.values(s.ledger.flows),
  ];
  if (scalars.some((v) => typeof v !== "number" || !Number.isFinite(v)))
    throw new Error("Nonfinite sampled physical account");
  const energy = Math.max(1, s.ledger.initialEnergy + s.ledger.suppliedEnergy);
  const material = Math.max(1, s.ledger.initialMaterial + s.ledger.supplied);
  if (Math.abs(s.energyResidual) > energy * 1e-7 || Math.abs(s.materialResidual) > material * 1e-7)
    throw new Error("Sampled material/work account residual exceeds 1e-7 relative tolerance");
}
