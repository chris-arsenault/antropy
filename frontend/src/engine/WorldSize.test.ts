import { expect, it } from "vitest";
import { resizeWorld } from "./worldSize";
import { type EngineConfig } from "./types";

it("resizes supply with actual mesh-aligned area without changing local physical scales", () => {
  const c = {
    width: 720,
    height: 540,
    mesh: 2,
    sourceCount: 240,
    landscapeRegionSpacing: Math.sqrt((720 * 540) / 35),
    landscapeSpread: 18,
    terrain: { featureWavelength: 36 },
  } as EngineConfig;
  const bigger = resizeWorld(c, 2);
  expect([bigger.width, bigger.height, bigger.sourceCount]).toEqual([1440, 1080, 960]);
  expect(bigger.terrain).toBe(c.terrain);
  expect(bigger.landscapeRegionSpacing).toBe(c.landscapeRegionSpacing);
  expect(bigger.landscapeSpread).toBe(18);
  expect(resizeWorld(bigger, 0.5)).toEqual(c);
});
