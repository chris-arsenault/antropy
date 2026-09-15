export interface ChemicalDisplay {
  species: number;
  base: "matter" | "potential" | "chemical" | "none";
  impedance: boolean;
  stress: boolean;
  exposure: number;
}
export const initialChemicalDisplay: ChemicalDisplay = {
  species: 0,
  base: "matter",
  impedance: false,
  stress: false,
  exposure: 4,
};
export function chemicalLayers(view: ChemicalDisplay) {
  return [
    view.base === "matter",
    view.base === "potential",
    view.impedance,
    view.stress,
    view.base === "chemical",
  ];
}
export const quantity = (n: number) => (n === 0 ? "0" : n.toPrecision(3));
