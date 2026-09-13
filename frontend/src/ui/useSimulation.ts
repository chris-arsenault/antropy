import { useCallback, useEffect, useState } from "react";
import { type World } from "../sim/types";
import { stepWorld } from "../sim/world";
import { createPacer, DEFAULT_SPEED, type Speed } from "./pacing";
import {
  appendPoint,
  appendSample,
  appendRecent,
  populationPoint,
  populationHistory,
} from "./populationHistory";
import { noteBrowserExecution } from "./runtimeIdentity";
import { observeSpatial } from "../observe/spatialHistory";
import { useRecovery } from "./useRecovery";

/** Population statistics are recomputed at most this often while running; the map redraws every frame. */
export const STATS_INTERVAL_MS = 250;

function useWorldSamples(world: World) {
  const [history, setHistory] = useState(() => populationHistory(world).history);
  const [recent, setRecent] = useState(() => populationHistory(world).recent);
  const advanceWorld = useCallback(() => {
    stepWorld(world);
    observeSpatial(world);
    if (world.tick % 100 !== 0) return;
    const point = populationPoint(world);
    const record = populationHistory(world);
    record.history = appendSample(record.history, point);
    record.recent = appendRecent(record.recent, point);
    setHistory(record.history);
    setRecent(record.recent);
  }, [world]);
  return { history, recent, setHistory, advanceWorld };
}
export function useSimulation(world: World) {
  const [running, setRunning] = useState(false),
    [speed, setSpeed] = useState<Speed>(DEFAULT_SPEED);
  const recovery = useRecovery(world, running, setRunning);
  const [version, setVersion] = useState(0),
    [statsVersion, setStatsVersion] = useState(0),
    [throughput, setThroughput] = useState(0);
  const { history, recent, setHistory, advanceWorld } = useWorldSamples(world);
  const refresh = useCallback(() => {
    setVersion((v) => v + 1);
    setStatsVersion((v) => v + 1);
  }, []);
  useEffect(() => {
    if (!running) return;
    const pacer = createPacer(speed, performance.now());
    let frame = 0,
      started = performance.now(),
      statsAt = started,
      ticks = 0;
    const advance = () => {
      const before = world.tick;
      noteBrowserExecution(world);
      pacer.advance(performance.now(), advanceWorld, () => performance.now());
      ticks += world.tick - before;
      if (world.tick !== before) setVersion((v) => v + 1);
      if (performance.now() - statsAt >= STATS_INTERVAL_MS) {
        setStatsVersion((v) => v + 1);
        statsAt = performance.now();
      }
      if (performance.now() - started >= 1000) {
        setThroughput((ticks * 1000) / (performance.now() - started));
        started = performance.now();
        ticks = 0;
      }
      if (world.stopReason) {
        const record = populationHistory(world);
        record.history = appendPoint(record.history, world);
        setHistory(record.history);
        setRunning(false);
        refresh();
        return;
      }
      frame = window.setTimeout(advance, 16);
    };
    frame = window.setTimeout(advance, 16);
    return () => {
      clearTimeout(frame);
      setStatsVersion((v) => v + 1);
    };
  }, [world, running, speed, refresh, advanceWorld, setHistory]);
  return {
    running,
    setRunning,
    speed,
    setSpeed,
    version,
    statsVersion,
    throughput,
    history,
    recent,
    refresh,
    recovery,
  };
}
