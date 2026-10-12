// @vitest-environment node
import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { parseFlags } from "./flags";
import { runServerReview } from "./serverReview";

let output: string;
beforeEach(async () => {
  const root = fileURLToPath(new URL("../artifacts/", import.meta.url));
  await mkdir(root, { recursive: true });
  output = await mkdtemp(`${root}server-review-test-`);
  vi.stubEnv("BIOTROPY_TOKEN", "test-operator-secret");
});
afterEach(async () => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  await rm(output, { recursive: true, force: true });
});
function flags(extra: string[] = []) {
  return parseFlags(["--server", "http://127.0.0.1:8095", "--output", output, ...extra]);
}
it("uses only GET and exports a retained living checkpoint with independent provenance", async () => {
  const routes: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: URL, init: RequestInit) => {
      expect(init.method ?? "GET").toBe("GET");
      expect(init.redirect).toBe("error");
      expect(init.headers).toEqual({ Authorization: "Bearer test-operator-secret" });
      routes.push(url.pathname);
      if (url.pathname === "/api/checkpoints/automatic-living")
        return new Response(new Uint8Array([65, 66, 67]), {
          headers: {
            "x-biotropy-generation": "2",
            "x-biotropy-tick": "100",
            "x-biotropy-version": "53",
            "x-biotropy-checkpoint": "automatic-living",
          },
        });
      if (url.pathname === "/api/checkpoints")
        return Response.json({
          checkpoints: [
            { id: "automatic-empty", population: 0, compatible: true, createdAt: 200 },
            { id: "automatic-living", population: 4, compatible: true, createdAt: 100 },
          ],
        });
      return Response.json({ generation: 4, tick: 500, population: 0 });
    })
  );
  await runServerReview(flags(["--checkpoint", "latest-living"]));
  expect(routes).toEqual([
    "/api/status",
    "/api/diagnostics",
    "/api/ecology",
    "/api/checkpoints",
    "/api/checkpoints/automatic-living",
    "/api/status",
  ]);
  expect(await readFile(`${output}/checkpoint.bin`, "utf8")).toBe("ABC");
  const manifestText = await readFile(`${output}/capture.json`, "utf8"),
    manifest = JSON.parse(manifestText);
  expect(manifest.complete).toBe(true);
  expect(manifest.files[4]).toMatchObject({
    bytes: 3,
    tick: "100",
    generation: "2",
    version: "53",
  });
  expect(manifest.files[4].sha256).toHaveLength(64);
  expect(manifestText).not.toContain("test-operator-secret");
});
it("stops on credential failure without retry or later requests", async () => {
  const fetch = vi.fn(async () => new Response("Denied", { status: 401 }));
  vi.stubGlobal("fetch", fetch);
  await expect(runServerReview(flags())).rejects.toThrow("HTTP 401");
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(JSON.parse(await readFile(`${output}/capture-failure.json`, "utf8")).complete).toBe(false);
});
it("enforces actual streamed bytes even without Content-Length", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(new Uint8Array(2 * 1024 * 1024)))
  );
  await expect(runServerReview(flags(["--max-mib", "1"]))).rejects.toThrow("byte budget");
  expect(JSON.parse(await readFile(`${output}/capture-failure.json`, "utf8")).complete).toBe(false);
});
it("rejects credential-bearing URLs and destinations outside ignored artifacts", async () => {
  await expect(
    runServerReview(parseFlags(["--server", "http://secret@localhost"]))
  ).rejects.toThrow("without credentials");
  await expect(runServerReview(parseFlags(["--output", "../outside-artifacts"]))).rejects.toThrow(
    "under frontend/harness/artifacts"
  );
});
