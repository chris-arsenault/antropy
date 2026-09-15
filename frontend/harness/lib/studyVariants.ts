/** Diagnostic knock-in/reversion catalogs. No population replacement or parent selection. */
import { mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { loadEngine, captureEngine } from "../numerical/engine";
import { checkpointSource } from "./checkpointSource";
import { type Genotype } from "../../src/engine/types";
import { parseFlags, flag, integerFlag, type Flags } from "./flags";
import { hashText } from "./studyWorld";

function exchange(target: Genotype, donor: Genotype, flags: Flags) {
  const homolog = integerFlag(flags, "homolog", 0),
    slot = integerFlag(flags, "slot", 0),
    part = flag(flags, "part", "");
  const a = target.chromosomes[homolog],
    b = donor.chromosomes[homolog];
  if (![a, b].every(Boolean) || slot < 0) throw new Error("Invalid homolog or slot");
  if (part === "weight") {
    if (slot >= a.behavior.weights.length) throw new Error("Invalid weight index");
    a.behavior.weights[slot] = b.behavior.weights[slot];
    return;
  }
  if (part === "physical") {
    if (slot >= a.physical.length) throw new Error("Invalid physical index");
    a.physical[slot] = b.physical[slot];
    return;
  }
  if (part === "membrane") {
    a.chemistry.membrane = structuredClone(b.chemistry.membrane);
    return;
  }
  const offsets = { receptors: 3, transporters: 7, enzymes: 11 };
  if (!(part in offsets) || slot > 3) throw new Error("Invalid machinery selection");
  const key = part as keyof typeof offsets;
  // Whole machinery alleles include their corresponding construction investment.
  Object.assign(a.chemistry[key][slot], structuredClone(b.chemistry[key][slot]));
  a.physical[offsets[key] + slot] = b.physical[offsets[key] + slot];
}
export async function generate(flags: Flags) {
  const engine = await loadEngine(),
    source = await checkpointSource(engine, flag(flags, "checkpoint", ""));
  try {
    const a = source.world.command<Genotype>("genotype", { id: integerFlag(flags, "ancestor", 1) }),
      b = source.world.command<Genotype>("genotype", { id: integerFlag(flags, "candidate", 0) });
    if (a.chromosomes.length !== b.chromosomes.length) throw new Error("Matching ploidy required");
    const output = flag(flags, "output", "");
    if (!output) throw new Error("Output required");
    const variants = (
      [
        ["knockin", a, b],
        ["reversion", b, a],
      ] as const
    ).map(([name, base, donor]) => {
      const changed = structuredClone(base);
      exchange(changed, donor, flags);
      if (JSON.stringify(base) === JSON.stringify(changed))
        throw new Error("Selected allele does not differ");
      return { name, base, changed };
    });
    // Require a fresh directory so a failed rerun cannot replace archived evidence.
    mkdirSync(output);
    captureEngine(output, engine);
    for (const { name, base, changed } of variants) {
      const world = engine.restore(source.world.snapshot());
      try {
        const genotypes = [structuredClone(base), changed].map((g) => ({ ...g, parent: base.id }));
        const ids = world.command<number[]>("appendCatalog", { genotypes });
        const bytes = world.snapshot(),
          path = join(output, `diagnostic-${name}.bin`);
        writeFileSync(path, bytes, { flag: "wx" });
        const provenance = {
          schemaVersion: 3,
          kind: "diagnostic genotype catalog",
          source: source.provenance,
          sourceDigest: engine.sourceDigest,
          checkpointSha256: createHash("sha256").update(bytes).digest("hex"),
          flags: Object.fromEntries(flags.values),
          baselineSha256: hashText(JSON.stringify(base)),
          candidateSha256: hashText(JSON.stringify(changed)),
          comparisonAncestor: ids[0],
          comparisonCandidate: ids[1],
          population: "Observed cells unchanged",
        };
        writeFileSync(path + ".provenance.json", JSON.stringify(provenance, null, 2), {
          flag: "wx",
        });
        console.log(JSON.stringify({ path, ...provenance }));
      } finally {
        world.dispose();
      }
    }
  } finally {
    source.world.dispose();
  }
}
if (process.argv[1]?.endsWith("studyVariants.ts"))
  await generate(parseFlags(process.argv.slice(2)));
