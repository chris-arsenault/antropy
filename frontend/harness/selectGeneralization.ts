import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { digest, loadColonyModel } from "./lib/colonyArtifacts";
import { validateWorldCases, type ColonyWorldCase } from "./lib/colonyWorlds";

interface Evaluation {
  complete: boolean;
  params: {
    worlds: ColonyWorldCase[];
    modelPath: string;
    modelHash: string;
    ticks: number;
    objective: string;
    physics: string;
  };
  results: { valid: boolean; viable: boolean; score: number }[];
}

const [root, ...paths] = process.argv.slice(2);
if (!root || paths.length === 0)
  throw new Error("usage: selectGeneralization.ts STUDY VALIDATION...");
if (existsSync(join(root, "selection.json"))) throw new Error("candidate is already frozen");
const worlds = validateWorldCases(JSON.parse(readFileSync(join(root, "validation.json"), "utf8")));
const candidates = paths.map((path) => {
  const evaluation = JSON.parse(readFileSync(path, "utf8")) as Evaluation;
  if (!evaluation.complete || evaluation.results.length !== worlds.length)
    throw new Error("incomplete validation evaluation");
  if (JSON.stringify(evaluation.params.worlds) !== JSON.stringify(worlds))
    throw new Error("selection requires the declared validation worlds");
  if (evaluation.params.ticks !== 48000 || evaluation.params.objective !== "colony-survival-v2")
    throw new Error("selection outcome protocol mismatch");
  const model = loadColonyModel(evaluation.params.modelPath);
  if (digest(JSON.stringify(model)) !== evaluation.params.modelHash)
    throw new Error("evaluated weights changed");
  const scores = evaluation.results.map((result) => result.score);
  return {
    path,
    ...evaluation.params,
    viable: evaluation.results.filter((result) => result.valid && result.viable).length,
    minimum: Math.min(...scores),
    mean: scores.reduce((a, b) => a + b, 0) / scores.length,
  };
});
candidates.sort((a, b) => b.viable - a.viable || b.minimum - a.minimum || b.mean - a.mean);
const selected = candidates[0];
copyFileSync(selected.modelPath, join(root, "selected-model.json"));
writeFileSync(
  join(root, "selection.json"),
  JSON.stringify(
    {
      frozenAt: new Date().toISOString(),
      selected,
      candidates,
      rule: "validation viable count, minimum score, mean score; no test outcomes inspected",
    },
    null,
    2
  )
);
console.log(
  JSON.stringify({ model: selected.modelPath, viable: selected.viable, minimum: selected.minimum })
);
