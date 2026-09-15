// @vitest-environment node
import { expect, it } from "vitest";
import { loadEngine } from "../numerical/engine";
import { type Summary } from "../../src/engine/types";
import { strategyFixture } from "./strategyFixture";
import { parseFlags } from "./flags";
it("matches total scheduled supply and conserves material through source replacement", async () => {
  const engine = await loadEngine(),
    supplied = [];
  for (const lifetime of [5, 25]) {
    const world = engine.create(301, { width: 16, height: 16, sourceCount: 0, founders: 0 });
    try {
      const fixture = strategyFixture(
        world,
        parseFlags(["--ticks", "100", "--lifetime", String(lifetime)])
      );
      for (let i = 0; i < 100; i++) {
        fixture.beforeStep();
        world.step();
        fixture.afterStep();
      }
      const s = world.command<Summary>("summary");
      expect(world.command<{ sources: unknown[] }>("environment").sources).toHaveLength(0);
      expect(Math.abs(s.energyResidual)).toBeLessThan(1e-8);
      expect(Math.abs(s.materialResidual)).toBeLessThan(1e-8);
      supplied.push(s.ledger.supplied);
    } finally {
      world.dispose();
    }
  }
  expect(supplied[0]).toBeCloseTo(supplied[1], 10);
});
