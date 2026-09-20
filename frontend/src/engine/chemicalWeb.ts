import { type EngineWorld } from "./client";

export type WebMode = "measured" | "primary" | "supported" | "environment";
export interface WebQuery {
  mode: WebMode;
  focus: number | null;
  offset: number;
}
export interface ChemicalRoute {
  amount?: number;
  input: number;
  output: number;
  cells: number;
  primary: number;
  capacity: number;
}
export interface ChemicalWeb extends WebQuery {
  window?: import("./phenotypes").FlowWindow | null;
  activity?: import("./phenotypes").Activity | null;
  tick: number;
  population: number;
  assigned: number;
  unassigned: number;
  pairs: number;
  rows: ChemicalRoute[];
  sources: number[];
}

/** Opt-in reduced observation; never part of a physical checkpoint or world-render frame. */
export class ChemicalWebObservation {
  get measuring() {
    return this.query?.mode === "measured";
  }
  private query: WebQuery | null = null;
  private world: EngineWorld | null = null;
  private cached: ChemicalWeb | null = null;

  select(value: Record<string, unknown>) {
    if (value.enabled === false) {
      this.query = null;
      this.cached = null;
      this.world = null;
      return;
    }
    const { mode, focus, offset } = value;
    if (mode !== "measured" && mode !== "primary" && mode !== "supported" && mode !== "environment")
      throw new Error("Unknown chemical web view");
    if (focus !== null && !inRange(focus, 255))
      throw new Error("Chemical must be an integer from 0 to 255");
    if (!inRange(offset, 65536)) throw new Error("Chemical web page is outside its bounds");
    const query: WebQuery = { mode, focus, offset };
    if (JSON.stringify(query) !== JSON.stringify(this.query)) this.cached = null;
    this.query = query;
  }

  read(world: EngineWorld, tick: number) {
    if (!this.query) return null;
    if (this.world !== world || this.cached?.tick !== tick) {
      this.cached = world.command<ChemicalWeb>("chemicalWeb", { ...this.query });
      this.world = world;
    }
    return this.cached;
  }
}

function inRange(value: unknown, maximum: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= maximum;
}

export function routeWeight(web: ChemicalWeb, route: ChemicalRoute) {
  if (web.mode === "measured") return route.amount ?? 0;
  return web.mode === "primary" ? route.primary : route.cells;
}
export function routeRate(web: ChemicalWeb, route: ChemicalRoute) {
  return ((route.amount ?? 0) / Math.max(1e-30, web.window?.seconds ?? 0)).toPrecision(3);
}
export function routeCaption(web: ChemicalWeb, route: ChemicalRoute) {
  if (web.mode === "environment") return "local-medium pathway";
  if (web.mode === "measured") return `${routeRate(web, route)} material / s`;
  return `${route.primary} primary cells · ${route.cells} supporting cells`;
}
export function routeValue(web: ChemicalWeb, route: ChemicalRoute) {
  if (web.mode === "environment") return "Environmental conversion";
  if (web.mode === "measured") return routeRate(web, route);
  return route.primary.toLocaleString();
}
