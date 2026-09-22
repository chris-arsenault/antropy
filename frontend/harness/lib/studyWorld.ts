import { createHash } from "node:crypto";
import { type Engine, type EngineWorld } from "../../src/engine/client";
import { type Genotype, type Definition } from "../../src/engine/types";
import { checkpointSource } from "./checkpointSource";
import { flag, integerFlag, type Flags } from "./flags";
import { strategyFixture, installMotorVariants } from "./strategyFixture";
import { assignPopulation } from "./engineFixtures";
import { readFrame } from "./longRun";

export const hashText = (text: string): string => createHash("sha256").update(text).digest("hex");
function hybrid(ancestor: Genotype, descendant: Genotype, part: string): Genotype {
  if (part === "whole" || part === "founder")
    return structuredClone(part === "founder" ? ancestor : descendant);
  if (!["behavior", "physical"].includes(part)) throw new Error("Unknown inherited part");
  if (ancestor.chromosomes.length !== descendant.chromosomes.length)
    throw new Error("Matching ploidy required");
  return {
    ...structuredClone(descendant),
    chromosomes: descendant.chromosomes.map((c, i) => ({
      behavior: structuredClone(
        part === "behavior" ? c.behavior : ancestor.chromosomes[i].behavior
      ),
      physical: structuredClone(
        part === "physical" ? c.physical : ancestor.chromosomes[i].physical
      ),
      chemistry: structuredClone(
        part === "physical" ? c.chemistry : ancestor.chromosomes[i].chemistry
      ),
    })),
  };
}
function installContest(world: EngineWorld, saved: EngineWorld, flags: Flags) {
  const candidate = saved.command<Genotype>("genotype", { id: integerFlag(flags, "candidate", 0) });
  const ancestor = saved.command<Genotype>("genotype", { id: integerFlag(flags, "ancestor", 1) });
  const swap = Number(flag(flags, "swap", "false") === "true");
  assignPopulation(
    world,
    [
      { label: "ancestor", genotype: ancestor },
      {
        label: "candidate inherited part",
        genotype: hybrid(ancestor, candidate, flag(flags, "part", "whole")),
      },
    ],
    (i) => (i + swap) % 2
  );
}
function installCounterfactual(world: EngineWorld, saved: EngineWorld, flags: Flags) {
  const replacement = flag(flags, "replace", "none"),
    lineage = integerFlag(flags, "lineage", 0),
    genotypes: Record<number, Genotype> = {};
  if (!["none", "founder", "physical", "behavior"].includes(replacement))
    throw new Error("Unknown replacement");
  if (replacement !== "none") {
    const ancestor = saved.command<Genotype>("genotype", { id: integerFlag(flags, "ancestor", 1) }),
      cells = readFrame(world).cells.filter((c) => c.lineage === lineage);
    if (!cells.length) throw new Error("Specify a living --lineage for the intervention");
    for (const c of cells)
      if (!genotypes[c.genome])
        genotypes[c.genome] = hybrid(
          ancestor,
          saved.command<Genotype>("genotype", { id: c.genome }),
          replacement
        );
  }
  world.command("replaceLineage", { replacement: { lineage, genotypes } });
}
function policy(flags: Flags, mode: string) {
  const patch: Record<string, unknown> = {},
    knockout = flag(flags, "knockout", "none");
  if (flag(flags, "frozen", "false") === "true" || !["baseline", "discovery"].includes(mode))
    Object.assign(patch, {
      mutationRate: 0,
      physicalMutationRate: 0,
      learningRetention: 0,
      transmission: "clonal",
    });
  if (knockout === "damage") patch.damageRate = 0;
  if (knockout === "movement-impedance") patch.movementImpedance = 0;
  if (!["none", "damage", "movement-impedance"].includes(knockout))
    throw new Error("Unknown knockout");
  return patch;
}
export async function loadStudyWorld(flags: Flags, engine: Engine) {
  const path = flag(flags, "checkpoint", ""),
    mode = flag(flags, "mode", "baseline"),
    seed = integerFlag(flags, "seed", 101);
  if (!path) throw new Error("Study requires an explicit current-schema --checkpoint");
  if (!["baseline", "contest", "resume", "motor", "discovery"].includes(mode))
    throw new Error("Unknown study mode");
  const environment = flag(flags, "environment", "default");
  if (!["default", "scheduled"].includes(environment)) throw new Error("Unknown study environment");
  const source = await checkpointSource(engine, path),
    saved = source.world;
  let world: EngineWorld | undefined;
  try {
    const sourceBytes = saved.snapshot(),
      definition = saved.command<Definition>("definition"),
      patch = policy(flags, mode);
    const config = {
      ...definition.config,
      ...patch,
      ...(environment === "scheduled" ? { sourceCount: 0 } : {}),
    };
    world = mode === "resume" ? engine.restore(sourceBytes) : engine.create(seed, config);
    prepareWorld(world, saved, flags, mode, environment, patch);
    return {
      world,
      source: { ...source.provenance, hash: source.provenance.sha256, tick: readFrame(saved).tick },
      sourceBytes,
      sourceSelection: selectBranches(saved, integerFlag(flags, "lineage", 0)),
      fixture: environment === "scheduled" ? strategyFixture(world, flags) : undefined,
    };
  } catch (error) {
    world?.dispose();
    throw error;
  } finally {
    saved.dispose();
  }
}
export function selectBranches(world: EngineWorld, lineage = 0) {
  return world.command<
    { branch: number; members: number; lineagePercent: number; cell: number; genome: number }[]
  >("studyBranches", { lineage });
}

function prepareWorld(
  world: EngineWorld,
  saved: EngineWorld,
  flags: Flags,
  mode: string,
  environment: string,
  patch: Record<string, unknown>
) {
  if (mode === "resume") {
    world.command("studyPolicy", { patch });
    installCounterfactual(world, saved, flags);
    if (environment === "scheduled") world.command("intervene", { clearSources: true });
  }
  if (mode === "contest") installContest(world, saved, flags);
  if (mode === "motor") installMotorVariants(world, flags);
}
