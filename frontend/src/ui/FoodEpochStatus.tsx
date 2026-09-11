import { type World } from "../sim/types";
import { foodEpoch } from "../sim/foodEpochs";

export function FoodEpochStatus({ world }: { world: World }) {
  const schedule = world.config.foodEpochs;
  if (!schedule) return null;
  const phase = foodEpoch(schedule, world.tick);
  return (
    <p>
      Food epoch {phase.index + 1}: new deposits contain {(100 * phase.share).toFixed(0)}% A /{" "}
      {((1 - phase.share) * 100).toFixed(0)}% B.
      {schedule.shares.length > 1 && (
        <> Next change at tick {phase.nextTick.toLocaleString()}.</>
      )}{" "}
      Existing deposits keep their contents.
    </p>
  );
}
