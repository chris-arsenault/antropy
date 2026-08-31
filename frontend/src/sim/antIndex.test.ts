import { describe, expect, it } from "vitest";
import { buildAntIndex, antsNear } from "./antIndex";
import { createAnt } from "./ant";
import { braitenbergController } from "./controller/braitenberg";
import { createGrid } from "./grid";
import { createRng } from "./rng";

function antAt(id: number, x: number, y: number, z: number) {
  return createAnt(id, {
    x,
    y,
    z,
    heading: 0,
    energy: 1,
    lineageId: 0,
    patrilineId: 0,
    motherId: 0,
    fatherId: 0,
    genome: braitenbergController.seed(createRng(1)),
    controllerState: braitenbergController.createState(),
  });
}

describe("ant spatial index", () => {
  const grid = createGrid(32, 16, 32);

  it("finds co-located and nearby ants only", () => {
    const ants = [antAt(1, 5, 5, 5), antAt(2, 5, 5, 5), antAt(3, 6, 5, 5), antAt(4, 20, 5, 20)];
    const index = buildAntIndex(grid, ants);

    const atVoxel = antsNear(index, grid, 5, 5, 5, 0);
    expect(atVoxel.map((a) => a.id)).toEqual([1, 2]);

    const within1 = antsNear(index, grid, 5, 5, 5, 1);
    expect(within1.map((a) => a.id).sort()).toEqual([1, 2, 3]);

    expect(antsNear(index, grid, 20, 5, 20, 1).map((a) => a.id)).toEqual([4]);
  });

  it("excludes dead ants", () => {
    const dead = antAt(9, 3, 3, 3);
    dead.alive = false;
    const index = buildAntIndex(grid, [dead]);
    expect(antsNear(index, grid, 3, 3, 3, 1)).toEqual([]);
  });
});
