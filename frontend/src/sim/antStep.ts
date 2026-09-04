import { type Ant } from "./ant";
import { depositPheromones, tryDig, tryEat, tryLayEgg, tryTrophallaxis } from "./actions";
import { Input } from "./controller/contract";
import { stampVisit } from "./decay";
import { applyBasalDrain, applyStepCost, checkDeath } from "./energy";
import { applyMotor } from "./locomotion";
import { applyMotorJitter } from "./motorJitter";
import { decodeOutputs, type Actions } from "./motors";
import { sense, type SenseContext } from "./senses";
import { microclimateMultiplier } from "./weather";
import { type World } from "./world";

/** Oracles pay the controller-comparable think cost (ADR-0009). */
const ORACLE_THINK_COST = 0.00008;

function diagnosticOutputs(world: World, ant: Ant, inputs: Float32Array): Float32Array | null {
  const sensorPolicy = world.sensorPolicyOverride;
  if (!sensorPolicy) return world.policyOverride?.(world, ant, inputs) ?? null;
  let policyState = world.sensorPolicyStates.get(ant.id);
  if (policyState === undefined) {
    policyState = sensorPolicy.createState();
    world.sensorPolicyStates.set(ant.id, policyState);
  }
  return sensorPolicy.act(inputs, policyState);
}

function controllerOutputs(
  world: World,
  ant: Ant,
  inputs: Float32Array
): { outputs: Float32Array; thinkCost: number } {
  const diagnostic = diagnosticOutputs(world, ant, inputs);
  if (diagnostic !== null) return { outputs: diagnostic, thinkCost: ORACLE_THINK_COST };
  return world.controller.act(ant.genome, inputs, ant.controllerState);
}

function isContactDig(ant: Ant, inputs: Float32Array, actions: Actions): boolean {
  const contact = inputs[Input.CONTACT_FOOD] > 0 || inputs[Input.CONTACT_EGG] > 0;
  return actions.dig && ant.carrying === null && ant.carriedEggIds.length === 0 && contact;
}

function resolveActions(
  world: World,
  ant: Ant,
  inputs: Float32Array,
  actions: Actions,
  sensedContactBand: number
): void {
  const contactDig = isContactDig(ant, inputs, actions);
  if (actions.eat) tryEat(world, ant);
  if (contactDig) tryDig(world, ant, sensedContactBand);
  applyMotor(world.grid, ant, actions.motor);
  if (actions.dig && !contactDig) tryDig(world, ant, actions.motor.verticalBias);
  depositPheromones(world, ant, actions.pheromoneA, actions.pheromoneB);
  if (world.config.workerReproduction && actions.layEgg) tryLayEgg(world, ant);
  tryTrophallaxis(world, ant);
}

/** Sense, decide, resolve and account for one living ant's fixed-timestep action. */
export function stepAnt(world: World, ctx: SenseContext, inputs: Float32Array, ant: Ant): void {
  ant.age += 1;
  stampVisit(world, ant.x, ant.y, ant.z);
  const climate = world.config.microclimate ? microclimateMultiplier(world, ant) : 1;
  sense(ctx, ant, inputs);
  const sensedContactBand = ant.verticalAttention;
  const acted = controllerOutputs(world, ant, inputs);
  ant.lastInputs.set(inputs);
  ant.lastOutputs.set(acted.outputs);
  const actions = decodeOutputs(acted.outputs);
  const nextVerticalBand = actions.motor.verticalBias;
  if (world.config.motorJitter) applyMotorJitter(actions.motor, world.seed, ant.id, world.tick);
  resolveActions(world, ant, inputs, actions, sensedContactBand);
  ant.verticalAttention = nextVerticalBand;
  applyBasalDrain(world, ant, acted.thinkCost, climate);
  applyStepCost(world, ant);
  if (world.config.mortality) checkDeath(world, ant);
}
