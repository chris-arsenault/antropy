import { describe, expect, it } from "vitest";
import { foundColony } from "../colony";
import { createWorld, stepWorld } from "../world";
import { degraded, omniscientOracle, resetOracleState, sensorOracle, type OraclePolicy } from "./policies";

// Slow tier: Appendix B §B.4 certification gates. A failure here indicts the
// layer named by the rung, not the controller.
function runLadderColony(seed: number, policy: OraclePolicy) {
  resetOracleState();
  const world = createWorld(seed);
  const colony = foundColony(world);
  world.policyOverride = policy;
  for (let t = 0; t < 8000; t++) {
    stepWorld(world);
  }
  const merit = Array.from(colony.patrilineDeliveries.values()).reduce((a, b) => a + b, 0);
  return { world, colony, merit };
}

describe("oracle ladder (§B.4)", () => {
  it("rung 1: the world is generous enough for a competent agent", { timeout: 240_000 }, () => {
    const { world, merit } = runLadderColony(8101, omniscientOracle);
    expect(world.colonies.length).toBe(1);
    expect(world.ants.length).toBeGreaterThan(10);
    expect(merit).toBeGreaterThan(2);
  });

  it("rung 2: the sensory interface is sufficient", { timeout: 240_000 }, () => {
    const { world, merit } = runLadderColony(8102, sensorOracle);
    expect(world.colonies.length).toBe(1);
    expect(world.ants.length).toBeGreaterThan(8);
    expect(merit).toBeGreaterThan(1);
  });

  it("rung 4: margins survive noise and lag", { timeout: 240_000 }, () => {
    const { world } = runLadderColony(8103, degraded(sensorOracle, 0.05, 2));
    expect(world.colonies.length).toBe(1);
    expect(world.ants.length).toBeGreaterThan(5);
  });
});
