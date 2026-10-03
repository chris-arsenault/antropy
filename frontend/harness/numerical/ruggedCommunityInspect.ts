import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { loadEngine } from "./engine";
import {
  HARM_CASES,
  ITERATION2_CASES,
  SHARED_CASES,
  SINGLE_CASES,
} from "../lib/ruggedCommunityFixture";
import { type Flows } from "../../src/engine/types";

interface TraceGroup {
  initialGenome: number;
  chemical: { imported: number[]; exported: number[] };
  reactions: { species: number; product: number; amount: number }[];
  ledger: { flows: Flows };
}
const [root] = process.argv.slice(2);
if (!root) throw new Error("Expected NEW_DIRECTORY");
mkdirSync(root);
const save = (name: string, value: unknown) =>
  writeFileSync(join(root, name), JSON.stringify(value));
const artifact = "harness/artifacts";
const paths = [
  ...SINGLE_CASES.map((c) => `rugged-community-i1-single/${c}`),
  ...SHARED_CASES.map((c) => `rugged-community-i1-shared/${c}`),
  ...ITERATION2_CASES.map((c) => `rugged-community-i2-shared/${c}`),
  ...HARM_CASES.map((c) => `rugged-community-i3-harm/${c}`),
];
const ancestry = [];
for (const path of paths) {
  const directory = join(artifact, path);
  const engine = await loadEngine(pathToFileURL(join(directory, "engine.wasm")));
  const world = engine.restore(readFileSync(join(directory, "final.bin")));
  try {
    ancestry.push({ path, records: world.command("ancestry") });
  } finally {
    world.dispose();
  }
}
save("ancestry.json", ancestry);

const directory = join(artifact, "rugged-community-i1-shared/active");
const engine = await loadEngine(pathToFileURL(join(directory, "engine.wasm")));
const world = engine.restore(readFileSync(join(directory, "initial.bin")));
try {
  world.command("traceStart");
  const rows = [];
  for (let tick = 1; tick <= 64; tick++) {
    world.step();
    rows.push({
      tick,
      groups: world.command<TraceGroup[]>("trace").map((g) => ({
        genome: g.initialGenome,
        flows: g.ledger.flows,
        imports: [0, 128, 136].map((s) => [s, g.chemical.imported[s]]),
        exports: [0, 128, 136].map((s) => [s, g.chemical.exported[s]]),
        reactions: g.reactions,
      })),
    });
  }
  save("timeline.json", { directory, sourceDigest: engine.sourceDigest, ticks: 64, rows });
  console.log(JSON.stringify({ root, endpoints: ancestry.length, replayTicks: 64 }));
} finally {
  world.dispose();
}
