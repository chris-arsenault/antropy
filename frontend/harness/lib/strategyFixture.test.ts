import { expect, it } from "vitest";
import { createWorld, stepWorld } from "../../src/sim/world";
import { DEFAULT_CONFIG } from "../../src/sim/config";
import { balance, materialBalance } from "../../src/sim/accounting";
import { strategyFixture, installMotorVariants } from "./strategyFixture";
import { parseFlags } from "./flags";

it("matches scheduled supply and conserves material through deposit replacement", () => {
  const supplied = [5, 25].map((lifetime) => {
    const world = createWorld(301, { ...DEFAULT_CONFIG, sourceCount: 0, founders: 4 });
    const flags = parseFlags(["--ticks", "100", "--lifetime", String(lifetime)]);
    const fixture = strategyFixture(world, flags);
    installMotorVariants(world, flags);
    expect(world.cells[0].body).toEqual(world.cells[1].body);
    for (let i = 0; i < 100; i++) {
      fixture.beforeStep();
      stepWorld(world);
      fixture.afterStep();
    }
    expect(world.sources).toHaveLength(0);
    expect(Math.abs(balance(world))).toBeLessThan(1e-8);
    expect(Math.abs(materialBalance(world))).toBeLessThan(1e-8);
    return world.ledger.supplied;
  });
  expect(supplied[0]).toBeCloseTo(supplied[1], 10);
});
