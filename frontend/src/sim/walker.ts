import { type Rng } from "./rng";
import { type MotorState } from "./movement";

/**
 * Scripted random-walk controller for M3/M4 harness use. Replaced as the
 * behavioral source by the controller contract (design spec §2.3) in M4+.
 */
export function walkerMotor(rng: Rng): MotorState {
  const roll = rng.next();
  return {
    turn: roll < 0.2 ? rng.next() * 2 - 1 : 0,
    forward: 0.6,
    verticalBias: rng.next() * 0.4 - 0.2,
  };
}
