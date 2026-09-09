import { type ColonyFrame } from "../colonySensors";
import { programmedColony } from "../policies/colony";
import { programmedForager } from "../policies/programmed";
import { type ScenarioId } from "../types";
import { INPUT_COUNT, type Action } from "./contract";
import { HIDDEN_COUNT, RNN_GENOME_LENGTH, rnnController } from "./rnn";
import {
  type RegisteredModel,
  registeredParameterCount,
  registeredStateSize,
} from "./registeredModel";
import { actRegistered, createRegisteredState } from "./registeredNetwork";

const RNN_GENOME = rnnController.fixedSeed();

export interface LocalController {
  readonly id: string;
  readonly observation: "navigation" | "colony";
  act(navigation: Float32Array, state: Float32Array, colony?: ColonyFrame): Action;
}

const forager: LocalController = {
  id: "programmed-forager",
  observation: "navigation",
  act: (navigation) => programmedForager.act(navigation),
};
const colony: LocalController = {
  id: "programmed-colony",
  observation: "colony",
  act: (_navigation, _state, frame) => programmedColony(requireColonyFrame(frame)),
};

function requireColonyFrame(frame: ColonyFrame | undefined): ColonyFrame {
  if (!frame) throw new Error("colony controller requires a local colony observation");
  return frame;
}

export function historicalController(genome: Float32Array = RNN_GENOME): LocalController {
  return {
    id: "historical-rnn",
    observation: "navigation",
    act: (navigation, state) => rnnController.act(genome, navigation, state),
  };
}

/** No controller adapter accepts a World, position, route or map capability. */
export function localController(
  scenario: Exclude<ScenarioId, "oracle">,
  mortality: boolean,
  model: RegisteredModel | null
): LocalController {
  if (scenario === "registered-colony") {
    if (!model) throw new Error("registered colony requires an imported model");
    return {
      id: "registered-colony",
      observation: "colony",
      act: (_navigation, state, frame) => actRegistered(model, requireColonyFrame(frame), state),
    };
  }
  if (scenario === "rnn") return historicalController();
  return mortality ? colony : forager;
}

export function createControllerState(model: RegisteredModel | null, seed: number, id: number) {
  return model
    ? createRegisteredState(model, seed ^ Math.imul(id, 2654435761))
    : new Float32Array(HIDDEN_COUNT);
}

export function controllerStateSize(model: RegisteredModel | null): number {
  return model ? registeredStateSize(model) : HIDDEN_COUNT;
}

export function inspectController(
  scenario: ScenarioId,
  model: RegisteredModel | null,
  mortality: boolean
) {
  if (model)
    return {
      inputs: model.inputs,
      hidden: model.hidden,
      parameters: registeredParameterCount(model),
      tasks: model.tasks,
    };
  if (scenario === "rnn")
    return {
      inputs: INPUT_COUNT,
      hidden: HIDDEN_COUNT,
      parameters: RNN_GENOME_LENGTH,
      tasks: 0,
    };
  return {
    inputs: scenario !== "oracle" && mortality ? 111 : INPUT_COUNT,
    hidden: 0,
    parameters: 0,
    tasks: 256,
  };
}

export function validateControllerState(
  model: RegisteredModel | null,
  state: readonly number[],
  task: number
): void {
  if (state.length !== controllerStateSize(model) || !state.every(Number.isFinite))
    throw new Error("checkpoint controller shape mismatch");
  if (!model) return;
  if (task >= model.tasks) throw new Error("checkpoint task outside model vocabulary");
  const words = state.slice(-2);
  if (
    !words.every((word) => Number.isInteger(word) && word >= 0 && word <= 65535) ||
    words.every((word) => word === 0)
  )
    throw new Error("invalid private random state");
}
