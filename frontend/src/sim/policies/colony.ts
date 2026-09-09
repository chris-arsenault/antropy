import { type ColonyFrame } from "../colonySensors";
import { IDLE_ACTION, Input, type Action } from "../controller/contract";
import { programmedForager } from "./programmed";
import { followLocalGradient } from "./gradient";
import { quantizeColonyFrame } from "../controller/colonyObservation";

function face(offset: number, action: Action): Action {
  if (offset === 0) return action;
  return { ...IDLE_ACTION, turn: offset <= 4 ? 1 : -1 };
}

/** These numeric conventions belong only to this reference policy. */
function remember(frame: ColonyFrame, action: Action, task: number): Action {
  return { ...action, task: frame.task === task ? null : task };
}

function eatLocally(frame: ColonyFrame): Action | null {
  const edible = frame.contacts.findIndex((contact) => contact.edible);
  if (frame.hunger < Math.fround(0.7) && (frame.cargo > 0 || edible >= 0)) {
    return face(frame.cargo > 0 ? 0 : edible, { ...IDLE_ACTION, eat: true });
  }
  return null;
}

function localWork(frame: ColonyFrame): Action | null {
  const recipient = frame.contacts.findIndex((contact) => contact.hungry);
  if (frame.cargo > 0 && recipient >= 0) return face(recipient, { ...IDLE_ACTION, feed: true });
  const food = frame.contacts.findIndex((contact) => contact.food >= 0.25);
  if (frame.cargo === 0 && recipient >= 0 && food >= 0) {
    return face(food, { ...IDLE_ACTION, mandible: true });
  }
  if (frame.cargo > 0 && frame.contacts.some((contact) => contact.queen)) {
    const space = frame.contacts.findIndex((contact) => contact.open);
    if (space >= 0) return face(space, { ...IDLE_ACTION, release: true });
  }
  return null;
}

/** Every worker uses this pure policy over its own present local observations. */
export function programmedColony(observation: ColonyFrame): Action {
  const frame = quantizeColonyFrame(observation);
  const eating = eatLocally(frame);
  if (eating) return remember(frame, eating, 3);
  const work = localWork(frame);
  if (work) return remember(frame, work, 2);
  if (frame.cargo === 0 && frame.navigation[Input.SKY_LIGHT] < 0.5) {
    const outward = followLocalGradient(frame.freshAir, frame.contacts);
    if (outward) return remember(frame, outward, 0);
  }
  const inputs = Float32Array.from(frame.navigation);
  inputs[Input.CONTACT_CACHE] = 0;
  inputs[Input.CONTACT_FOOD] = Number(frame.contacts[0].food >= 0.25);
  inputs[Input.OPEN_FORWARD] = Number(frame.contacts[0].open);
  inputs[Input.OPEN_LEFT] = Number(frame.contacts[1].open);
  inputs[Input.OPEN_RIGHT] = Number(frame.contacts[7].open);
  // Ignore stored food when leaving the nest; hungry workers and nurses use localWork.
  if (inputs[Input.SKY_LIGHT] < 0.5) inputs[Input.CONTACT_FOOD] = 0;
  const action = programmedForager.act(inputs);
  const physical = action.move && frame.cargo === 0 ? { ...action, pheromoneA: 1 } : action;
  return remember(frame, physical, frame.cargo > 0 ? 1 : 0);
}
