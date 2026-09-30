import { type EngineConfig } from "./types";
import { resizeWorld } from "./worldSize";

export function WorldSize({
  config,
  change,
}: {
  config: EngineConfig;
  change: (c: EngineConfig) => void;
}) {
  const regions = config.sourceCount
    ? Math.max(1, Math.round((config.width * config.height) / config.landscapeRegionSpacing ** 2))
    : 0;
  return (
    <details>
      <summary>World size and resource neighborhoods</summary>
      <p>
        {config.width} × {config.height} world units; {config.sourceCount} reservoirs; {regions}{" "}
        placement regions. Regions are initial opportunities, not fixed colony boundaries.
      </p>
      <button type="button" onClick={() => change(resizeWorld(config, Math.SQRT1_2))}>
        Half area
      </button>
      <button type="button" onClick={() => change(resizeWorld(config, Math.SQRT2))}>
        Double area
      </button>
      <p>
        These presets scale reservoir count with area and retain local terrain and neighborhood
        sizes. Editing width or height directly keeps the displayed reservoir count.
      </p>
    </details>
  );
}
