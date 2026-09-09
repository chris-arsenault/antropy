import { createWorld } from "../../src/sim/world";
import { scenarioConfig } from "../../src/sim/scenarios";
import { colonyBounds, fitCamera } from "../../src/ui/camera";
import { constructionSites } from "./constructionSites";

async function until(predicate: () => boolean, timeout = 15_000): Promise<void> {
  const deadline = performance.now() + timeout;
  while (!predicate()) {
    if (performance.now() > deadline)
      throw new Error(
        `browser construction check timed out: ${document.querySelector(".construction-panel")?.textContent}`
      );
    await new Promise((done) => setTimeout(done, 50));
  }
}
function button(text: string): HTMLButtonElement {
  const result = [...document.querySelectorAll("button")].find((node) => node.textContent === text);
  if (!result) throw new Error(`missing button: ${text}`);
  return result;
}

/** Exercise the actual application through its DOM in an isolated browser page. */
export async function reviewBrowserConstruction(): Promise<Record<string, unknown>> {
  await until(() => !!document.querySelector(".construction-panel"));
  await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  const canvas = document.querySelector<HTMLCanvasElement>(".world-view")!;
  const bounds = canvas.getBoundingClientRect();
  const world = createWorld(
    101,
    "colony-programmed",
    scenarioConfig("colony-programmed", "compact"),
    false
  );
  const target = constructionSites(world).cache;
  const camera = fitCamera(colonyBounds(world, true), canvas.clientWidth, canvas.clientHeight);
  canvas.dispatchEvent(
    new PointerEvent("pointerdown", {
      bubbles: true,
      shiftKey: true,
      clientX: bounds.left + bounds.width / 2 + (target.x + 0.5 - camera.x) * camera.scale,
      clientY: bounds.top + bounds.height / 2 - (target.y + 0.5 - camera.y) * camera.scale,
    })
  );
  const select = document.querySelector<HTMLSelectElement>(".construction-panel select")!;
  select.value = "cache";
  select.dispatchEvent(new Event("change", { bubbles: true }));
  await until(() =>
    document
      .querySelector(".construction-panel")!
      .textContent!.includes(`(${target.x}, ${target.y})`)
  );
  button("Queue at selected cell").click();
  await until(() =>
    document.querySelector(".construction-panel")!.textContent!.includes("pending")
  );
  const speed = document.querySelector<HTMLSelectElement>('[data-testid="speed-select"]')!;
  speed.value = "max";
  speed.dispatchEvent(new Event("change", { bubbles: true }));
  button("Run").click();
  await until(
    () => document.querySelector(".construction-panel")!.textContent!.includes("done"),
    30_000
  );
  button("Pause").click();
  return {
    target,
    tick: document.querySelector('[data-testid="tick"]')!.textContent,
    panel: document.querySelector(".construction-panel")!.textContent,
    panZoomControlsPresent: !!button("Fit colony"),
    cacheCreatedThroughUI: true,
  };
}
