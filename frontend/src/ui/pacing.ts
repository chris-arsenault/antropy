export const SPEED_PRESETS = [1, 10, 100, 1000] as const;
export type SpeedPreset = (typeof SPEED_PRESETS)[number];

/** Speeds at which per-ant rendering is disabled and only charts update. */
export const CHARTS_ONLY_THRESHOLD = 1000;

export const BASE_TICKS_PER_SECOND = 10;

export interface FrameBudget {
  /** Hard cap on simulation work per frame, in ticks. */
  maxTicksPerFrame: number;
}

export const DEFAULT_FRAME_BUDGET: FrameBudget = { maxTicksPerFrame: 2000 };

/**
 * Wall-clock cap on simulation work per frame. When ticks cost more than the
 * budget allows, the host runs fewer ticks (effective speed drops) instead of
 * blocking the frame — the UI stays responsive at every speed setting.
 */
export const FRAME_TIME_BUDGET_MS = 12;

/**
 * Number of whole ticks to run for an animation frame. Fractional ticks are
 * carried by the caller via the returned remainder so slow speeds still
 * accumulate correctly.
 */
export function ticksForFrame(
  speed: SpeedPreset,
  elapsedMs: number,
  carry: number,
  budget: FrameBudget = DEFAULT_FRAME_BUDGET
): { ticks: number; carry: number } {
  const exact = carry + (elapsedMs / 1000) * BASE_TICKS_PER_SECOND * speed;
  const ticks = Math.min(Math.floor(exact), budget.maxTicksPerFrame);
  return { ticks, carry: exact - Math.floor(exact) };
}

export function isChartsOnly(speed: SpeedPreset): boolean {
  return speed >= CHARTS_ONLY_THRESHOLD;
}
