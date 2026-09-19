export const PANELS = {
  chemistry: "Chemistry",
  web: "Web",
  population: "Population",
  lineage: "Lineage",
  cell: "Cell",
  map: "Map",
  saves: "Saves",
  settings: "Settings",
} as const;
export type PanelKey = keyof typeof PANELS;
