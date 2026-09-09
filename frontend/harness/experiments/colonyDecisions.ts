import { colonyMotor } from "../../src/sim/controller/colonyEncoding";
import {
  COLONY_OBSERVATION_CONTRACT,
  quantizeColonyFrame,
} from "../../src/sim/controller/colonyObservation";
import { programmedColony } from "../../src/sim/policies/colony";
import { actColonyNetwork, createColonyState } from "../lib/learnedColony";
import { loadColonyModel, digest } from "../lib/colonyArtifacts";
import { colonyDecisionCases } from "../lib/colonyDecisionCases";
import { flag, type Flags } from "../lib/flags";
import { openLedger, recordRun } from "../lib/ledger";

interface Category {
  total: number;
  correct: number;
  confusion: number[][];
  errors: { detail: string; expected: number; actual: number }[];
}

export function runColonyDecisions(flags: Flags): void {
  const path = flag(flags, "model", ""),
    model = loadColonyModel(path);
  const categories: Record<string, Category> = {};
  for (const item of colonyDecisionCases()) {
    const frame = quantizeColonyFrame(item.frame);
    const expected = colonyMotor(programmedColony(frame));
    const actual = colonyMotor(actColonyNetwork(model, frame, createColonyState(model)));
    const category = (categories[item.category] ??= {
      total: 0,
      correct: 0,
      confusion: Array.from({ length: 8 }, () => new Array<number>(8).fill(0)),
      errors: [],
    });
    category.total++;
    category.correct += Number(actual === expected);
    category.confusion[expected][actual]++;
    if (actual !== expected && category.errors.length < 6)
      category.errors.push({ detail: item.detail, expected, actual });
  }
  const database = openLedger();
  const id = recordRun(database, {
    experiment: "colony-conditional-decisions",
    label: path,
    driver: "synthetic-local-zero-state",
    seed: 0,
    ticks: 0,
    wallMs: 0,
    params: {
      observationContract: COLONY_OBSERVATION_CONTRACT,
      modelHash: digest(JSON.stringify(model)),
      caseVersion: 1,
      modelVersion: model.version,
    },
    summary: { categories },
  });
  database.close();
  console.log(JSON.stringify({ id, categories }));
}
