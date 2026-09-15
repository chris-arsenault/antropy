import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative, delimiter, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
// Resolve the caller's installed toolchain once; execute its absolute path without a shell.
function executable(name) {
  for (const directory of (process.env.PATH ?? "").split(delimiter)) {
    if (!directory) continue;
    const path = resolve(directory, name);
    if (existsSync(path)) return path;
  }
  throw new Error(`Required toolchain executable unavailable: ${name}`);
}
execFileSync(
  executable("cargo"),
  [
    "build",
    "--locked",
    "--manifest-path",
    "engine/Cargo.toml",
    "--release",
    "--target",
    "wasm32-unknown-unknown",
  ],
  {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, RUSTFLAGS: `${process.env.RUSTFLAGS ?? ""} -C target-feature=+simd128` },
  }
);
mkdirSync(new URL("../public/", import.meta.url), { recursive: true });
function files(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? files(join(path, entry.name)) : [join(path, entry.name)]
  );
}
const hash = createHash("sha256");
for (const path of [
  ...files(join(root, "engine/src")),
  join(root, "engine/Cargo.toml"),
  join(root, "engine/Cargo.lock"),
].sort()) {
  hash.update(relative(root, path));
  hash.update(readFileSync(path));
}
hash.update(execFileSync(executable("rustc"), ["--version"]));
hash.update(
  `${process.env.RUSTFLAGS ?? ""} -C target-feature=+simd128;wasm32-unknown-unknown;release`
);
function leb(value) {
  const bytes = [];
  do {
    const byte = value & 127;
    value >>>= 7;
    bytes.push(byte | (value ? 128 : 0));
  } while (value);
  return Buffer.from(bytes);
}
const name = Buffer.from("antropy.source"),
  digest = Buffer.from(hash.digest("hex"));
const section = Buffer.concat([leb(name.length), name, digest]);
const wasm = readFileSync(
  new URL("../../engine/target/wasm32-unknown-unknown/release/antropy_engine.wasm", import.meta.url)
);
writeFileSync(
  new URL("../public/antropy-engine.wasm", import.meta.url),
  Buffer.concat([wasm, Buffer.from([0]), leb(section.length), section])
);
