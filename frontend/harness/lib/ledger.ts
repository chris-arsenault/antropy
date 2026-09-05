import { DatabaseSync } from "node:sqlite";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Durable experiment ledger (SQLite, committed to the repo): every harness
 * run lands here with its parameters, summary, and sampled time series —
 * measurements are tracked over time and queried, never encoded as tests.
 */
const DB_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "ledger.db");

export interface RunRecord {
  experiment: string;
  label: string;
  driver: string;
  seed: number;
  ticks: number;
  cadence: number;
  params: Record<string, unknown>;
  patches: string[];
  summary: Record<string, unknown>;
  wallMs: number;
}

export interface SeriesSample {
  tick: number;
  ants: number;
  eggs: number;
  stockpile: number;
  hoard: number;
  merit: number;
  eggsLaid: number;
  eggsPerished: number;
  meanEnergy: number;
  rain: number;
  stress: number;
}

export interface TraceSample {
  tick: number;
  antId: number;
  x: number;
  y: number;
  z: number;
  energy: number;
}

/** Demographic and conserved-energy state for long-horizon colony experiments. */
export interface DemographySample {
  tick: number;
  phase: "warmup" | "post-shock" | "recovery";
  workers: number;
  eggs: number;
  larvae: number;
  workerEnergy: number;
  broodEnergy: number;
  stockpile: number;
  storedFoodEnergy: number;
  colonyEnergy: number;
  meanWorkerEnergy: number;
  minWorkerEnergy: number;
  ageExpiredWorkers: number;
  energyDepletedWorkers: number;
  workerBirths: number;
  workerDeaths: number;
  queenDeaths: number;
  gatheredEnergy: number;
  burnedEnergy: number;
}

/** Population-genetic instruments sampled from one persistent world. */
export interface EvolutionSample {
  tick: number;
  phase: string;
  deliveryHeritability: number | null;
  deliverySamples: number;
  lifespanHeritability: number | null;
  lifespanSamples: number;
  effectivePopulation: number | null;
  effectivePopulationSamples: number;
  census: number;
  reproductiveEvents: number;
  genomeDiversity: number | null;
  genomePairs: number;
  founderDistanceMean: number | null;
  founderDistanceMax: number | null;
  founderDistanceSamples: number;
  founderLinesTotal: number;
  founderLinesRepresented: number;
  founderLinesContributing: number;
  maxFounderLineShare: number | null;
  founderLinesJson: string;
}

function gitCommit(): string {
  try {
    // Dev-tool provenance lookup; the harness never runs in production.
    // eslint-disable-next-line sonarjs/no-os-command-from-path
    const hash = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
    // eslint-disable-next-line sonarjs/no-os-command-from-path
    const dirty = execSync("git status --porcelain", { encoding: "utf8" }).trim() !== "";
    return dirty ? `${hash}+dirty` : hash;
  } catch {
    return "unknown";
  }
}

