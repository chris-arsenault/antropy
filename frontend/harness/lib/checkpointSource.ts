import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { type Engine } from "../../src/engine/client";
import { decodePackage } from "../../src/engine/package";

/** The only accepted sources are current binary checkpoints or current browser packages. */
export async function checkpointSource(engine: Engine, path: string) {
  const bytes = readFileSync(path);
  const packaged = bytes[0] === 0x1f && bytes[1] === 0x8b;
  const decoded = packaged ? await decodePackage(new Blob([bytes])) : null;
  const world = engine.restore(decoded?.snapshot ?? bytes);
  return {
    world,
    provenance: {
      path,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      restoringKernelDigest: engine.sourceDigest,
      packageMetadata: decoded?.metadata ?? null,
    },
  };
}
