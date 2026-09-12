/**
 * Optional spatial supply layout: equal vertical bands across the world, each with a fixed
 * food-A share for deposits arriving inside it. Absence retains heterogeneous mixed deposits.
 * Zones and epochs are alternatives; a configuration may declare at most one.
 */
export interface FoodZones {
  readonly shares: readonly number[];
}

export function validateFoodZones(value: unknown): void {
  if (value === undefined) return;
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid food zones");
  const { shares } = value as FoodZones;
  if (!Array.isArray(shares) || shares.length < 2 || shares.length > 16)
    throw new Error("Food zones require 2..16 band shares");
  if (!shares.every((s) => typeof s === "number" && Number.isFinite(s) && s >= 0 && s <= 1))
    throw new Error("Food zone shares must be fractions");
}

/** Band index and food-A share at a wrapped x coordinate. */
export function foodZone(zones: FoodZones, x: number, width: number) {
  const index = Math.min(zones.shares.length - 1, Math.floor((x / width) * zones.shares.length));
  return { index, share: zones.shares[index] };
}
