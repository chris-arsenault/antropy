import { loadEngine } from "../numerical/engine";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { capabilityScreens } from "./capabilityCases";
import { capabilityScenario } from "./capabilityFixture";
import { rpsScenario, rpsSettings } from "./rpsContest";
import { parseFlags } from "./flags";
import { type QuickScenario } from "./quickScenario";
import { runQuick } from "./quickRun";

/** Monocultures isolate allocation/compatibility costs; contact contests preserve local interference. */
export async function runEcologyAssays(
  seeds: number[],
  ticks: number,
  output: string,
  mechanism = "all"
): Promise<void> {
  const engine = await loadEngine();
  const monocultures = capabilityScreens(engine).flatMap((test) =>
    test.variants.map((variant, i) =>
      capabilityScenario({ ...test, key: `${test.key}-variant${i}`, variants: [variant] })
    )
  );
  const settings = rpsSettings(parseFlags([]), engine);
  const attack = [false, true].map((compatible) =>
    rpsScenario(
      `interference-${compatible ? "compatible" : "distant"}`,
      ["producer", compatible ? "resistant" : "sensitive"],
      settings
    )
  );
  const cases: QuickScenario[] = [...monocultures, ...attack];
  const selected = cases.filter((test) => mechanism === "all" || test.name.startsWith(mechanism));
  if (!selected.length)
    throw new Error(
      "Unknown or retired mechanism. Use processing, compatibility, detoxification, propulsion, motor, recurrence or interference; barrier probes use chemical-opportunities."
    );
  mkdirSync(output, { recursive: true });
  for (const seed of seeds)
    for (const scenario of selected)
      await runQuick(scenario, {
        seed,
        ticks,
        wallSeconds: 120,
        swap: false,
        output: join(output, `${scenario.name}-${seed}`),
      });
}
