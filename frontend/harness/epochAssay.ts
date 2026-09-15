import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { type Definition } from "../src/engine/types";
import { loadEngine } from "./numerical/engine";
import { checkpointSource } from "./lib/checkpointSource";
import { parseFlags, integerFlag, flag } from "./lib/flags";
import { runRecorded, requireRegistration } from "./lib/longRun";
import { sampleCohort, cohortWorld, cohortCounts } from "./epochCohort";

async function run() {
  const flags = parseFlags(process.argv.slice(2)),
    engine = await loadEngine(),
    seed = integerFlag(flags, "seed", 101);
  const paths = [flag(flags, "pre", ""), flag(flags, "post", "")],
    ticks = integerFlag(flags, "ticks", 15000),
    justification = requireRegistration(flags, ticks);
  if (paths.some((p) => !p)) throw new Error("Provide current-schema --pre and --post checkpoints");
  const share = Number(flag(flags, "share", "0.2")),
    swap = flag(flags, "swap", "false") === "true";
  if (![0.2, 0.8].includes(share)) throw new Error("Registered assay shares are 0.2 and 0.8");
  const sources = [];
  try {
    for (const path of paths) sources.push(await checkpointSource(engine, path));
    const definitions = sources.map((s) => s.world.command<Definition>("definition"));
    if (
      !isDeepStrictEqual(definitions[0].config, definitions[1].config) ||
      !isDeepStrictEqual(definitions[0].chemistry, definitions[1].chemistry)
    )
      throw new Error("Cohorts require identical chemistry definitions and physical configuration");
    const samples = sources.map((s, i) => sampleCohort(s.world, seed ^ (0x1793 + i)));
    const { world, postIds } = cohortWorld(
      engine,
      samples[0].map((s) => s.genome),
      samples[1].map((s) => s.genome),
      definitions[0].config,
      seed ^ 0x54321,
      share,
      swap
    );
    const label = `assay-${seed}-${share}-${swap}`,
      root = flag(flags, "output", "harness/artifacts/chemical-epoch-assays");
    mkdirSync(root, { recursive: true });
    try {
      runRecorded(engine, world, {
        directory: join(root, label),
        experiment: "food-epoch-assay",
        label,
        ticks,
        cadence: 500,
        checkpointEvery: 5000,
        wallSeconds: integerFlag(flags, "wall-seconds", 900),
        observation: (w) => ({ cohorts: cohortCounts(w, postIds) }),
        provenance: {
          justification,
          share,
          swap,
          sources: sources.map((s) => s.provenance),
          samples,
          postLineages: [...postIds],
          selection:
            "24 individual-weighted draws with replacement per cohort; fixed founder-lineage assignment counts descendants",
        },
      });
    } finally {
      world.dispose();
    }
  } finally {
    for (const source of sources) source.world.dispose();
  }
}
await run();
