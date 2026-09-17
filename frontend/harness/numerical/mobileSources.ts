/** Registered short source probes and one-case-at-a-time calibration. */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { type Definition, type Summary } from "../../src/engine/types";
import { openLedger, recordRun } from "../lib/ledger";
import { runRecorded } from "../lib/longRun";
import { resourceSample, studyGuard, validateAccounts } from "../lib/studyBudget";
import { loadEngine, captureEngine } from "./engine";

const [stage, root, seedText, driftText, processingText, ticksText] = process.argv.slice(2);
if (!["probe", "case"].includes(stage) || !root)
  throw new Error("Expected probe NEW-ROOT or case ROOT SEED DRIFT PROCESSING TICKS");
const engine = await loadEngine();
if (stage === "probe") {
  mkdirSync(root);
  const world = engine.create(27, { founders: 0, sourceCount: 0, width: 24, height: 24 });
  const db = openLedger();
  try {
    writeFileSync(join(root, "registration.json"), JSON.stringify({ started: Date.now() }));
    const started = performance.now();
    const report = world.command<{ cases: { final: Summary }[] }>("sourceProbe");
    for (const probe of report.cases) validateAccounts(probe.final);
    const binaryDigest = captureEngine(root, engine);
    const id = recordRun(db, {
      experiment: "mobile-source-probes",
      label: "Six 300-tick production-operator probes; medium, direction, drag and knockouts",
      driver: "wasm",
      seed: 27,
      ticks: 1800,
      params: {
        registration: "MOBILE-SOURCES-PLAN.md",
        binaryDigest,
        sourceDigest: engine.sourceDigest,
      },
      summary: report,
      wallMs: performance.now() - started,
    });
    writeFileSync(join(root, "probes.json"), JSON.stringify({ id, binaryDigest, ...report }));
    console.log(JSON.stringify({ id, cases: report.cases.length, ticksPerCase: 300 }));
  } finally {
    world.dispose();
    db.close();
  }
} else {
  const seed = Number(seedText),
    drift = Number(driftText),
    processing = Number(processingText),
    ticks = Number(ticksText);
  if (
    ![27, 101].includes(seed) ||
    ![0, 0.25, 1, 4].includes(drift) ||
    ![0, 0.25, 1, 4].includes(processing) ||
    ![1500, 3000].includes(ticks)
  )
    throw new Error("Case exceeds registered parameter or tick bounds");
  const registration = JSON.parse(readFileSync(join(root, "registration.json"), "utf8"));
  const deadline = registration.started + 30 * 60 * 1000;
  if (Date.now() >= deadline) throw new Error("Registered study wall budget exhausted");
  const name = `seed${seed}-d${drift}-p${processing}-t${ticks}`;
  const directory = join(root, name);
  const world = engine.create(seed, { sourceDrift: drift, sourceProcessing: processing });
  try {
    const definition = world.command<Definition>("definition");
    world.command("traceStart");
    const result = runRecorded(engine, world, {
      directory,
      experiment: "mobile-source-calibration",
      label: name,
      ticks,
      cadence: 50,
      checkpointEvery: 3050,
      wallSeconds: 120,
      provenance: { registration: "MOBILE-SOURCES-PLAN.md", chemistry: definition.chemistry },
      observation(w) {
        validateAccounts(w.command<Summary>("summary"));
        return { groups: w.command("trace"), resources: resourceSample(engine, directory, root) };
      },
      stop: studyGuard(engine, directory, root, deadline),
    });
    if (result.stop !== "horizon" && result.stop !== "extinction") process.exitCode = 2;
  } finally {
    world.dispose();
  }
}
