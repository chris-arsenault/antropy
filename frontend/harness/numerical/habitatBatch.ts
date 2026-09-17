/** Pilots and main are separate explicit invocations; inspect pilot evidence before main. */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [stage, directory] = process.argv.slice(2);
if (!["pilot", "main"].includes(stage) || !directory)
  throw new Error("Expected pilot|main and study directory; main requires reviewed pilots");
if (stage === "pilot") {
  mkdirSync(directory);
  writeFileSync(join(directory, "registration.json"), JSON.stringify({ started: Date.now() }));
}
for (const seed of [27, 101])
  for (const arm of ["on", "off"]) {
    if (stage === "main") {
      const pilot = JSON.parse(
        readFileSync(join(directory, `pilot-${seed}-${arm}`, "result.json"), "utf8")
      );
      if (pilot.failure || pilot.stop !== "horizon")
        throw new Error("Pilot requires investigation");
    }
    execFileSync(
      process.execPath,
      ["--import", "tsx", "harness/numerical/habitatStudy.ts", stage, String(seed), arm, directory],
      { stdio: "inherit" }
    );
  }
