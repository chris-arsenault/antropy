import { afterAll, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { RemoteScene } from "./remoteFrame";
import { decompressPublication } from "./remoteCompression";

const output = mkdtempSync(join(tmpdir(), "biotropy-transport-"));
afterAll(() => rmSync(output, { recursive: true, force: true }));

it("reconstructs real native packets through changes, removal, skipped samples, view changes, thinning and resets", async () => {
  execFileSync(
    process.env.CARGO ?? execFileSync("/usr/bin/which", ["cargo"], { encoding: "utf8" }).trim(),
    [
      "test",
      "--manifest-path",
      resolve("../engine/Cargo.toml"),
      "--bin",
      "biotropy-server",
      "export_transport_fixtures",
      "--",
      "--ignored",
    ],
    {
      env: { ...process.env, BIOTROPY_TRANSPORT_FIXTURE: output },
      timeout: 120000,
    }
  );
  const scene = new RemoteScene();
  for (const label of [
    "initial",
    "unchanged",
    "changed",
    "sun-map",
    "view",
    "history",
    "replacement",
    "reconnect",
  ]) {
    const zipped = new Uint8Array(readFileSync(join(output, `${label}.gz`)));
    const raw = await decompressPublication(zipped.buffer);
    const expected = JSON.parse(readFileSync(join(output, `${label}.json`), "utf8"));
    const { frame, metadata } = scene.receive(raw);
    expect(scene.status, label).toEqual(expected.status);
    expect(frame.tick).toBe(expected.tick);
    expect(frame.generation).toBe(expected.generation);
    expect(frame.sequence).toBe(expected.sequence);
    expect(organisms(frame.cells), label).toEqual(
      expected.organisms.map((v: [number, number[]]) => [v[0], v[1].map(Math.fround)])
    );
    const environment = Array.from({ length: 8 }, (_, lane) =>
      Array.from({ length: frame.nx * frame.ny }, (_, i) => frame.field[i * 8 + lane])
    );
    expect(environment, label).toEqual(
      expected.environment.map((v: number[]) => v.map(Math.fround))
    );
    expect(frame.markerCount).toBe(expected.markers.length);
    const markers = Array.from({ length: frame.markerCount }, (_, i) =>
      Array.from(frame.markers.slice(i * 12, (i + 1) * 12))
    );
    expect(markers.sort(compareRecords)).toEqual(
      expected.markers.map((v: [number, number[]]) => v[1].map(Math.fround)).sort(compareRecords)
    );
    if (["unchanged", "changed", "history"].includes(label)) {
      expect(metadata.definition).toBeNull();
      expect(metadata.reset).toBe(false);
    }
  }
}, 120000);

function organisms(records: Float32Array) {
  return Array.from({ length: records.length / 12 }, (_, i) => {
    const row = records.slice(i * 12, (i + 1) * 12);
    return [row[9], [...row.slice(0, 9), row[10], row[11]]];
  }).sort((a, b) => Number(a[0]) - Number(b[0]));
}
function compareRecords(a: number[], b: number[]) {
  return JSON.stringify(a).localeCompare(JSON.stringify(b));
}