export function initializeLedger(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      experiment TEXT NOT NULL,
      label TEXT NOT NULL DEFAULT '',
      driver TEXT NOT NULL,
      seed INTEGER NOT NULL,
      ticks INTEGER NOT NULL,
      cadence INTEGER NOT NULL,
      params TEXT NOT NULL,
      patches TEXT NOT NULL,
      git TEXT NOT NULL,
      started TEXT NOT NULL,
      wall_ms INTEGER NOT NULL,
      ticks_per_sec REAL NOT NULL,
      summary TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS series (
      run_id INTEGER NOT NULL REFERENCES runs(id),
      tick INTEGER NOT NULL,
      ants INTEGER, eggs INTEGER, stockpile REAL, hoard REAL, merit REAL,
      eggs_laid INTEGER, eggs_perished INTEGER, mean_energy REAL,
      rain INTEGER, stress REAL
    );
    CREATE TABLE IF NOT EXISTS trace (
      run_id INTEGER NOT NULL REFERENCES runs(id),
      tick INTEGER NOT NULL,
      ant_id INTEGER NOT NULL,
      x INTEGER, y INTEGER, z INTEGER, energy REAL
    );
    CREATE TABLE IF NOT EXISTS demography_series (
      run_id INTEGER NOT NULL REFERENCES runs(id),
      tick INTEGER NOT NULL,
      phase TEXT NOT NULL,
      workers INTEGER, eggs INTEGER, larvae INTEGER,
      worker_energy REAL, brood_energy REAL, stockpile REAL,
      stored_food_energy REAL, colony_energy REAL,
      mean_worker_energy REAL, min_worker_energy REAL,
      age_expired_workers INTEGER, energy_depleted_workers INTEGER,
      worker_births INTEGER, worker_deaths INTEGER, queen_deaths INTEGER,
      gathered_energy REAL, burned_energy REAL
    );
    CREATE TABLE IF NOT EXISTS evolution_series (
      run_id INTEGER NOT NULL REFERENCES runs(id),
      tick INTEGER NOT NULL,
      phase TEXT NOT NULL,
      delivery_heritability REAL, delivery_samples INTEGER,
      lifespan_heritability REAL, lifespan_samples INTEGER,
      effective_population REAL, effective_population_samples INTEGER,
      census INTEGER, reproductive_events INTEGER,
      genome_diversity REAL, genome_pairs INTEGER,
      founder_distance_mean REAL, founder_distance_max REAL, founder_distance_samples INTEGER,
      founder_lines_total INTEGER, founder_lines_represented INTEGER,
      founder_lines_contributing INTEGER, max_founder_line_share REAL,
      founder_lines TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_series_run ON series(run_id);
    CREATE INDEX IF NOT EXISTS idx_demography_series_run ON demography_series(run_id);
    CREATE INDEX IF NOT EXISTS idx_evolution_series_run ON evolution_series(run_id);
    CREATE INDEX IF NOT EXISTS idx_runs_experiment ON runs(experiment, started);
  `);
}

export function openLedger(): DatabaseSync {
  const db = new DatabaseSync(DB_PATH);
  initializeLedger(db);
  return db;
}

export function recordRun(
  db: DatabaseSync,
  run: RunRecord,
  series: SeriesSample[],
  trace: TraceSample[]
): number {
  const insert = db.prepare(
    `INSERT INTO runs (experiment, label, driver, seed, ticks, cadence, params, patches,
       git, started, wall_ms, ticks_per_sec, summary)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const result = insert.run(
    run.experiment,
    run.label,
    run.driver,
    run.seed,
    run.ticks,
    run.cadence,
    JSON.stringify(run.params),
    JSON.stringify(run.patches),
    gitCommit(),
    new Date().toISOString(),
    run.wallMs,
    run.ticks / (run.wallMs / 1000),
    JSON.stringify(run.summary)
  );
  const runId = Number(result.lastInsertRowid);
  const seriesInsert = db.prepare(`INSERT INTO series VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const s of series) {
    seriesInsert.run(
      runId,
      s.tick,
      s.ants,
      s.eggs,
      s.stockpile,
      s.hoard,
      s.merit,
      s.eggsLaid,
      s.eggsPerished,
      s.meanEnergy,
      s.rain,
      s.stress
    );
  }
  const traceInsert = db.prepare(`INSERT INTO trace VALUES (?, ?, ?, ?, ?, ?, ?)`);
  for (const t of trace) {
    traceInsert.run(runId, t.tick, t.antId, t.x, t.y, t.z, t.energy);
  }
  return runId;
}

/** Attach demographic time-series rows to an already-recorded harness run. */
export function recordDemographySeries(
  db: DatabaseSync,
  runId: number,
  samples: DemographySample[]
): void {
  const insert = db.prepare(
    `INSERT INTO demography_series (
       run_id, tick, phase, workers, eggs, larvae, worker_energy, brood_energy, stockpile,
       stored_food_energy, colony_energy, mean_worker_energy, min_worker_energy,
       age_expired_workers, energy_depleted_workers, worker_births, worker_deaths,
       queen_deaths, gathered_energy, burned_energy
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const sample of samples) {
    insert.run(
      runId,
      sample.tick,
      sample.phase,
      sample.workers,
      sample.eggs,
      sample.larvae,
      sample.workerEnergy,
      sample.broodEnergy,
      sample.stockpile,
      sample.storedFoodEnergy,
      sample.colonyEnergy,
      sample.meanWorkerEnergy,
      sample.minWorkerEnergy,
      sample.ageExpiredWorkers,
      sample.energyDepletedWorkers,
      sample.workerBirths,
      sample.workerDeaths,
      sample.queenDeaths,
      sample.gatheredEnergy,
      sample.burnedEnergy
    );
  }
}

/** Attach population-genetic time-series rows to an already-recorded harness run. */
export function recordEvolutionSeries(
  db: DatabaseSync,
  runId: number,
  samples: EvolutionSample[]
): void {
  const insert = db.prepare(
    `INSERT INTO evolution_series (
       run_id, tick, phase, delivery_heritability, delivery_samples,
       lifespan_heritability, lifespan_samples,
       effective_population, effective_population_samples, census, reproductive_events,
       genome_diversity, genome_pairs,
       founder_distance_mean, founder_distance_max, founder_distance_samples,
       founder_lines_total, founder_lines_represented, founder_lines_contributing,
       max_founder_line_share, founder_lines
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const sample of samples) {
    insert.run(
      runId,
      sample.tick,
      sample.phase,
      sample.deliveryHeritability,
      sample.deliverySamples,
      sample.lifespanHeritability,
      sample.lifespanSamples,
      sample.effectivePopulation,
      sample.effectivePopulationSamples,
      sample.census,
      sample.reproductiveEvents,
      sample.genomeDiversity,
      sample.genomePairs,
      sample.founderDistanceMean,
      sample.founderDistanceMax,
      sample.founderDistanceSamples,
      sample.founderLinesTotal,
      sample.founderLinesRepresented,
      sample.founderLinesContributing,
      sample.maxFounderLineShare,
      sample.founderLinesJson
    );
  }
}
