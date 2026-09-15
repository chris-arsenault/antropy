import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { type Genotype, type Summary } from "../../src/engine/types";
import { assignPopulation } from "../lib/engineFixtures";
import { flag, type Flags } from "../lib/flags";
import { runQuick } from "../lib/quickRun";
import { type QuickScenario } from "../lib/quickScenario";

function scenario(name: "first" | "second" | "empty"): QuickScenario {
  return {
    name: `resource-economy-${name}`,
    hypothesis:
      "Accessible feedstock funds a repeated local life cycle; stored founder resources alone do not.",
    specification: {
      registration: "docs/design/chemistry/resource-economy.md",
      source: name,
      motorGain: 0,
      mutation: false,
      learning: false,
      horizon: 1500,
      wallCapSeconds: 30,
    },
    target: { x: 32, y: 32, radius: 8 },
    create(engine, seed) {
      const w = engine.diagnostic("isolated-source", {
        seed,
        second: name === "second",
        founders: 1,
      });
      const genotype = w.command<Genotype>("genotype", { id: 1 });
      assignPopulation(w, [{ label: name, genotype, changes: { motorGain: 0 } }], () => 0);
      if (name === "empty") w.command("intervene", { clearField: true, clearSources: true });
      return w;
    },
  };
}

export async function runResourceEconomy(flags: Flags) {
  for (const key of flags.values.keys())
    if (key !== "output" && key !== "continue-first")
      throw new Error("Registered economy checks accept --output and --continue-first");
  const output = flag(flags, "output", "harness/artifacts/resource-economy");
  mkdirSync(output, { recursive: true });
  const checkpoint = flag(flags, "continue-first", "");
  if (checkpoint) {
    await runQuick(continuation(checkpoint), {
      seed: 101,
      ticks: 3000,
      swap: false,
      wallSeconds: 30,
      output: join(output, "first-continuation"),
    });
    return;
  }
  for (const name of ["first", "second", "empty"] as const)
    await runQuick(scenario(name), {
      seed: 101,
      ticks: 1500,
      swap: false,
      wallSeconds: 30,
      output: join(output, name),
    });
}

function continuation(checkpoint: string): QuickScenario {
  const base = scenario("first");
  return {
    ...base,
    name: "resource-economy-first-continuation",
    specification: { ...base.specification, checkpoint, horizon: 3000, startingTick: 1500 },
    create(engine) {
      const w = engine.restore(readFileSync(checkpoint));
      const s = w.command<Summary>("summary");
      if (s.tick !== 1500 || s.population !== 2 || s.generation !== 1) {
        w.dispose();
        throw new Error("Continuation requires the registered two-daughter tick-1500 checkpoint");
      }
      return w;
    },
  };
}
