import { type SimConfig } from "./config";
import { layoutSpecs } from "./nestLayouts";

/** Generation constraints are separate from checkpoint state validity. */
export function validateGeneration(config: SimConfig): void {
  const specs = layoutSpecs(config.environment.nestShape, config.nestSeed);
  const relief = config.environment.surfaceProfile === "woodland" ? 18 : 5;
  const depth = Math.max(...specs.chambers.map((room) => room.depth + room.ry));
  const halfWidth = Math.max(...specs.chambers.map((room) => Math.abs(room.dx) + room.rx));
  const headroom = relief + (config.environment.surfaceTiers ? 52 : 3);
  if (!Number.isSafeInteger(config.surfaceBase) || config.surfaceBase - relief - depth < 0)
    throw new Error("ground datum leaves insufficient room for the selected nest");
  if (config.surfaceBase + headroom >= config.height)
    throw new Error("world height leaves insufficient space above the ground");
  if (config.width / 2 <= Math.max(halfWidth + 8, config.foodClearance + 8))
    throw new Error("world width leaves insufficient nest or foraging space");
  if (!Number.isSafeInteger(config.foodCount) || !Number.isSafeInteger(config.foodClearance))
    throw new Error("food count and clearance must be integers");
}
