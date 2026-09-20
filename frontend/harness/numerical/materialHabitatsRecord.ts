/** Record completed native mechanism evidence in the existing ledger. */
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { openLedger, recordRun } from "../lib/ledger";

const [directory, binary] = process.argv.slice(2);
if (!directory || !binary) throw new Error("Expected completed case directory and native binary");
const report = JSON.parse(readFileSync(`${directory}/results.json`, "utf8"));
const binaryDigest = createHash("sha256").update(readFileSync(binary)).digest("hex");
const db = openLedger();
interface Case {
  name?: string;
  enabled?: boolean;
  ticks: number;
  wallMs: number;
}
try {
  const ids = report.cases.map((c: Case) =>
    recordRun(db, {
      experiment: "material-habitats-mechanisms",
      label: c.name ?? `public regeneration ${c.enabled}`,
      driver: "native-ordinary-World",
      seed: c.name ? 27 : 101,
      ticks: c.ticks,
      params: { registration: "MATERIAL-HABITATS-PLAN.md", binaryDigest },
      summary: { ...c },
      wallMs: c.wallMs,
    })
  );
  writeFileSync(`${directory}/ledger.json`, JSON.stringify({ ids, binaryDigest }, null, 2));
  console.log(JSON.stringify({ ids, binaryDigest }));
} finally {
  db.close();
}
