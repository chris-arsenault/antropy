import { type EngineWorld } from "./client";
import { type Inspection, type Summary } from "./types";

/** Only the selected display record is retained; no population/private-state mirror. */
export class SelectedObservation {
  private world: EngineWorld | null = null;
  private value: Inspection | null = null;
  private revision = "";
  private dirty = false;

  invalidate() {
    this.dirty = true;
  }

  read(world: EngineWorld, summary: Summary, id: number | null) {
    this.select(world, id);
    if (id === null) return null;
    if (this.value?.tick === summary.tick && !this.dirty) return this.value;
    const l = summary.ledger;
    const revision = `${summary.ancestryRecords}/${l.deaths}/${l.transfers}`;
    const patch = world.command<Partial<Inspection>>("inspectSelected", {
      cell: id,
      genealogy: revision !== this.revision,
      genome: this.value?.genotype?.id ?? null,
      machinery: this.installedIdentity(),
    });
    this.value = { ...this.value, ...patch } as Inspection;
    this.revision = revision;
    this.dirty = false;
    return this.value;
  }

  private installedIdentity() {
    return this.value?.cell?.machineryRevision ?? null;
  }

  private select(world: EngineWorld, id: number | null) {
    if (world !== this.world || id !== this.value?.ancestor.id) {
      this.world = world;
      this.value = null;
      this.revision = "";
    }
  }
}
