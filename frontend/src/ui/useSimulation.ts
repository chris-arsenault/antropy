import { useCallback, useEffect, useState } from "react";
import { type World } from "../sim/types";
import { stepWorld } from "../sim/world";
import { createPacer, DEFAULT_SPEED, type Speed } from "./pacing";
import {
  appendPoint,
  appendSample,
  appendRecent,
  populationPoint,
  type PopulationPoint,
} from "./populationHistory";
import { noteBrowserExecution } from "./runtimeIdentity";

export function useSimulation(world: World) {
  const [running, setRunning] = useState(false),
    [speed, setSpeed] = useState<Speed>(DEFAULT_SPEED);
  const [version, setVersion] = useState(0),
    [throughput, setThroughput] = useState(0);
  const [history, setHistory] = useState(() => [populationPoint(world)]);
  const [recent, setRecent] = useState<PopulationPoint[]>([]);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  const advanceWorld = useCallback(() => {
    stepWorld(world);
    if (world.tick % 100 !== 0) return;
    const point = populationPoint(world);
    setHistory((h) => appendSample(h, point));
    setRecent((h) => appendRecent(h, point));
  }, [world]);
  useEffect(() => {
    if (!running) return;
    const pacer = createPacer(speed, performance.now());
    let frame = 0,
      started = performance.now(),
      ticks = 0;
    const advance = () => {
      const before = world.tick;
      noteBrowserExecution(world);
      pacer.advance(performance.now(), advanceWorld, () => performance.now());
      ticks += world.tick - before;
      if (world.tick !== before) refresh();
      if (performance.now() - started >= 1000) {
        setThroughput((ticks * 1000) / (performance.now() - started));
        started = performance.now();
        ticks = 0;
      }
      if (world.stopReason) {
        setHistory((h) => appendPoint(h, world));
        setRunning(false);
        return;
      }
      frame = requestAnimationFrame(advance);
    };
    frame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frame);
  }, [world, running, speed, refresh, advanceWorld]);
  return {
    running,
    setRunning,
    speed,
    setSpeed,
    version,
    throughput,
    history,
    recent,
    refresh,
  };
}
