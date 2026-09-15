import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { type Genotype } from "../../src/engine/types";
import { spatialProbe } from "./spatialProbes";
import { assignPopulation } from "./engineFixtures";
import { type QuickScenario } from "./quickScenario";
import { runQuick } from "./quickRun";
import { flag, integerFlag, type Flags } from "./flags";
import { viabilityPatch } from "./viabilityPatch";

const CASES = [
  "resident",
  "retain",
  "empty",
  "empty-retain",
  "moving-retain",
  "ordinary",
  "patch-first",
  "patch-second",
  "group-first",
  "group-second",
  "compatible-first",
  "compatible-second",
] as const;
type ViabilityCase = (typeof CASES)[number];
export function viabilityProbe(name: ViabilityCase): QuickScenario {
  if (name.startsWith("compatible")) return viabilityPatch(name.endsWith("second"), 4, true);
  if (name.startsWith("patch") || name.startsWith("group"))
    return viabilityPatch(name.endsWith("second"), name.startsWith("group") ? 4 : 1);
  const empty = name.startsWith("empty"),
    retain = name.includes("retain"),
    moving = name.startsWith("moving") || name === "ordinary";
  const base = spatialProbe(empty ? "empty" : "resident");
  return {
    ...base,
    name: `viability-${name}`,
    hypothesis:
      "Product retention can preserve biomass feedstock; compare export with retention at equal uptake and motor settings.",
    specification: {
      ...base.specification,
      stationary: !moving,
      exportDisabled: retain,
      stop: "300/1500/3000 ticks, terminal state, or 30 seconds",
    },
    create(engine, seed, swap) {
      const world = base.create(engine, seed, swap),
        genotype = world.command<Genotype>("genotype", { id: 2 });
      try {
        assignPopulation(
          world,
          [
            {
              label: name,
              genotype,
              changes: {
                motorGain: moving ? 1 : 0,
                ...(name === "ordinary"
                  ? {}
                  : {
                      transport: [0.9, 0.9, retain ? 0 : 0.9, retain ? 0 : 0.9] as [
                        number,
                        number,
                        number,
                        number,
                      ],
                    }),
              },
            },
          ],
          () => 0
        );
      } catch (error) {
        world.dispose();
        throw error;
      }
      return world;
    },
  };
}
export async function runViability(flags: Flags): Promise<void> {
  const selected = flag(flags, "case", "list");
  if (selected === "list") {
    console.log(CASES.join("\n"));
    return;
  }
  const names = selected.split(",");
  if (names.some((n) => !CASES.includes(n as ViabilityCase)))
    throw new Error("Unknown viability case");
  const ticks = integerFlag(flags, "ticks", 300);
  if (![300, 1500, 3000].includes(ticks)) throw new Error("Unregistered viability horizon");
  const output = flag(flags, "output", "harness/artifacts/viability");
  mkdirSync(output, { recursive: true });
  for (const name of names)
    await runQuick(viabilityProbe(name as ViabilityCase), {
      seed: 101,
      ticks,
      swap: false,
      wallSeconds: 30,
      output: join(output, name),
    });
}
