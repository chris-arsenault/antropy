import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { App } from "./App";

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
    expect(container.textContent).toContain(
      "Food zones, left to right: 100% A / 0% B · 0% A / 100% B."
    );
    expect(container.querySelector<HTMLSelectElement>(".trait-panel select")?.value).toBe("foodA");
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
    ).toBe("strategy");
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
  } finally {
    await act(async () => root.unmount());
    vi.unstubAllGlobals();
  }
});
