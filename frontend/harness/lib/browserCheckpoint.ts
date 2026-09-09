const delay = (ms: number) => new Promise((done) => setTimeout(done, ms));

async function waitForTick(tick: number, deadline: number): Promise<void> {
  while (document.querySelector('[data-testid="tick"]')?.textContent !== String(tick)) {
    const error = document.querySelector(".persistence-message")?.textContent;
    if (error) throw new Error(error);
    if (performance.now() > deadline) throw new Error("checkpoint import timed out");
    await delay(50);
  }
}

/** Diagnostic rendering of a measured endpoint, separate from the tick-zero Run-only check. */
export async function reviewBrowserCheckpoint(path: string) {
  if (!path.startsWith("/harness/artifacts/")) throw new Error("expected a local harness artifact");
  const deadline = performance.now() + 30000;
  while (!document.querySelector(".persistence-controls input")) {
    if (performance.now() > deadline) throw new Error("application did not load");
    await delay(50);
  }
  const response = await fetch(path);
  if (!response.ok) throw new Error(`checkpoint fetch failed: ${response.status}`);
  const text = await response.text();
  const tick = JSON.parse(text).tick;
  const transfer = new DataTransfer();
  transfer.items.add(new File([text], "measured-checkpoint.json", { type: "application/json" }));
  const input = document.querySelector<HTMLInputElement>(".persistence-controls input")!;
  input.files = transfer.files;
  input.dispatchEvent(new Event("change", { bubbles: true }));
  await waitForTick(tick, deadline);
  await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  if (![...document.querySelectorAll("button")].some((button) => button.textContent === "Run"))
    throw new Error("imported review should remain paused");
  return {
    diagnosticCheckpoint: true,
    onlyRunAndPause: false,
    source: path,
    tick,
    status: document.querySelector(".status-line")!.textContent,
  };
}
