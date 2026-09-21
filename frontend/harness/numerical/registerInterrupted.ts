/** Register preserved evidence after an externally stopped recorded run; never step a world. */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { openLedger, recordRun } from "../lib/ledger";

const [directory, analysisPath, reason] = process.argv.slice(2);
if (!directory || !analysisPath || !reason)
  throw new Error("Expected run directory, analysis summary and explicit stopping reason");
const output = join(directory, "interrupted-result.json");
if (existsSync(output)) throw new Error("Interrupted result already registered");
const manifest = JSON.parse(readFileSync(join(directory, "trajectory/manifest.json"), "utf8")),
  analysis = JSON.parse(readFileSync(analysisPath, "utf8")),
  endpoint = analysis.trajectory.at(-1),
  checkpoint = join(directory, `trajectory/checkpoint-${endpoint.tick}.bin`);
if (!existsSync(checkpoint)) throw new Error("Analysis checkpoint missing");
const params = {
  ...manifest,
  status: "incomplete",
  stop: reason,
  requestedTicks: manifest.ticks,
  analysisTicks: endpoint.tick,
  checkpoint,
  analysisPath,
  provenance: "Registered from preserved observations after process interruption",
};
const db = openLedger();
try {
  const ledgerId = recordRun(db, {
    experiment: "integrated-200k-review",
    label: `v${manifest.checkpointVersion} seed${manifest.seed}; user-shortened observation`,
    driver: "wasm",
    seed: manifest.seed,
    ticks: endpoint.tick,
    params,
    summary: endpoint.summary,
    wallMs: endpoint.timing.elapsedMs,
  });
  const result = { ledgerId, ...params, summary: endpoint.summary };
  writeFileSync(output, JSON.stringify(result, null, 2), { flag: "wx" });
  console.log(JSON.stringify({ ledgerId, analysisTicks: endpoint.tick, stop: reason }));
} finally {
  db.close();
}
