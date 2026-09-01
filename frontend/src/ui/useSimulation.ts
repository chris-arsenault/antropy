import { useCallback, useEffect, useRef, useState } from "react";
import { computeStats, TRAIT_KEYS, type WorldStats } from "../sim/stats";
import { stepWorld, type World } from "../sim/world";
import { createTimeSeries, pushSample, type TimeSeries } from "./charts/timeSeries";
import { FRAME_TIME_BUDGET_MS, ticksForFrame, type SpeedPreset } from "./pacing";

export interface StatsHistory {
  population: TimeSeries;
  eggs: TimeSeries;
  colonies: TimeSeries;
  dominantShare: TimeSeries;
  traitMeans: TimeSeries[];
}

export interface SimulationHandle {
  world: World;
  tick: number;
  running: boolean;
  speed: SpeedPreset;
  /** Fractional-tick interpolation factor for the renderer, updated per frame. */
  alphaRef: { readonly current: number };
  /** Latest instrumentation sample, republished with the tick counter. */
  stats: WorldStats | null;
  /** Ring-buffered chart series; object identity is stable. */
  history: StatsHistory;
  start(): void;
  pause(): void;
  setSpeed(speed: SpeedPreset): void;
}

const UI_REFRESH_MS = 100;
const STATS_SAMPLE_INTERVAL_TICKS = 50;

function createHistory(): StatsHistory {
  return {
    population: createTimeSeries(),
    eggs: createTimeSeries(),
    colonies: createTimeSeries(),
    dominantShare: createTimeSeries(),
    traitMeans: TRAIT_KEYS.map(() => createTimeSeries()),
  };
}

function recordSample(history: StatsHistory, stats: WorldStats): void {
  pushSample(history.population, stats.tick, stats.population);
  pushSample(history.eggs, stats.tick, stats.eggCount);
  pushSample(history.colonies, stats.tick, stats.colonyCount);
  pushSample(history.dominantShare, stats.tick, stats.dominantPatrilineShare);
  for (let i = 0; i < history.traitMeans.length; i++) {
    pushSample(history.traitMeans[i], stats.tick, stats.traitMeans[i]);
  }
}

/**
 * Hosts the simulation loop on the main thread (ADR-0001): owns the World
 * produced by the factory (fresh or checkpoint-restored — remount with a new
 * key to switch), advances it inside a requestAnimationFrame budget, samples
 * instrumentation on a tick cadence, and republishes at a throttled rate.
 */
export function useSimulation(worldFactory: () => World): SimulationHandle {
  // The initializer runs exactly once per mount; later identity changes of
  // `worldFactory` are irrelevant by design.
  const [initial] = useState(() => {
    const world = worldFactory();
    const history = createHistory();
    const stats = computeStats(world);
    recordSample(history, stats);
    return { world, history, stats };
  });
  const { world, history } = initial;

  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState<SpeedPreset>(1);
  const [tick, setTick] = useState(world.tick);
  const [stats, setStats] = useState<WorldStats | null>(initial.stats);

  const frameRef = useRef(0);
  const alphaRef = useRef(0);
  const lastSampleRef = useRef(world.tick);

  useEffect(() => {
    if (!running) {
      return undefined;
    }
    let last = performance.now();
    let lastPublish = last;
    let carry = 0;
    let latest: WorldStats | null = null;

    const frame = (now: number) => {
      const budgeted = ticksForFrame(speed, now - last, carry);
      carry = budgeted.carry;
      last = now;
      const deadline = performance.now() + FRAME_TIME_BUDGET_MS;
      for (let i = 0; i < budgeted.ticks; i++) {
        stepWorld(world);
        if (world.tick - lastSampleRef.current >= STATS_SAMPLE_INTERVAL_TICKS) {
          lastSampleRef.current = world.tick;
          latest = computeStats(world);
          recordSample(history, latest);
        }
        // Over-budget ticks are dropped, not deferred — effective speed
        // degrades but the frame never blocks (FRAME_TIME_BUDGET_MS).
        if (performance.now() > deadline) {
          break;
        }
      }
      alphaRef.current = carry;
      if (now - lastPublish >= UI_REFRESH_MS) {
        lastPublish = now;
        setTick(world.tick);
        if (latest) {
          setStats(latest);
        }
      }
      frameRef.current = requestAnimationFrame(frame);
    };

    frameRef.current = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(frameRef.current);
      setTick(world.tick);
    };
  }, [running, speed, world, history]);

  const start = useCallback(() => setRunning(true), []);
  const pause = useCallback(() => setRunning(false), []);

  return { world, tick, running, speed, alphaRef, stats, history, start, pause, setSpeed };
}
