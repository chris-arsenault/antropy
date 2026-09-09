import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { App } from "./App";

it("opens bacteria paused with mutation, both chemical layers and stats available through Run", async () => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    }
  );
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const container = document.createElement("div"),
    root = createRoot(container);
  try {
    await act(async () => root.render(<App />));
    expect(container.textContent).toContain("Top-down bacteria");
    expect(container.textContent).toContain("Live mutation on");
    expect(container.textContent).toContain("Tick 0");
    expect(
      container.querySelector('canvas[aria-label="Top-down bacterial population"]')
    ).not.toBeNull();
    const buttons = Array.from(container.querySelectorAll("button"));
    expect(buttons.find((b) => b.textContent === "Run")).toBeDefined();
    expect(container.querySelectorAll(".map-tools input:checked")).toHaveLength(2);
  } finally {
    await act(async () => root.unmount());
    vi.unstubAllGlobals();
  }
});
