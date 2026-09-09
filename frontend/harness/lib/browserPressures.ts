async function until(predicate: () => boolean, timeout = 30000): Promise<void> {
  const deadline = performance.now() + timeout;
  while (!predicate()) {
    if (performance.now() > deadline) throw new Error("browser pressure check timed out");
    await new Promise((done) => setTimeout(done, 50));
  }
}
function button(text: string): HTMLButtonElement {
  const node = [...document.querySelectorAll("button")].find((entry) => entry.textContent === text);
  if (!node) throw new Error(`missing button ${text}`);
  return node;
}

function collectiveStartup(): void {
  if (document.querySelector<HTMLSelectElement>('[aria-label="Collective work"]')?.value !== "true")
    throw new Error("collective work should be the default");
  if (!document.querySelector('[data-testid="behavior-panel"]'))
    throw new Error("worker behavior metrics missing");
}

/** Actual application controls; no work orders or simulation-state injection. */
export async function reviewBrowserPressures(): Promise<Record<string, unknown>> {
  await until(() => !!document.querySelector(".construction-panel"));
  const panel = document.querySelector<HTMLDetailsElement>(".construction-panel")!;
  if (panel.open) throw new Error("manual construction diagnostics should start collapsed");
  const climate = document.querySelector<HTMLSelectElement>(
    '[aria-label="Material temperature and moisture"]'
  )!;
  const autonomy = document.querySelector<HTMLSelectElement>(
    '[aria-label="Autonomous construction"]'
  )!;
  if (climate.value !== "true" || autonomy.value !== "true")
    throw new Error("pressure startup disabled");
  collectiveStartup();
  const initialTick = document.querySelector('[data-testid="tick"]')!.textContent;
  if (initialTick !== "0") throw new Error("review should begin at tick zero");
  const temperature = [...document.querySelectorAll<HTMLLabelElement>(".layer-row")]
    .find((label) => label.textContent?.includes("Temperature"))!
    .querySelector<HTMLInputElement>("input")!;
  const metrics = document.querySelector<HTMLElement>(".dock-metrics")!;
  if (metrics.hidden || !temperature.checked)
    throw new Error("review observations should start visible");
  if (document.querySelectorAll(".layer-row input:checked").length !== 1)
    throw new Error("other overlays obscure the default temperature view");
  const cavityHeat = document.querySelector<HTMLInputElement>(
    '[aria-label="Initial cavity warming"]'
  )!.value;
  if (cavityHeat !== "0") throw new Error("artificial cavity heating should be off");
  const nest = document.querySelector<HTMLSelectElement>('[aria-label="Nest shape"]')!.value;
  if (nest !== "founding") throw new Error("default founding nest missing");
  const counter = (name: string) =>
    Number(document.querySelector(`[data-testid="${name}"]`)!.textContent);
  button("Run").click();
  await until(() => counter("tick") >= 4000, 600000);
  button("Pause").click();
  await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  return {
    initialTick,
    tick: document.querySelector('[data-testid="tick"]')!.textContent,
    climateEnabled: climate.value,
    autonomousConstruction: autonomy.value,
    diagnosticPanelCollapsed: !panel.open,
    temperatureOverlay: temperature.checked,
    metricsInitiallyVisible: !metrics.hidden,
    initialCavityHeat: cavityHeat,
    excavated: counter("excavated-cells"),
    spoilPlaced: counter("deposited-spoil"),
    queenMoves: counter("queen-moves"),
    broodMoves: counter("brood-moves"),
    cacheBuilds: counter("cache-builds"),
    cacheMoves: counter("cache-moves"),
    nest,
    onlyRunAndPause: true,
    status: document.querySelector(".status-line")!.textContent,
    noWorkOrdersIssued: true,
    motionCertification: false,
    behavior: document.querySelector('[data-testid="behavior-panel"]')!.textContent,
  };
}
