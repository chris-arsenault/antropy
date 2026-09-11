import { openSync, writeSync, closeSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  attachObserver,
  FLOW_UNITS,
  type FlowFact,
  type LifeFact,
} from "../../src/sim/observation";
import { type World } from "../../src/sim/types";
import { matrixMobility } from "../../src/sim/matrix";
import { summary } from "../../src/sim/stats";
import { encodeGenotype } from "../../src/sim/genetics/codec";
import { STUDY_SCHEMA, type StudyRow, type StudyTable } from "./studySchema";
import { locomotion } from "../../src/sim/body";

export class StudyObserver {
  private files = new Map<StudyTable, number>();
  private flows = new Map<string, { -readonly [K in keyof FlowFact]: FlowFact[K] }>();
  private exposure = new Map<number, ReturnType<typeof exposureRow>>();
  private start: number;
  private detach: () => void;
  constructor(
    private world: World,
    directory: string
  ) {
    this.start = world.tick;
    writeFileSync(
      join(directory, "schema.json"),
      JSON.stringify({ version: 1, tables: STUDY_SCHEMA, flowUnits: FLOW_UNITS })
    );
    for (const table of Object.keys(STUDY_SCHEMA) as StudyTable[])
      this.files.set(table, openSync(join(directory, `${table}.jsonl`), "wx"));
    this.detach = attachObserver(world, {
      flow: (fact) => this.flow(fact),
      life: (fact) => this.life(fact),
    });
    this.sample();
  }
  private row<T extends StudyTable>(table: T, row: StudyRow<T>): void {
    writeSync(this.files.get(table)!, JSON.stringify(row) + "\n");
  }
  private flow(fact: FlowFact): void {
    const key = `${fact.cell}:${fact.channel}`;
    const previous = this.flows.get(key);
    if (previous) previous.amount += fact.amount;
    else this.flows.set(key, { ...fact });
  }
  private life(fact: LifeFact): void {
    this.row("life", fact);
  }
  /** Called before each step: one full dt of exposure for every acting organism. */
  beforeStep(): void {
    const w = this.world,
      dt = w.config.dt;
    for (const cell of w.cells) {
      let row = this.exposure.get(cell.id);
      if (!row) {
        row = exposureRow(cell);
        this.exposure.set(cell.id, row);
      }
      row.seconds += dt;
      row.slowed_seconds += Number(matrixMobility(w, cell) <= 0.8) * dt;
      row.impaired_seconds += Number(cell.damage >= 0.2) * dt;
      row.damage_seconds += cell.damage * dt;
      row.swim_seconds += cell.action.swim * dt;
      row.turn_seconds += Math.abs(cell.action.turn) * dt;
      row.food_read_seconds += (cell.inputs[0] + cell.inputs[19]) * dt;
    }
  }
  flush(): void {
    const end_tick = this.world.tick,
      start_tick = this.start;
    for (const f of this.flows.values())
      this.row("flows", {
        start_tick,
        end_tick,
        cell: f.cell,
        lineage: f.lineage,
        genome: f.genome,
        channel: f.channel,
        amount: f.amount,
      });
    for (const row of this.exposure.values())
      this.row("exposure", { start_tick, end_tick, ...row });
    this.flows.clear();
    this.exposure.clear();
    this.start = end_tick;
  }
  sample(): void {
    const w = this.world,
      s = summary(w);
    for (const c of w.cells)
      this.row("bodies", {
        tick: w.tick,
        cell: c.id,
        genome: c.genome,
        motor: c.body.motor,
        core: c.body.core,
        speed_ceiling: locomotion(c, w.config).speed,
      });
    for (const c of w.cells)
      this.row("census", {
        tick: w.tick,
        cell: c.id,
        lineage: c.lineage,
        genome: c.genome,
        born: c.born,
        generation: c.generation,
        x: c.x,
        y: c.y,
        energy: c.energy,
        reserve: c.reserve,
        damage: c.damage,
      });
    this.row("environment", {
      tick: w.tick,
      population: s.population,
      grid_cells: w.matrix.length,
      half_speed_area: s.matrixHalfSpeedArea,
      matrix: s.matrix,
      toxin: s.toxin,
      bound_toxin: s.boundToxin,
      energy_residual: s.energyResidual,
      material_residual: s.materialResidual,
    });
  }
  close(): void {
    this.flush();
    this.detach();
    for (const r of this.world.genomes.values())
      this.row("genomes", {
        id: r.id,
        parent: r.parent,
        born: r.born,
        learned: r.learned,
        encoding: JSON.stringify(encodeGenotype(r.genome)),
      });
    for (const fd of this.files.values()) closeSync(fd);
  }
}
function exposureRow(cell: World["cells"][number]) {
  return {
    cell: cell.id,
    lineage: cell.lineage,
    genome: cell.genome,
    seconds: 0,
    slowed_seconds: 0,
    impaired_seconds: 0,
    damage_seconds: 0,
    swim_seconds: 0,
    turn_seconds: 0,
    food_read_seconds: 0,
  };
}
