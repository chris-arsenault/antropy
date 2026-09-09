import { type ColonyFrame } from "../../src/sim/colonySensors";
import { type Action } from "../../src/sim/controller/contract";
import { colonyMotor } from "../../src/sim/controller/colonyEncoding";

/** Numeric occupancy and transitions carry no assumptions about learned task meanings. */
export class TaskTelemetry {
  readonly counts = {
    decisions: 0,
    changes: 0,
    occupancy: {} as Record<string, number>,
    transitions: {} as Record<string, number>,
    motors: {} as Record<string, number>,
    loaded: {} as Record<string, number>,
  };

  observe(frame: ColonyFrame, action: Action): void {
    const current = String(frame.task),
      next = action.task ?? frame.task;
    this.counts.decisions++;
    this.counts.occupancy[current] = (this.counts.occupancy[current] ?? 0) + 1;
    const motor = `${current}:${colonyMotor(action)}`;
    this.counts.motors[motor] = (this.counts.motors[motor] ?? 0) + 1;
    if (frame.cargo > 0) this.counts.loaded[current] = (this.counts.loaded[current] ?? 0) + 1;
    if (next === frame.task) return;
    this.counts.changes++;
    const transition = `${current}:${next}`;
    this.counts.transitions[transition] = (this.counts.transitions[transition] ?? 0) + 1;
  }
}
