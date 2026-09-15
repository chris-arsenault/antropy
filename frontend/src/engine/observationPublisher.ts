import { observationDelta, type ObservationView, type ObservationDelta } from "./observationDelta";
import { checkObservationBudget } from "./observationBudget";

/** One unacknowledged observation. Slow consumers never queue old diagnostic snapshots. */
export class ObservationPublisher {
  private previous: ObservationView = { status: null, inspection: null };
  private sequence = 0;
  private awaiting: number | null = null;
  private pending: (() => ObservationView) | null = null;

  constructor(private readonly send: (sequence: number, delta: ObservationDelta) => void) {}

  reset() {
    this.previous = { status: null, inspection: null };
  }

  publish(read: () => ObservationView) {
    this.pending = read;
    if (this.awaiting !== null) return;
    this.pending = null;
    const current = read();
    const delta = observationDelta(this.previous, current);
    checkObservationBudget(delta);
    this.sequence++;
    this.send(this.sequence, delta);
    this.awaiting = this.sequence;
    this.previous = current;
  }

  acknowledge(sequence: number) {
    if (sequence !== this.awaiting) return;
    this.awaiting = null;
    if (this.pending) this.publish(this.pending);
  }
}
