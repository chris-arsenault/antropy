import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createWorld } from "../../src/sim/world";
import { type World } from "../../src/sim/types";
import { DEFAULT_CONFIG, type Config } from "../../src/sim/config";
import { type Genome, controller } from "../../src/sim/controller";
import { constantEfforts, travelGenome } from "../../src/sim/controller/diagnostics";
import { seedGenotype } from "../../src/sim/genetics/genotype";
import { heldEnergy, heldMaterial } from "../../src/sim/accounting";
import { checkpointToJson } from "../../src/persist/checkpoint";
import { measure, sourceDigest } from "./bacteriaRun";
import { openLedger, recordRun } from "./ledger";

interface Case {
  label: string;
  mechanism: string;
  setup: (world: World) => void;
  config?: Partial<Config>;
}
function install(world: World, id: number, behavior: Genome, genes: Record<number, number>): void {
  const base = seedGenotype(world.config),
    physical = base.chromosomes[0].physical;
  for (const [index, value] of Object.entries(genes)) physical[Number(index)] = value;
  const genome = { chromosomes: [{ behavior, physical }] };
  world.genomes.set(id, { id, genome, parent: null, born: 0, learned: 0 });
  world.nextGenome = Math.max(world.nextGenome, id + 1);
}
function assign(world: World, ids: number[]): void {
  world.cells.forEach((cell, i) => {
    cell.genome = ids[i % ids.length];
    world.ancestry.get(cell.id)!.genome = cell.genome;
  });
}
function food(world: World, a: number, b: number): void {
  world.nutrient.fill(a);
  world.nutrientB.fill(b);
}
function pathwayCases(): Case[] {
  return ["A", "B"].flatMap((substrate) =>
    ["A", "B", "generalist"].map((specialist) => ({
      label: `${specialist} processing on ${substrate}`,
      mechanism: "substrate specialization",
      config: { transporterRatio: 0.06, transportBRatio: 0.06 },
      setup: (w: World) => {
        food(w, substrate === "A" ? 0.6 : 0, substrate === "B" ? 0.6 : 0);
        const a = ({ generalist: 1, A: 5 / 3, B: 1 / 3 } as Record<string, number>)[specialist];
        install(w, 1, constantEfforts({}), { 2: Math.log(a), 4: Math.log(2 - a) });
        assign(w, [1]);
      },
    }))
  );
}
function defenseCases(): Case[] {
  return [false, true].flatMap((exposure) =>
    [false, true].map((defense) => ({
      label: `${defense ? "high" : "low"} defense; toxin ${exposure}`,
      mechanism: "defense cost and benefit",
      config: { toxinDecay: 0 },
      setup: (w: World) => {
        food(w, 0.5, 0.5);
        if (exposure) w.toxin.fill(0.05);
        install(w, 1, constantEfforts({}), { 5: Math.log(defense ? 4 : 0.2) });
        assign(w, [1]);
      },
    }))
  );
}
function matrixCases(): Case[] {
  return [false, true].flatMap((exposure) =>
    [false, true].map((build) => ({
      label: `${build ? "builder" : "nonbuilder"}; toxin ${exposure}`,
      mechanism: "matrix protection and expense",
      config: { toxinDecay: 0 },
      setup: (w: World) => {
        food(w, 0.5, 0.5);
        if (exposure) w.toxin.fill(0.05);
        install(w, 1, constantEfforts({ matrix: build ? 0.8 : 0 }), {});
        assign(w, [1]);
      },
    }))
  );
}
function attackCases(): Case[] {
  return [false, true].map((resistant) => ({
    label: `producer versus ${resistant ? "resistant" : "susceptible"} nonproducer`,
    mechanism: "direct interference",
    setup: (w: World) => {
      food(w, 0.5, 0.5);
      install(w, 1, constantEfforts({ toxin: 0.8 }), { 5: Math.log(4) });
      install(w, 2, constantEfforts({}), { 5: Math.log(resistant ? 4 : 0.2) });
      assign(w, [1, 2]);
    },
  }));
}
function travelCases(): Case[] {
  return [false, true].flatMap((distant) =>
    ["fast", "slow"].map((speed) => ({
      label: `${speed} movement; ${distant ? "distant pulse" : "local food"}`,
      mechanism: "movement opportunity cost",
      config: { founders: 1, thermalEnergy: 0, sourceCount: 1 },
      setup: (w: World) => {
        food(w, distant ? 0 : 0.4, 0);
        Object.assign(w.cells[0], { x: 3, y: 8, heading: 0 });
        Object.assign(w.sources[0], {
          x: 12,
          y: 8,
          radius: 1,
          foodA: distant ? 25 : 0,
          foodB: 0,
          remaining: distant ? 20 : 0,
          rate: 1.25,
          wait: 1e9,
        });
        // No replacement pulse during the declared assay.
        w.config.sourceRate = 0;
        w.config.sourceGap = 1e9;
        install(w, 1, travelGenome(speed as "fast" | "slow"), {});
        assign(w, [1]);
      },
    }))
  );
}
export function runEcologyAssays(
  seeds: number[],
  ticks: number,
  output: string,
  mechanism = "all"
): void {
  mkdirSync(output, { recursive: true });
  const cases = [
    ...pathwayCases(),
    ...defenseCases(),
    ...matrixCases(),
    ...attackCases(),
    ...travelCases(),
  ].filter((test) => mechanism === "all" || test.mechanism.startsWith(mechanism));
  if (!cases.length) throw new Error("Unknown causal mechanism");
  for (const seed of seeds)
    for (const test of cases) {
      runCase(test, seed, ticks, output);
    }
}
function runCase(test: Case, seed: number, ticks: number, output: string): void {
  const world = createWorld(seed, {
    ...DEFAULT_CONFIG,
    width: 16,
    height: 16,
    founders: 8,
    sourceCount: 0,
    initialNutrient: 0,
    mutationRate: 0,
    physicalMutationRate: 0,
    learning: "static",
    learningRetention: 0,
    ...test.config,
  });
  test.setup(world);
  world.ledger.initial = heldEnergy(world);
  world.ledger.initialMaterial = heldMaterial(world);
  const start = checkpointToJson(world),
    digest = sourceDigest();
  const result = measure(world, ticks, 100, { spatial: false });
  const params = {
    mechanism: test.mechanism,
    config: world.config,
    initialCheckpoint: start,
    sourceDigest: digest,
    sourceDigestAfter: sourceDigest(),
    stoppingTick: ticks,
  };
  const db = openLedger();
  const id = recordRun(db, {
    experiment: "ecology-causal",
    label: test.label,
    driver: controller.id,
    seed,
    ticks: world.tick,
    params,
    summary: {
      ...result.final,
      maxResidual: result.maxResidual,
      maxMaterialResidual: result.maxMaterialResidual,
    },
    wallMs: result.wallMs,
  });
  db.close();
  writeFileSync(
    join(output, `assay-${id}.json`),
    JSON.stringify({ id, label: test.label, ...params, ...result }, null, 2)
  );
  console.log(
    JSON.stringify({
      id,
      label: test.label,
      population: world.cells.length,
      divisions: world.ledger.divisions,
      damageDeaths: world.ledger.damageDeaths,
      genomes: result.final.genomes,
    })
  );
}
