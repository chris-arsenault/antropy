import { type EngineConfig } from "./types";

/** Resize area and supply together, keeping local physical lengths fixed. */
export function resizeWorld(config: EngineConfig, factor: number): EngineConfig {
  const dimension = (value: number) =>
    Math.max(8, 4 * config.mesh, Math.round((value * factor) / config.mesh) * config.mesh);
  const width = dimension(config.width),
    height = dimension(config.height);
  return {
    ...config,
    width,
    height,
    sourceCount: Math.round((config.sourceCount * width * height) / (config.width * config.height)),
  };
}
