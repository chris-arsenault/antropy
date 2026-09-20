import { type EngineWorld } from "../../src/engine/client";
import { type CellState, type Definition, type Summary } from "../../src/engine/types";
import { type QuickScenario, percent } from "./quickScenario";

interface TraceGroup {
  lineage: number;
  initialGenome: number;
  initialCells: number;
  living: number;
  founders: { id: number; firstUptake: number | null; arrival: number | null }[];
  ledger: Summary["ledger"];
  chemical: CellState["chemicalFlows"];
  reactions: { species: number; product: number; amount: number }[];
  organismSeconds: number;
  damageSeconds: number;
  slowedSeconds: number;
}
interface AssayCell {
  cell: CellState;
  localInputsNow: number[];
  local: number[];
  impedance: number;
  mobility: number;
  stressLoad: number;
}
export interface SpeciesFlow {
  channel: string;
  species: number;
  product: number | null;
  amount: number;
}

function combine(groups: TraceGroup[]): TraceGroup[] {
  const map = new Map<number, TraceGroup>();
  for (const group of groups) {
    const previous = map.get(group.initialGenome);
    if (!previous) {
      map.set(group.initialGenome, group);
      continue;
    }
    for (const key of [
      "initialCells",
      "living",
      "organismSeconds",
      "damageSeconds",
      "slowedSeconds",
    ] as const)
      previous[key] += group[key];
    for (const key of ["births", "deaths", "divisions"] as const)
      previous.ledger[key] += group.ledger[key];
    for (const key of Object.keys(group.ledger.flows) as (keyof CellState["flows"])[])
      previous.ledger.flows[key] += group.ledger.flows[key];
    mergeChemical(previous, group);
    previous.founders.push(...group.founders);
    mergeReactions(previous, group);
  }
  return [...map.values()];
}
function speciesFlows(group: TraceGroup): SpeciesFlow[] {
  const result: SpeciesFlow[] = [];
  for (const channel of ["imported", "exported"] as const)
    group.chemical[channel].forEach((amount, species) => {
      if (amount > 0) result.push({ channel, species, product: null, amount });
    });
  result.push(...group.reactions.map((r) => ({ channel: "reaction", ...r })));
  return result;
}
function result(group: TraceGroup, definition: Definition) {
  const flows = group.ledger.flows;
  const importedPotential = group.chemical.imported.reduce(
    (sum, amount, species) => sum + amount * definition.chemistry.properties[species].potential,
    0
  );
  const perCell = (n: number) => (group.initialCells ? n / group.initialCells : null);
  return {
    genome: group.initialGenome,
    initialCells: group.initialCells,
    living: group.living,
    flows,
    organismSeconds: group.organismSeconds,
    meanDamagePercent: percent(group.damageSeconds, group.organismSeconds),
    slowedOrganismTimePercent: percent(group.slowedSeconds, group.organismSeconds),
    speciesFlows: speciesFlows(group),
    importedPotential,
    motorPercentImportedPotential: percent(flows.motors, importedPotential),
    constructedMaterialPerInitialCell: perCell(flows.constructed),
    birthsPerInitialCell: perCell(group.ledger.births),
    divisionsPerInitialCell: perCell(group.ledger.divisions),
    founderArrivalsPercent: percent(
      group.founders.filter((f) => f.arrival !== null).length,
      group.initialCells
    ),
    founderArrivalTicks: group.founders.map((f) => f.arrival),
    founderFirstUptakeTicks: group.founders.map((f) => f.firstUptake),
  };
}

export class QuickObserver {
  private definition: Definition;
  private initialGroups: Map<number, number>;
  constructor(
    private world: EngineWorld,
    private scenario: QuickScenario
  ) {
    this.definition = world.command("definition");
    const { x, y, radius } = scenario.target;
    world.command("traceStart", { target: [x, y, radius] });
    this.initialGroups = new Map(
      world.command<TraceGroup[]>("trace").map((g) => [g.lineage, g.initialGenome])
    );
  }
  frame() {
    const frame = this.world.command<{ tick: number; cells: AssayCell[] }>("assayFrame");
    const { width, height } = this.definition.config;
    const axis = (a: number, b: number, size: number) => {
      const d = Math.abs(a - b) % size;
      return Math.min(d, size - d);
    };
    return {
      tick: frame.tick,
      cells: frame.cells.map(({ cell, local, ...probe }) => ({
        id: cell.id,
        parent: cell.parent,
        lineage: cell.lineage,
        genome: cell.genome,
        generation: cell.generation,
        born: cell.born,
        x: cell.x,
        y: cell.y,
        heading: cell.heading,
        body: cell.body,
        energy: cell.energy,
        damage: cell.damage,
        action: cell.action,
        inputs: cell.inputs,
        receptors: cell.receptors,
        photoreceptor: cell.photoreceptor,
        contacts: cell.contacts,
        flows: cell.flows,
        task: cell.brain.task,
        ...probe,
        group: this.initialGroups.get(cell.lineage),
        inventory: cell.inventory.amounts.flatMap((amount, s) => (amount ? [[s, amount]] : [])),
        localMixture: local.flatMap((amount, s) => (amount ? [[s, amount]] : [])),
        targetDistance: Math.hypot(
          axis(cell.x, this.scenario.target.x, width),
          axis(cell.y, this.scenario.target.y, height)
        ),
      })),
    };
  }
  result() {
    return combine(this.world.command<TraceGroup[]>("trace")).map((g) =>
      result(g, this.definition)
    );
  }
  close() {
    this.world.command("traceStop");
  }
}

function mergeReactions(previous: TraceGroup, group: TraceGroup) {
  for (const edge of group.reactions) {
    const old = previous.reactions.find(
      (r) => r.species === edge.species && r.product === edge.product
    );
    if (old) old.amount += edge.amount;
    else previous.reactions.push(edge);
  }
}

function mergeChemical(previous: TraceGroup, group: TraceGroup) {
  for (const key of ["imported", "exported", "consumed", "produced"] as const)
    group.chemical[key].forEach((amount, species) => {
      previous.chemical[key][species] += amount;
    });
}
