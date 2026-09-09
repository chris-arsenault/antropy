import { useCallback, useEffect, useState } from "react";
import { type World } from "../sim/types";
import { stepWorld } from "../sim/world";
import { createPacer, DEFAULT_SPEED, type Speed } from "./pacing";

export function useSimulation(world: World) {
  const [running, setRunning] = useState(false),
    [speed, setSpeed] = useState<Speed>(DEFAULT_SPEED);
  const [version, setVersion] = useState(0),
    [throughput, setThroughput] = useState(0);
  const [history, setHistory] = useState<
    { tick: number; population: number; births: number; deaths: number }[]
  >([]);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  useEffect(() => {
    if (!running) return;
    const pacer = createPacer(speed, performance.now());
    let frame = 0,
      started = performance.now(),
      ticks = 0;
    const advance = () => {
      const before = world.tick;
      pacer.advance(
        performance.now(),
        () => stepWorld(world),
        () => performance.now()
      );
      ticks += world.tick - before;
      if (world.tick !== before) refresh();
      if (performance.now() - started >= 1000) {
        setThroughput((ticks * 1000) / (performance.now() - started));
        setHistory((h) =>
          [
            ...h,
            {
              tick: world.tick,
              population: world.cells.length,
              births: world.ledger.births,
              deaths: world.ledger.deaths,
            },
          ].slice(-240)
        );
        started = performance.now();
        ticks = 0;
      }
      if (world.stopReason) {
        setRunning(false);
        return;
      }
      frame = requestAnimationFrame(advance);
    };
    frame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frame);
  }, [world, running, speed, refresh]);
  return {
    running,
    setRunning,
    speed,
    setSpeed,
    version,
    throughput,
    history,
    refresh,
  };
}
