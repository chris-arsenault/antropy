import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { flag, type Flags } from "./flags";
import { foodAccess } from "./foodAccess";
import { runQuick, validateQuickOptions } from "./quickRun";

export function runQuickPanel(flags: Flags): void {
  const stage = flag(flags, "stage", "probe");
  if (!["probe", "contest"].includes(stage)) throw new Error("Stage must be probe or contest");
  const options = {
    output: flag(flags, "output", `harness/artifacts/quick-food-access-${stage}`),
    seed: Number(flag(flags, "seed", "701")),
    ticks: Number(flag(flags, "ticks", stage === "probe" ? "300" : "3000")),
    wallSeconds: 120,
    swap: false,
  };
  validateQuickOptions(options);
  mkdirSync(options.output, { recursive: true });
  for (const context of ["persistent", "brief"] as const) {
    const scenario = foodAccess(context);
    const cases =
      stage === "probe"
        ? ["fast", "slow"].map((probe) => ({
            probe: probe as "fast" | "slow",
            swap: false,
            label: probe,
          }))
        : [false, true].map((swap) => ({ swap, label: String(swap) }));
    for (const test of cases)
      runQuick(scenario, {
        ...options,
        ...test,
        output: join(options.output, `${context}-${test.label}`),
      });
  }
}
