export const SPEEDS = [1, 10, 30, 60, 120, "max"] as const;
export type Speed = (typeof SPEEDS)[number];
export const DEFAULT_SPEED: Speed = 30;
/** Paced speeds leave most of a 60 Hz frame to rendering; maximum accepts about 30 frames/s. */
const FRAME_BUDGET_MS = 9,
  MAX_FRAME_BUDGET_MS = 28;

/** Wall-clock tick targets; bounded debt prevents catch-up bursts after a suspended tab. */
export function createPacer(speed: Speed, start: number) {
  let previous = start,
    owed = 0;
  const budget = speed === "max" ? MAX_FRAME_BUDGET_MS : FRAME_BUDGET_MS;
  return {
    advance(now: number, step: () => void, clock: () => number): number {
      const elapsed = Math.max(0, now - previous);
      previous = now;
      if (speed !== "max") owed = Math.min(Math.max(1, speed / 4), owed + (elapsed * speed) / 1000);
      const deadline = clock() + budget;
      let ticks = 0;
      while (speed === "max" || owed >= 1 - 1e-9) {
        step();
        ticks++;
        if (speed !== "max") owed = Math.max(0, owed - 1);
        if (clock() >= deadline || ticks >= 256) break;
      }
      return ticks;
    },
  };
}
