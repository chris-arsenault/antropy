/**
 * De novo evolution from the single founder in the zoned or mixed default world. Samples inherited
 * traits and positions of every living cell each 1,000 ticks and saves periodic checkpoints for
 * later invasibility assays. Nothing here selects parents or promotes a winner.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createWorld } from "../../src/sim/world";
import { DEFAULT_CONFIG, type Config } from "../../src/sim/config";
import { DEFAULT_CYCLE, type CycleConfig } from "../../src/sim/cycle";
import { DEFAULT_DISTURBANCE } from "../../src/sim/disturbance";
import { type World } from "../../src/sim/types";
import { checkpointToJson } from "../../src/persist/checkpoint";
import { noteExecution } from "../../src/persist/provenance";
import { traitValues } from "../../src/observe/traits";
import { controller } from "../../src/sim/controller";
import { measure, sourceDigest, warnIfSourceChanged } from "./bacteriaRun";
import { cycleFlags } from "./zonesContest";
import { openLedger, recordRun } from "./ledger";
import { type Flags, flag, integerFlag } from "./flags";

export interface EvolveSettings {
  seed: number;
  ticks: number;
  world: "zones" | "mixed";
  sourceRate: number;
  /** Physical mutation supply per birth; the default is 0.025 per locus at scale 0.08. */
  physicalMutationRate: number;
  physicalMutationScale: number;
  /** Behavioral (RNN) mutation supply per locus; the default is 0.0006 at scale 0.06. */
  mutationRate: number;
  mutationScale: number;
  /** Element cycle constants, or null for off; `--light` and `--light-supply` override the defaults. */
  cycle: CycleConfig | null;
  /** Membrane crowding exponent for acquisition pathways. */
  crowding: number;
  /** Family chemistry: 1 toxin type or 2. */
  toxinTypes: 1 | 2;
  /** Contact injury rate per unit neighbour toxin machinery; the default is off. */
  contactDamageRate: number;
  /** Predation: fraction of a contact-killed cell eaten by touching producers; the default is off. */
  preyYield: number;
  /** Abiotic disturbance at the documented defaults, or off. */
  disturbance: boolean;
  /** Horizontal gene transfer probability per touching pair per second; the default is off. */
  transferRate: number;
  /** Reserve sharing rate between touching cells; the default is off. */
  sharingRate: number;
  /** Neutral signal secretion rate per unit core at full effort; the default is off. */
  secretionRate: number;
  checkpointEvery: number;
  output: string;
}
export function evolveSettings(flags: Flags): EvolveSettings {
  const world = flag(flags, "world", "zones");
  if (world !== "zones" && world !== "mixed") throw new Error("--world must be zones or mixed");
  const number = (key: string, fallback: number) => Number(flag(flags, key, String(fallback)));
  const cycleDefault = (DEFAULT_CONFIG as Config).cycle ? "on" : "off";
  return {
    seed: integerFlag(flags, "seed", 101),
    ticks: integerFlag(flags, "ticks", 500000),
    world,
    sourceRate: number("source-rate", DEFAULT_CONFIG.sourceRate),
    physicalMutationRate: number("physical-rate", DEFAULT_CONFIG.physicalMutationRate),
    physicalMutationScale: number("physical-scale", DEFAULT_CONFIG.physicalMutationScale),
    mutationRate: number("mutation-rate", DEFAULT_CONFIG.mutationRate),
    mutationScale: number("mutation-scale", DEFAULT_CONFIG.mutationScale),
    cycle: flag(flags, "cycle", cycleDefault) === "on" ? cycleFlags(flags) : null,
    crowding: number("crowding", DEFAULT_CONFIG.machineryCrowding),
    toxinTypes: number("toxin-types", DEFAULT_CONFIG.toxinTypes) === 2 ? 2 : 1,
    contactDamageRate: number("contact-damage", DEFAULT_CONFIG.contactDamageRate),
    preyYield: number("prey-yield", DEFAULT_CONFIG.preyYield),
    disturbance: flag(flags, "disturbance", "off") === "on",
    transferRate: number("transfer-rate", DEFAULT_CONFIG.transferRate),
    sharingRate: number("sharing-rate", DEFAULT_CONFIG.sharingRate),
    secretionRate: number("secretion-rate", DEFAULT_CONFIG.secretionRate),
    checkpointEvery: integerFlag(flags, "checkpoint-every", 100000),
    output: flag(flags, "output", "harness/artifacts/evolve"),
  };
}
export function evolveConfig(s: EvolveSettings): Config {
  const config: Config = {
    ...DEFAULT_CONFIG,
    sourceRate: s.sourceRate,
    physicalMutationRate: s.physicalMutationRate,
    physicalMutationScale: s.physicalMutationScale,
    mutationRate: s.mutationRate,
    mutationScale: s.mutationScale,
    machineryCrowding: s.crowding,
    toxinTypes: s.toxinTypes,
    contactDamageRate: s.contactDamageRate,
    preyYield: s.preyYield,
    transferRate: s.transferRate,
    sharingRate: s.sharingRate,
    secretionRate: s.secretionRate,
  };
  if (s.world === "mixed") delete config.foodZones;
  if (s.cycle) config.cycle = s.cycle;
  else delete config.cycle;
  if (s.disturbance) config.disturbance = DEFAULT_DISTURBANCE;
  else delete config.disturbance;
  return config;
}
function cycleLabel(s: EvolveSettings): string {
  if (!s.cycle) return "";
  const light = s.cycle.light === DEFAULT_CYCLE.light ? "" : `-light${s.cycle.light}`;
  const supply =
    s.cycle.lightSupply === DEFAULT_CYCLE.lightSupply ? "" : `-supply${s.cycle.lightSupply}`;
  const radius =
    s.cycle.lightRadius === DEFAULT_CYCLE.lightRadius ? "" : `-radius${s.cycle.lightRadius}`;
  return `-cycle${light}${supply}${radius}`;
}
function mutationLabel(s: EvolveSettings): string {
  const physical =
    s.physicalMutationRate === DEFAULT_CONFIG.physicalMutationRate &&
    s.physicalMutationScale === DEFAULT_CONFIG.physicalMutationScale
      ? ""
      : `-pm${s.physicalMutationRate}x${s.physicalMutationScale}`;
  const behavioral =
    s.mutationRate === DEFAULT_CONFIG.mutationRate &&
    s.mutationScale === DEFAULT_CONFIG.mutationScale
      ? ""
      : `-bm${s.mutationRate}x${s.mutationScale}`;
  return physical + behavioral;
}

