export enum Material {
  AIR = 0,
  SOIL = 1,
  ROCK = 2,
  FOOD = 3,
  CACHE = 4,
  CLAY = 5,
  LOOSE_SOIL = 6,
  WOOD = 7,
}

/** Material identity survives excavation; food quantity is stored separately from terrain. */
export const MATERIALS: Record<
  Material,
  { color: string; solid: boolean; excavationWork: number }
> = {
  [Material.AIR]: { color: "#18242b", solid: false, excavationWork: 0 },
  [Material.SOIL]: { color: "#705035", solid: true, excavationWork: 1 },
  [Material.ROCK]: { color: "#424750", solid: true, excavationWork: Infinity },
  [Material.FOOD]: { color: "#79c84a", solid: true, excavationWork: 0 },
  [Material.CACHE]: { color: "#d09a36", solid: true, excavationWork: 0 },
  [Material.CLAY]: { color: "#996849", solid: true, excavationWork: 3 },
  [Material.LOOSE_SOIL]: { color: "#aa8b59", solid: true, excavationWork: 0.4 },
  [Material.WOOD]: { color: "#755638", solid: true, excavationWork: 4 },
};

export function isSolid(material: Material): boolean {
  return MATERIALS[material].solid;
}
