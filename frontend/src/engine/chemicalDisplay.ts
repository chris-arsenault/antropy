export interface ChemicalDisplay {
  species: number;
  base:
    | "matter"
    | "potential"
    | "chemical"
    | "weathering"
    | "illumination"
    | "response0"
    | "response1"
    | "none";
  impedance: boolean;
  illumination: boolean;
  stress: boolean;
  exposure: number;
}
export const initialChemicalDisplay: ChemicalDisplay = {
  species: 0,
  base: "potential",
  illumination: true,
  impedance: true,
  stress: true,
  exposure: 4,
};
export function chemicalLayers(view: ChemicalDisplay) {
  return [
    view.base === "matter",
    view.base === "potential",
    view.impedance,
    view.stress,
    view.base === "chemical",
    view.base === "weathering",
    view.base === "illumination",
    view.base === "response0",
    view.base === "response1",
    view.illumination,
  ];
}
export const quantity = (n: number) => (n === 0 ? "0" : n.toPrecision(3));
