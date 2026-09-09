import { type HabitatState, type SiteObservation } from "../sim/construction/habitat";
import { type Checkpoint2D } from "./checkpoint";
import { siteIdentity } from "../sim/construction/habitat";

export type HabitatCheckpoint = {
  sites: [number, SiteObservation][];
  traffic: [number, { tick: number; count: number }][];
};
export function habitatCheckpoint(state: HabitatState): HabitatCheckpoint {
  return structuredClone({ sites: [...state.sites], traffic: [...state.traffic] });
}
export function restoreHabitat(record: HabitatCheckpoint): HabitatState {
  return {
    sites: new Map(structuredClone(record.sites)),
    traffic: new Map(structuredClone(record.traffic)),
  };
}
export function validateHabitat(c: Checkpoint2D): void {
  if (!c.habitat || !Array.isArray(c.habitat.sites) || !Array.isArray(c.habitat.traffic))
    throw new Error("missing checkpoint habitat observations");
  const ids = new Set<number>();
  for (const [id, site] of c.habitat.sites) {
    if (ids.has(id) || id !== site.id || !validPosition(c, site))
      throw new Error("invalid checkpoint habitat identity");
    validateSite(site);
    ids.add(id);
  }
  validateTraffic(c);
}

function validPosition(c: Checkpoint2D, site: SiteObservation): boolean {
  return (
    site.id === siteIdentity(site.y * c.config.width + site.x) &&
    [site.x, site.y, site.tick].every(Number.isSafeInteger) &&
    site.x >= 0 &&
    site.y >= 0 &&
    site.x < c.config.width &&
    site.y < c.config.height &&
    site.tick >= 0 &&
    site.tick <= c.tick
  );
}

function validateTraffic(c: Checkpoint2D): void {
  if (new Set(c.habitat.traffic.map(([id]) => id)).size !== c.habitat.traffic.length)
    throw new Error("duplicate checkpoint traffic observation");
  for (const [id, traffic] of c.habitat.traffic)
    if (!validTraffic(c, id, traffic)) throw new Error("invalid checkpoint traffic observation");
}

function validTraffic(
  c: Checkpoint2D,
  id: number,
  traffic: { tick: number; count: number }
): boolean {
  return (
    Number.isSafeInteger(id) &&
    id >= 0 &&
    id < c.grid.length &&
    Number.isSafeInteger(traffic.tick) &&
    traffic.tick >= 0 &&
    traffic.tick <= c.tick &&
    Number.isFinite(traffic.count) &&
    traffic.count >= 0 &&
    traffic.count <= 32
  );
}
function validateSite(site: SiteObservation): void {
  if (
    !validQuantities(site) ||
    !Number.isInteger(site.material) ||
    site.material < 0 ||
    site.material > 7 ||
    ![site.supported, site.occupied, site.queen, site.backed].every(
      (v) => typeof v === "boolean"
    ) ||
    (site.brood !== null && (!Number.isSafeInteger(site.brood) || site.brood < 1))
  )
    throw new Error("invalid checkpoint habitat observation");
}

function validQuantities(site: SiteObservation): boolean {
  return (
    [site.temperature, site.moisture, site.work, site.food, site.traffic].every(Number.isFinite) &&
    site.moisture >= 0 &&
    site.moisture <= 1 &&
    site.food >= 0 &&
    site.work >= 0 &&
    site.traffic >= 0
  );
}
