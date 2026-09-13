import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { App } from "./App";
import "fake-indexeddb/auto";

it("opens bacteria paused with active ecology layers and explicit disabled systems", async () => {
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
    expect(container.textContent).toContain("occupied regions");
    expect(container.textContent).toContain("Browse retained spatial samples");
    expect(container.textContent).not.toContain("NaN");
    expect(container.querySelector<HTMLSelectElement>(".trait-panel select")?.value).toBe("motor");
    expect(container.querySelector('.population-chart svg[role="img"]')).not.toBeNull();
    expect(container.textContent).toContain("Opposite edges connect");
    expect(container.textContent).toContain("Inherited construction targets");
    expect(container.textContent).toContain("Distinct inherited sequences");
    expect(
      container.querySelector('canvas[aria-label="Top-down bacterial population"]')
    ).not.toBeNull();
    const buttons = Array.from(container.querySelectorAll("button"));
    expect(buttons.find((b) => b.textContent === "Run")).toBeDefined();
    expect(container.querySelectorAll(".map-tools input:checked")).toHaveLength(3);
    expect(container.textContent).toContain("solid walls disabled");
    expect(container.textContent).toContain("Neutral signaling disabled");
    expect(container.textContent).toContain("Mixed finite deposits");
    expect(container.textContent).toContain("Damage share of deaths · lifetime");
    expect(
      container.querySelector<HTMLSelectElement>(".population-color-control select")?.value
    ).toBe("foodA");
    expect(container.querySelector(".trait-panel")?.closest("details")).toBeNull();
    expect(container.textContent).toContain("Strategy clusters");
    // Identical founders form one cluster; further clusters appear only with inherited variation.
    expect(container.querySelectorAll(".strategy-table tbody tr")).toHaveLength(1);
    expect(container.textContent).toContain("Recent families");
    expect(container.textContent).toContain("Recent sampled behavior");
    const family = container.querySelector<HTMLButtonElement>(".family-link")!;
    await act(async () => family.click());
    expect(container.textContent).toContain("Family and relatedness");
    expect(container.textContent).toContain("Ancestry links");
    const overlay = Array.from(container.querySelectorAll<HTMLInputElement>("input")).find(
      (input) => input.parentElement?.textContent?.includes("Population regions")
    )!;
    await act(async () => overlay.click());
    expect(overlay.checked).toBe(false);
    expect(container.querySelectorAll(".map-tools input:checked")).toHaveLength(3);
    expect(
      container.querySelector<HTMLSelectElement>(".population-color-control select")?.value
    ).toBe("foodA");
  } finally {
    await act(async () => root.unmount());
    vi.unstubAllGlobals();
  }
});
