import { actorSystem, type ActorContext, type DiagnosticPolicy } from "./actorSystem";
import { chemistrySystem, type ChemistryContext } from "./chemistrySystem";
import { createKernel, type SimulationSystem } from "./kernel";
import { lifecycleSystem } from "./lifecycleSystem";
import { resourceSystem, type ResourceContext } from "./resources";
import { type World } from "./types";
import { settlingSystem } from "./settling";
import { climateSystem } from "./climate/transport";
export type { DiagnosticPolicy } from "./actorSystem";

/** Composition declares phase capabilities; the generic kernel contains no feature operations. */
export interface SimulationContexts {
  resources: ResourceContext;
  settling: World;
  fields: ChemistryContext & World;
  actors: ActorContext;
  lifecycle: World;
}

const systems: readonly SimulationSystem<SimulationContexts>[] = [
  resourceSystem,
  settlingSystem,
  chemistrySystem,
  climateSystem,
  actorSystem,
  lifecycleSystem,
];
const colonyKernel = createKernel<SimulationContexts>(systems);
const historicalKernel = createKernel<SimulationContexts>(
  systems.filter((system) => ["settling", "fields", "actors"].includes(system.phase))
);
export const simulationManifest = colonyKernel.manifest;

export function validateSimulationManifest(value: unknown): void {
  if (
    !Array.isArray(value) ||
    value.length !== simulationManifest.length ||
    !simulationManifest.every((expected, index) => matchesMechanism(value[index], expected))
  )
    throw new Error("checkpoint simulation mechanism manifest mismatch");
}

function matchesMechanism(value: unknown, expected: (typeof simulationManifest)[number]): boolean {
  if (!value || typeof value !== "object" || Object.keys(value).length !== 3) return false;
  const actual = value as Partial<typeof expected>;
  return (
    actual.id === expected.id &&
    actual.version === expected.version &&
    actual.phase === expected.phase
  );
}

export function stepWorld(world: World, policy?: DiagnosticPolicy): void {
  world.tick += 1;
  colonyKernel.step({
    resources: world,
    settling: world,
    fields: world,
    actors: { world, policy: policy ?? null, diagnosticGenome: null },
    lifecycle: world,
  });
}

/** Retained assay: one worker, chemistry and actions, without colony growth or lifecycle. */
export function stepWorldWithRnn(world: World, genome: Float32Array): void {
  world.tick += 1;
  historicalKernel.step({
    resources: world,
    settling: world,
    fields: world,
    actors: { world, policy: null, diagnosticGenome: genome },
    lifecycle: world,
  });
}
