import { type Config } from "../sim/config";
import { foodLayout, withLayout, type FoodLayout } from "./foodLayout";

export function FoodEpochSettings({
  config,
  onChange,
}: {
  config: Config;
  onChange: (config: Config) => void;
}) {
  return (
    <label>
      Food layout{" "}
      <select
        value={foodLayout(config)}
        onChange={(event) => onChange(withLayout(config, event.target.value as FoodLayout))}
      >
        <option value="mixed">Mixed deposits</option>
        <option value="epochs">Alternating epochs</option>
        <option value="zones">A-rich and B-rich halves</option>
      </select>
    </label>
  );
}
