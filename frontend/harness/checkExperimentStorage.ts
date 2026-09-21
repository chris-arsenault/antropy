/** Check the Git index so ignored local runs cannot quietly return to committed artifacts. */
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { isLocalExperiment } from "./lib/artifactPolicy";

const root = resolve(process.cwd(), process.argv[2] ?? ".");
const tracked = execFileSync("/usr/bin/git", ["-C", root, "ls-files", "--cached", "-z"], {
  encoding: "utf8",
});
const experimental = tracked.split("\0").filter(isLocalExperiment);
if (experimental.length > 0) {
  console.error("Experimental data must remain in ignored local files:");
  for (const path of experimental) console.error(path);
  process.exitCode = 1;
} else {
  console.log("experiment storage check passed: no tracked ledger or raw experiment artifacts");
}
