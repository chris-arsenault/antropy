import { type LocalContact } from "../colonySensors";
import { IDLE_ACTION, type Action } from "../controller/contract";

/** Compare current neighboring concentrations and physical openness, with no map or memory. */
export function followLocalGradient(
  values: readonly number[],
  contacts: readonly LocalContact[]
): Action | null {
  const choices = [0, 1, 7].filter((offset) => contacts[offset].open && values[offset] > 0);
  choices.sort((left, right) => values[right] - values[left]);
  if (choices.length > 0) {
    const selected = choices[0];
    return selected === 0
      ? { ...IDLE_ACTION, move: true }
      : { ...IDLE_ACTION, turn: selected === 1 ? 1 : -1 };
  }
  if (values[2] <= 0 && values[6] <= 0) return null;
  return { ...IDLE_ACTION, turn: values[2] >= values[6] ? 1 : -1 };
}
