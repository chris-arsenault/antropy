/** Registered in docs/photoreception.md; ordinary World and existing bounded trace runner. */
import { mkdirSync } from "node:fs";
import { runQuick } from "../lib/quickRun";
import { type QuickScenario } from "../lib/quickScenario";
import { chemicalContext } from "../lib/chemicalGenotypes";
import { frozen, install } from "../lib/engineFixtures";
import { type EngineConfig } from "../../src/engine/types";

const output = process.argv[2];
if (!output) throw new Error("Expected new output directory");
mkdirSync(output);
for (const [name, stock, gain, contrast] of [
  ["toward", 0, 16, 0.8],
  ["away", 0, -16, 0.8],
  ["unbuilt", -1, 16, 0.8],
  ["uniform", 0, 16, 0],
] as const) {
  const config: Partial<EngineConfig> = {
    ...frozen,
    width: 24,
    height: 24,
    founders: 1,
    sourceCount: 0,
    illuminationContrast: contrast,
    divisionWorkPerCore: 100,
  };
  const scenario: QuickScenario = {
    name: `photoreception-${name}`,
    hypothesis:
      "Local light differences can steer an ordinary RNN; unbuilt and uniform controls have no directional cue.",
    specification: { registration: "docs/photoreception.md", stock, gain, config },
    target: { x: 7.4, y: 9.2, radius: 1 },
    create(engine, seed) {
      const world = engine.create(seed, config);
      const genotype = chemicalContext(engine, config).genotype;
      for (const c of genotype.chromosomes) {
        c.physical[15] = stock;
        c.behavior = world.command("diagnosticController", {
          logits: [0.08, 0, 0, 0, -1, 0, 0, 0, 0],
          response: [42, 1, gain],
        });
      }
      install(
        world,
        [{ label: name, genotype }],
        [{ cell: 1, variant: 0, x: 7.4, y: 9.2, heading: 0 }],
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
