import { type EngineWorld } from "./client";
import { localIdentity } from "../persist/identity";
import { type SpatialState } from "./types";
import {
  type PhenotypeReport,
  type PhenotypeSelection,
  type SavedPin,
  selectionLabel,
} from "./phenotypes";

/** Worker-local membership. Only reduced reports enter the publication stream. */
export class PhenotypeObservation {
  enabled = false;
  private selection: PhenotypeSelection = { kind: "all" };
  private highlight = false;
  private configured = "";
  private cached: PhenotypeReport | null = null;
  pin: SavedPin | null = null;

  restore(world: EngineWorld, pin: SavedPin | null) {
    if (pin) world.command("phenotype", { action: "restorePin", pin });
    this.pin = pin;
  }

  configure(world: EngineWorld, spatial: SpatialState, web: boolean) {
    const selection = this.selection;
    const members =
      selection.kind === "region"
        ? (spatial.regions.find((r) => r.id === selection.id)?.members ?? [])
        : [];
    const config = {
      action: "configure",
      enabled: this.enabled || web,
      highlight: this.highlight,
      selection,
      members,
    };
    const key = JSON.stringify(config);
    if (key === this.configured) return;
    // Leave an unopened observer unallocated in ordinary map-only runs.
    if (!this.configured && !config.enabled && !this.pin && !this.highlight) return;
    world.command("phenotype", config);
    this.configured = key;
    this.cached = null;
  }

  change(world: EngineWorld, payload: Record<string, unknown>) {
    switch (payload.action) {
      case "panel":
        this.enabled = payload.enabled === true;
        break;
      case "select":
        this.selection = parseSelection(payload.selection);
        break;
      case "highlight":
        this.highlight = payload.enabled === true;
        break;
      case "pin":
        this.capture(world);
        break;
      case "unpin":
        world.command("phenotype", { action: "unpin" });
        this.pin = null;
        if (this.selection.kind === "pin") this.selection = { kind: "all" };
        break;
      default:
        throw new Error("Unknown phenotype control");
    }
    this.cached = null;
  }

  private capture(world: EngineWorld) {
    world.command("phenotype", {
      action: "pin",
      id: localIdentity(),
      label: selectionLabel(this.selection),
    });
    const read = (offset: number) =>
      world.command<SavedPin & { total: number }>("phenotype", { action: "pinRoots", offset });
    const first = read(0);
    const roots = [...first.roots];
    while (roots.length < first.total) roots.push(...read(roots.length).roots);
    this.pin = { id: first.id, label: first.label, started: first.started, roots };
  }

  read(world: EngineWorld, tick: number): PhenotypeReport | null {
    if (!this.enabled && !this.pin && !this.highlight) return null;
    if (!this.enabled && !this.pin && this.cached) return this.cached;
    if (this.cached?.tick !== tick) this.cached = world.command("phenotype", { action: "report" });
    return this.cached;
  }

  point(world: EngineWorld, tick: number) {
    if (!this.pin) return undefined;
    const group = this.read(world, tick)?.groups[2];
    if (!group) return undefined;
    return { id: this.pin.id, count: group.count, actual: group.actual, target: group.target };
  }
}

function parseSelection(value: unknown): PhenotypeSelection {
  if (!value || typeof value !== "object") throw new Error("Missing phenotype selection");
  const s = value as Record<string, unknown>;
  if (s.kind === "all" || s.kind === "pin") return { kind: s.kind };
  if (s.kind === "region" && integer(s.id, 1, Number.MAX_SAFE_INTEGER))
    return { kind: "region", id: s.id };
  if (s.kind === "role" && integer(s.input, 0, 255) && integer(s.output, 0, 255))
    return { kind: "role", input: s.input, output: s.output };
  throw new Error("Invalid phenotype selection");
}
function integer(n: unknown, minimum: number, maximum: number): n is number {
  return typeof n === "number" && Number.isSafeInteger(n) && n >= minimum && n <= maximum;
}
