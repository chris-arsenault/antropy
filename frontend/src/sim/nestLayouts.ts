import { type ChamberRole } from "./types";
import { type EnvironmentConfig } from "./environmentConfig";
import { varyNest } from "./nestVariation";
import { FOUNDING_NEST } from "./foundingNest";

export interface ChamberSpec {
  readonly id: string;
  readonly role: ChamberRole;
  readonly dx: number;
  readonly depth: number;
  readonly rx: number;
  readonly ry: number;
}

export interface NodeSpec {
  readonly id: string;
  readonly dx: number;
  readonly depth: number;
}

const COMPACT_CHAMBERS: readonly ChamberSpec[] = [
  { id: "upper-east-brood", role: "brood", dx: 24, depth: 12, rx: 5, ry: 2 },
  { id: "upper-west-brood", role: "brood", dx: -25, depth: 17, rx: 5, ry: 2 },
  { id: "middle-east-pupae", role: "pupae", dx: 38, depth: 29, rx: 6, ry: 2 },
  { id: "lower-east-food", role: "food", dx: 30, depth: 43, rx: 6, ry: 2 },
  { id: "lower-west-food", role: "food", dx: -33, depth: 39, rx: 6, ry: 2 },
  { id: "queen-chamber", role: "queen", dx: 2, depth: 49, rx: 6, ry: 3 },
];
const COMPACT_JUNCTIONS: readonly NodeSpec[] = [
  { id: "fork", dx: -2, depth: 9 },
  { id: "west", dx: -13, depth: 24 },
  { id: "east", dx: 15, depth: 23 },
  { id: "lower", dx: -4, depth: 36 },
];
const COMPACT_PASSAGES: readonly (readonly [string, string])[] = [
  ["entrance", "fork"],
  ["fork", "upper-east-brood"],
  ["fork", "upper-west-brood"],
  ["upper-west-brood", "west"],
  ["upper-east-brood", "east"],
  ["west", "east"],
  ["east", "middle-east-pupae"],
  ["west", "lower-west-food"],
  ["east", "lower"],
  ["lower", "lower-west-food"],
  ["lower", "lower-east-food"],
  ["lower-west-food", "queen-chamber"],
  ["lower-east-food", "queen-chamber"],
];

export function layoutSpecs(layout: EnvironmentConfig["nestShape"], seed = 0) {
  const specs = fixedLayout(layout);
  return seed === 0 ? specs : varyNest(specs, seed);
}

function fixedLayout(layout: EnvironmentConfig["nestShape"]) {
  if (layout === "founding") return FOUNDING_NEST;
  if (layout === "narrow")
    return {
      chambers: CHAMBER_SPECS.map((room) => ({
        ...room,
        rx: Math.max(2, Math.floor(room.rx / 2)),
        ry: Math.max(2, Math.floor(room.ry / 2)),
      })),
      junctions: JUNCTION_SPECS,
      passages: PASSAGE_SPECS,
    };
  return layout === "reference"
    ? { chambers: CHAMBER_SPECS, junctions: JUNCTION_SPECS, passages: PASSAGE_SPECS }
    : { chambers: COMPACT_CHAMBERS, junctions: COMPACT_JUNCTIONS, passages: COMPACT_PASSAGES };
}

export const CHAMBER_SPECS: readonly ChamberSpec[] = [
  { id: "upper-east-brood", role: "brood", dx: 62, depth: 18, rx: 16, ry: 5 },
  { id: "upper-west-brood", role: "brood", dx: -66, depth: 24, rx: 15, ry: 6 },
  { id: "middle-east-pupae", role: "pupae", dx: 86, depth: 39, rx: 18, ry: 6 },
  { id: "middle-west-brood", role: "brood", dx: -91, depth: 44, rx: 20, ry: 7 },
  { id: "lower-east-food", role: "food", dx: 82, depth: 63, rx: 21, ry: 7 },
  { id: "lower-west-food", role: "food", dx: -88, depth: 66, rx: 18, ry: 7 },
  { id: "deep-west-brood", role: "brood", dx: -58, depth: 84, rx: 18, ry: 7 },
  { id: "queen-chamber", role: "queen", dx: 48, depth: 88, rx: 24, ry: 8 },
];

export const JUNCTION_SPECS: readonly NodeSpec[] = [
  { id: "entrance-neck", dx: -5, depth: 7 },
  { id: "upper-fork", dx: 7, depth: 16 },
  { id: "east-upper-junction", dx: 35, depth: 23 },
  { id: "west-upper-junction", dx: -31, depth: 27 },
  { id: "west-drop-junction", dx: -36, depth: 42 },
  { id: "middle-crossing", dx: 4, depth: 38 },
  { id: "east-middle-junction", dx: 42, depth: 43 },
  { id: "west-middle-junction", dx: -48, depth: 48 },
  { id: "lower-crossing", dx: -7, depth: 59 },
  { id: "east-lower-junction", dx: 43, depth: 65 },
  { id: "west-lower-junction", dx: -47, depth: 68 },
  { id: "east-drop-junction", dx: 39, depth: 78 },
  { id: "deep-crossing", dx: 5, depth: 84 },
];

export const PASSAGE_SPECS: readonly (readonly [string, string])[] = [
  ["entrance", "entrance-neck"],
  ["entrance-neck", "upper-fork"],
  ["upper-fork", "east-upper-junction"],
  ["upper-fork", "west-upper-junction"],
  ["upper-fork", "middle-crossing"],
  ["east-upper-junction", "upper-east-brood"],
  ["east-upper-junction", "east-middle-junction"],
  ["west-upper-junction", "upper-west-brood"],
  ["west-upper-junction", "west-drop-junction"],
  ["west-drop-junction", "west-middle-junction"],
  ["west-drop-junction", "middle-crossing"],
  ["middle-crossing", "east-middle-junction"],
  ["middle-crossing", "west-middle-junction"],
  ["east-middle-junction", "middle-east-pupae"],
  ["west-middle-junction", "middle-west-brood"],
  ["east-middle-junction", "west-middle-junction"],
  ["east-middle-junction", "lower-crossing"],
  ["west-middle-junction", "lower-crossing"],
  ["lower-crossing", "east-lower-junction"],
  ["lower-crossing", "west-lower-junction"],
  ["east-lower-junction", "lower-east-food"],
  ["west-lower-junction", "lower-west-food"],
  ["east-lower-junction", "west-lower-junction"],
  ["east-lower-junction", "east-drop-junction"],
  ["east-drop-junction", "deep-crossing"],
  ["west-lower-junction", "deep-crossing"],
  ["west-lower-junction", "deep-west-brood"],
  ["deep-crossing", "deep-west-brood"],
  ["deep-crossing", "queen-chamber"],
  ["east-drop-junction", "queen-chamber"],
  ["deep-west-brood", "queen-chamber"],
];
