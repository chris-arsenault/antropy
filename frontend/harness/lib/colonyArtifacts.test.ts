import { afterEach, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { physicsDigest } from "./colonyArtifacts";

const directories: string[] = [];
afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true });
});

it("fingerprints extracted runtime modules and their paths, excluding tests and model data", () => {
  const directory = mkdtempSync(join(tmpdir(), "antropy-digest-"));
  directories.push(directory);
  writeFileSync(join(directory, "world.ts"), "export const tick = 1;");
  const baseline = physicsDigest(directory);
  writeFileSync(join(directory, "world.test.ts"), "test fixture");
  writeFileSync(join(directory, "review-colony.json"), "model fixture");
  expect(physicsDigest(directory)).toBe(baseline);
  mkdirSync(join(directory, "plugins"));
  writeFileSync(join(directory, "plugins", "fields.ts"), "export const field = 1;");
  const extracted = physicsDigest(directory);
  expect(extracted).not.toBe(baseline);
  rmSync(join(directory, "plugins", "fields.ts"));
  writeFileSync(join(directory, "plugins", "transport.ts"), "export const field = 1;");
  expect(physicsDigest(directory)).not.toBe(extracted);
});
