import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { digest, loadColonyModel } from "./lib/colonyArtifacts";
import { validateWorldCases } from "./lib/colonyWorlds";

const root = process.argv[2];
if (!root) throw new Error("usage: prepareGeneralizationReview.ts STUDY");
const selection = JSON.parse(readFileSync(join(root, "selection.json"), "utf8"));
const modelPath = join(root, "selected-model.json");
const model = loadColonyModel(modelPath);
if (digest(JSON.stringify(model)) !== selection.selected.modelHash)
  throw new Error("selected model changed after freezing");
const test = JSON.parse(readFileSync(join(root, "test-rnn.json"), "utf8"));
if (!test.complete || test.params.modelHash !== selection.selected.modelHash)
  throw new Error("reserved evaluation must finish with the frozen model");
const worlds = validateWorldCases(JSON.parse(readFileSync(join(root, "test.json"), "utf8")));
// Fixed review rule: first compact test layout, regardless of whether it passes.
const world = worlds.find((entry) => entry.config.environment.nestShape === "compact");
if (!world) throw new Error("study has no compact review layout");
copyFileSync(modelPath, "src/sim/controller/generalization-review.json");
writeFileSync("src/sim/controller/generalization-review-world.json", JSON.stringify(world));
writeFileSync(
  join(root, "review.json"),
  JSON.stringify(
    {
      world,
      modelHash: selection.selected.modelHash,
      modelFile: "generalization-review.json",
      rule: "first compact test layout regardless of outcome; tick zero; paused; no assistance",
    },
    null,
    2
  )
);
console.log(JSON.stringify({ label: world.label, modelHash: selection.selected.modelHash }));
