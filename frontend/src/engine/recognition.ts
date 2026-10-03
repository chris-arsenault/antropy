import { type Definition, type Machinery } from "./types";
import { type RecognitionProfile } from "./bindingTypes";
import { machineryLabel } from "./bodyParts";
import { numberText as n } from "./Table";

export const ATLAS_PROPERTIES = ["potential", "diffusion", "impedance", "stress"] as const;
export type AtlasDisplay = (typeof ATLAS_PROPERTIES)[number] | "recognition" | "susceptibility";

export function recognitionLabel(profile: RecognitionProfile | null | undefined, site: number) {
  const row = profile?.sites[site];
  if (!row || row.affinities.length === 0) return "No active recognition";
  const [x, y] = row.preferred;
  return `#${16 * x + y} · peak ${n(row.peak)} · breadth ${n(row.effectiveBreadth)}`;
}
export function atlasValues(
  definition: Definition,
  display: AtlasDisplay,
  profile: RecognitionProfile | null,
  site: number
): number[] {
  if (display === "susceptibility")
    return profile?.susceptibility ?? Array.from({ length: 256 }, () => 1);
  if (display === "recognition") {
    const values = new Map(profile?.sites[site]?.affinities ?? []);
    return Array.from({ length: 256 }, (_, s) => values.get(s) ?? 0);
  }
  return definition.chemistry.properties.map((p) => p[display]);
}
export function radialTargets(m: Machinery | null) {
  if (!m || m.keys) return [];
  return [...m.receptors, ...m.transporters, ...m.enzymes]
    .map((point, i) => ({
      point,
      label: machineryLabel(i),
      membrane: false,
      active: i < 8 || m.programs[i - 8],
    }))
    .filter((p) => p.active)
    .concat([{ point: m.membrane, label: "Membrane", membrane: true, active: true }]);
}
