/** Harness observations only; positions and counters never enter controller inputs. */
export class ColonyMotion {
  readonly counts = {
    commands: 0,
    moves: 0,
    observedTranslations: 0,
    turns: 0,
    reversals: 0,
    longestTurnRun: 0,
  };
  private readonly previous = new Map<
    number,
    { x: number; y: number; motor: number; run: number }
  >();

  observe(id: number, x: number, y: number, motor: number): void {
    const old = this.previous.get(id) ?? { x, y, motor: 0, run: 0 };
    const turning = [1, 2].includes(motor);
    const oldTurning = [1, 2].includes(old.motor);
    const run = turning ? old.run + 1 : 0;
    this.counts.commands++;
    this.counts.moves += Number(motor === 3);
    this.counts.turns += Number(turning);
    this.counts.reversals += Number(turning && oldTurning && old.motor !== motor);
    this.counts.observedTranslations += Number(old.x !== x || old.y !== y);
    this.counts.longestTurnRun = Math.max(this.counts.longestTurnRun, run);
    this.previous.set(id, { x, y, motor, run });
  }
}
