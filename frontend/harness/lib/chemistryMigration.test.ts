// @vitest-environment node
import { expect, it } from "vitest";
import { loadEngine } from "../numerical/engine";
import { type Summary, type Definition } from "../../src/engine/types";
import { parseFlags } from "./flags";
import { rpsScenario, rpsSettings, FAMILIES } from "./rpsContest";
import { zoneScenario, zoneSettings, dietGenotype, DIETS } from "./zonesContest";
import { invasionSettings } from "./invasion";

it("runs family and allocation contests through the same strict numerical checkpoints", async () => {
  const engine = await loadEngine(),
    flags = parseFlags(["--size", "16", "--founders", "4", "--sources", "1"]),
    zones = zoneSettings(flags, engine);
  const scenarios = [
    rpsScenario("families", FAMILIES, rpsSettings(flags, engine)),
    zoneScenario(
      "allocations",
      DIETS.map((label) => ({ label, genotype: dietGenotype(label, zones, engine) })),
      zones
    ),
  ];
  for (const scenario of scenarios) {
    const world = scenario.create(engine, 101, false),
      restored = engine.restore(world.snapshot());
    try {
      world.step();
      restored.step();
      expect(world.snapshot()).toEqual(restored.snapshot());
      const s = world.command<Summary>("summary");
      expect(s.materialResidual).toBeCloseTo(0, 8);
      expect(s.energyResidual).toBeCloseTo(0, 8);
    } finally {
      world.dispose();
      restored.dispose();
    }
  }
});
it("preserves source dimensions, chemistry and population settings in invasion", async () => {
  const engine = await loadEngine(),
    world = engine.create(101, {
      width: 32,
      height: 16,
      founders: 4,
      sourceCount: 2,
      chemistrySeed: 7,
      viscosity: 0.02,
    });
  try {
    const s = invasionSettings(world, parseFlags([]), engine);
    expect(s.config).toEqual(world.command<Definition>("definition").config);
    expect(s.founders).toBe(4);
    expect(s.sources).toBe(2);
    expect(invasionSettings(world, parseFlags(["--size", "24"]), engine).config.height).toBe(24);
  } finally {
    world.dispose();
  }
});
it("rejects retired switches instead of silently ignoring them", () => {
  for (const name of [
    "weathering-period",
    "cycle",
    "toxin-types",
    "prey-yield",
    "sharing-rate",
    "matrix",
    "secretion-rate",
    "resolution",
    "chemical-resolution",
    "regime",
  ])
    expect(() => parseFlags(["--" + name, "1"])).toThrow(/Retired/);
});
