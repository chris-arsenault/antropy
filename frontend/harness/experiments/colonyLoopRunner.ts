import {
  backboneVector,
  colonySeedVector,
  derivedColonySeedVector,
  diggerSeedVector,
  functionalSeedVector,
  setRuntimeSeedBase,
} from "../../src/sim/controller/rnn";
import { flag, intFlag, seedsOf, type Flags } from "../lib/flags";
import { openLedger, recordRun } from "../lib/ledger";
import { applyPatches } from "../lib/patch";
import { cacheEpisode, forageEpisode, seededCacheEpisode, seededForageEpisode } from "./colonyLoop";
import { energyCeilingEpisode, energyEpisode, energySeedEpisode } from "./colonyLoopEnergy";
import { fieldNavigationEpisode } from "./colonyLoopField";
import { type ColonyLoopResult } from "./colonyLoopTypes";
import { colonyOdorEpisode } from "./colonyOdorField";

type Episode = (seed: number, ticks: number, cadence: number) => ColonyLoopResult;

const EPISODES: Readonly<Record<string, Episode>> = {
  "field-navigation": fieldNavigationEpisode,
  "colony-odor": colonyOdorEpisode,
  "oracle-forage": forageEpisode,
  "seeded-forage": seededForageEpisode,
  "seeded-cache": seededCacheEpisode,
  "oracle-cache": cacheEpisode,
  "oracle-energy": energyEpisode,
  "oracle-energy-ceiling": energyCeilingEpisode,
  "seeded-energy": energySeedEpisode,
};

function driverFor(stage: string): string {
  if (stage === "oracle-energy-ceiling") return "omniscient-pathing-oracle";
  if (stage.startsWith("seeded-")) return "seed-e-rnn";
  return "sensor-oracle";
}

function selectSeedBase(name: string): Float32Array | null {
  if (name === "baked") return null;
  if (name === "backbone") return backboneVector();
  if (name === "functional") return functionalSeedVector();
  if (name === "colony") return colonySeedVector();
  if (name === "derived") return derivedColonySeedVector();
  if (name === "digger") return diggerSeedVector();
  throw new Error(`unknown seed base "${name}"`);
}

function recordEpisodes(flags: Flags, episode: Episode, stage: string): void {
  const ticks = intFlag(flags, "ticks", 2500);
  const cadence = intFlag(flags, "cadence", 25);
  const label = flag(flags, "label", "");
  const seedBase = flag(flags, "seed-base", "baked");
  const patches = flags.values.get("patch") ?? [];
  const db = openLedger();
  const restore = applyPatches(patches);
  setRuntimeSeedBase(selectSeedBase(seedBase));
  try {
    for (const seed of seedsOf(flags, "9100,9101,9102,9103,9104")) {
      const started = Date.now();
      const result = episode(seed, ticks, cadence);
      const runId = recordRun(
        db,
        {
          experiment: `colony-loop/${stage}`,
          label,
          driver: driverFor(stage),
          seed,
          ticks,
          cadence,
          params: { ...result.params, seedBase },
          patches,
          summary: result.summary,
          wallMs: Date.now() - started,
        },
        [],
        result.trace
      );
      console.log(`[run ${runId}] ${stage} seed=${seed} ${JSON.stringify(result.summary)}`);
    }
  } finally {
    setRuntimeSeedBase(null);
    restore();
  }
}

/** Run the Appendix E behavioral ladder in the measurement harness. */
export function runColonyLoop(flags: Flags): void {
  const stage = flag(flags, "stage", "oracle-forage");
  const episode = EPISODES[stage];
  if (!episode) throw new Error(`unknown colony-loop stage "${stage}"`);
  recordEpisodes(flags, episode, stage);
}