function sample(world: World) {
  const traits = new Map<number, ReturnType<typeof traitValues>>();
  const cells = world.cells.map((c) => {
    let t = traits.get(c.genome);
    if (!t) {
      t = traitValues(world, c.genome);
      traits.set(c.genome, t);
    }
    return {
      id: c.id,
      genome: c.genome,
      lineage: c.lineage,
      generation: c.generation,
      x: Math.round(c.x * 10) / 10,
      y: Math.round(c.y * 10) / 10,
      foodA: t.foodA,
      motor: t.motor,
      core: t.core,
      defense: t.defense,
      weapon: t.weapon,
      builder: t.builder,
      photo: t.photo,
      tint: t.tint,
      damage: c.damage,
    };
  });
  return { tick: world.tick, population: cells.length, cells };
}

/** Run label: the world, seed and supply, then every lever that departs from its default. */
function runLabel(s: EvolveSettings): string {
  const levers: [string, boolean][] = [
    [`-crowd${s.crowding}`, s.crowding > 0],
    ["-families", s.toxinTypes === 2],
    [`-contact${s.contactDamageRate}`, s.contactDamageRate > 0],
    [`-prey${s.preyYield}`, s.preyYield > 0],
    ["-disturbed", s.disturbance],
    [`-hgt${s.transferRate}`, s.transferRate > 0],
    [`-share${s.sharingRate}`, s.sharingRate > 0],
    [`-signal${s.secretionRate}`, s.secretionRate > 0],
  ];
  const suffix = levers
    .filter(([, on]) => on)
    .map(([text]) => text)
    .join("");
  return `${s.world}-${s.seed}-rate${s.sourceRate}${mutationLabel(s)}${cycleLabel(s)}${suffix}`;
}
export function runEvolve(flags: Flags): void {
  const s = evolveSettings(flags),
    label = runLabel(s);
  const directory = join(s.output, label);
  if (existsSync(directory)) throw new Error("Choose a new output; evidence is append-only");
  mkdirSync(directory, { recursive: true });
  const config = evolveConfig(s),
    world = createWorld(s.seed, config),
    digest = sourceDigest();
  const save = (name: string, value: unknown) =>
    writeFileSync(join(directory, name), JSON.stringify(value));
  const manifest = {
    label,
    settings: s,
    config,
    sourceDigest: digest,
    started: new Date().toISOString(),
    status: "running",
    sourceDigestAfter: "",
    sampleContract:
      "Every 1,000 ticks: every living cell's inherited construction traits (foodA = A share of A+B processing %, photo = light harvesting % of core, others % of core or founder core), position and damage.",
  };
  save("manifest.json", manifest);
  writeFileSync(join(directory, "initial.json"), checkpointToJson(world));
  noteExecution(world, `headless:${digest}`);
  const samples = [sample(world)];
  try {
    const result = measure(world, s.ticks, 1000, {
      spatial: false,
      progress: true,
      onSample: (w) => {
        samples.push(sample(w));
        if (w.tick % s.checkpointEvery === 0)
          writeFileSync(join(directory, `checkpoint-${w.tick}.json`), checkpointToJson(w));
      },
    });
    manifest.sourceDigestAfter = sourceDigest();
    warnIfSourceChanged(digest, manifest.sourceDigestAfter);
    const db = openLedger();
    const id = recordRun(db, {
      experiment: "evolve-zones",
      label,
      driver: controller.id,
      seed: s.seed,
      ticks: world.tick,
      params: manifest,
      summary: result.final,
      wallMs: result.wallMs,
    });
    db.close();
    save("samples.json", samples);
    save("result.json", { ...result, frames: undefined, ledgerId: id });
    writeFileSync(join(directory, "checkpoint.json"), checkpointToJson(world));
    manifest.status = world.stopReason ? `stopped: ${world.stopReason}` : "complete";
    console.log(JSON.stringify({ label, id, tick: world.tick, population: world.cells.length }));
  } catch (error) {
    manifest.status = "failed";
    save("samples.json", samples);
    throw error;
  } finally {
    save("manifest.json", manifest);
  }
}
