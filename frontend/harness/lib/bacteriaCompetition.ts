import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { type Definition } from "../../src/engine/types";
import { loadEngine } from "../numerical/engine";
import { checkpointSource } from "./checkpointSource";
import { runRecorded, readFrame } from "./longRun";
import { assignPopulation } from "./engineFixtures";
import { prepareCompetition } from "./competitionIdentity";
import { competitionObservation } from "./competitionObservation";

/** Compare observed inherited genotypes on common founder bodies in the source physics. */
export async function compareCheckpoint(
  path: string,
  candidate: number | "representative",
  seeds: number[],
  ticks: number,
  output: string
): Promise<void> {
  if (ticks < 1 || ticks > 3000)
    throw new Error(
      "This comparison has a 3000-tick ceiling; register longer invasion work separately"
    );
  const engine = await loadEngine(),
    source = await checkpointSource(engine, path);
  try {
    const { ancestor, descendant, identity } = prepareCompetition(source.world, candidate),
      config = source.world.command<Definition>("definition").config;
    mkdirSync(output, { recursive: true });
    for (const seed of seeds)
      for (const swap of [false, true]) {
        const world = engine.create(seed, {
          ...config,
          mutationRate: 0,
          physicalMutationRate: 0,
          transmission: "clonal",
          learningRetention: 0,
        });
        try {
          const groups = new Map(
            readFrame(world).cells.map((c, i) => [c.lineage, (i + Number(swap)) % 2])
          );
          assignPopulation(
            world,
            [
              { label: "ancestor", genotype: ancestor },
              { label: "observed descendant", genotype: descendant },
            ],
            (i) => (i + Number(swap)) % 2
          );
          const label = `compare-${seed}-${swap}`;
          runRecorded(engine, world, {
            directory: join(output, label),
            experiment: "bacteria-competition",
            label,
            ticks,
            cadence: 100,
            checkpointEvery: 1000,
            wallSeconds: 120,
            provenance: {
              source: source.provenance,
              identity,
              swap,
              initialCounts: competitionObservation(world, groups).map((g) => g.population),
              interpretation:
                "Frozen mutation and inherited learning; private learning and complete source physics retained. Historical regime labels had no numerical-kernel meaning.",
            },
            observation: (w) => ({ groups: competitionObservation(w, groups) }),
          });
        } finally {
          world.dispose();
        }
      }
  } finally {
    source.world.dispose();
  }
}
