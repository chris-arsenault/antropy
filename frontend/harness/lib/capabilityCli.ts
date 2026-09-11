import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { type Flags, flag } from "./flags";
import { capabilityScreens } from "./capabilityCases";
import { capabilityScenario } from "./capabilityFixture";
import { runQuick } from "./quickRun";
import { capabilityFollowups } from "./capabilityFollowups";

function checkBudget(root: string, output: string): void {
  if (existsSync(output)) throw new Error(`Evidence exists: ${output}`);
  if (readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory()).length >= 48)
    throw new Error("48-case capability budget exhausted");
}

function selectCases(flags: Flags) {
  const stage = flag(flags, "stage", "screen");
  if (stage !== "screen" && stage !== "followup") throw new Error(`Unknown stage: ${stage}`);
  const cases = stage === "followup" ? capabilityFollowups() : capabilityScreens();
  const selected = flag(flags, "case", "list");
  if (selected === "list" || selected === "screen") return cases;
  const names = selected.split(",");
  const missing = names.filter((name) => !cases.some((c) => c.key === name));
  if (missing.length) throw new Error(`Unknown capability cases: ${missing.join(", ")}`);
  return cases.filter((c) => names.includes(c.key));
}

export function runCapabilities(flags: Flags): void {
  const root = flag(flags, "output", "harness/artifacts/capabilities-2026-09-11");
  const tests = selectCases(flags);
  if (flag(flags, "case", "list") === "list") {
    console.log(tests.map((c) => `${c.key}: ${c.hypothesis}`).join("\n"));
    return;
  }
  mkdirSync(root, { recursive: true });
  for (const test of tests)
    for (const swap of [false, true]) {
      const output = join(root, `${test.key}-${swap}`);
      checkBudget(root, output);
      runQuick(capabilityScenario(test), {
        seed: Number(flag(flags, "seed", "701")),
        ticks: Number(flag(flags, "ticks", "1500")),
        wallSeconds: 120,
        swap,
        output,
      });
    }
}
