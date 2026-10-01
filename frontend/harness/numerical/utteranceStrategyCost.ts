import { mkdirSync, writeFileSync } from "node:fs";
import { loadEngine, captureEngine } from "./engine";
import { measureOperating, measureStorage } from "./performance";
import { openLedger, recordRun } from "../lib/ledger";
import { validateAccounts } from "../lib/studyBudget";
import { type EngineWorld } from "../../src/engine/client";
const WORKLOAD = { population: 2000, warmup: 4, ticks: 36, wallSeconds: 60 };
const CONFIG = {
  preset: "ecology",
  width: 720,
  height: 540,
  founders: 0,
  sourceCount: 0,
  mutationRate: 0,
  physicalMutationRate: 0,
  learningRetention: 0,
};
const CASES = [
  ["silent", 0, false],
  ["sparse", 32, false],
  ["dense", 1, true],
  ["paired", 32, false],
] as const;

function pairReceivers(world: EngineWorld) {
  const cells = world.command<{ cells: { id: number; genome: number; x: number; y: number }[] }>(
    "frame"
  ).cells;
  for (const [i, cell] of cells.entries()) {
    if ((cell.genome - 1) % 32 !== 0 || !cells[i + 1]) continue;
    world.command("intervene", { cell: cells[i + 1].id, x: cell.x + 1, y: cell.y });
  }
}

function continuationReport(storage: ReturnType<typeof measureStorage>) {
  return {
    saveMs: storage.saveMs,
    restoreMs: storage.restoreMs,
    checkpointBytes: storage.checkpointBytes,
    memoryBytes: storage.memoryBytes,
    continuationMatches: storage.continuationMatches,
    continuation: storage.continuation,
  };
}

/** Fixed v49 operating panel; registration: docs/utterances-and-strategy-results.md. */
export async function runUtteranceStrategyCost(output: string, selected: string) {
  if (selected !== "all" && selected !== "paired") throw new Error("Expected --case all or paired");
  mkdirSync(output);
  const engine = await loadEngine(),
    digest = captureEngine(output, engine);
  const db = openLedger();
  try {
    for (const [name, every, dense] of selected === "paired" ? CASES.slice(3) : CASES.slice(0, 3)) {
      const world = engine.create(101, CONFIG);
      try {
        world.command("loadFixture", { population: WORKLOAD.population, programs: 4, dense });
        world.command("speechLoad", { every });
        if (name === "paired") pairReceivers(world);
        writeFileSync(`${output}/${name}-initial.antropy`, world.snapshot());
        world.step(WORKLOAD.warmup);
        const result = measureOperating(world, WORKLOAD.ticks, WORKLOAD.wallSeconds);
        validateAccounts(result.initial);
        validateAccounts(result.summary);
        const storage = measureStorage(engine, world);
        writeFileSync(`${output}/${name}-final.antropy`, storage.saved);
        const continuation = continuationReport(storage);
        const params = {
          name,
          every,
          dense,
          ...WORKLOAD,
          digest,
          sourceDigest: engine.sourceDigest,
        };
        const summary = { ...result, ...continuation };
        const id = recordRun(db, {
          experiment: "utterance-strategy-cost",
          label: name,
          driver: "wasm",
          seed: 101,
          ticks: result.steps,
          params,
          summary,
          wallMs: result.wallMs,
        });
        writeFileSync(`${output}/${name}.json`, JSON.stringify({ id, params, summary }, null, 2));
        console.log(
          JSON.stringify({
            id,
            name,
            steps: result.steps,
            stop: result.stop,
            ticksPerSecond: result.ticksPerSecond,
            checkpointBytes: storage.checkpointBytes,
            memoryBytes: storage.memoryBytes,
            utterances: result.summary.ledger.flows.utterances,
            heard: result.summary.ledger.flows.heard,
          })
        );
      } finally {
        world.dispose();
      }
    }
  } finally {
    db.close();
  }
}
