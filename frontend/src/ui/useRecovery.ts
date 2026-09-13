import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { type World } from "../sim/types";
import { observationIdentity } from "../persist/observation";
import { saveLocal } from "../persist/db";
import { browserCheckpoint } from "./runtimeIdentity";

/** Never overlaps automatic serialization/writes. A failure pauses physical execution visibly. */
export function useRecovery(
  world: World,
  running: boolean,
  setRunning: Dispatch<SetStateAction<boolean>>
) {
  const [status, setStatus] = useState("Automatic recovery every 30 seconds while running");
  const saved = useRef(-1),
    busy = useRef(false);
  const save = useCallback(async () => {
    if (busy.current || world.tick === saved.current || world.tick === 0) return;
    busy.current = true;
    const tick = world.tick;
    try {
      const text = browserCheckpoint(world);
      await saveLocal(text, {
        tick,
        seed: world.seed,
        runId: observationIdentity(world),
        reason: "automatic",
      });
      saved.current = tick;
      setStatus(`Recovery saved at tick ${tick.toLocaleString()}`);
    } catch (error) {
      setRunning(false);
      setStatus(`Paused: recovery failed. ${String(error)}`);
    } finally {
      busy.current = false;
    }
  }, [world, setRunning]);
  useEffect(() => {
    if (!running) {
      const timer = window.setTimeout(() => void save(), 0);
      return () => clearTimeout(timer);
    }
    const timer = window.setInterval(() => void save(), 30000);
    const hidden = () => {
      if (document.hidden) void save();
    };
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("pagehide", save);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("pagehide", save);
    };
  }, [running, save]);
  return status;
}
