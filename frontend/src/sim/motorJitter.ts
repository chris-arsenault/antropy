import { type MotorState } from "./movement";
import { MOTOR_JITTER } from "./tunables";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Pure signed noise keyed to one ant-tick; consumes no simulation RNG state. */
export function deterministicMotorJitter(seed: number, antId: number, tick: number): number {
  let hash = seed ^ Math.imul(antId, 0x9e3779b9) ^ Math.imul(tick, 0x85ebca6b);
  hash = Math.imul(hash ^ (hash >>> 16), 0x7feb352d);
  hash = Math.imul(hash ^ (hash >>> 15), 0x846ca68b);
  hash = (hash ^ (hash >>> 16)) >>> 0;
  return (hash / 4294967296) * 2 - 1;
}

/** Apply bounded world-side turn noise after controller/oracle output decoding. */
export function applyMotorJitter(
  motor: MotorState,
  seed: number,
  antId: number,
  tick: number
): void {
  const noise = deterministicMotorJitter(seed, antId, tick) * MOTOR_JITTER.turnAmplitude;
  motor.turn = clamp(motor.turn + noise, -1, 1);
}
