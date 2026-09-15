import { parseFlags } from "./flags";
import { runStudy } from "./studyRun";

await runStudy(parseFlags(process.argv.slice(2)));
