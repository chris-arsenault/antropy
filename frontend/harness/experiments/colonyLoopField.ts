import { NEST_CONFIG } from "../../src/sim/config";
import { analyzeFieldNavigation, fieldNavigationStarts } from "../../src/sim/fieldNavigation";
import { voxelIndex } from "../../src/sim/grid";
import { buildAuthoredNestWorld } from "../../src/sim/nestWorld";
import { emitNestScent, sampleScent, stepScentField } from "../../src/sim/scent";
import { NEST_FIXTURE_SCENT, SCENT } from "../../src/sim/tunables";
import { type ColonyLoopResult } from "./colonyLoopTypes";

/** Appendix E2's world-side proof that the effective nest field leads home. */
export function fieldNavigationEpisode(seed: number, ticks: number): ColonyLoopResult {
  const setup = buildAuthoredNestWorld(seed, undefined, NEST_CONFIG);
  const { world, colony, nest } = setup;
  const sourceIndex = voxelIndex(world.grid, colony.x, colony.y, colony.z);
  const entranceIndex = voxelIndex(world.grid, nest.entrance.x, nest.entrance.y, nest.entrance.z);
  const starts = fieldNavigationStarts(world, nest.entrance, NEST_FIXTURE_SCENT.surfaceRadius);
  const initialSource = sampleScent(world.nestScent, sourceIndex, colony.id);
  const initialEntrance = sampleScent(world.nestScent, entranceIndex, colony.id);
  const initial = analyzeFieldNavigation(world, world.nestScent, starts, sourceIndex, colony.id);
  const passes = Math.floor(ticks / SCENT.stepInterval);
  for (let pass = 0; pass < passes; pass++) {
    stepScentField(world.grid, world.nestScent);
    emitNestScent(world.grid, world.nestScent, sourceIndex, colony.id);
  }
  const report = analyzeFieldNavigation(world, world.nestScent, starts, sourceIndex, colony.id);
  return {
    params: { passes, surfaceRadius: NEST_FIXTURE_SCENT.surfaceRadius },
    summary: {
      ...report,
      initialSuccessRate: initial.successRate,
      initialFailureCounts: initial.failureCounts,
      initialSource,
      initialEntrance,
      finalSource: sampleScent(world.nestScent, sourceIndex, colony.id),
      finalEntrance: sampleScent(world.nestScent, entranceIndex, colony.id),
    },
    trace: [],
  };
}
