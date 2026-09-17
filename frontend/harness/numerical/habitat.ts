/** Registered short environmental opportunity checks using the existing runner and ledger. */
import { mkdirSync, writeFileSync } from "node:fs";
import { runQuick } from "../lib/quickRun";
import { habitatScenario } from "../lib/habitatScenario";
import { loadEngine, captureEngine } from "./engine";
import { openLedger, recordRun } from "../lib/ledger";

const [stage, output] = process.argv.slice(2);
if (
  ![
    "medium",
    "probe",
    "contest",
    "byproduct-probe",
    "byproduct-contest",
    "byproduct-knockout",
  ].includes(stage) ||
  !output
)
  throw new Error(
    "Provide probe|contest and a new output directory; inspect probes before contests"
  );
mkdirSync(output);
if (stage === "probe" || stage === "medium") {
  const engine = await loadEngine(),
    world = engine.create(27, { founders: 0, sourceCount: 0, width: 24, height: 24 }),
    db = openLedger();
  try {
    const started = performance.now(),
      report = world.command<Record<string, unknown>>("weatheringProbe"),
      binaryDigest = captureEngine(output, engine);
    const id = recordRun(db, {
      experiment: "environmental-abiotic",
      label: "75 production-field updates; two local media with weathering on/off",
      driver: "wasm",
      seed: 27,
      ticks: 0,
      params: { binaryDigest, registration: "ENVIRONMENTAL-ECOLOGY-PLAN.md" },
      summary: report,
      wallMs: performance.now() - started,
    });
    writeFileSync(
      `${output}/abiotic.json`,
      JSON.stringify({ id, binaryDigest, ...report }, null, 2)
    );
    writeFileSync(
      `${output}/economy.json`,
      JSON.stringify(engine.command("resourceEconomy", { seed: 27 }))
    );
  } finally {
    world.dispose();
    db.close();
  }
}
const contest = stage.endsWith("contest") || stage.endsWith("knockout");
let names = !contest
  ? ["producer", "export-off", "feedback-off"]
  : ["strong-forward", "strong-swapped", "mild-forward", "mild-swapped"];
if (stage.endsWith("knockout")) names = ["feedback-off-forward", "feedback-off-swapped"];
if (stage === "medium") names = [];
for (const arm of names) {
  const name = stage.startsWith("byproduct") ? `byproduct-${arm}` : arm;
  await runQuick(habitatScenario(name, contest), {
    seed: 27,
    ticks: contest ? 1500 : 300,
    wallSeconds: 120,
    swap: name.endsWith("swapped"),
    output: `${output}/${name}`,
  });
}
