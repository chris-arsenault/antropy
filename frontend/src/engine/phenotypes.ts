import { type Flows } from "./types";

export type PhenotypeSelection =
  | { kind: "all" }
  | { kind: "role"; input: number; output: number }
  | { kind: "region"; id: number }
  | { kind: "pin" };
export type Quantiles = [number, number, number] | null;
export interface FlowWindow {
  start: number;
  end: number;
  seconds: number;
  complete: boolean;
}
export interface SpeciesFlow {
  rows: [number, number][];
  total: number;
  other: number;
}
export interface Activity {
  imports: SpeciesFlow;
  exports: SpeciesFlow;
  inputWork: {
    startingIdentities: number[];
    starting: { captured: number; spent: number; external: number };
    nonstarting: { captured: number; spent: number; external: number };
    captured: SpeciesFlow;
    spent: SpeciesFlow;
    external: SpeciesFlow;
  };
  flows: Flows;
  overflow: number;
  division: number;
  organismSeconds: number;
}
export interface PhenotypeGroup {
  count: number;
  actual: Quantiles[];
  target: Quantiles[];
  illumination: number | null;
  activity: Activity | null;
}
export interface PinMetadata {
  id: string;
  label: string;
  started: number;
  roots: number;
}
export interface SavedPin extends Omit<PinMetadata, "roots"> {
  roots: number[];
}
export interface PhenotypePoint {
  id: string;
  count: number;
  actual: Quantiles[];
  target: Quantiles[];
}
export interface PhenotypeReport {
  tick: number;
  selection: PhenotypeSelection;
  highlight: boolean;
  window: FlowWindow;
  groups: [PhenotypeGroup, PhenotypeGroup, PhenotypeGroup];
  pin: PinMetadata | null;
}
export const PHENOTYPE_TRAITS = [
  "Body mass",
  "Motor / mass",
  "Storage / mass",
  "Strongest membrane identity X",
  "Strongest membrane identity Y",
  "Usable energy / capacity",
  "Damage",
  "Mouth / mass",
  "Ear / mass",
  "Strategic context 0",
  "Strategic context 1",
  "Strategic context 2",
  "Strategic context 3",
  "Reflex learning gain",
  "Strategic hidden retention",
];

export function selectionLabel(selection: PhenotypeSelection): string {
  switch (selection.kind) {
    case "all":
      return "Whole population";
    case "role":
      return `Primary role #${selection.input} → #${selection.output}`;
    case "region":
      return `Region ${selection.id}`;
    case "pin":
      return "Pinned descendants";
  }
}
