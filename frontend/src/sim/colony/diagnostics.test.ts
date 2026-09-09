import { expect, it, vi } from "vitest";
import { constructionFixture } from "../construction/fixture";
import { observeDecisions, reportDecision, captureDecision } from "./diagnostics";
import { WAIT } from "./contract";

it("keeps independent measurement subscribers active when another subscriber detaches", () => {
  const { world } = constructionFixture();
  const decisions = vi.fn(),
    spatialUse = vi.fn();
  const stopDecisions = observeDecisions(world, decisions);
  const stopSpatial = observeDecisions(world, spatialUse);
  const before = captureDecision(world, world.ant);
  reportDecision(world, world.ant, [], WAIT, "success", before);
  stopSpatial();
  reportDecision(world, world.ant, [], WAIT, "success", before);
  expect(decisions).toHaveBeenCalledTimes(2);
  expect(spatialUse).toHaveBeenCalledTimes(1);
  stopDecisions();
  reportDecision(world, world.ant, [], WAIT, "success", before);
  expect(decisions).toHaveBeenCalledTimes(2);
  expect(captureDecision(world, world.ant)).toBeNull();
});
