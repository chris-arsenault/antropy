// @vitest-environment node
import { expect, it } from "vitest";
import { loadEngine } from "./engine";

it("rejects harness worlds that would inherit an unnamed preset", async () => {
  const engine = await loadEngine(),
    small = { width: 24, height: 24, founders: 0, sourceCount: 0 };
  expect(() => engine.create(1, small)).toThrow(/preset/);
  expect(() => engine.command("configuration", { config: small })).toThrow(/preset/);
  const { config } = engine.command<{ config: Record<string, unknown> }>("configuration", {
    config: { preset: "diagnostic", ...small },
  });
  // A complete configuration, such as one read from a checkpoint, inherits nothing.
  engine.create(1, config).dispose();
  engine.create(1, { preset: "ecology", ...small }).dispose();
});
