import { type World, type Ant } from "../types";
import { cellIndex } from "../grid";
import { stepFrom } from "../geometry";
import { Material } from "../materials";
import { type Request } from "../colony/contract";
import { siteIdentity, distance } from "./habitat";

export const CHAMBER_FEATURE_NAMES = [
  "contactFocusX",
  "siteFocusX",
  "siteFocusY",
  "localOpenBelow",
  "siteOpenBelow",
  "focusOpen",
  "focusBrood",
  "focusSolid",
  "entranceDepth",
  "contactEntranceDepth",
  "siteEntranceDistance",
  "contactBelowBacked",
  "siteBelowBacked",
] as const;

/** Geometric summaries of remembered sightings; never inspect unseen terrain or select work. */
export function observeChamber(world: World, ant: Ant) {
  const focus = ant.decision.focus;
  const entrance = world.knowledge.locations.get(-1);
  const depth = entrance ? entrance.y - ant.y : 0;
  const at = (x: number, y: number) =>
    world.habitat.sites.get(siteIdentity(cellIndex(world.grid, x, y)));
  const open = (x: number, y: number) => {
    const s = at(x, y);
    return !!s && [Material.AIR, Material.CACHE].includes(s.material);
  };
  const area = focus
    ? [...world.habitat.sites.values()].filter(
        (s) => Math.abs(s.x - focus.x) < 10 && s.y >= focus.y && s.y < focus.y + 4
      )
    : [];
  const counts = [
    area.filter((s) => open(s.x, s.y)).length,
    area.filter((s) => s.brood !== null).length,
    area.filter((s) => s.work > 0 && s.work < 10 && s.backed).length,
  ];
  const contacts = Array.from({ length: 8 }, (_, h) => {
    const p = stepFrom(ant, h);
    return [
      focus ? Math.abs(p.x - focus.x) : 0,
      Number(open(p.x, p.y - 1)),
      entrance ? entrance.y - p.y : 0,
      Number(!!at(p.x, p.y - 1)?.backed),
    ];
  });
  return (request: Request) => {
    const site = world.habitat.sites.get(request.destination!);
    return [
      contacts[request.heading][0],
      focus && site ? Math.abs(site.x - focus.x) : 1000,
      focus && site ? site.y - focus.y : -1000,
      contacts[request.heading][1],
      Number(!!site && open(site.x, site.y - 1)),
      ...counts,
      depth,
      contacts[request.heading][2],
      entrance && site ? Math.abs(site.x - entrance.x) : 0,
      contacts[request.heading][3],
      Number(!!site && !!at(site.x, site.y - 1)?.backed),
    ];
  };
}

/** A bounded rotating view around a private landmark, without filtering for dig suitability. */
export function chamberSites(world: World, ant: Ant) {
  const focus = ant.decision.focus;
  if (!focus) return [];
  const sites = [...world.habitat.sites.values()].filter((s) => distance(s, focus) < 20);
  const start = (world.tick * 16 + ant.id) % Math.max(1, sites.length);
  return Array.from(
    { length: Math.min(16, sites.length) },
    (_, i) => sites[(start + i) % sites.length]
  );
}
