import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { initializeLedger, recordEvolutionSeries, recordRun, type EvolutionSample } from "./ledger";

describe("evolution ledger", () => {
  it("persists unavailable values and per-line contribution without coercing them to zero", () => {
    const db = new DatabaseSync(":memory:");
    initializeLedger(db);
    const runId = recordRun(
      db,
      {
        experiment: "instrument-fixture",
        label: "bounded",
        driver: "fixture",
        seed: 1,
        ticks: 1,
        cadence: 1,
        params: {},
        patches: [],
        summary: {},
        wallMs: 1,
      },
      [],
      []
    );
    const sample: EvolutionSample = {
      tick: 1,
      phase: "fixture",
      deliveryHeritability: null,
      deliverySamples: 2,
      lifespanHeritability: 0.4,
      lifespanSamples: 4,
      effectivePopulation: 12.5,
      effectivePopulationSamples: 6,
      census: 10,
      reproductiveEvents: 8,
      genomeDiversity: 0.2,
      genomePairs: 45,
      founderDistanceMean: 0.1,
      founderDistanceMax: 0.3,
      founderDistanceSamples: 10,
      founderLinesTotal: 3,
      founderLinesRepresented: 2,
      founderLinesContributing: 2,
      maxFounderLineShare: 0.7,
      founderLinesJson: '[{"founderLineId":1,"living":7,"offspring":8}]',
    };

    recordEvolutionSeries(db, runId, [sample]);
    const row = db
      .prepare(
        `SELECT phase, delivery_heritability, delivery_samples,
                effective_population, founder_lines
         FROM evolution_series WHERE run_id = ?`
      )
      .get(runId) as Record<string, unknown>;

    expect(row.phase).toBe("fixture");
    expect(row.delivery_heritability).toBeNull();
    expect(row.delivery_samples).toBe(2);
    expect(row.effective_population).toBe(12.5);
    expect(row.founder_lines).toBe(sample.founderLinesJson);
    db.close();
  });
});
