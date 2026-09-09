import { execFileSync } from "node:child_process";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

const DB_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "ledger.db");
const GIT_PATH = "/usr/bin/git";

export interface RunRecord {
  readonly experiment: string;
  readonly label: string;
  readonly driver: string;
  readonly seed: number;
  readonly ticks: number;
  readonly params: Record<string, unknown>;
  readonly summary: Record<string, unknown>;
  readonly wallMs: number;
}

function gitRevision(): string {
  try {
    const revision = execFileSync(GIT_PATH, ["rev-parse", "--short", "HEAD"], {
      encoding: "utf8",
    }).trim();
    const dirty = execFileSync(GIT_PATH, ["status", "--porcelain"], {
      encoding: "utf8",
    }).trim();
    return dirty ? `${revision}+dirty` : revision;
  } catch {
    return "unknown";
  }
}

export function openLedger(): DatabaseSync {
  const database = new DatabaseSync(DB_PATH);
  database.exec("PRAGMA busy_timeout = 5000");
  database.exec(`
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
    )
  `);
  return database;
}

export function recordRun(database: DatabaseSync, run: RunRecord): number {
  const result = database
    .prepare(
      `INSERT INTO runs (
         experiment, label, driver, seed, ticks, cadence, params, patches,
         git, started, wall_ms, ticks_per_sec, summary
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      run.experiment,
      run.label,
      run.driver,
      run.seed,
      run.ticks,
      0,
      JSON.stringify(run.params),
      "[]",
      gitRevision(),
      new Date().toISOString(),
      run.wallMs,
      run.ticks / Math.max(0.001, run.wallMs / 1000),
      JSON.stringify(run.summary)
    );
  return Number(result.lastInsertRowid);
}
