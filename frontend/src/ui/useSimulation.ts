import { useCallback, useEffect, useRef, useState } from "react";
import { createWorld, stepWorld, type World } from "../sim/world";
import { ticksForFrame, type SpeedPreset } from "./pacing";

export interface SimulationHandle {
  world: World;
  tick: number;
  running: boolean;
  speed: SpeedPreset;
  /** Fractional-tick interpolation factor for the renderer, updated per frame. */
  alphaRef: { readonly current: number };
  start(): void;
  pause(): void;
  setSpeed(speed: SpeedPreset): void;
}

const UI_REFRESH_MS = 100;

/**
 * Hosts the simulation loop on the main thread (ADR-0001): owns the World,
 * advances it inside a requestAnimationFrame budget, and republishes the tick
 * counter to React at a throttled cadence so high speeds don't flood renders.
 */
export function useSimulation(seed: number, init?: (world: World) => void): SimulationHandle {
  // The initializer runs exactly once per mount; later identity changes of
  // `init` are irrelevant by design.
  const [world] = useState(() => {
    const created = createWorld(seed);
    init?.(created);
    return created;
  });
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState<SpeedPreset>(1);
  const [tick, setTick] = useState(world.tick);

  const frameRef = useRef(0);
  const alphaRef = useRef(0);

  useEffect(() => {
    if (!running) {
      return undefined;
    }
    let last = performance.now();
    let lastPublish = last;
    let carry = 0;

    const frame = (now: number) => {
      const budgeted = ticksForFrame(speed, now - last, carry);
      carry = budgeted.carry;
      last = now;
      for (let i = 0; i < budgeted.ticks; i++) {
        stepWorld(world);
      }
      alphaRef.current = carry;
      if (now - lastPublish >= UI_REFRESH_MS) {
        lastPublish = now;
        setTick(world.tick);
      }
      frameRef.current = requestAnimationFrame(frame);
    };

    frameRef.current = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(frameRef.current);
      setTick(world.tick);
    };
  }, [running, speed, world]);

  const start = useCallback(() => setRunning(true), []);
  const pause = useCallback(() => setRunning(false), []);

  return { world, tick, running, speed, alphaRef, start, pause, setSpeed };
}
