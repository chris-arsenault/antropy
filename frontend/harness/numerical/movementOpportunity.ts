/** Bounded current-kernel comparison registered in docs/movement-opportunity-study.md. */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { type CellState, type Definition, type Genotype } from "../../src/engine/types";
import { type EngineWorld } from "../../src/engine/client";
import { frozen, install, pulse } from "../lib/engineFixtures";
import { runQuick } from "../lib/quickRun";
import { type QuickScenario } from "../lib/quickScenario";
import { loadEngine } from "./engine";

type Treatment = "resident" | "swimmer" | "lower-drag";
const root = process.argv[2];
const stage = process.argv[3] ?? "probe";
if (!root || !["probe", "contest"].includes(stage))
  throw new Error("Expected a new output directory and optional probe|contest stage");
mkdirSync(root);

function scenario(distance: number, treatment: Treatment): QuickScenario {
  return {
    name: `movement-${distance}-${treatment}`,
    hypothesis: "Travel can repay motor expense when food is away from the starting location",
    specification: {
      registration: "docs/movement-opportunity-study.md",
      distance,
      treatment,
      provisioning: "Ordinary newborn stocks; no target-body assembly",
      limits: "Constructed controller and food patch, no evolved advantage claim",
    },
    target: { x: 16, y: 16, radius: 2 },
    create(engine, seed) {
      const world = engine.create(seed, {
        ...frozen,
        width: 32,
        height: 32,
        founders: 1,
        sourceCount: 0,
        sourceEpochs: null,
        sourceZones: null,
        viscosity: treatment === "lower-drag" ? 0.001 : 0.004,
        illuminationContrast: 0,
        shadeStrength: 0,
      });
      try {
        const genotype = world.command<Genotype>("genotype", { id: 1 });
        pulse(world, [[0, 96]], [16, 16], 2);
        const changes = treatment === "resident" ? { motorGain: 0 } : { swimBiasDelta: 0.3 };
        install(
          world,
          [{ label: treatment, genotype, changes }],
          [{ cell: 1, variant: 0, x: 16 + distance, y: 16, heading: Math.PI * 1.25 }]
        );
        return world;
      } catch (error) {
        world.dispose();
        throw error;
      }
    },
  };
}

function budget(world: EngineWorld) {
  const config = world.command<Definition>("definition").config;
  const [{ cell, mobility }] = world.command<{ cells: { cell: CellState; mobility: number }[] }>(
    "assayFrame"
  ).cells;
  const b = cell.body;
  const upkeep =
    (1 + cell.damage) *
    (b[0] * Number(config.maintenance) +
      b[1] * Number(config.motorMaintenance) +
      b[2] * Number(config.storageMaintenance) +
      b.slice(3).reduce((a, v) => a + v, 0) * Number(config.machineryMaintenance) +
      Number(config.controllerCost));
  const power = b[1] * Number(config.motorPowerDensity) * (1 - cell.damage);
  return {
    body: b,
    inventory: cell.inventory.amounts.reduce((a, v) => a + v, 0),
    capacity: b[2] * Number(config.storageCapacity),
    energy: cell.energy,
    energyCapacity: b[0] * Number(config.energyCapacity),
    maintenancePerSecond: upkeep,
    fullMotorPower: power,
    initialMobility: mobility,
    viscosity: config.viscosity,
    reserveSecondsAtRestWithoutIncomeOrOtherCosts: cell.energy / upkeep,
    reserveSecondsAtFullSwimWithoutIncomeOrOtherCosts: cell.energy / (upkeep + power),
  };
}

function contest(): QuickScenario {
  const base = scenario(8, "swimmer");
  return {
    ...base,
    name: "movement-shared-patch",
    specification: {
      ...base.specification,
      treatment: "Eight residents and eight swimmers, alternating positions on radius-eight ring",
      horizon: 1500,
    },
    create(kernel, seed, swap) {
      const initial = base.create(kernel, seed, false);
      const definition = initial.command<Definition>("definition");
      const genotype = initial.command<Genotype>("genotype", { id: 1 });
      initial.dispose();
      const world = kernel.create(seed, { ...definition.config, founders: 16 });
      try {
        pulse(world, [[0, 96]], [16, 16], 2);
        install(
          world,
          [
            { label: "resident", genotype, changes: { motorGain: 0 } },
            { label: "swimmer", genotype, changes: { swimBiasDelta: 0.3 } },
          ],
          Array.from({ length: 16 }, (_, i) => {
            const angle = (2 * Math.PI * i) / 16;
            return {
              cell: i + 1,
              variant: (i + Number(swap)) % 2,
              x: 16 + 8 * Math.cos(angle),
              y: 16 + 8 * Math.sin(angle),
              heading: angle + Math.PI * 1.25,
            };
          })
        );
        return world;
      } catch (error) {
        world.dispose();
        throw error;
      }
    },
  };
}

const engine = await loadEngine();
if (stage === "contest") {
  for (const swap of [false, true])
    await runQuick(contest(), {
      seed: 701,
      ticks: 1500,
      swap,
      wallSeconds: 120,
      output: join(root, `contest-${Number(swap)}`),
    });
} else {
  await probes();
}

async function probes() {
  const cases = [0, 8].flatMap((distance) =>
    (["resident", "swimmer", "lower-drag"] as const).map((t) => scenario(distance, t))
  );
  const budgets = cases.map((test) => {
    const world = test.create(engine, 701, false);
    try {
      return { name: test.name, ...budget(world) };
    } finally {
      world.dispose();
    }
  });
  writeFileSync(join(root, "budgets.json"), JSON.stringify(budgets), { flag: "wx" });
  console.log(JSON.stringify({ budgets }));
  for (const test of cases)
    await runQuick(test, {
      seed: 701,
      ticks: 300,
      swap: false,
      wallSeconds: 120,
      output: join(root, test.name),
    });
}
