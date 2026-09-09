import { useEffect, useState } from "react";
import { type World } from "../sim/types";
import { stepWorld } from "../sim/world";
import { createPacer, type Speed } from "./pacing";

export function useSimulationClock(
  world: World,
  running: boolean,
  speed: Speed,
  onAdvance: () => void
) {
  const [throughput, setThroughput] = useState({ ticksPerSecond: 0, millisecondsPerTick: 0 });
  useEffect(() => {
    if (!running) return;
    const pacer = createPacer(speed, performance.now());
    let frame = 0,
      started = performance.now(),
      ticks = 0,
      computation = 0;
    const advance = () => {
      const before = performance.now();
      const count = pacer.advance(
        before,
        () => stepWorld(world),
        () => performance.now()
      );
      computation += performance.now() - before;
      ticks += count;
      if (count > 0) onAdvance();
      const now = performance.now();
      if (now - started >= 1000) {
        setThroughput({
          ticksPerSecond: (ticks * 1000) / (now - started),
          millisecondsPerTick: ticks ? computation / ticks : 0,
        });
        started = now;
        ticks = 0;
        computation = 0;
      }
      frame = requestAnimationFrame(advance);
    };
    frame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frame);
  }, [world, running, speed, onAdvance]);
  return throughput;
}
