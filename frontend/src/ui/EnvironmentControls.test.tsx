import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { EnvironmentControls } from "./EnvironmentControls";
import { terrainConfig } from "../sim/config";
import { BASELINE_ENVIRONMENT } from "../sim/environmentConfig";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const cleanups: (() => Promise<void>)[] = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) await cleanup();
});

async function renderControls() {
  const container = document.createElement("div"),
    root = createRoot(container);
  document.body.appendChild(container);
  cleanups.push(async () => {
    await act(async () => root.unmount());
    container.remove();
  });
  const config = terrainConfig("reference"),
    onApply = vi.fn();
  await act(async () => root.render(<EnvironmentControls config={config} onApply={onApply} />));
  return { container, config, onApply };
}

async function select(container: HTMLElement, label: string, value: string) {
  const input = container.querySelector<HTMLSelectElement>(`select[aria-label="${label}"]`)!;
  await act(async () => {
    input.value = value;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

async function apply(container: HTMLElement) {
  await act(async () =>
    container
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
  );
}

it("edits only the chosen draft axis and applies it explicitly", async () => {
  const { container, config, onApply } = await renderControls();
  await select(container, "Nest shape", "compact");
  expect(onApply).not.toHaveBeenCalled();
  for (const key of ["width", "height", "surfaceBase"] as const)
    expect(
      Number(container.querySelector<HTMLInputElement>(`input[aria-label="${key}"]`)!.value)
    ).toBe(config[key]);
  await apply(container);
  expect(onApply).toHaveBeenCalledExactlyOnceWith({
    ...config,
    environment: { ...config.environment, nestShape: "compact" },
  });
});

it("offers and applies the original physical rules preset", async () => {
  const { container, config, onApply } = await renderControls();
  await select(container, "Environment preset", "baseline");
  await apply(container);
  expect(onApply).toHaveBeenCalledExactlyOnceWith({
    ...terrainConfig("baseline", config),
    environment: BASELINE_ENVIRONMENT,
  });
});
