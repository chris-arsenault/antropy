/** Cold-path packages for declared browser capacity fixtures; not browser founders. */
import { mkdirSync, writeFileSync } from "node:fs";
import { loadEngine, captureEngine } from "./engine";
import { encodePackage } from "../../src/engine/package";
import { emptySpatial, observe } from "../../src/engine/observation";
const output = process.argv[2];
if (!output) throw new Error("Provide a new output directory");
mkdirSync(output);
const engine = await loadEngine(),
  binaryDigest = captureEngine(output, engine);
for (const growth of [false, true]) {
  const world = engine.create(101, { founders: 0, sourceCount: 0 });
  world.command("loadFixture", { population: 2000, growth });
  const spatial = emptySpatial();
  observe(world, spatial);
  const blob = await encodePackage(world.snapshot(), {
    seed: 101,
    tick: 0,
    observation: {
      spatial,
      history: [],
      recent: [],
      runId: `capacity-${growth}`,
      executions: [{ digest: engine.sourceDigest, tick: 0 }],
    },
  });
  writeFileSync(
    `${output}/${growth ? "growth" : "varied"}.antropy`,
    Buffer.from(await blob.arrayBuffer())
  );
  world.dispose();
}
writeFileSync(
  `${output}/manifest.json`,
  JSON.stringify(
    { binaryDigest, sourceDigest: engine.sourceDigest, population: 2000, constructed: true },
    null,
    2
  )
);
