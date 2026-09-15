import { mkdirSync, writeFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import { loadEngine, captureEngine } from "./engine";
import { type EngineWorld } from "../../src/engine/client";
import {
  type Inspection,
  type LiveStatus,
  type PopulationSample,
  type Summary,
} from "../../src/engine/types";
import { SelectedObservation } from "../../src/engine/selectedObservation";
import { ObservationPublisher } from "../../src/engine/observationPublisher";
import { applyObservation, type ObservationView } from "../../src/engine/observationDelta";
import { openLedger, recordRun } from "../lib/ledger";

/** Synthetic retained display load, not an ecological history. See data-ownership.md. */
function displayFixture(world: EngineWorld): LiveStatus {
  const summary = world.command<Summary>("summary");
  const population = world.command<{ population: PopulationSample }>("census").population;
  const pairs = () => Array.from({ length: 64 }, (_, i): [number, number] => [i + 1, 1]);
  const history = Array.from({ length: 240 }, (_, i) => ({
    tick: i * 25,
    population: 64,
    biomass: 10,
    divisions: i,
    deaths: 0,
    traits: Array(9).fill(1) as number[],
    membrane: Array(16).fill(4) as number[],
    families: pairs(),
    lineages: pairs(),
    regions: Array.from({ length: 64 }, (_, j) => ({
      id: j + 1,
      x: j,
      y: i,
      count: 1,
      membraneX: 1,
    })),
    regionCount: 64,
  }));
  return {
    summary,
    chemicals: world.command("chemicalOverview"),
    population,
    history,
    recent: [],
    regions: [],
    spatialEvents: [],
    eventsDropped: 0,
    running: true,
    speed: "max",
    throughput: 0,
    recovery: "fixture",
    error: null,
    kernelDigest: world.sourceDigest,
    memoryBytes: 0,
    workerWork: null,
  };
}

function measure(world: EngineWorld, base: LiveStatus, legacy: boolean) {
  let received: ObservationView = { status: null, inspection: null };
  let sequence = 0,
    payload: unknown;
  const selected = new SelectedObservation();
  const publisher = new ObservationPublisher((seq, delta) => {
    sequence = seq;
    payload = delta;
    received = applyObservation(received, structuredClone(delta));
  });
  const publish = () => {
    const status = { ...base, summary: world.command<Summary>("summary") };
    if (legacy) {
      payload = { status, inspection: world.command<Inspection>("inspect", { cell: 100000 }) };
      received = structuredClone(payload) as ObservationView;
    } else {
      publisher.publish(() => ({
        status,
        inspection: selected.read(world, status.summary, 100000),
      }));
      publisher.acknowledge(sequence);
    }
  };
  publish();
  publish();
  const start = performance.now();
  let steps = 0;
  while (steps < 20 && performance.now() - start < 30000) {
    world.step();
    publish();
    steps++;
  }
  const wallMs = performance.now() - start;
  return {
    metrics: {
      steps,
      wallMs,
      millisecondsPerPublication: wallMs / steps,
      lastPayloadJsonBytes: Buffer.byteLength(JSON.stringify(payload)),
      stop: steps === 20 ? "horizon" : "wall cap",
    },
    received,
  };
}

export async function runObservationTransport(output: string) {
  mkdirSync(output);
  const engine = await loadEngine(),
    wasmDigest = captureEngine(output, engine);
  const original = engine.create(101, { width: 24, height: 24, founders: 1, sourceCount: 0 });
  original.command("historyFixture", { count: 100000 });
  const initial = original.snapshot(),
    base = displayFixture(original);
  writeFileSync(`${output}/initial.antropy`, initial);
  original.dispose();
  const a = engine.restore(initial),
    b = engine.restore(initial);
  try {
    const legacy = measure(a, base, true),
      revisioned = measure(b, base, false);
    const equalPhysics = Buffer.compare(a.snapshot(), b.snapshot()) === 0;
    const equalDisplays = isDeepStrictEqual(legacy.received, revisioned.received);
    const result = {
      wasmDigest,
      legacy: legacy.metrics,
      revisioned: revisioned.metrics,
      equalPhysics,
      equalDisplays,
    };
    writeFileSync(`${output}/legacy-final.antropy`, a.snapshot());
    writeFileSync(`${output}/revisioned-final.antropy`, b.snapshot());
    const db = openLedger();
    try {
      const id = recordRun(db, {
        experiment: "observation-transport",
        driver: "wasm",
        seed: 101,
        ticks: 40,
        label:
          "100k synthetic ancestors, 240 dense chart samples; full versus revisioned observation and local structured clone",
        params: {
          registration: "docs/design/chemistry/data-ownership.md",
          warmup: 2,
          publications: 20,
          wallCapSeconds: 30,
        },
        summary: result,
        wallMs: legacy.metrics.wallMs + revisioned.metrics.wallMs,
      });
      writeFileSync(`${output}/report.json`, JSON.stringify({ id, ...result }, null, 2));
      console.log(JSON.stringify({ id, ...result }));
    } finally {
      db.close();
    }
    if (!equalPhysics || !equalDisplays)
      throw new Error("Observation transport equivalence failed");
  } finally {
    a.dispose();
    b.dispose();
  }
}

if (process.argv[1]?.endsWith("observationTransport.ts")) {
  const output = process.argv[2];
  if (!output) throw new Error("Provide a new output directory");
  await runObservationTransport(output);
}
