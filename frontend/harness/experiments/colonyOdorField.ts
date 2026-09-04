import { fieldNavigationStarts } from "../../src/sim/fieldNavigation";
import { exchangeMaterialScent } from "../../src/sim/materialScent";
import { buildAuthoredNestWorld } from "../../src/sim/nestWorld";
import { emitNestScent, sampleScent, scentResponse, stepScentField } from "../../src/sim/scent";
import { COLONY_ODOR, NEST_FIXTURE_SCENT, SCENT } from "../../src/sim/tunables";
import { voxelIndex } from "../../src/sim/grid";
import { type ColonyLoopResult } from "./colonyLoopTypes";

interface Distribution {
  readonly count: number;
  readonly min: number;
  readonly p01: number;
  readonly median: number;
  readonly p99: number;
  readonly max: number;
}

function percentile(sorted: readonly number[], fraction: number): number {
  if (sorted.length === 0) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))];
}

function distribution(values: number[]): Distribution {
  values.sort((left, right) => left - right);
  return {
    count: values.length,
    min: values[0] ?? 0,
    p01: percentile(values, 0.01),
    median: percentile(values, 0.5),
    p99: percentile(values, 0.99),
    max: values.at(-1) ?? 0,
  };
}

/** Appendix F diagnostic: classify authored-nest air from colony odor alone. */
export function colonyOdorEpisode(seed: number, ticks: number): ColonyLoopResult {
  const { world, nest, colony } = buildAuthoredNestWorld(seed);
  const source = voxelIndex(world.grid, colony.x, colony.y, colony.z);
  const passes = Math.floor(ticks / SCENT.stepInterval);
  for (let pass = 0; pass < passes; pass++) {
    stepScentField(world.grid, world.nestScent);
    emitNestScent(world.grid, world.nestScent, source, colony.id);
    stepScentField(world.grid, world.colonyScent);
    exchangeMaterialScent(world.grid, world.colonyScent, world.materialColonyScent);
  }
  const starts = fieldNavigationStarts(world, nest.entrance, NEST_FIXTURE_SCENT.surfaceRadius);
  const inside: number[] = [];
  const outside: number[] = [];
  let trueInside = 0;
  let trueOutside = 0;
  for (const index of starts) {
    const value = scentResponse(sampleScent(world.colonyScent, index, colony.id), 1);
    const predictedInside = value >= COLONY_ODOR.insideThreshold;
    if (world.cavities.has(index)) {
      inside.push(value);
      if (predictedInside) trueInside += 1;
    } else {
      outside.push(value);
      if (!predictedInside) trueOutside += 1;
    }
  }
  return {
    params: { passes, threshold: COLONY_ODOR.insideThreshold },
    summary: {
      inside: distribution(inside),
      outside: distribution(outside),
      trueInside,
      falseOutside: inside.length - trueInside,
      trueOutside,
      falseInside: outside.length - trueOutside,
      accuracy: (trueInside + trueOutside) / starts.length,
    },
    trace: [],
  };
}
