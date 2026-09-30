/** Eight short paired probes registered in TERRAIN-AND-SEASONS-PLAN.md. No seed search. */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { frozen, install, pulse } from "../lib/engineFixtures";
import { runQuick } from "../lib/quickRun";
import { type QuickScenario } from "../lib/quickScenario";
import { type Definition, type Genotype } from "../../src/engine/types";
import { MOTOR_LOAD_INPUT } from "../../src/engine/controllerInputs";

type Question = "travel" | "feedback" | "shade" | "seasons";
const root = process.argv[2];
if (!root) throw new Error("Expected a new output directory");
mkdirSync(root);

function configuration(question: Question, enabled: boolean) {
  const seasonal = question === "seasons";
  const moving = question === "travel" || question === "feedback";
  return {
    preset: "diagnostic",
    ...frozen,
    width: 64,
    height: 48,
    founders: 1,
    sourceCount: seasonal ? 1 : 0,
    sourceLifetime: 2,
    sourceGap: 6,
    sourceDrift: 0,
    illuminationContrast: 0,
    shadeStrength: question === "shade" ? 1 : 0,
    terrain: {
      movement: moving && (question === "feedback" || enabled),
      feedback: true,
      minimumConductance: 0.25,
      transmission: question !== "shade" || enabled,
      seasons: seasonal && enabled,
      seasonAmplitude: 1,
      seasonPeriod: 8,
    },
  };
}

function scenario(question: Question, enabled: boolean): QuickScenario {
  return {
    name: `terrain-${question}-${Number(enabled)}`,
    hypothesis:
      "Local physical exposure changes measured access, paid effort or supply; feedback can express a response",
    specification: {
      registration: "docs/plans/TERRAIN-AND-SEASONS-PLAN.md",
      question,
      enabled,
      mutation: "frozen",
      learning: "static",
      horizon: 300,
      seed: 701,
      limits: "Constructed opportunity, no evolved advantage or default-season persistence claim",
    },
    target: { x: 20, y: 16, radius: 2 },
    create(engine, seed) {
      const seasonal = question === "seasons";
      const moving = question === "travel" || question === "feedback";
      const world = engine.create(seed, configuration(question, enabled));
      try {
        const g = world.command<Genotype>("genotype", { id: 1 });
        const logits = [moving ? 0.6 : 0, 0, 0.5, 1, 1, 1, 1, 0, 0];
        const behavior = world.command<Genotype["chromosomes"][number]["behavior"]>(
          "diagnosticController",
          {
            logits,
            response: question === "feedback" && enabled ? [MOTOR_LOAD_INPUT, 1, 4] : null,
          }
        );
        for (const chromosome of g.chromosomes) chromosome.behavior = behavior;
        const definition = world.command<Definition>("definition");
        const position = seasonal ? definition.sources[0] : { x: 16, y: 16 };
        install(
          world,
          [{ label: question, genotype: g }],
          [{ cell: 1, variant: 0, x: position.x, y: position.y, heading: 0 }]
        );
        if (!seasonal)
          pulse(
            world,
            [
              [0, 24],
              [136, 24],
            ],
            [20, 16],
            3
          );
        return world;
      } catch (error) {
        world.dispose();
        throw error;
      }
    },
  };
}

for (const question of ["travel", "feedback", "shade", "seasons"] as const) {
  if (process.argv[3] && process.argv[3] !== question) continue;
  for (const enabled of [false, true]) {
    const test = scenario(question, enabled);
    await runQuick(test, {
      seed: 701,
      ticks: 300,
      swap: false,
      wallSeconds: 120,
      output: join(root, test.name),
    });
  }
}
