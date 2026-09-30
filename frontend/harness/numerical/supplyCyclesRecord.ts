/** Register native supply-cycle comparisons in the existing local experiment ledger. */
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { openLedger, recordRun } from "../lib/ledger";

const [binary, ...directories] = process.argv.slice(2);
if (!binary || !directories.length)
  throw new Error("Expected binary and completed case directories");
const binaryDigest = createHash("sha256").update(readFileSync(binary)).digest("hex");
const db = openLedger();
try {
  for (const directory of directories) {
    const report = JSON.parse(readFileSync(`${directory}/result.json`, "utf8"));
    const id = recordRun(db, {
      experiment: "terrain-extinction-supply-cycles",
      label: `${directory}: cycle scale ${report.cycleScale}`,
      driver: "native-ordinary-World",
      seed: report.seed,
      ticks: report.tick - report.startTick,
      params: { ...report, binaryDigest, ledger: undefined },
      summary: {
        tick: report.tick,
        population: report.population,
        stop: report.stop,
        ...report.ledger,
      },
      wallMs: report.wallSeconds * 1000,
    });
    writeFileSync(`${directory}/ledger.json`, JSON.stringify({ id, binaryDigest }, null, 2), {
      flag: "wx",
    });
    console.log(JSON.stringify({ directory, id, stop: report.stop }));
  }
} finally {
  db.close();
}
