import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { type Definition, type Genotype, type Summary } from "../../src/engine/types";
import { frozen, install } from "../lib/engineFixtures";
import { runQuick } from "../lib/quickRun";
import { type QuickScenario } from "../lib/quickScenario";
import { loadEngine, captureEngine } from "./engine";

function scenario(enabled: boolean, crisis: boolean, rate: number | null = 0.2): QuickScenario {
  return {
    name: `mortality-${crisis ? "crisis" : "ordinary"}-${enabled ? "recovery" : "spill"}`,
    hypothesis:
      "Recovered body chemistry can fund later survivor intake without healthy-period subsidy.",
    specification: {
      registration: "docs/mortality-recycling-results.md",
      enabled,
      crisis,
      sourceRate: rate ?? "world-default",
      memory: 60,
      halfResponse: 0.25,
      deathTick: 20,
      sourceWait: crisis ? 600 : null,
    },
    target: { x: 24, y: 24, radius: 3 },
    stopOnExtinction: true,
    create(engine, seed, swap) {
      const w = engine.create(seed, {
        preset: "diagnostic",
        ...frozen,
        width: 48,
        height: 48,
        founders: 4,
        sourceCount: 0,
        sourcePriming: 0,
        sourceDrift: 0,
        mortalityRecovery: enabled,
        mortalityMemory: 60,
        mortalityHalfResponse: 0.25,
      });
      try {
        const g = w.command<Genotype>("genotype", { id: 1 });
        const logits = Array.from({ length: 28 }, () => -3);
        logits.fill(0, 0, 2);
        logits[2] = 2;
        for (let i = 5; i <= 10; i++) logits[i] = 3;
        const behavior = w.command<Genotype["chromosomes"][number]["behavior"]>(
          "diagnosticController",
          { logits }
        );
        for (const ch of g.chromosomes) ch.behavior = behavior;
        install(
          w,
          [{ label: "stationary-paid-uptake", genotype: g }],
          Array.from({ length: 4 }, (_, i) => ({
            cell: i + 1,
            variant: 0,
            x: 24 + (swap ? -1 : 1) * (i === 0 ? 2 : -1),
            y: 24 + (i === 0 ? 0 : i - 2),
            heading: swap ? Math.PI : 0,
          }))
        );
        w.command("scheduledSource", {
          source: {
            x: 24,
            y: 24,
            radius: 3,
            rate: rate ?? w.command<Definition>("definition").config.sourceRate,
            duration: 600,
            ...(crisis ? { wait: 600 } : {}),
          },
        });
        w.command("strategyAblation", { enabled: true });
        return w;
      } catch (error) {
        w.dispose();
        throw error;
      }
    },
    beforeStep(w, tick) {
      if (crisis && tick === 20) w.command("mortalityAssay", { cells: [2, 3, 4] });
    },
  };
}

async function budget(root: string) {
  const engine = await loadEngine();
  captureEngine(root, engine);
  const report = engine.command<Record<string, unknown>>("resourceEconomy", {
    seed: 27,
    config: { preset: "ecology" },
  });
  writeFileSync(join(root, "economy.json"), JSON.stringify(report));
  const w = engine.create(27, { preset: "ecology", founders: 4 });
  try {
    const reserves = Array.from({ length: 4 }, (_, i) =>
      w.command<{ cell: { energy: number }; upkeep: { maintenancePerSecond: number } }>("inspect", {
        cell: i + 1,
      })
    ).map((r) => ({
      energy: r.cell.energy,
      maintenance: r.upkeep.maintenancePerSecond,
      maintenanceOnlyReserveSeconds: r.cell.energy / r.upkeep.maintenancePerSecond,
    }));
    writeFileSync(join(root, "reserves.json"), JSON.stringify(reserves));
    console.log(JSON.stringify({ ticksAdvanced: 0, reserves }));
  } finally {
    w.dispose();
  }
}

const [stage, root] = process.argv.slice(2);
if (!root || !["budget", "probe", "feeding", "defaults"].includes(stage))
  throw new Error(
    "Expected budget|probe|feeding|defaults NEW_DIRECTORY; follow registered stage conditions"
  );
mkdirSync(root);
if (stage === "budget") await budget(root);
else {
  for (const mode of [false, true]) {
    const cases = stage === "defaults" ? [true] : [false, true];
    for (const item of cases) {
      const caseScenario = scenario(
        mode,
        stage === "feeding" || item,
        stage === "defaults" ? null : 0.2
      );
      const placement = item ? "mirror" : "first";
      const condition = item ? "crisis" : "ordinary";
      const result = await runQuick(caseScenario, {
        seed: 27,
        ticks: stage === "feeding" ? 1500 : 300,
        swap: stage === "feeding" && item,
        wallSeconds: stage === "feeding" ? 120 : 60,
        output: join(
          root,
          `${mode ? "recovery" : "spill"}-${stage === "feeding" ? placement : condition}`
        ),
      });
      const s: Summary = result.final;
      console.log(
        JSON.stringify({
          mode,
          item,
          ticks: result.ticks,
          population: s.population,
          growth: s.ledger.flows.grown,
          uptake: s.ledger.flows.imported,
          mortality: s.mortality,
        })
      );
    }
  }
}
