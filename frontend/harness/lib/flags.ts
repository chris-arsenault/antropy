export interface Flags {
  readonly values: Map<string, string[]>;
}

export function parseFlags(arguments_: readonly string[]): Flags {
  const values = new Map<string, string[]>();
  for (let index = 0; index < arguments_.length; index++) {
    const argument = arguments_[index];
    if (!argument.startsWith("--")) throw new Error(`unexpected argument: ${argument}`);
    const key = argument.slice(2);
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
  const value = Number.parseInt(flag(flags, key, String(fallback)), 10);
  if (!Number.isFinite(value)) throw new Error(`--${key} must be an integer`);
  return value;
}

export function seedsFlag(flags: Flags, fallback: string): number[] {
  return flag(flags, "seeds", flag(flags, "seed", fallback))
    .split(",")
    .map((value) => Number.parseInt(value, 10));
}
