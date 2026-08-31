import { braitenbergController } from "./braitenberg";
import { type Controller } from "./contract";
import { rnnController } from "./rnn";

const CONTROLLERS: Record<string, Controller> = {
  [rnnController.id]: rnnController,
  [braitenbergController.id]: braitenbergController,
};

/** Controller lookup for checkpoint loading. Unknown ids stop the load. */
export function controllerById(id: string): Controller {
  const controller = CONTROLLERS[id];
  if (!controller) {
    throw new Error(`unknown controller id "${id}" in checkpoint`);
  }
  return controller;
}
