import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { executable } from "./toolchain.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const toolchain = "nightly-2026-02-01";
const bindgen = "0.2.108";
const run = (command, args, extra = {}) =>
  execFileSync(executable(command), args, { cwd: root, stdio: "inherit", ...extra });
// CI and local builds use the same pinned tools. Public packages contain no credentials.
const installed = execFileSync(executable("rustup"), ["toolchain", "list"], { encoding: "utf8" });
if (!installed.includes(toolchain))
  run("rustup", [
    "toolchain",
    "install",
    toolchain,
    "--profile",
    "minimal",
    "--component",
    "rust-src",
    "--target",
    "wasm32-unknown-unknown",
  ]);
let version = "";
try {
  version = execFileSync(executable("wasm-bindgen"), ["--version"], { encoding: "utf8" }).trim();
} catch {
  /* Install the pinned public build tool below. */
}
if (version !== `wasm-bindgen ${bindgen}`)
  run("cargo", ["install", "wasm-bindgen-cli", "--version", bindgen, "--locked"]);

const flags = [
  "-C target-feature=+atomics,+bulk-memory,+simd128",
  "-C link-arg=--shared-memory",
  "-C link-arg=--max-memory=4294967296",
  "-C link-arg=--import-memory",
  "-C link-arg=--export=__wasm_init_tls",
  "-C link-arg=--export=__tls_size",
  "-C link-arg=--export=__tls_align",
  "-C link-arg=--export=__tls_base",
].join(" ");
run(
  "rustup",
  [
    "run",
    toolchain,
    "cargo",
    "build",
    "--lib",
    "--locked",
    "--manifest-path",
    "engine/Cargo.toml",
    "--release",
    "--target",
    "wasm32-unknown-unknown",
    "--features",
    "threads",
    "--target-dir",
    "engine/target/threads",
    "-Z",
    "build-std=panic_abort,std",
  ],
  { env: { ...process.env, RUSTFLAGS: flags } }
);
run("wasm-bindgen", [
  "engine/target/threads/wasm32-unknown-unknown/release/antropy_engine.wasm",
  "--target",
  "web",
  "--out-dir",
  "frontend/public/engine-threads",
  "--out-name",
  "engine",
]);
// Preserve the source identity appended to the serial binary, plus the execution toolchain.
const serial = readFileSync(new URL("../public/antropy-engine.wasm", import.meta.url));
const module = new WebAssembly.Module(serial);
const sections = WebAssembly.Module.customSections(module, "antropy.source");
writeFileSync(
  new URL("../public/engine-threads/build.json", import.meta.url),
  JSON.stringify({
    sourceDigest: new TextDecoder().decode(sections[0]),
    toolchain,
    bindgen,
    flags,
  })
);
