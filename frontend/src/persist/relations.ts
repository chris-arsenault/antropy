import { type Checkpoint } from "./checkpoint";
import { type Ancestor } from "../sim/types";
import { decodeGenotype } from "../sim/genetics/codec";
import { checkpointAncestry } from "./checkpointAncestry";

function requireRelation(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Invalid bacterial checkpoint: ${message}`);
}
function checkParent(
  a: Ancestor,
  ancestors: Map<number, Ancestor>,
  budding: boolean
): number | null {
  if (a.parent === null) {
    requireRelation(a.lineage === a.id && a.born === 0, "invalid founder ancestry");
    return null;
  }
  const parent = ancestors.get(a.parent);
  requireRelation(!!parent && a.parent < a.id, "invalid parent reference");
  requireRelation(parent!.lineage === a.lineage, "inconsistent descendant lineage");
  requireRelation(
    parent!.born <= a.born &&
      (budding
        ? parent!.ended === null || parent!.ended >= a.born
        : parent!.cause === "division" && parent!.ended === a.born),
    "invalid parent lifetime"
  );
  return parent!.id;
}
function checkAncestry(data: Checkpoint, ancestors: Map<number, Ancestor>): Uint32Array {
  const live = new Set(data.cells.map((c) => c.id));
  const generations = new Uint32Array(data.nextCell);
  const genomes = new Map(data.genomes.map((g) => [g.id, g]));
  for (const a of ancestors.values()) {
    const parent = checkParent(a, ancestors, data.config.reproduction === "budding");
    generations[a.id] = parent === null ? 0 : generations[parent] + 1;
    requireRelation(a.born <= data.tick && a.id < data.nextCell, "invalid ancestor time or ID");
    // Dead organisms may reference pruned genotype records; living ones must not. A genotype
    // born after its organism is only possible through gene transfer.
    const genome = genomes.get(a.genome);
    requireRelation(
      a.genome < data.nextGenome &&
        (!genome || genome.born <= a.born || data.config.transferRate > 0),
      "invalid ancestry genome"
    );
    requireRelation(!live.has(a.id) || !!genome, "missing living cell genome");
    requireRelation((a.cause === "alive") === live.has(a.id), "living ancestry/body mismatch");
    checkEnd(a, data.tick);
  }
  return generations;
}
function checkEnd(a: Ancestor, tick: number): void {
  if (a.cause === "alive") requireRelation(a.ended === null, "living ancestor has end time");
  else
    requireRelation(
      a.ended !== null && a.ended >= a.born && a.ended <= tick,
      "invalid ancestor end time"
    );
}
function checkCells(
  data: Checkpoint,
  generations: Uint32Array,
  ancestors: Map<number, Ancestor>
): void {
  for (const c of data.cells) {
    const a = ancestors.get(c.id);
    requireRelation(!!a, "missing cell record");
    for (const key of ["parent", "lineage", "genome", "born"] as const)
      requireRelation(c[key] === a![key], `inconsistent cell ${key}`);
    requireRelation(c.generation === generations[c.id], "inconsistent cell generation");
  }
}
function checkGenomes(data: Checkpoint): void {
  const genomes = new Map(data.genomes.map((g) => [g.id, g]));
  for (const g of data.genomes) {
    requireRelation(
      decodeGenotype(g.genome).chromosomes.length === (data.config.ploidy === "haploid" ? 1 : 2),
      "genotype and configuration ploidy disagree"
    );
    requireRelation(g.id < data.nextGenome && g.born <= data.tick, "invalid genome ID or time");
    if (g.parent === null) {
      requireRelation(g.learned === 0, "founder cannot have a learning transfer");
      continue;
    }
    // A parent record may have been pruned once no living cell carried it.
    const parent = genomes.get(g.parent);
    requireRelation(g.parent < g.id, "invalid genome parent");
    requireRelation(!parent || parent.born <= g.born, "invalid genome ancestry time");
  }
}
function checkInterventions(data: Checkpoint, ancestors: Map<number, Ancestor>): void {
  let previousTick = 0;
  for (const intervention of data.interventions) {
    const a = ancestors.get(intervention.cell);
    requireRelation(!!a && a.born <= intervention.tick, "invalid intervention cell");
    requireRelation(
      intervention.tick >= previousTick && intervention.tick <= data.tick,
      "invalid intervention time"
    );
    requireRelation(
      a!.ended === null || intervention.tick <= a!.ended,
      "intervention after cell lifetime"
    );
    previousTick = intervention.tick;
  }
}
export function validateRelations(data: Checkpoint): void {
  for (const records of [data.genomes, data.cells])
    requireRelation(
      new Set(records.map((r) => r.id)).size === records.length,
      "duplicate identities"
    );
  requireRelation(
    data.cells.length <= data.config.maxPopulation,
    "population exceeds safety limit"
  );
  requireRelation(data.sources.length === data.config.sourceCount, "inconsistent source count");
  const ancestors = checkpointAncestry(data);
  requireRelation(ancestors.size === data.nextCell - 1, "incomplete organism ancestry");
  checkCells(data, checkAncestry(data, ancestors), ancestors);
  checkGenomes(data);
  checkInterventions(data, ancestors);
}
