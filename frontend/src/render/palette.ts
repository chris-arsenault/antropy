import { Material, type MaterialId } from "../sim/materials";

/** Per-material RGB in [0, 1], render-side only. */
export const MATERIAL_COLORS: Record<MaterialId, readonly [number, number, number]> = {
  [Material.AIR]: [0, 0, 0],
  [Material.TOPSOIL]: [0.42, 0.3, 0.18],
  [Material.CLAY]: [0.62, 0.42, 0.28],
  [Material.ROCK]: [0.45, 0.45, 0.48],
  [Material.FOOD]: [0.35, 0.65, 0.25],
  [Material.LOOSE_FILL]: [0.55, 0.45, 0.32],
  [Material.WATER]: [0.2, 0.4, 0.7],
};
