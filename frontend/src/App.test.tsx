import { describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { SINGLE_FORAGER_CONFIG } from "./sim/config";
import { rnnController } from "./sim/controller/rnn";
import { createWorld, populateForagers, type World } from "./sim/world";
import { type ScenarioId } from "./ui/scenarios";
import { ConfiguredApp } from "./App";

function buildTestWorld(_scenario: ScenarioId, seed: number): World {
  const world = createWorld(seed, rnnController, SINGLE_FORAGER_CONFIG);
  populateForagers(world, 1);
  return world;
}

async function renderApp(): Promise<{ container: HTMLElement; root: Root }> {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(<ConfiguredApp buildWorld={buildTestWorld} />);
  });
  return { container, root };
}

async function cleanup(container: HTMLElement, root: Root): Promise<void> {
  await act(async () => {
    root.unmount();
  });
  container.remove();
}

describe("App scenario selection", () => {
  it("renders the matched single-forager selector and defaults to the full-map baseline", async () => {
    const { container, root } = await renderApp();

    expect(container.querySelector("h1")?.textContent).toBe("Antropy");
    expect(container.querySelector('[data-testid="tick"]')?.textContent).toBe("0");
    const scenarios = container.querySelector<HTMLSelectElement>('[data-testid="scenario-select"]');
    if (!scenarios) throw new Error("missing scenario select");
    expect(scenarios.value).toBe("omniscient-single");
    expect([...scenarios.options].map(({ text }) => text)).toEqual([
      "Omniscient pathfinding ant",
      "Programmed sensor-limited ant",
    ]);
    expect(container.querySelector('[data-testid="world-mode"]')?.textContent).toContain(
      "Omniscient pathfinding ant"
    );
    expect(container.querySelector(".status-line")?.textContent).toContain("ants 1");
    expect(container.querySelector("button")?.textContent).toBe("Run");
    const effectiveConfig = container.querySelector('[data-testid="effective-config"]');
    expect(effectiveConfig?.textContent).toContain("food energy2.4");
    expect(effectiveConfig?.textContent).toContain("energy tank8");
    expect(effectiveConfig?.textContent).toContain("surface food target1600");

    await cleanup(container, root);
  });

  it("restarts into the sensor-limited programmed ant", async () => {
    const { container, root } = await renderApp();
    const scenarios = container.querySelector<HTMLSelectElement>('[data-testid="scenario-select"]');
    if (!scenarios) throw new Error("missing scenario select");

    await act(async () => {
      scenarios.value = "sensor-limited-single";
      scenarios.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(container.querySelector('[data-testid="world-mode"]')?.textContent).toContain(
      "Programmed sensor-limited ant"
    );
    expect(container.querySelector('[data-testid="world-mode"]')?.textContent).toContain(
      "local sensors"
    );
    await cleanup(container, root);
  });
});

describe("App runtime", () => {
  it("shows the viewport with an explicit notice when WebGL2 is unavailable", async () => {
    const { container, root } = await renderApp();

    const view = container.querySelector('[data-testid="world-view"]');
    expect(view).not.toBeNull();
    expect(view?.textContent).toContain("WebGL2 is unavailable");

    await cleanup(container, root);
  });

  it("replaces the viewport with a notice at charts-only speed", async () => {
    const { container, root } = await renderApp();

    const select = container.querySelector<HTMLSelectElement>('[data-testid="speed-select"]');
    if (!select) {
      throw new Error("missing speed select");
    }
    await act(async () => {
      select.value = "1000";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    const view = container.querySelector('[data-testid="world-view"]');
    expect(view?.textContent).toContain("rendering disabled");
    expect(view?.querySelector("canvas")).toBeNull();

    await cleanup(container, root);
  });

  it("toggles between run and pause", async () => {
    const { container, root } = await renderApp();

    const button = container.querySelector("button");
    if (!button) {
      throw new Error("missing run button");
    }
    await act(async () => {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(button.textContent).toBe("Pause");

    await act(async () => {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(button.textContent).toBe("Run");

    await cleanup(container, root);
  });
});
