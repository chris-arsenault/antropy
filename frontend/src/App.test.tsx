import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { App, ConfiguredApp } from "./App";
import { createWorld } from "./sim/world";
import { FORAGER_CONFIG, PROGRAMMED_LIFECYCLE_CONFIG } from "./sim/config";
import { type ScenarioId, type World } from "./sim/types";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const preparedWorlds = new Map<ScenarioId, World>([
  [
    "programmed-lifecycle",
    createWorld(1, "programmed-lifecycle", PROGRAMMED_LIFECYCLE_CONFIG, false),
  ],
]);

function buildTestWorld(scenario: ScenarioId, seed: number): World {
  const prepared = seed === 1 ? preparedWorlds.get(scenario) : undefined;
  if (prepared) return prepared;
  const world = createWorld(seed, scenario, FORAGER_CONFIG, false);
  if (seed === 1) preparedWorlds.set(scenario, world);
  return world;
}

async function renderApp(): Promise<{ container: HTMLElement; root: Root }> {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () =>
    root.render(
      <ConfiguredApp
        buildWorld={buildTestWorld}
        initialModel={null}
        initialSeed={1}
        initialController={null}
      />
    )
  );
  return { container, root };
}

async function cleanup(container: HTMLElement, root: Root): Promise<void> {
  await act(async () => root.unmount());
  container.remove();
}

describe("colony knowledge review startup", () => {
  it("opens programmed ants at tick zero and retains the historical RNN comparison", async () => {
    const { container, root } = await renderApp();
    await act(async () => root.render(<App />));
    const select = () => {
      const element = container.querySelector<HTMLSelectElement>('[data-testid="scenario-select"]');
      if (!element) throw new Error("scenario selector missing");
      return element;
    };
    expect(select().value).toBe("colony-programmed");
    expect(container.querySelector('[data-testid="tick"]')?.textContent).toBe("0");
    expect(container.querySelector("header")?.textContent).toContain("seed 101");
    expect(container.querySelector("button")?.textContent).toBe("Run");
    expect(container.querySelector<HTMLElement>(".dock-metrics")?.hidden).toBe(false);
    expect(container.querySelector('[data-testid="habitat-panel"]')).not.toBeNull();
    expect(
      container.querySelector<HTMLInputElement>('[aria-label="Initial cavity warming"]')?.value
    ).toBe("0");
    expect(container.querySelector<HTMLSelectElement>('[data-testid="speed-select"]')?.value).toBe(
      "30"
    );
    await act(async () => {
      select().value = "programmed-lifecycle";
      select().dispatchEvent(new Event("change", { bubbles: true }));
    });
    await act(async () => {
      select().value = "registered-colony";
      select().dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(select().value).toBe("registered-colony");
    const reset = [...container.querySelectorAll("button")].find(
      (button) => button.textContent === "New world"
    );
    if (!reset) throw new Error("reset button missing");
    await act(async () => reset.click());
    expect(container.querySelector('[data-testid="tick"]')?.textContent).toBe("0");
    expect(container.querySelector('[data-testid="world-mode"]')?.textContent).toContain(
      "RNN colony"
    );
    await cleanup(container, root);
  }, 20_000);
});

describe("2D application", () => {
  it("exposes the programmed worker scenarios", async () => {
    const { container, root } = await renderApp();
    const select = container.querySelector<HTMLSelectElement>('[data-testid="scenario-select"]');
    expect(select?.value).toBe("programmed-lifecycle");
    expect([...(select?.options ?? [])].map((option) => option.text)).toEqual([
      "Programmed ants · colony knowledge",
      "Linear-program ants · colony knowledge",
      "Map-aware pathing diagnostic",
      "Programmed worker colony",
      "Programmed colony with lifecycle",
      "Experimental RNN creature",
    ]);
    expect(container.querySelector("canvas")?.getAttribute("aria-label")).toBe(
      "Two-dimensional simulation"
    );
    expect(container.querySelector('[data-testid="effective-config"]')?.textContent).toContain(
      "2048 × 128"
    );
    expect(container.querySelector('[data-testid="map-layers"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="charts-panel"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="inspector"]')).not.toBeNull();
    await cleanup(container, root);
  });

  it("restarts into the recurrent local policy", async () => {
    const { container, root } = await renderApp();
    const select = container.querySelector<HTMLSelectElement>('[data-testid="scenario-select"]');
    if (!select) throw new Error("scenario selector missing");
    await act(async () => {
      select.value = "rnn";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(container.querySelector('[data-testid="world-mode"]')?.textContent).toContain(
      "Experimental RNN creature"
    );
    await cleanup(container, root);
  });

  it("shows a paused manual task write as a diagnostic intervention", async () => {
    const { container, root } = await renderApp();
    const input = container.querySelector<HTMLInputElement>('input[name="task"]');
    if (!input?.form) throw new Error("task editor missing");
    await act(async () => {
      input.value = "7";
      input.form!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    expect(container.querySelector('[data-testid="inspector"]')?.textContent).toContain(
      "Task register: 7"
    );
    expect(container.querySelector('[data-testid="inspector"]')?.textContent).toContain(
      "This run is diagnostic"
    );
    expect(container.querySelector('[data-testid="tick"]')?.textContent).toBe("0");
    await cleanup(container, root);
  });
});
