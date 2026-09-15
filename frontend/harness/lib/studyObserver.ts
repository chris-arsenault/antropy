import { openSync, writeSync, closeSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { type EngineWorld } from "../../src/engine/client";
import { type Definition, type Genotype } from "../../src/engine/types";
import { STUDY_SCHEMA, type StudyTable, type StudyRow } from "./studySchema";

const FLOW_UNITS = {
  imported: "material",
  exported: "material",
  reacted: "material",
  constructed: "material",
  motors: "energy",
  transport: "energy",
  reaction_heat: "energy",
  maintenance: "energy",
  learning: "energy",
  construction: "energy",
  repair: "energy",
  division: "energy",
  captured: "energy",
  damage: "fraction",
  repaired: "fraction",
  distance: "world units",
};
export class StudyObserver {
  private files = new Map<StudyTable, number>();
  private closed = false;
  constructor(
    private world: EngineWorld,
    directory: string
  ) {
    const definition = world.command<Definition>("definition");
    writeFileSync(
      join(directory, "schema.json"),
      JSON.stringify({
        version: 3,
        chemistry: definition.chemistry,
        tables: STUDY_SCHEMA,
        flowUnits: FLOW_UNITS,
        units: {
          world_area: "world units squared",
          half_speed_area: "world area",
          speed_ceiling: "world units/model second before energy affordability",
        },
      })
    );
    try {
      for (const table of Object.keys(STUDY_SCHEMA) as StudyTable[])
        this.files.set(table, openSync(join(directory, `${table}.jsonl`), "wx"));
      world.command("traceStart", { study: true });
      this.sample();
    } catch (error) {
      for (const fd of this.files.values()) closeSync(fd);
      throw error;
    }
  }
  private row<T extends StudyTable>(table: T, row: StudyRow<T>) {
    writeSync(this.files.get(table)!, JSON.stringify(row) + "\n");
  }
  /** Exposure and transfers are captured inside each ordinary kernel step. */
  beforeStep(): void {}
  flush() {
    const data = this.world.command<{
      flows: StudyRow<"flows">[];
      exposure: StudyRow<"exposure">[];
      life: StudyRow<"life">[];
      genomes: Genotype[];
    }>("studyDrain");
    for (const key of ["flows", "exposure", "life"] as const)
      for (const row of data[key]) this.row(key, row);
    for (const g of data.genomes)
      this.row("genomes", {
        id: g.id,
        parent: g.parent,
        born: g.born,
        learned: g.learned,
        encoding: JSON.stringify(g),
      });
  }
  sample() {
    const data = this.world.command<{
      bodies: StudyRow<"bodies">[];
      census: StudyRow<"census">[];
      environment: StudyRow<"environment">[];
    }>("studySample");
    for (const key of ["bodies", "census", "environment"] as const)
      for (const row of data[key]) this.row(key, row);
  }
  close() {
    if (this.closed) return;
    try {
      this.flush();
    } finally {
      try {
        this.world.command("traceStop");
      } finally {
        for (const fd of this.files.values()) closeSync(fd);
        this.closed = true;
      }
    }
  }
}
