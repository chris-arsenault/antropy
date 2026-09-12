import { type World } from "../sim/types";
import { foodEpoch } from "../sim/foodEpochs";

const percent = (share: number) =>
  `${(100 * share).toFixed(0)}% A / ${(100 * (1 - share)).toFixed(0)}% B`;

export function FoodEpochStatus({ world }: { world: World }) {
  const { foodEpochs: schedule, foodZones: zones } = world.config;
  if (zones)
    return (
      <p>
        Food zones, left to right: {zones.shares.map(percent).join(" · ")}. New deposits take the
        composition of the band they land in; existing deposits keep their contents.
      </p>
    );
  if (!schedule) return null;
  const phase = foodEpoch(schedule, world.tick);
  return (
    <p>
      Food epoch {phase.index + 1}: new deposits contain {percent(phase.share)}.
      {schedule.shares.length > 1 && <> Next change at tick {phase.nextTick.toLocaleString()}.</>}{" "}
      Existing deposits keep their contents.
    </p>
  );
}
