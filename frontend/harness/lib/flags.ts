export interface Flags {
  readonly values: Map<string, string[]>;
}
const RETIRED = new Set([
  "weathering-period",
  "chemical-resolution",
  "resolution",
  "regime",
  "cycle",
  "light",
  "light-supply",
  "light-radius",
  "crowding",
  "toxin-types",
  "contact-damage",
  "prey-yield",
  "sharing-rate",
  "secretion-rate",
  "autotroph-photo",
  "autotroph-core",
  "toxin-effort",
  "producer-weapon",
  "resistant-defense",
  "defense-strength",
  "immunity-strength",
  "toxin-k",
  "toxin-decay",
  "toxin-diffusion",
  "matrix",
  "initial-nutrient",
  "specialist-a",
  "specialist-b",
]);

export function parseFlags(arguments_: readonly string[]): Flags {
  const values = new Map<string, string[]>();
  for (let index = 0; index < arguments_.length; index++) {
    const argument = arguments_[index];
    if (!argument.startsWith("--")) throw new Error(`unexpected argument: ${argument}`);
    const key = argument.slice(2);
    if (RETIRED.has(key))
      throw new Error(`Retired chemical option --${key}; see docs/design/chemistry/migration.md`);
    const next = arguments_[index + 1];
    const hasValue = next !== undefined && !next.startsWith("--");
    const value = hasValue ? arguments_[++index] : "true";
    values.set(key, [...(values.get(key) ?? []), value]);
  }
  return { values };
}

export function flag(flags: Flags, key: string, fallback: string): string {
  return flags.values.get(key)?.at(-1) ?? fallback;
}

export function integerFlag(flags: Flags, key: string, fallback: number): number {
  const value = Number(flag(flags, key, String(fallback)));
  if (!Number.isSafeInteger(value)) throw new Error(`--${key} must be an integer`);
  return value;
}

export function assertKnownFlags(flags: Flags, allowed: readonly string[]) {
  for (const key of flags.values.keys())
    if (!allowed.includes(key)) throw new Error(`Unknown option --${key}`);
}

export function wallSecondsFlag(flags: Flags, fallback: number): number {
  const legacy = integerFlag(flags, "wall", fallback);
  const seconds = integerFlag(flags, "wall-seconds", legacy);
  if (flags.values.has("wall") && legacy !== seconds)
    throw new Error("Conflicting --wall and --wall-seconds budgets");
  if (seconds <= 0) throw new Error("--wall-seconds must be positive");
  return seconds;
}

export function seedsFlag(flags: Flags, fallback: string): number[] {
  return flag(flags, "seeds", flag(flags, "seed", fallback))
    .split(",")
    .map((value) => {
      const seed = Number(value);
      if (!value.trim() || !Number.isSafeInteger(seed) || seed < 0 || seed > 4294967295)
        throw new Error("Seeds must be integers from 0 through 4294967295");
      return seed;
    });
}
