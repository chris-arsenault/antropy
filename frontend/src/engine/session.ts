import { Engine, type EngineWorld } from "./client";
import { encodePackage, decodePackage } from "./package";
import { loadRecovery, storeRecovery } from "./recovery";
import { localIdentity } from "../persist/identity";
import { createPacer, DEFAULT_SPEED, type Speed } from "../ui/pacing";
import { type Definition, type LiveStatus, type ObservationState, type Summary } from "./types";
import { emptySpatial, observe, regionSummaries, currentPopulation } from "./observation";
import { ColdOperations } from "./coldOperations";

export class Session {
  world: EngineWorld;
  definition: Definition;
  observation: ObservationState;
  private population: LiveStatus["population"];
  private chemicals: LiveStatus["chemicals"] | null = null;
  running = false;
  speed: Speed = DEFAULT_SPEED;
  recovery = "Automatic recovery every 30 seconds while running";
  error: string | null = null;
  private pacer = createPacer(this.speed, performance.now());
  private lastSaved = -1;
  private cold = new ColdOperations();
  private measurementAt = performance.now();
  private measuredTicks = 0;
  private throughput = 0;
  private revision = 0;

  constructor(readonly engine: Engine) {
    this.observation = this.newObservation();
    this.world = engine.create();
    this.definition = this.world.command("definition");
    this.population = observe(this.world, this.observation.spatial);
  }
  setRunning(running: boolean) {
    if (running && this.world.command<Summary>("summary").stopReason) return;
    if (running && !this.running) {
      this.measurementAt = performance.now();
      this.measuredTicks = 0;
      this.throughput = 0;
    }
    this.running = running;
    this.pacer = createPacer(this.speed, performance.now());
  }
  setSpeed(speed: Speed) {
    this.speed = speed;
    this.pacer = createPacer(speed, performance.now());
  }
  advance(now: number) {
    if (!this.running) return 0;
    const count = this.pacer.advance(
      now,
      () => {
        const status = this.step();
        if (status.stopReason) this.running = false;
        return this.running;
      },
      () => performance.now()
    );
    this.measuredTicks += count;
    const completed = performance.now();
    if (completed - this.measurementAt >= 500) {
      this.throughput = (this.measuredTicks * 1000) / (completed - this.measurementAt);
      this.measurementAt = completed;
      this.measuredTicks = 0;
    }
    return count;
  }
  step() {
    this.recordExecution();
    const result = this.world.step();
    if (result.tick % 25 === 0) this.sample();
    return result;
  }
  private newObservation(): ObservationState {
    return {
      runId: localIdentity(),
      history: [],
      recent: [],
      spatial: emptySpatial(),
      executions: [{ digest: this.engine.sourceDigest, tick: 0 }],
    };
  }
  private recordExecution() {
    const history = this.observation.executions;
    if (history[history.length - 1].digest === this.engine.sourceDigest) return;
    if (history.length >= 64)
      throw new Error("Execution history budget reached; export before continuing");
    history.push({
      digest: this.engine.sourceDigest,
      tick: this.world.command<Summary>("summary").tick,
    });
  }
  private sample() {
    this.population = observe(this.world, this.observation.spatial);
    const tick = this.population.tick;
    this.observation.recent = [
      ...this.observation.recent.filter((p) => p.tick >= tick - 2000 && p.tick < tick),
      {
        tick,
        population: this.population.membrane.reduce((sum, n) => sum + n, 0),
        bins: this.population.efforts.map((e) => e.bins),
      },
    ];
    this.record(this.world.command<Summary>("summary"));
  }
  private record(summary: Summary) {
    const regions = regionSummaries(this.observation.spatial);
    const point = {
      tick: summary.tick,
      population: summary.population,
      biomass: summary.biomass,
      divisions: summary.ledger.divisions,
      deaths: summary.ledger.deaths,
      traits: this.population.traits.map((t) => t.median ?? 0),
      membrane: Array.from({ length: 16 }, (_, x) =>
        this.population.membrane.slice(x * 16, x * 16 + 16).reduce((sum, n) => sum + n, 0)
      ),
      families: this.population.families.rows,
      lineages: this.population.lineages.rows,
      regions: regions
        .slice(0, 64)
        .map(({ id, x, y, count, membraneX }) => ({ id, x, y, count, membraneX })),
      regionCount: regions.length,
    };
    const history = [...this.observation.history.filter((p) => p.tick < point.tick), point];
    this.observation.history =
      history.length <= 240
        ? history
        : history.filter((_, i) => i % 2 === 0 || i === history.length - 1);
  }
  status(): LiveStatus {
    const summary = this.world.command<Summary>("summary");
    if (this.chemicals?.tick !== summary.tick)
      this.chemicals = this.world.command<LiveStatus["chemicals"]>("chemicalOverview");
    if (!this.observation.history.length) this.record(summary);
    return {
      kernelDigest: this.engine.sourceDigest,
      chemicals: this.chemicals,
      summary,
      running: this.running,
      speed: this.speed,
      throughput: this.running ? this.throughput : 0,
      recovery: this.recovery,
      error: this.error,
      history: this.observation.history,
      recent: this.observation.recent,
      memoryBytes: this.engine.memoryBytes,
      workerWork: null,
      population: this.population,
      regions: regionSummaries(this.observation.spatial),
      spatialEvents: this.observation.spatial.events.slice(-64),
      eventsDropped: this.observation.spatial.dropped,
    };
  }
  restart(seed: number, config: Record<string, unknown>) {
    this.revision++;
    this.setRunning(false);
    const next = this.engine.create(seed, config);
    this.replace(next, this.newObservation());
  }
  private replace(next: EngineWorld, observation: ObservationState) {
    let definition: Definition, population: LiveStatus["population"];
    try {
      definition = next.command<Definition>("definition");
      population =
        observation.spatial.tick < 0 ? observe(next, observation.spatial) : currentPopulation(next);
    } catch (error) {
      next.dispose();
      throw error;
    }
    this.world.dispose();
    this.world = next;
    this.chemicals = null;
    this.definition = definition;
    this.observation = observation;
    this.population = population;
    this.lastSaved = -1;
    this.error = null;
    this.recovery = "Restored or new population; paused";
    this.setRunning(false);
    this.measuredTicks = 0;
    this.measurementAt = performance.now();
  }
  async export() {
    return this.cold.run(async () => {
      const summary = this.world.command<Summary>("summary");
      return encodePackage(this.world.snapshot(), {
        seed: this.definition.seed,
        tick: summary.tick,
        observation: this.observation,
      });
    });
  }
  async restore(blob: Blob, revision = ++this.revision) {
    this.setRunning(false);
    return this.cold.run(() => this.restorePackage(blob, revision));
  }
  private async restorePackage(blob: Blob, revision: number) {
    const { snapshot, metadata } = await decodePackage(blob);
    if (revision !== this.revision)
      throw new Error("Restore superseded by a newer population request");
    const next = this.engine.restore(snapshot);
    const summary = next.command<Summary>("summary");
    const definition = next.command<Definition>("definition");
    if (summary.tick !== metadata.tick || definition.seed !== metadata.seed) {
      next.dispose();
      throw new Error("Checkpoint metadata disagrees with physical state");
    }
    this.replace(next, metadata.observation);
  }
  async restoreLocal(id?: string) {
    const revision = ++this.revision;
    this.setRunning(false);
    await this.restore(await loadRecovery(id), revision);
  }
  async save(reason: "manual" | "automatic"): Promise<string | undefined> {
    if (reason === "automatic" && this.cold.busy) return undefined;
    return this.cold.run(() => this.savePackage(reason));
  }
  private async savePackage(reason: "manual" | "automatic") {
    const runId = this.observation.runId,
      world = this.world;
    const summary = world.command<Summary>("summary");
    if (reason === "automatic" && (summary.tick === this.lastSaved || summary.tick === 0))
      return undefined;
    const operation = async () => {
      const seed = this.definition.seed,
        snapshot = world.snapshot();
      const blob = await encodePackage(snapshot, {
        seed,
        tick: summary.tick,
        observation: this.observation,
      });
      const id = await storeRecovery(blob, {
        seed,
        tick: summary.tick,
        runId,
        reason,
        rawBytes: snapshot.length,
      });
      if (this.observation.runId === runId) {
        this.lastSaved = summary.tick;
        this.recovery = `Recovery saved at tick ${summary.tick.toLocaleString()}`;
      }
      return id;
    };
    try {
      return await operation();
    } catch (error) {
      if (this.observation.runId === runId) {
        this.setRunning(false);
        this.recovery = `Paused: recovery failed. ${String(error)}`;
      }
      throw error;
    }
  }
  fail(error: unknown) {
    this.running = false;
    this.error = String(error);
  }
}
