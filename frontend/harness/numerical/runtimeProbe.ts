/** Bounded browser operational fixture. Physical state stays with its worker renderer. */
import { Engine } from "../../src/engine/client";
import { Session } from "../../src/engine/session";
import { Renderer, type ViewOptions } from "../../src/engine/renderer";
import { SelectedObservation } from "../../src/engine/selectedObservation";
import { ObservationPublisher } from "../../src/engine/observationPublisher";
import { type Definition } from "../../src/engine/types";
import { observe } from "../../src/engine/observation";
import { validateObservation } from "../../src/engine/observationValidation";

export interface ProbeSettings {
  mode: "observe" | "save" | "render" | "soak";
  founders: number;
  history: number;
  repetitions: number;
  durationMs?: number;
}
export async function runtimeProbe(settings: ProbeSettings) {
  const binary = new Uint8Array(
    await (await fetch(new URL("/antropy-engine.wasm", import.meta.url))).arrayBuffer()
  );
  const engine = await Engine.load(binary);
  const session = new Session(engine);
  session.restart(101, { founders: settings.founders });
  if (settings.history) {
    session.world.command("historyFixture", { count: settings.history });
    session.definition = session.world.command<Definition>("definition");
  }
  if (settings.mode === "soak") matureObservation(session);
  const renderer = new Renderer(new OffscreenCanvas(1200, 800));
  try {
    return await repeat(session, renderer, settings);
  } finally {
    renderer.dispose();
    session.world.dispose();
  }
}
async function repeat(session: Session, renderer: Renderer, settings: ProbeSettings) {
  const inspection = new SelectedObservation(),
    engine = session.engine;
  const options: ViewOptions = {
    width: 1200,
    height: 800,
    camera: { x: 160, y: 120, scale: 3 },
    field: 5,
    species: 0,
    color: 6,
    exposure: 4,
    selected: -1,
    layers: [true, false, false, false, false],
    regions: true,
    sources: true,
  };
  let sequence = 0,
    bytes = 0;
  const publisher = new ObservationPublisher((id, value) => {
    sequence = id;
    const copy = structuredClone(value);
    bytes = JSON.stringify(copy).length;
  });
  const samples = [],
    start = performance.now();
  const selected = settings.history || 1;
  const soak = settings.mode === "soak";
  const duration = soak ? Math.min(1800000, settings.durationMs ?? 1800000) : 120000;
  for (let i = 0; i < Math.min(soak ? 18000 : 200, settings.repetitions); i++) {
    if (performance.now() - start >= duration) break;
    const at = performance.now();
    // A fixed physical workload isolates retention from population/ancestry growth.
    const status = session.status();
    publisher.publish(() => ({
      status,
      inspection: inspection.read(session.world, status.summary, selected),
    }));
    publisher.acknowledge(sequence);
    await executeMode(session, renderer, settings.mode, options, i);
    const sample = {
      iteration: i,
      ms: performance.now() - at,
      wasmBytes: engine.memoryBytes,
      observationBytes: bytes,
      tick: status.summary.tick,
      ancestors: status.summary.ancestryRecords,
    };
    if (!soak || i % 100 === 0) {
      samples.push(sample);
      if (soak) self.postMessage({ progress: sample });
    }
    await new Promise((resolve) => setTimeout(resolve, soak ? 100 : 0));
  }
  return { settings, digest: engine.sourceDigest, wallMs: performance.now() - start, samples };
}

async function executeMode(
  session: Session,
  renderer: Renderer,
  mode: ProbeSettings["mode"],
  options: ViewOptions,
  i: number
) {
  if (mode === "save" || (mode === "soak" && i % 300 === 0)) await session.save("manual");
  if (mode === "render" || mode === "soak") renderer.draw(session.world, [320, 240], options, true);
}

function matureObservation(session: Session) {
  observe(session.world, session.observation.spatial);
  const status = session.status(),
    tick = status.summary.tick;
  const point = status.history[0];
  session.observation.history = Array.from({ length: 240 }, (_, i) => ({
    ...point,
    tick: tick - (239 - i) * 25,
  }));
  session.observation.recent = Array.from({ length: 81 }, (_, i) => ({
    tick: tick - (80 - i) * 25,
    population: status.summary.population,
    bins: status.population.efforts.map((e) => e.bins),
  }));
  const events = session.observation.spatial.events;
  if (events.length)
    session.observation.spatial.events = Array.from({ length: 2048 }, (_, i) => ({
      ...events[0],
      tick: tick - 2048 + i,
    }));
  validateObservation(session.observation, tick);
}
