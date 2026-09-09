import { applyActionToAnt } from "./actions";
import { senseColony, type ColonyFrame } from "./colonySensors";
import { type Action } from "./controller/contract";
import { historicalController, localController, type LocalController } from "./controller/runtime";
import { oracleAction } from "./policies/oracle";
import { spend } from "./resources";
import { sense } from "./sensors";
import { type Ant, type World } from "./types";
import { isKnowledgeScenario } from "./colony/contract";
import { expireKnowledge } from "./colony/knowledge";
import { actColonyWorker } from "./colony/actors";
import { adultBodies, canAct, reproductive } from "./adultBody";

export type DiagnosticPolicy = (frame: ColonyFrame, ant: Ant) => Action;
export interface ActorContext {
  readonly world: World;
  readonly policy: DiagnosticPolicy | null;
  readonly diagnosticGenome: Float32Array | null;
}

export const actorSystem = {
  id: "local-actions",
  version: 3,
  phase: "actors" as const,
  run({ world, policy, diagnosticGenome }: ActorContext): void {
    if (!diagnosticGenome) {
      resolveActors(world, policy);
      return;
    }
    const ant = world.ant;
    prepareStep(world, ant);
    applyActionToAnt(world, ant, localAction(historicalController(diagnosticGenome), world, ant));
  },
};

function prepareStep(world: World, ant: Ant): void {
  ant.lastInputs = sense(world, ant);
  spend(world, ant, world.config.sensorCost);
  if (!reproductive(ant)) world.economy.workerTicks += 1;
}

function localAction(controller: LocalController, world: World, ant: Ant): Action {
  const frame = controller.observation === "colony" ? senseColony(world, ant) : undefined;
  return controller.act(ant.lastInputs, ant.controllerState, frame);
}

/** The map diagnostic is deliberately resolved outside the local-controller adapter. */
function resolveActors(world: World, policy: DiagnosticPolicy | null): void {
  if (isKnowledgeScenario(world.scenario) && !policy) {
    expireKnowledge(world);
    for (const ant of adultBodies(world)) {
      if (!canAct(world, ant)) continue;
      prepareStep(world, ant);
      actColonyWorker(world, ant);
    }
    return;
  }
  resolveHistoricalWorkers(world, policy);
  // Historical worker comparisons have no reproductive output; the queen uses the common seed.
  if (canAct(world, world.queen)) {
    prepareStep(world, world.queen);
    actColonyWorker(world, world.queen);
  }
}

function resolveHistoricalWorkers(world: World, policy: DiagnosticPolicy | null): void {
  const controller =
    world.scenario === "oracle" || policy
      ? null
      : localController(world.scenario, world.config.mortalityEnabled, world.registeredController);
  for (const ant of [...world.ants]) {
    prepareStep(world, ant);
    let action: Action;
    if (policy) action = policy(senseColony(world, ant), ant);
    else if (controller) action = localAction(controller, world, ant);
    else action = oracleAction({ ...world, ant });
    applyActionToAnt(world, ant, action);
  }
}
