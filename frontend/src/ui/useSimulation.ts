import { useCallback, useEffect, useRef, useState } from "react";
import { createWorld, stepWorld, type World } from "../sim/world";
import { ticksForFrame, type SpeedPreset } from "./pacing";

export interface SimulationHandle {
  world: World;
  tick: number;
  running: boolean;
  speed: SpeedPreset;
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
export function useSimulation(seed: number): SimulationHandle {
  const [world] = useState(() => createWorld(seed));
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState<SpeedPreset>(1);
  const [tick, setTick] = useState(world.tick);

  const frameRef = useRef(0);

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

  return { world, tick, running, speed, start, pause, setSpeed };
}
