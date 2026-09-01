import * as tunables from "../../src/sim/tunables";

/**
 * Boutique parameter patching for harness runs: dotted paths into the
 * tunable tables ("COLONY.stockpileSatiation=8", "DIG.cost.topsoil=0.01"),
 * applied before a run and restored after. `as const` is type-level only,
 * so the runtime objects accept writes; production code never patches.
 */
type Table = Record<string, unknown>;

const TABLES = tunables as unknown as Record<string, Table>;

export interface AppliedPatch {
  spec: string;
  restore: () => void;
}

function resolve(pathParts: string[]): { holder: Table; key: string } {
  const [tableName, ...rest] = pathParts;
  const table = TABLES[tableName];
  if (typeof table !== "object" || table === null) {
    throw new Error(`unknown tunable table: ${tableName}`);
  }
  let holder: Table = table;
  for (const part of rest.slice(0, -1)) {
    const next = holder[part];
    if (typeof next !== "object" || next === null) {
      throw new Error(`unknown tunable path: ${pathParts.join(".")}`);
    }
    holder = next as Table;
  }
  const key = rest[rest.length - 1];
  if (!(key in holder)) {
    throw new Error(`unknown tunable key: ${pathParts.join(".")}`);
  }
  return { holder, key };
}

/** Apply "TABLE.key[.subkey]=value" specs; returns a restore function. */
export function applyPatches(specs: string[]): () => void {
  const applied: AppliedPatch[] = [];
  for (const spec of specs) {
    const eq = spec.indexOf("=");
    if (eq < 0) {
      throw new Error(`patch must be path=value: ${spec}`);
    }
    const pathParts = spec.slice(0, eq).split(".");
    const value = Number(spec.slice(eq + 1));
    if (Number.isNaN(value)) {
      throw new Error(`patch value must be numeric: ${spec}`);
    }
    const { holder, key } = resolve(pathParts);
    const prior = holder[key];
    holder[key] = value;
    applied.push({ spec, restore: () => (holder[key] = prior) });
  }
  return () => {
    for (const patch of applied.reverse()) {
      patch.restore();
    }
  };
}
