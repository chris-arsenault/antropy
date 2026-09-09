import { storedFood } from "../sim/resources";
import { useCallback, useState } from "react";
import { type World } from "../sim/types";
import { overrideTask } from "../sim/taskMemory";

import { DEFAULT_SPEED, type Speed } from "./pacing";
import { useSimulationClock } from "./useSimulationClock";

export interface SimulationHandle {
  readonly world: World;
  readonly version: number;
  readonly running: boolean;
  readonly speed: Speed;
  readonly ticksPerSecond: number;
  readonly millisecondsPerTick: number;
  readonly history: readonly HistoryPoint[];
  start(): void;
  pause(): void;
  setSpeed(speed: Speed): void;
  setTask(id: number, value: number): void;
}

export interface HistoryPoint {
  readonly tick: number;
  readonly storedEnergy: number;
  readonly distanceMoved: number;
  readonly turns: number;
  readonly pheromoneDeposited: number;
  readonly workers: number;
  readonly brood: number;
  readonly queenEnergy: number;
  readonly births: number;
  readonly deaths: number;
}

function appendHistory(current: readonly HistoryPoint[], world: World): readonly HistoryPoint[] {
  const previous = current[current.length - 1];
  if (previous && world.tick - previous.tick < 20) return current;
  return [
    ...current,
    {
      tick: world.tick,
      storedEnergy: storedFood(world) * world.config.foodEnergyDensity,
      distanceMoved: world.economy.movement,
      turns: world.ants.reduce((total, ant) => total + ant.turns, 0),
      pheromoneDeposited: world.metrics.pheromoneDeposited,
      workers: world.ants.length,
      brood: world.brood.length,
      queenEnergy: world.queen.energy,
      births: world.metrics.workerHatches,
      deaths: world.metrics.deaths,
    },
  ].slice(-300);
}

export function useSimulation(factory: () => World): SimulationHandle {
  const [world] = useState(factory);
  const [version, setVersion] = useState(world.tick);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState<Speed>(DEFAULT_SPEED);
  const [history, setHistory] = useState<readonly HistoryPoint[]>([]);
  const [, setEdits] = useState(0);

  const advance = useCallback(() => {
    setHistory((current) => appendHistory(current, world));
    setVersion(world.tick);
  }, [world]);
  const throughput = useSimulationClock(world, running, speed, advance);

  const start = useCallback(() => setRunning(true), []);
  const pause = useCallback(() => setRunning(false), []);
  const setTask = useCallback(
    (id: number, value: number) => {
      overrideTask(world, id, value);
      setEdits((current) => current + 1);
    },
    [world]
  );
  return {
    world,
    version,
    running,
    speed,
    history,
    start,
    pause,
    setSpeed,
    setTask,
    ...throughput,
  };
}
