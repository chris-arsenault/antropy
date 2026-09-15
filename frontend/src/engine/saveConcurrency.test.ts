// @vitest-environment node
import { readFileSync } from "node:fs";
import { expect, it, vi } from "vitest";
import { Engine } from "./client";
import { Session } from "./session";
import * as packages from "./package";

vi.mock("./recovery", () => ({ storeRecovery: vi.fn(async () => "saved") }));

it("serializes multiple save requests before allocating their snapshots", async () => {
  const engine = await Engine.load(new Uint8Array(readFileSync("public/antropy-engine.wasm")));
  const session = new Session(engine);
  let active = 0,
    maximum = 0;
  const encode = vi.spyOn(packages, "encodePackage").mockImplementation(async () => {
    active++;
    maximum = Math.max(active, maximum);
    await new Promise((resolve) => setTimeout(resolve, 10));
    active--;
    return new Blob();
  });
  try {
    await Promise.all([session.save("manual"), session.save("manual"), session.export()]);
    expect(maximum).toBe(1);
  } finally {
    encode.mockRestore();
    session.world.dispose();
  }
});
