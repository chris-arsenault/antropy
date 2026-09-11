import { type World, type Cell, type Point } from "./types";
import { moved, radius } from "./geometry";
import { nextRandom } from "./random";
import { type SpatialIndex } from "./spatial";
import { scaleBody } from "./body";
import { matrixFree } from "./matrix";

interface ReproductionPolicy {
  readonly parentSurvives: boolean;
  place(world: World, parent: Cell, index: SpatialIndex): Point[] | null;
}
function place(world: World, parent: Cell, index: SpatialIndex, budding: boolean): Point[] | null {
  const c = world.config,
    childRadius = radius({ body: scaleBody(parent.body, 0.5), reserve: parent.reserve / 2 }, c),
    offset = childRadius * 1.001;
  const phase = nextRandom(world.rng) * 2 * Math.PI;
  for (let attempt = 0; attempt < 8; attempt++) {
    const angle = phase + (attempt * Math.PI) / 4;
    const points = budding
      ? [parent, moved(parent, angle, 2 * offset, c)]
      : [moved(parent, angle, offset, c), moved(parent, angle, -offset, c)];
    if (
      points.every(
        (p) => index.free(p, childRadius, parent.id) && matrixFree(world, p, childRadius)
      )
    )
      return points;
  }
  return null;
}
export const reproductivePolicies: Record<"fission" | "budding", ReproductionPolicy> = {
  fission: { parentSurvives: false, place: (w, p, i) => place(w, p, i, false) },
  budding: { parentSurvives: true, place: (w, p, i) => place(w, p, i, true) },
};
