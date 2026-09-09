import { expect, it } from "vitest";
import { constructionFixture } from "../sim/construction/fixture";
import { nestArea } from "../sim/construction/nestArea";
import { createCheckpoint, restoreCheckpoint } from "./checkpoint";

it("retains the original nest-area denominator through checkpoint restoration", () => {
  const { world } = constructionFixture();
  const before = nestArea(world);
  const restored = restoreCheckpoint(createCheckpoint(world));
  expect(nestArea(restored)).toEqual(before);
});
