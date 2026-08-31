/** Voxel material IDs (design spec §5.2). One byte per voxel. */
export const Material = {
  AIR: 0,
  TOPSOIL: 1,
  CLAY: 2,
  ROCK: 3,
  FOOD: 4,
  LOOSE_FILL: 5,
  /** Reserved for the future ecosystem stage. */
  WATER: 6,
} as const;

export type MaterialId = (typeof Material)[keyof typeof Material];

export function isSolid(material: MaterialId): boolean {
  return material !== Material.AIR && material !== Material.WATER;
}
