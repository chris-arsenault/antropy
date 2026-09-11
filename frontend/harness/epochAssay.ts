import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { restoreWorld, checkpointToJson } from "../src/persist/checkpoint";
import { noteExecution } from "../src/persist/provenance";
import { encodeGenotype } from "../src/sim/genetics/codec";
import { controller } from "../src/sim/controller";
import { measure, sourceDigest } from "./lib/bacteriaRun";
import { parseFlags, integerFlag, flag } from "./lib/flags";
import { recordRun, openLedger } from "./lib/ledger";
import { sampleCohort, cohortWorld, cohortCounts } from "./epochCohort";

const hash = (text: string) => createHash("sha256").update(text).digest("hex");
const identity = () =>
  hash(
    sourceDigest() +
      readFileSync("harness/epochAssay.ts", "utf8") +
      readFileSync("harness/epochCohort.ts", "utf8")
  );
function prepare() {
  const flags = parseFlags(process.argv.slice(2)),
    seed = integerFlag(flags, "seed", 101);
  const root = flag(flags, "root", "harness/artifacts/epochs-2026-09-11");
  const share = Number(flag(flags, "share", "0.2")),
    swap = flag(flags, "swap", "false") === "true";
  if (![0.2, 0.8].includes(share)) throw new Error("Registered assay shares are 0.2 and 0.8");
  const texts = [50000, 100000].map((tick) =>
    readFileSync(join(root, `live-${seed}`, `checkpoint-${tick}.json`), "utf8")
  );
  const worlds = texts.map(restoreWorld);
  const samples = worlds.map((w, i) => sampleCohort(w, seed ^ (0x1793 + i)));
  const { world, postIds } = cohortWorld(
    samples[0].map((s) => s.genome),
    samples[1].map((s) => s.genome),
    worlds[0].config,
    seed ^ 0x54321,
    share,
    swap
  );
  const label = `assay-${seed}-${share}-${swap}`,
    directory = join(root, label);
  if (existsSync(directory)) throw new Error("Existing assay directory; evidence is append-only");
  mkdirSync(directory, { recursive: true });
  const save = (name: string, data: unknown) =>
    writeFileSync(join(directory, name), JSON.stringify(data));
  const manifest = {
    label,
    seed,
    share,
    swap,
    config: world.config,
    ticks: 15000,
    status: "running",
    sourceDigest: identity(),
    sourceDigestAfter: "",
    sourceHashes: texts.map(hash),
    selection: "24 individual-weighted draws with replacement per cohort",
    samples: samples.map((group) => group.map((s) => ({ ...s, genome: encodeGenotype(s.genome) }))),
  };
  save("manifest.json", manifest);
  noteExecution(world, `headless:${manifest.sourceDigest}`);
  writeFileSync(join(directory, "initial.json"), checkpointToJson(world));
  return { world, postIds, directory, manifest, save };
}
function run() {
  const { world, postIds, directory, manifest, save } = prepare();
  const cohorts = [{ tick: 0, ...cohortCounts(world, postIds) }];
  try {
    const result = measure(world, 15000, 500, {
      spatial: false,
      progress: true,
      onSample: (w) => cohorts.push({ tick: w.tick, ...cohortCounts(w, postIds) }),
    });
    if (cohorts[cohorts.length - 1].tick !== world.tick)
      cohorts.push({ tick: world.tick, ...cohortCounts(world, postIds) });
    manifest.sourceDigestAfter = identity();
    if (manifest.sourceDigest !== manifest.sourceDigestAfter)
      throw new Error("Source changed during assay");
    const db = openLedger();
    const id = recordRun(db, {
      experiment: "food-epoch-assay",
      label: manifest.label,
      driver: controller.id,
      seed: manifest.seed,
      ticks: world.tick,
      params: manifest,
      summary: { ...result.final, cohorts },
      wallMs: result.wallMs,
    });
    db.close();
    save("result.json", { ...result, cohorts, ledgerId: id });
    writeFileSync(join(directory, "checkpoint.json"), checkpointToJson(world));
    manifest.status = "complete";
    console.log(
      JSON.stringify({ run: manifest.label, id, tick: world.tick, ...cohortCounts(world, postIds) })
    );
  } catch (error) {
    manifest.status = "failed";
    throw error;
  } finally {
    save("manifest.json", manifest);
  }
}
run();
