import { readFileSync } from "node:fs";
import { loadEngine } from "./engine";

function difference(a: unknown, b: unknown, path = ""): unknown {
  if (Object.is(a, b)) return null;
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object")
    return { path, a, b };
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const result = difference(
      (a as Record<string, unknown>)[key],
      (b as Record<string, unknown>)[key],
      `${path}.${key}`
    );
    if (result) return result;
  }
  return null;
}
const engine = await loadEngine();
const a = engine.restore(readFileSync(process.argv[2]));
// Restore twice is deterministic; step before the next restore to test noncanonical runtime state.
a.step(Number(process.argv[3] ?? 110));
const b = engine.restore(a.snapshot());
for (let i = 0; i < 5; i++) {
  const frameA = a.command<{ cells: { id: number }[] }>("frame"),
    frameB = b.command("frame");
  console.log(JSON.stringify({ phase: i, frame: difference(frameA, frameB) }));
  for (const cell of frameA.cells) {
    const found = difference(
      a.command("inspect", { cell: cell.id }),
      b.command("inspect", { cell: cell.id })
    );
    if (found) {
      console.log(JSON.stringify({ cell: cell.id, first: found }));
      break;
    }
  }
  a.step();
  b.step();
}
a.dispose();
b.dispose();
