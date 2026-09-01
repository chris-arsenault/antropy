/** Minimal repeatable-flag parser for harness commands. */
export interface Flags {
  values: Map<string, string[]>;
}

export function parseFlags(argv: string[]): Flags {
  const values = new Map<string, string[]>();
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith("--")) {
      throw new Error(`unexpected argument: ${argv[i]}`);
    }
    const key = argv[i].slice(2);
    const hasValue = i + 1 < argv.length && !argv[i + 1].startsWith("--");
    const value = hasValue ? argv[++i] : "true";
    values.set(key, [...(values.get(key) ?? []), value]);
  }
  return { values };
}

export function flag(flags: Flags, key: string, fallback: string): string {
  return flags.values.get(key)?.at(-1) ?? fallback;
}

export function intFlag(flags: Flags, key: string, fallback: number): number {
  return Number(flag(flags, key, String(fallback)));
}

export function seedsOf(flags: Flags, fallback: string): number[] {
  return flag(flags, "seeds", flag(flags, "seed", fallback)).split(",").map(Number);
}
