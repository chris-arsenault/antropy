import { expect, it } from "vitest";
import { emptySpatial, observe } from "./observation";
import { type EngineWorld } from "./client";
import { validateObservation } from "./observationValidation";
import { type ObservationState } from "./types";

const group = (
  members: number[],
  votes: [number, number][] = [],
  youngestDescendant: number | null = null
) => ({
  x: 10,
  y: 10,
  membraneX: 4,
  members,
  lineages: [[1, members.length]],
  votes,
  youngestDescendant,
});
it("retains region identity through merge, split and founding, without calling dissolution extinction", () => {
  const h = emptySpatial();
  let tick = 0,
    regions = [group([1, 2, 3]), group([4, 5, 6])];
  const world = {
    command: () => ({ tick, regions, origins: h.origins, population: {} }),
  } as unknown as EngineWorld;
  observe(world, h);
  expect(h.events.map((e) => e.kind)).toEqual(["appearance", "appearance"]);
  tick = 25;
  regions = [
    group(
      [1, 2, 3, 4, 5, 6],
      [
        [1, 3],
        [2, 3],
      ]
    ),
  ];
  observe(world, h);
  expect(h.regions[0].id).toBe(1);
  expect(h.events.some((e) => e.kind === "merge")).toBe(true);
  expect(h.events.some((e) => e.kind === "dissolved")).toBe(false);
  tick = 50;
  regions = [group([1, 2, 3], [[1, 3]]), group([4, 5, 6], [[1, 3]])];
  observe(world, h);
  expect(h.regions.map((r) => r.id)).toEqual([1, 3]);
  expect(h.events.some((e) => e.kind === "split")).toBe(true);
  tick = 75;
  regions = [group([1, 2, 3, 7], [[1, 4]], 60), group([4, 5, 6], [[3, 3]])];
  observe(world, h);
  expect(h.events.filter((e) => e.kind === "founding")).toHaveLength(1);
  tick = 100;
  regions = [group([4, 5, 6], [[3, 3]])];
  observe(world, h);
  expect(h.events.at(-1)?.kind).toBe("dissolved");
});
it("rejects future provenance, duplicate region membership and malformed retained clocks", () => {
  const h = emptySpatial();
  h.tick = 0;
  const o: ObservationState = {
    runId: "run",
    history: [],
    recent: [],
    spatial: h,
    executions: [{ tick: 0, digest: "unidentified" }],
  };
  expect(() => validateObservation(o, 0)).not.toThrow();
  o.executions.push({ tick: 1, digest: "a".repeat(64) });
  expect(() => validateObservation(o, 0)).toThrow();
  o.executions.pop();
  o.spatial.tick = NaN;
  expect(() => validateObservation(o, 0)).toThrow();
  o.spatial.tick = 0;
  o.spatial.nextId = 3;
  o.spatial.regions = [1, 2].map((id) => ({
    ...group([1, 2, 3]),
    id,
    born: 0,
    established: null,
    origins: [],
  }));
  expect(() => validateObservation(o, 0)).toThrow();
});
