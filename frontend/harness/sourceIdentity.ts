import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { type Plugin } from "vite";

function files(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(join(root, e.name)) : [join(root, e.name)]
  );
}
export function browserSourceDigest(root: string): string {
  const hash = createHash("sha256");
  for (const path of [
    ...files(join(root, "src")),
    ...files(join(root, "../engine/src")),
    join(root, "../engine/Cargo.toml"),
    join(root, "../engine/Cargo.lock"),
    join(root, "scripts/build-engine.mjs"),
    join(root, "scripts/build-threads.mjs"),
    join(root, "scripts/toolchain.mjs"),
    join(root, "pnpm-lock.yaml"),
    join(root, "vite.config.ts"),
    join(root, "harness/sourceIdentity.ts"),
  ].sort()) {
    hash.update(relative(root, path));
    hash.update(readFileSync(path));
  }
  return hash.digest("hex");
}
export function sourceIdentity(): Plugin {
  let root = "";
  return {
    name: "antropy-source-identity",
    configResolved(config) {
      root = config.root;
    },
    transform(code, id) {
      if (!id.endsWith("/src/engine/runtimeIdentity.ts")) return;
      return { code: code.replace("ANTROPY_SOURCE_ID", browserSourceDigest(root)), map: null };
    },
    handleHotUpdate(ctx) {
      ctx.server.ws.send({
        type: "custom",
        event: "antropy:source",
        data: { digest: browserSourceDigest(root) },
      });
    },
  };
}
