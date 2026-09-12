/** Optional physical supply schedule. Absence retains heterogeneous mixed deposits. */
export interface FoodEpochs {
  readonly phaseTicks: number;
  readonly shares: readonly number[];
}
/** The measured alternating calendar; selectable, no longer the Run default. */
export const DEFAULT_EPOCHS: FoodEpochs = { phaseTicks: 50000, shares: [0.8, 0.2] };

export function validateFoodEpochs(value: unknown): void {
  if (value === undefined) return;
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid food epochs");
  const { phaseTicks, shares } = value as FoodEpochs;
  if (!Number.isSafeInteger(phaseTicks) || phaseTicks < 1)
    throw new Error("Food epoch duration must be a positive integer");
  validateShares(shares);
}
function validateShares(shares: unknown): void {
  if (!Array.isArray(shares) || shares.length < 1 || shares.length > 16)
    throw new Error("Food epochs require 1..16 shares");
  if (!shares.every((s) => typeof s === "number" && Number.isFinite(s) && s >= 0 && s <= 1))
    throw new Error("Food epoch shares must be fractions");
}

export function foodEpoch(schedule: FoodEpochs, tick: number) {
  const index = Math.floor(tick / schedule.phaseTicks);
  return {
    index,
    share: schedule.shares[index % schedule.shares.length],
    nextTick: (index + 1) * schedule.phaseTicks,
  };
}
