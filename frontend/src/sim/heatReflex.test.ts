import { describe, expect, it } from "vitest";
import { surfaceSpawnY } from "./ant";
import { backboneVector, rnnController } from "./controller/rnn";
import { createRng } from "./rng";
import { createWorld, spawnAnt, stepWorld, type World } from "./world";

/**
 * The hand-derived backbone (§B.9.1): a seed-portfolio capability, not the
 * shipped forager. Rung-3 assays verify a competence is *expressible*
 * against the shipped sensors; whether a given derived seed chooses to use
 * it is an S-layer outcome (the in-vivo forager drops it because foraging
 * through middays beats burrowing in the current economy).
 */
function backboneGenome() {
  return rnnController.deserializeGenome(backboneVector());
}

/**
 * Rung-3 assay for the heat-escape competence, behavior-level: a
 * heat-instinct ant on the open surface at a harsh midday digs itself
 * below ground; the same ant on a cool night leaves the terrain alone.
 */
const HOT_TICK = 30_500;
const COOL_TICK = 11_500;

function runEpisode(tickBase: number): number {
  const world: World = createWorld(7030);
  world.ants = [];
  world.tick = tickBase;
  world.rng = createRng(777);
  world.foodBase = 0;
  world.foodTarget = 0;
  const x = 60;
  const z = 60;
  const y = surfaceSpawnY(world.grid, x, z) as number;
  const genome = backboneGenome();
  const ant = spawnAnt(world, {
    x,
    y,
    z,
    heading: 0.7,
    energy: 0.9,
    lineageId: 0,
    patrilineId: 0,
    motherId: 0,
    fatherId: 0,
    genome,
    controllerState: rnnController.createState(),
    traits: rnnController.physical(genome),
  });
  let deepest = 0;
  const trace: string[] = [];
  for (let t = 0; t < 250; t++) {
    stepWorld(world);
    // Depth below the LOCAL surface — walking downhill is not burrowing.
    // surfaceMap holds the solid-top y; a standing ant sits at +1.
    const local = world.surfaceMap[ant.z * world.grid.sizeX + ant.x];
    deepest = Math.max(deepest, local + 1 - ant.y);
    if (t % 50 === 0) {
      trace.push(
        `t=${t} pos=(${ant.x},${ant.y},${ant.z}) local=${local} temp=${ant.lastInputs[22].toFixed(2)} dig=${ant.lastOutputs[4].toFixed(2)} vb=${ant.lastOutputs[2].toFixed(2)} fwd=${ant.lastOutputs[1].toFixed(2)}`
      );
    }
  }
  if (process.env.HEAT_TRACE) {
    console.error(trace.join("\n"));
  }
  return deepest;
}

describe("heat-escape assay (rung 3)", () => {
  it("digs in below the midday surface, and barely touches it at night", () => {
    const hot = runEpisode(HOT_TICK);
    const cool = runEpisode(COOL_TICK);
    expect(hot).toBeGreaterThanOrEqual(1);
    // Incidental terrain contact is tolerated; systematic burrowing when
    // cool is not.
    expect(cool).toBeLessThanOrEqual(1);
    expect(hot).toBeGreaterThan(cool);
  });
});
