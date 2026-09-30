export interface ChemicalDisplay {
  species: number;
  base:
    | "landscape"
    | "matter"
    | "potential"
    | "chemical"
    | "weathering"
    | "illumination"
    | "terrain"
    | "cover"
    | "emission"
    | "height"
    | "conductance"
    | "slope"
    | "supply"
    | "seasonAmplitude"
    | "seasonPhase"
    | "ceiling"
    | "none";
  impedance: boolean;
  illumination: boolean;
  stress: boolean;
  exposure: number;
}
export const initialChemicalDisplay: ChemicalDisplay = {
  species: 0,
  base: "landscape",
  illumination: true,
  impedance: false,
  stress: false,
  exposure: 4,
};
export function chemicalLayers(view: ChemicalDisplay) {
  return [
    view.base === "matter",
    view.base === "potential" || view.base === "landscape",
    view.impedance,
    view.stress,
    view.base === "chemical",
    view.base === "weathering",
    view.base === "illumination",
    view.illumination,
    view.base === "terrain",
    view.base === "cover",
    view.base === "emission",
    view.base === "height",
    view.base === "conductance",
    view.base === "slope",
    view.base === "supply",
    view.base === "seasonAmplitude",
    view.base === "seasonPhase",
    view.base === "ceiling",
    view.base === "landscape",
  ];
}
export const quantity = (n: number) => (n === 0 ? "0" : n.toPrecision(3));
