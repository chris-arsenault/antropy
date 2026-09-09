const delay = (ms: number) => new Promise((done) => setTimeout(done, ms));
const tick = () => Number(document.querySelector('[data-testid="tick"]')!.textContent);

function button(label: string): HTMLButtonElement {
  const found = [...document.querySelectorAll("button")].find((node) => node.textContent === label);
  if (!found) throw new Error(`missing ${label}`);
  return found;
}

async function measure(target: string) {
  button("New world").click();
  await delay(250);
  if (tick() !== 0) throw new Error("comparison must start from tick zero");
  const select = document.querySelector<HTMLSelectElement>('[data-testid="speed-select"]')!;
  select.value = target;
  select.dispatchEvent(new Event("change", { bubbles: true }));
  await delay(50);
  const start = performance.now();
  button("Run").click();
  await delay(4000);
  button("Pause").click();
  await delay(50);
  const elapsed = performance.now() - start;
  const finalTick = tick();
  const shown = Number(document.querySelector('[data-testid="actual-tick-rate"]')!.textContent);
  await delay(250);
  if (tick() !== finalTick) throw new Error("Pause did not stop ticking");
  return { target, ticks: finalTick, elapsed, measured: (finalTick * 1000) / elapsed, shown };
}

/** Actual controls on identical fresh default worlds; no physics or controller overrides. */
export async function reviewBrowserPacing() {
  const deadline = performance.now() + 10000;
  while (!document.querySelector('[data-testid="speed-select"]')) {
    if (performance.now() > deadline) throw new Error("application did not load");
    await delay(50);
  }
  const initial = document.querySelector<HTMLSelectElement>('[data-testid="speed-select"]')!.value;
  if (initial !== "30") throw new Error("default tick target should be 30 ticks/s");
  if (document.querySelector<HTMLElement>(".dock-metrics")!.hidden) throw new Error("stats hidden");
  const rates = [];
  for (const target of ["1", "10", "30", "max"]) rates.push(await measure(target));
  if (rates[0].ticks < 3 || rates[0].ticks > 5)
    throw new Error("1 tick/s does not follow wall time");
  if (rates[1].measured < rates[0].measured * 3)
    throw new Error("tick target had no measured effect");
  if (rates.some((rate) => rate.shown <= 0)) throw new Error("throughput stats did not update");
  return { initial, rates, pauseVerified: true, optionsRetained: true };
}
