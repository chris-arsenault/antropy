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

export function openLedger(): DatabaseSync {
  const db = new DatabaseSync(DB_PATH);
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
    CREATE INDEX IF NOT EXISTS idx_series_run ON series(run_id);
    CREATE INDEX IF NOT EXISTS idx_runs_experiment ON runs(experiment, started);
  `);
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
  const seriesInsert = db.prepare(
    `INSERT INTO series VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const s of series) {
    seriesInsert.run(
      runId, s.tick, s.ants, s.eggs, s.stockpile, s.hoard, s.merit,
      s.eggsLaid, s.eggsPerished, s.meanEnergy, s.rain, s.stress
    );
  }
  const traceInsert = db.prepare(`INSERT INTO trace VALUES (?, ?, ?, ?, ?, ?, ?)`);
  for (const t of trace) {
    traceInsert.run(runId, t.tick, t.antId, t.x, t.y, t.z, t.energy);
  }
  return runId;
}
