import { type ColonyFrame } from "../../src/sim/colonySensors";
import { colonyMotor } from "../../src/sim/controller/colonyEncoding";
import { actColonyNetwork, createColonyState } from "../lib/learnedColony";
import { loadColonyModel, digest } from "../lib/colonyArtifacts";
import { flag, integerFlag, type Flags } from "../lib/flags";
import { openLedger, recordRun } from "../lib/ledger";

interface Trap {
  tick: number;
  expected: number;
  actual: number;
  frame: ColonyFrame;
}

export function runColonyTraps(flags: Flags): void {
  const path = flag(flags, "model", "");
  const source = integerFlag(flags, "source", 2522);
  const model = loadColonyModel(path);
  const database = openLedger();
  const row = database.prepare("SELECT summary FROM runs WHERE id = ?").get(source) as {
    summary: string;
  };
  const captured = JSON.parse(row.summary) as { results: { errors: Trap[] }[] };
  const results = captured.results
    .flatMap((result) => result.errors)
    .map((trap) => {
      const frame = { ...trap.frame, navigation: Float32Array.from(trap.frame.navigation) };
      const actual = colonyMotor(actColonyNetwork(model, frame, createColonyState(model)));
      return { tick: trap.tick, expected: trap.expected, original: trap.actual, actual };
    });
  const summary = {
    correct: results.filter((r) => r.expected === r.actual).length,
    total: results.length,
    results,
  };
  const id = recordRun(database, {
    experiment: "colony-static-traps",
    label: path,
    driver: "zero-state-local",
    seed: 5,
    ticks: 0,
    params: { source, modelHash: digest(JSON.stringify(model)) },
    summary,
    wallMs: 0,
  });
  database.close();
  console.log(JSON.stringify({ id, ...summary }));
}
