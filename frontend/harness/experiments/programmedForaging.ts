import { flag, seedsOf, type Flags } from "../lib/flags";
import { openLedger, recordRun } from "../lib/ledger";
import { measureProgrammedForaging, PROGRAMMED_FORAGING_GATE } from "../lib/programmedForaging";

/** Record the fixed programmed-colony gate over an untouched world panel. */
export function runProgrammedForaging(flags: Flags): void {
  const db = openLedger();
  const label = flag(flags, "label", "");
  for (const seed of seedsOf(flags, "2,3,4,5")) {
    const started = Date.now();
    const summary = measureProgrammedForaging(seed);
    const runId = recordRun(
      db,
      {
        experiment: "programmed-foraging",
        label,
        driver: "sensor-oracle",
        seed,
        ticks: PROGRAMMED_FORAGING_GATE.ticks,
        cadence: PROGRAMMED_FORAGING_GATE.sampleInterval,
        params: { gate: PROGRAMMED_FORAGING_GATE },
        patches: [],
        summary: { ...summary },
        wallMs: Date.now() - started,
      },
      [],
      []
    );
    console.log(`[run ${runId}] seed=${seed} ${JSON.stringify(summary)}`);
  }
}
