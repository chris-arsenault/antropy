import { type Config } from "./config";
import { type Point, type World } from "./types";
import { nextRandom } from "./random";
import { distance, wrap } from "./geometry";
import { foodZoneX } from "./foodZones";

/** Abiotic renewal sites. Identity and composition do not depend on their occupants. */
export interface Habitat extends Point {
  radius: number;
  richness: number;
  share: number;
}

export function createLandscape(world: World): void {
  const c = world.config;
  const random = () => nextRandom(world.environmentRng);
  const count = c.resourceLayout === "localized" ? c.landscapeRegions : 3;
  world.patchCenters = Array.from({ length: count }, () => ({
    x: random() * c.width,
    y: random() * c.height,
  }));
  if (c.resourceLayout !== "localized") return;
  const weights = world.patchCenters.map(() => 0.2 + 4 * random() ** 2);
  const total = weights.reduce((sum, w) => sum + w, 0);
  for (let i = 0; i < c.sourceCount; i++) {
    let draw = random() * total;
    const region = weights.findIndex((weight) => (draw -= weight) <= 0);
    const center = world.patchCenters[i < 3 ? 0 : Math.max(0, region)];
    const angle = random() * 2 * Math.PI;
    const reach = c.landscapeSpread * Math.sqrt(random());
    const site = {
      x: wrap(center.x + Math.cos(angle) * reach, c.width),
      y: wrap(center.y + Math.sin(angle) * reach, c.height),
      radius: c.sourceRadius * (0.6 + random()),
      richness: 0.3 + 2 * random() ** 2,
      share: 0.05 + 0.9 * random(),
    };
    if (c.foodZones) site.x = foodZoneX(c.foodZones, site.x, c.width, i);
    world.habitats.push(site);
  }
}

/** Choose separated existing opportunities without prescribing their occupants' traits. */
function startingHabitats(world: World): Habitat[] {
  const first = world.habitats[0];
  if (!first) return [];
  const farthest = world.habitats.reduce((best, site) =>
    distance(first, site, world.config) > distance(first, best, world.config) ? site : best
  );
  return farthest === first ? [first] : [first, farthest];
}

/** Split founders between two resource neighborhoods; each uses finite, accounted inventories. */
export function founderPosition(world: World, ordinal: number): Point {
  const c = world.config;
  const random = () => nextRandom(world.rng);
  const sites = startingHabitats(world);
  const habitat = sites[ordinal % sites.length];
  if (!habitat) return { x: random() * c.width, y: random() * c.height };
  const angle = random() * 2 * Math.PI;
  const reach = habitat.radius * 1.5 * Math.sqrt(random());
  return {
    x: wrap(habitat.x + Math.cos(angle) * reach, c.width),
    y: wrap(habitat.y + Math.sin(angle) * reach, c.height),
  };
}

export function validateLandscape(c: Config): void {
  if (!["localized", "scattered"].includes(c.resourceLayout))
    throw new Error("Invalid resource layout");
  if (!Number.isInteger(c.landscapeRegions) || c.landscapeRegions < 1 || c.landscapeRegions > 100)
    throw new Error("Landscape regions must be an integer from 1 to 100");
  if (c.landscapeSpread <= 0 || c.sourcePriming < 0 || c.sourcePriming > 1)
    throw new Error("Invalid landscape spread or initial inventory fraction");
}
