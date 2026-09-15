/** Compare a runtime-only kernel repair with its archived executable on declared capacity cases. */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { Engine } from "../../src/engine/client";
const [previous, output] = process.argv.slice(2);
if (!previous || !output) throw new Error("Provide the previous WASM and a new output directory");
mkdirSync(output);
const paths = [previous, "public/antropy-engine.wasm"];
const binaries = paths.map((path) => new Uint8Array(readFileSync(path)));
const engines = await Promise.all(binaries.map((bytes) => Engine.load(bytes)));
const results = [];
for (const [population, growth] of [
  [48, false],
  [2000, false],
  [2000, true],
] as const) {
  const before = engines[0].create(101, { founders: 0, sourceCount: 0 });
  before.command("loadFixture", { population, growth });
  const after = engines[1].restore(before.snapshot());
  const start = performance.now();
  try {
    for (let tick = 10; tick <= 110; tick += 10) {
      before.step(10);
      after.step(10);
      if (Buffer.compare(before.snapshot(), after.snapshot()))
        throw new Error(`Continuation changed: ${population}, growth=${growth}, tick=${tick}`);
      if (performance.now() - start > 60000) throw new Error("Equivalence wall cap exceeded");
    }
    results.push({
      population,
      growth,
      ticks: 110,
      equal: true,
      wallMs: performance.now() - start,
    });
  } finally {
    before.dispose();
    after.dispose();
  }
}
const result = {
  binaries: binaries.map((bytes, i) => ({
    path: paths[i],
    sha256: createHash("sha256").update(bytes).digest("hex"),
    sourceDigest: engines[i].sourceDigest,
  })),
  results,
};
writeFileSync(`${output}/result.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result));
