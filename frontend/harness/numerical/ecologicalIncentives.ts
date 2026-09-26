/** Registered prepared fixtures, ordinary kernel and existing experiment ledger. */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { runQuick } from "../lib/quickRun";

const [root, ...names] = process.argv.slice(2);
if (!root || names.length === 0) throw new Error("Expected prepared directory and case names");
const preparation = JSON.parse(readFileSync(join(root, "preparation.json"), "utf8"));
for (const name of names) {
  const path = join(root, `${name}.bin`);
  const bytes = readFileSync(path);
  await runQuick(
    {
      name: `ecological-incentives-${name}`,
      hypothesis: "Local compression, chemical exchange and light create conditional returns",
      specification: {
        registration: "docs/plans/ECOLOGICAL-INCENTIVES-PLAN.md",
        path,
        sha256: createHash("sha256").update(bytes).digest("hex"),
        preparation,
      },
      target: { x: 16, y: 16, radius: 2 },
      create: (engine) => engine.restore(bytes),
    },
    { seed: 701, ticks: 300, swap: false, wallSeconds: 120, output: join(root, name) }
  );
}
