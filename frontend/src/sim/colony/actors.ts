import { actProgrammed, linearController } from "../controller/linear/controller";
import { type Ant, type World } from "../types";
import { observeKnowledge } from "./knowledge";
import { observeCandidates } from "./observation";
import { applyRequest } from "./resolve";
import { observeHabitat } from "../construction/habitat";
import { reportDecision, captureDecision } from "./diagnostics";
import { behaviorBefore, recordBehavior } from "./behavior";
import { reproductive } from "../adultBody";

export function actColonyWorker(world: World, ant: Ant): void {
  observeKnowledge(world, ant);
  observeHabitat(world, ant);
  const candidates = observeCandidates(world, ant);
  const decision = world.linearGenome
    ? linearController.act(world.linearGenome, candidates, ant.decision.registers)
    : actProgrammed(candidates, ant.decision.registers);
  ant.decision.registers = decision.registers;
  const before = behaviorBefore(world, ant);
  const snapshot = captureDecision(world, ant);
  const result = applyRequest(world, ant, decision.request);
  if (!reproductive(ant)) recordBehavior(world, ant, decision.request, result, before);
  reportDecision(world, ant, candidates, decision.request, result, snapshot);
  observeKnowledge(world, ant);
}
