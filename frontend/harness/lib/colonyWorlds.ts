import { type SimConfig } from "../../src/sim/config";
import { snapshotConfig } from "../../src/sim/configValidation";
import { validateGeneration } from "../../src/sim/generationValidation";

export interface ColonyWorldCase {
  /** Float32-exact training identity, independent of the food/random seed. */
  readonly id: number;
  readonly label: string;
  readonly seed: number;
  readonly config: SimConfig;
}

export function validateWorldCases(cases: readonly ColonyWorldCase[]): readonly ColonyWorldCase[] {
  if (!Array.isArray(cases) || cases.length === 0) throw new Error("world cases must be nonempty");
  const identities = new Set<number>();
  return cases.map((entry) => {
    if (!Number.isSafeInteger(entry.id) || entry.id < 0 || entry.id > 0xff_ffff)
      throw new Error("world identity must be a Float32-exact nonnegative integer");
    if (identities.has(entry.id)) throw new Error("duplicate world identity");
    if (!Number.isSafeInteger(entry.seed) || entry.seed < 0 || entry.seed > 0xffff_ffff)
      throw new Error("invalid world random seed");
    if (typeof entry.label !== "string" || !entry.label) throw new Error("missing world label");
    identities.add(entry.id);
    const config = snapshotConfig(entry.config);
    validateGeneration(config);
    return { ...entry, config };
  });
}
