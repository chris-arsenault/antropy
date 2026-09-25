/** Three operating loads registered in LIGHT-ECOLOGY-PLAN.md, M6 execution. */
import { runCapacity } from "./capacity";

const output = process.argv[2];
if (!output) throw new Error("Expected a new output directory");
await runCapacity(output, undefined, [
  [48, false, 4, false, 100, false, true],
  [2000, false],
  [96, false, 8, true, 100, true],
]);
