import { type ChamberSpec, type NodeSpec } from "./nestLayouts";

/** A small occupied starting nest; further nursery and storage space must be made or discovered. */
export const FOUNDING_NEST = {
  chambers: [
    { id: "upper-east-brood", role: "brood", dx: 7, depth: 12, rx: 2, ry: 1 },
    { id: "lower-west-food", role: "food", dx: -7, depth: 18, rx: 2, ry: 1 },
    { id: "queen-chamber", role: "queen", dx: 3, depth: 22, rx: 2, ry: 1 },
  ] satisfies readonly ChamberSpec[],
  junctions: [{ id: "fork", dx: 0, depth: 8 }] satisfies readonly NodeSpec[],
  passages: [
    ["entrance", "fork"],
    ["fork", "upper-east-brood"],
    ["fork", "lower-west-food"],
    ["lower-west-food", "queen-chamber"],
    ["upper-east-brood", "queen-chamber"],
  ] satisfies readonly (readonly [string, string])[],
};
