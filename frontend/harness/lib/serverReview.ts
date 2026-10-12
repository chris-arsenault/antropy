import { mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { assertKnownFlags, flag, integerFlag, wallSecondsFlag, type Flags } from "./flags";
import { downloadEvidence } from "./serverReviewDownload";

const MIB = 1024 * 1024;
// The established operator listener is LAN-only HTTP; callers may supply HTTPS.
// eslint-disable-next-line sonarjs/no-clear-text-protocols
const DEFAULT_SERVER = "http://192.168.66.3:8095";
interface StoredCheckpoint {
  id: string;
  compatible: boolean;
  population: number;
  createdAt: number;
}
function checkpointId(choice: string, checkpoints: StoredCheckpoint[]): string | null {
  if (choice === "none") return null;
  if (choice !== "latest-living") {
    if (!/^[a-z0-9-]+$/.test(choice)) throw new Error("Invalid stored checkpoint id");
    return choice;
  }
  const living = checkpoints
    .filter((c) => c.compatible && c.population > 0)
    .sort((a, b) => b.createdAt - a.createdAt)[0];
  if (!living) throw new Error("No compatible living checkpoint is retained");
  return living.id;
}
async function outputDirectory(path: string): Promise<string> {
  const root = fileURLToPath(new URL("../artifacts/", import.meta.url)),
    output = resolve(path),
    inside = (parent: string, child: string) => {
      const local = relative(parent, child);
      return local !== "" && !local.startsWith(`..${sep}`) && local !== "..";
    };
  if (!inside(root, output))
    throw new Error("Capture output must be under frontend/harness/artifacts/");
  await mkdir(output, { recursive: true });
  if (!inside(await realpath(root), await realpath(output)))
    throw new Error("Capture output resolves outside local artifacts");
  return output;
}
function serverOrigin(text: string): URL {
  const server = new URL(text);
  if (
    !["http:", "https:"].includes(server.protocol) ||
    server.username ||
    server.password ||
    server.search ||
    server.hash ||
    server.pathname !== "/"
  )
    throw new Error(
      "--server must be an HTTP(S) origin without credentials, path, query or fragment"
    );
  return server;
}
function options(flags: Flags) {
  assertKnownFlags(flags, ["server", "output", "checkpoint", "max-mib", "wall-seconds"]);
  const token = process.env.BIOTROPY_TOKEN;
  if (!token)
    throw new Error(
      "BIOTROPY_TOKEN is required; run through with-cred -- in the managed environment"
    );
  const server = serverOrigin(flag(flags, "server", DEFAULT_SERVER));
  const maxMiB = integerFlag(flags, "max-mib", 512),
    wallSeconds = wallSecondsFlag(flags, 120);
  if (maxMiB <= 0 || maxMiB > 4096) throw new Error("--max-mib must be from1 to4096");
  if (wallSeconds > 3600) throw new Error("--wall-seconds must be at most3600");
  return { token, server, maxMiB, wallSeconds };
}
export async function runServerReview(flags: Flags) {
  const { token, server, maxMiB, wallSeconds } = options(flags),
    output = await outputDirectory(
      flag(flags, "output", `harness/artifacts/server-review-${Date.now()}`)
    ),
    budget = { remaining: maxMiB * MIB, signal: AbortSignal.timeout(wallSeconds * 1000) },
    files: Awaited<ReturnType<typeof downloadEvidence>>[] = [],
    manifest = {
      schema: 1,
      startedAt: new Date().toISOString(),
      server: server.origin,
      maxMiB,
      wallSeconds,
      files,
    };
  const get = async (route: string, name: string, limit = 64 * MIB) => {
    files.push(
      await downloadEvidence(
        new URL(`/api/${route}`, server),
        token,
        resolve(output, name),
        budget,
        limit
      )
    );
  };
  try {
    for (const route of ["status", "diagnostics", "ecology", "checkpoints"])
      await get(route, `${route}.json`);
    const index = JSON.parse(await readFile(resolve(output, "checkpoints.json"), "utf8")),
      id = checkpointId(flag(flags, "checkpoint", "none"), index.checkpoints);
    if (id) await get(`checkpoints/${id}`, "checkpoint.bin", 2048 * MIB);
    await get("status", "status-after.json");
    await writeFile(
      resolve(output, "capture.json"),
      JSON.stringify(
        { ...manifest, completedAt: new Date().toISOString(), complete: true },
        null,
        2
      ),
      { flag: "wx" }
    );
    console.log(output);
    return output;
  } catch (error) {
    await writeFile(
      resolve(output, "capture-failure.json"),
      JSON.stringify({ ...manifest, complete: false, error: String(error) }, null, 2),
      { flag: "wx" }
    );
    throw error;
  }
}
