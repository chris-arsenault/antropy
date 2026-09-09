import { decodeCheckpoint, encodeCheckpoint } from "./checkpoint";
import { type World } from "../sim/types";

export function downloadCheckpoint(world: World): void {
  const blob = new Blob([encodeCheckpoint(world)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `antropy-2d-seed-${world.seed}-tick-${world.tick}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function readCheckpoint(file: File): Promise<World> {
  return decodeCheckpoint(await file.text());
}
