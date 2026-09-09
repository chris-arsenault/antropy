import { type ColonyFrame } from "../colonySensors";
import { Input } from "./contract";

export const COLONY_OBSERVATION_CONTRACT = "colony-f32-v1";

/** Quantize receptors before either policy compares them or derives contrast features. */
export function quantizeColonyFrame(frame: ColonyFrame): ColonyFrame {
  const navigation = Float32Array.from(frame.navigation);
  const cargo = Math.fround(frame.cargo / 4) * 4;
  navigation[Input.CARRYING] = Number(cargo > 0);
  return {
    task: frame.task,
    navigation,
    contacts: frame.contacts.map((contact) => ({
      ...contact,
      food: Math.fround(Math.min(1, contact.food / 4)) * 4,
    })),
    hunger: Math.fround(frame.hunger),
    cargo,
    freshAir: frame.freshAir.map(Math.fround),
  };
}
