// @vitest-environment node
import { readFileSync } from "node:fs";
import { expect, it, vi } from "vitest";
import { Engine } from "./client";
import { Session } from "./session";

it("measures completed tick work and excludes time spent paused", async () => {
  const engine = await Engine.load(
    new Uint8Array(readFileSync(new URL("../../public/antropy-engine.wasm", import.meta.url)))
  );
  const session = new Session(engine);
  let now = 10000;
  vi.spyOn(performance, "now").mockImplementation(() => now);
  vi.spyOn(session, "step").mockImplementation(() => {
    now += 200;
    return { tick: 1, stopReason: null };
  });
  try {
    session.setSpeed("max");
    for (let resume = 0; resume < 2; resume++) {
      session.setRunning(true);
      for (let i = 0; i < 3; i++) session.advance(now);
      expect(session.status().throughput).toBe(5);
      session.setRunning(false);
      now += 180000;
    }
  } finally {
    vi.restoreAllMocks();
    session.world.dispose();
  }
});
