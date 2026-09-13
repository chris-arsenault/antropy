import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { createWorld } from "../sim/world";
import { DEFAULT_CONFIG } from "../sim/config";
import { type World } from "../sim/types";
import { saveLocal } from "../persist/db";
import { useRecovery } from "./useRecovery";

vi.mock("../persist/db", () => ({ saveLocal: vi.fn() }));
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

it("avoids overlapping recovery writes and pauses with the save failure visible", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const world = createWorld(1, {
    ...DEFAULT_CONFIG,
    width: 16,
    height: 16,
    founders: 1,
    sourceCount: 0,
  });
  world.tick = 1;
  const pause = vi.fn();
  let rejectWrite: (error: Error) => void = () => {};
  vi.mocked(saveLocal).mockImplementation(
    () =>
      new Promise<void>((_, reject) => {
        rejectWrite = reject;
      })
  );
  function View({ world }: { world: World }) {
    const status = useRecovery(world, true, pause);
    return <p>{status}</p>;
  }
  const container = document.createElement("div"),
    root = createRoot(container);
  try {
    await act(async () => root.render(<View world={world} />));
    await act(async () => vi.advanceTimersByTime(30000));
    expect(saveLocal).toHaveBeenCalledTimes(1);
    expect(vi.mocked(saveLocal).mock.calls[0][1].tick).toBe(1);
    world.tick = 2;
    await act(async () => vi.advanceTimersByTime(30000));
    expect(saveLocal).toHaveBeenCalledTimes(1);
    await act(async () => rejectWrite(new Error("quota unavailable")));
    expect(pause).toHaveBeenCalledWith(false);
    expect(container.textContent).toContain("Paused: recovery failed");
    expect(container.textContent).toContain("quota unavailable");
  } finally {
    await act(async () => root.unmount());
  }
});
