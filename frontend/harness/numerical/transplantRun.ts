/** Execute registered prepared checkpoints through the existing observer and ledger. */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { runQuick } from "../lib/quickRun";

const [root, name, limit] = process.argv.slice(2);
const ticks = Number(limit);
if (!root || !name || !Number.isInteger(ticks) || ticks < 1 || ticks > 1500)
  throw new Error("Expected prepared directory, case name and 1–1500 tick limit");
const path = join(root, `${name}.bin`);
const bytes = readFileSync(path);
await runQuick(
  {
    name: `transplant-${name}`,
    hypothesis:
      "Actual saved physiology may sustain dispersed cells in appropriate local chemistry",
    specification: {
      registration: "docs/cluster-bottleneck-study.md",
      path,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      preparation: JSON.parse(readFileSync(join(root, "preparation.json"), "utf8")),
    },
    target: { x: 16, y: 16, radius: 0 },
    create: (engine) => engine.restore(bytes),
  },
  { seed: 27, ticks, swap: false, wallSeconds: 120, output: join(root, name) }
);
