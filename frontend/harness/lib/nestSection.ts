import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { type World } from "../../src/sim/types";
import { connectedNestCells } from "../../src/sim/construction/nestArea";
import { cellIndex, pointAt } from "../../src/sim/grid";
import { Material } from "../../src/sim/materials";

/** Exact grid projection for headless review: no renderer, browser or policy inputs. */
export function writeNestSection(world: World, initial: readonly number[], output: string): void {
  const cells = [...connectedNestCells(world.grid, world.nest.home)].map((i) =>
    pointAt(world.grid, i)
  );
  if (!cells.length) return;
  const left = Math.min(...cells.map((p) => p.x)) - 2;
  const right = Math.max(...cells.map((p) => p.x)) + 2;
  const bottom = Math.min(...cells.map((p) => p.y)) - 2;
  const top = Math.max(...cells.map((p) => p.y)) + 2;
  const symbol = (x: number, y: number) => {
    const i = cellIndex(world.grid, x, y);
    if (world.grid.backing[i] === Material.AIR) return " ";
    if (![Material.AIR, Material.CACHE].includes(world.grid.cells[i])) return "#";
    return [Material.AIR, Material.CACHE].includes(initial[i]) ? "." : "+";
  };
  const lines = ["# soil | . original nest | + excavated open cell", `x=${left}..${right}`];
  for (let y = top; y >= bottom; y--)
    lines.push(
      `${y} ${Array.from({ length: right - left + 1 }, (_, i) => symbol(left + i, y)).join("")}`
    );
  writeFileSync(resolve(output, "nest-section.txt"), lines.join("\n") + "\n");
}
