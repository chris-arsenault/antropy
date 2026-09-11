import { DEFAULT_CONFIG, type Config } from "../sim/config";

export function FoodEpochSettings({
  config,
  onChange,
}: {
  config: Config;
  onChange: (config: Config) => void;
}) {
  return (
    <label>
      <input
        type="checkbox"
        checked={!!config.foodEpochs}
        onChange={(event) =>
          onChange({
            ...config,
            foodEpochs: event.target.checked ? DEFAULT_CONFIG.foodEpochs : undefined,
          })
        }
      />{" "}
      Food epochs
    </label>
  );
}
