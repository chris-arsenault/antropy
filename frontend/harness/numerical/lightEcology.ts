/** Six bounded probes registered in docs/plans/LIGHT-ECOLOGY-PLAN.md, M4 execution. */
import { mkdirSync } from "node:fs";
import { runQuick } from "../lib/quickRun";
import { type QuickScenario } from "../lib/quickScenario";
import { chemicalContext } from "../lib/chemicalGenotypes";
import { frozen, install } from "../lib/engineFixtures";
import { type EngineConfig, type Genotype } from "../../src/engine/types";
import { type EngineWorld } from "../../src/engine/client";

const output = process.argv[2];
const followup = process.argv[3] === "followup";
if (!output) throw new Error("Expected new output directory");
mkdirSync(output);

function logits(swim: number, cover: number, emission: number): number[] {
  const ports = Array<number>(42).fill(0);
  ports[0] = swim;
  ports[4] = -1;
  ports.fill(3, 9, 39);
  ports[40] = cover;
  ports[41] = emission;
  return ports;
}

function variant(world: EngineWorld, template: Genotype, name: string, i: number) {
  const genotype = structuredClone(template);
  const steering = name.startsWith("shade") || i === 1;
  const gain = name === "shade-away" ? -16 : 16;
  const emission = i === 0 && name.startsWith("lamp-on") ? 3 : 0;
  const behavior = world.command<Genotype["chromosomes"][number]["behavior"]>(
    "diagnosticController",
    {
      logits: logits(steering ? 0.08 : 0, name.endsWith("builder") ? 3 : 0, emission),
      response: steering ? [42, 1, gain] : null,
    }
  );
  for (const chromosome of genotype.chromosomes) {
    if (name.startsWith("strong")) chromosome.physical[20] = 3;
    chromosome.behavior = behavior;
  }
  return { label: `${name}-${i}`, genotype };
}

function placement(name: string, i: number) {
  const position = { cell: i + 1, variant: i, x: 12, y: 12, heading: 0 };
  if (name.startsWith("shade")) return { ...position, x: 7.4, y: 9.2 };
  if (i === 1) return { ...position, x: 8, y: followup ? 10 : 12 };
  return position;
}

const cases = followup
  ? ["strong-builder", "strong-idle", "lamp-on-offset", "lamp-off-offset"]
  : ["shade-toward", "shade-away", "builder", "idle", "lamp-on", "lamp-off"];
for (const name of cases) {
  const lamp = name.startsWith("lamp");
  const moving = name.startsWith("shade");
  const config: Partial<EngineConfig> = {
    ...frozen,
    width: 24,
    height: 24,
    founders: lamp ? 2 : 1,
    sourceCount: 0,
    illuminationContrast: 0,
    shadeStrength: moving ? 0.8 : 0,
    divisionWorkPerCore: 100,
  };
  const scenario: QuickScenario = {
    name: `light-ecology-${name}`,
    hypothesis:
      "Local optical cues can change paid actions; material cover and emitted work have explicit costs.",
    specification: { registration: "docs/plans/LIGHT-ECOLOGY-PLAN.md#m4-execution", name, config },
    target: { x: 12, y: 12, radius: 1 },
    create(engine, seed) {
      const world = engine.create(seed, config);
      const template = chemicalContext(engine, config).genotype;
      const variants = Array.from({ length: lamp ? 2 : 1 }, (_, i) =>
        variant(world, template, name, i)
      );
      install(
        world,
        variants,
        variants.map((_, i) => placement(name, i)),
        true
      );
      return world;
    },
  };
  await runQuick(scenario, {
    seed: 27,
    ticks: 300,
    swap: false,
    wallSeconds: 30,
    output: `${output}/${name}`,
  });
}
