import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { restoreWorld } from "../../src/persist/checkpoint";
import { createWorld } from "../../src/sim/world";
import { controller } from "../../src/sim/controller";
import { type Genotype } from "../../src/sim/genetics/genotype";
import { type World } from "../../src/sim/types";
import { flag, integerFlag, type Flags } from "./flags";
import { strategyFixture, installMotorVariants } from "./strategyFixture";

export const hashText = (text: string): string => createHash("sha256").update(text).digest("hex");

export function loadStudyWorld(flags: Flags) {
  const path = flag(flags, "checkpoint", "../.sulion-paste/bacteria-101-48661.json");
  const text = readFileSync(path, "utf8"),
    saved = restoreWorld(text);
  const mode = flag(flags, "mode", "baseline"),
    seed = integerFlag(flags, "seed", 101);
  const config = { ...saved.config };
  const scheduled = flag(flags, "environment", "default") === "scheduled";
  if (scheduled) config.sourceCount = 0;
  if (freezeInheritance(flags, mode)) {
    config.mutationRate = 0;
    config.physicalMutationRate = 0;
    config.learningRetention = 0;
  }
  const world = mode === "resume" ? saved : createWorld(seed, config);
  if (mode === "resume") Object.assign(world.config, config);
  if (mode === "contest") installContest(world, saved, flags);
  if (mode === "motor") installMotorVariants(world, flags);
  if (mode === "resume") installCounterfactual(world, saved, flags);
  if (!["baseline", "contest", "resume", "motor", "discovery"].includes(mode))
    throw new Error("Unknown study mode");
  applyKnockout(world, flag(flags, "knockout", "none"));
  return {
    world,
    source: { path, hash: hashText(text), tick: saved.tick },
    sourceText: text,
    sourceSelection: selectBranches(saved),
    fixture: scheduled ? strategyFixture(world, flags) : undefined,
  };
}
function freezeInheritance(flags: Flags, mode: string): boolean {
  return flag(flags, "frozen", "false") === "true" || !["baseline", "discovery"].includes(mode);
}
function applyKnockout(world: World, knockout: string): void {
  if (knockout === "damage") world.config.damageRate = 0;
  if (knockout === "binding") world.config.matrixBinding = 0;
  if (!["none", "damage", "binding"].includes(knockout)) throw new Error("Unknown knockout");
}
function hybrid(ancestor: Genotype, descendant: Genotype, part: string): Genotype {
  if (part === "whole") return descendant;
  if (!["behavior", "physical"].includes(part)) throw new Error("Unknown inherited part");
  return {
    chromosomes: descendant.chromosomes.map((c, i) => ({
      behavior: part === "behavior" ? c.behavior : ancestor.chromosomes[i].behavior,
      physical: part === "physical" ? c.physical : ancestor.chromosomes[i].physical,
    })),
  };
}
function installContest(world: World, saved: World, flags: Flags): void {
  const candidate = saved.genomes.get(integerFlag(flags, "candidate", 895));
  if (!candidate) throw new Error("Missing candidate genotype");
  const ancestor = saved.genomes.get(1)!.genome;
  world.genomes.set(1, { id: 1, parent: null, born: 0, genome: ancestor, learned: 0 });
  world.genomes.set(2, {
    id: 2,
    parent: null,
    born: 0,
    genome: hybrid(ancestor, candidate.genome, flag(flags, "part", "whole")),
    learned: 0,
  });
  world.nextGenome = 3;
  const swap = Number(flag(flags, "swap", "false") === "true");
  for (const [i, cell] of world.cells.entries()) {
    cell.genome = ((i + swap) % 2) + 1;
    world.ancestry.get(cell.id)!.genome = cell.genome;
  }
}
/** Both arms reset private memory; preserve every body, position, field and identity. */
function installCounterfactual(world: World, saved: World, flags: Flags): void {
  const replacement = flag(flags, "replace", "none");
  if (!["none", "founder", "physical", "behavior"].includes(replacement))
    throw new Error("Unknown replacement");
  const ancestor = saved.genomes.get(1)!.genome;
  if (replacement !== "none") replaceLeader(world, ancestor, replacement);
  for (const cell of world.cells) cell.brain = controller.createState();
}
function replaceLeader(world: World, ancestor: Genotype, replacement: string): void {
  for (const record of world.genomes.values()) {
    const inLeader = world.cells.some((c) => c.genome === record.id && c.lineage === 18);
    if (!inLeader) continue;
    record.genome =
      replacement === "founder" ? ancestor : hybrid(ancestor, record.genome, replacement);
  }
}

export function selectBranches(world: World) {
  const cells = world.cells.filter((c) => c.lineage === 18),
    groups = new Map<number, typeof cells>();
  for (const cell of cells) {
    const chain = [cell.id];
    while (world.ancestry.get(chain.at(-1)!)!.parent !== null)
      chain.push(world.ancestry.get(chain.at(-1)!)!.parent!);
    const branch = chain[Math.max(0, chain.length - 4)];
    const members = groups.get(branch) ?? [];
    members.push(cell);
    groups.set(branch, members);
  }
  return [...groups]
    .sort((a, b) => b[1].length - a[1].length || a[0] - b[0])
    .slice(0, 3)
    .map(([branch, members]) => {
      members.sort((a, b) => a.born - b.born || a.id - b.id);
      const cell = members[Math.floor(members.length / 2)];
      return {
        branch,
        members: members.length,
        lineagePercent: (100 * members.length) / cells.length,
        cell: cell.id,
        genome: cell.genome,
      };
    });
}
