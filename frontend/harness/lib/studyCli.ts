import { parseFlags } from "./flags";
import { runStudy } from "./studyRun";

runStudy(parseFlags(process.argv.slice(2)));
