/** Import completed native assays into the existing ledger; never advance physics here. */
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { openLedger, recordRun } from "../lib/ledger";

const [directory, binary] = process.argv.slice(2);
if (!directory || !binary) throw new Error("Expected completed case directory and native binary");
const report = JSON.parse(readFileSync(`${directory}/report.json`, "utf8"));
const binaryDigest = createHash("sha256").update(readFileSync(binary)).digest("hex");
const db = openLedger();
try {
  const ids = report.cases.map((c: { name: string; ticks: number; wallMs: number }) =>
    recordRun(db, {
      experiment: "local-illumination",
      label: c.name,
      driver: "native-ordinary-World",
      seed: 27,
      ticks: c.ticks,
      params: { registration: report.registration, binaryDigest },
      summary: c,
      wallMs: c.wallMs,
    })
  );
  writeFileSync(`${directory}/ledger.json`, JSON.stringify({ ids, binaryDigest }, null, 2));
  console.log(JSON.stringify({ ids, binaryDigest }));
} finally {
  db.close();
}
