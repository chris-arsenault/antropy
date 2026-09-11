import { noteExecution } from "../persist/provenance";
import { checkpointToJson } from "../persist/checkpoint";
import { type World } from "../sim/types";

let source = "ANTROPY_SOURCE_ID";
// HMR can mix module versions. Record that uncertainty instead of claiming an exact bundle.
if (import.meta.hot?.data) {
  source = import.meta.hot.data.source ?? source;
  import.meta.hot.on("antropy:source", (data: { digest: string }) => {
    source = `mixed-hmr:${data.digest}`;
    import.meta.hot!.data.source = source;
  });
}
export const noteBrowserExecution = (world: World): void => noteExecution(world, source);
export const browserCheckpoint = (world: World): string => checkpointToJson(world, source);
