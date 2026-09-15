import { act, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { readFileSync } from "node:fs";
import { expect, it, vi } from "vitest";
import { App as Application } from "../App";
import { Engine } from "./client";
import { Session } from "./session";
import { type Message, type Request } from "./protocol";
import { type Inspection } from "./types";
import { observationDelta, type ObservationView } from "./observationDelta";

it("mounts fresh worker canvases in StrictMode and keeps controls independent with 48 paused founders", async () => {
  const bytes = new Uint8Array(readFileSync("public/antropy-engine.wasm"));
  const session = new Session(await Engine.load(bytes)),
    sent: Request[] = [],
    canvases: HTMLCanvasElement[] = [];
  const restoreCanvas = workerFixture(session, sent, canvases);
  const container = document.createElement("div"),
    root = createRoot(container);
  try {
    await act(async () =>
      root.render(
        <StrictMode>
          <Application />
        </StrictMode>
      )
    );
    expect(canvases).toHaveLength(2);
    expect(canvases[0]).not.toBe(canvases[1]);
    expect(container.textContent).toContain("Tick 0");
    expect(container.querySelector(".population-totals dd")?.textContent).toBe("48");
    expect(container.textContent).toContain("Browse retained spatial samples");
    expect(
      container.querySelector('[aria-label="Family population shares over time"]')
    ).not.toBeNull();
    expect(
      container.querySelector('[aria-label="Founder population shares over time"]')
    ).not.toBeNull();
    expect(session.observation.spatial.regions.length).toBeGreaterThanOrEqual(2);
    expect(container.textContent).not.toContain("NaN");
    const labels = Array.from(container.querySelectorAll("label"));
    const colors = labels
      .find((l) => l.textContent?.startsWith("Cell colors"))!
      .querySelector("select")!;
    const regions = labels
      .find((l) => l.textContent?.includes("Population regions"))!
      .querySelector("input")!;
    const chemical = labels
      .find((l) => l.textContent?.startsWith("Environment"))!
      .querySelector("select")!;
    expect(colors.value).toBe("6");
    expect(chemical.value).toBe("matter");
    await act(async () => regions.click());
    expect(regions.checked).toBe(false);
    expect(chemical.value).toBe("matter");
    expect(colors.value).toBe("6");
    await checkChemicalSelection(container, chemical, colors, regions);
    const button = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent === "Run"
    )!;
    await act(async () => button.click());
    expect(button.textContent).toBe("Pause");
    expect(session.world.command<{ tick: number }>("summary").tick).toBe(1);
    const family = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent === "Founder 1"
    )!;
    await act(async () => family.click());
    expect(container.textContent).toContain("Cell 1");
    expect(container.textContent).toContain("Funded body and inherited genes");
    expect(container.textContent).toContain("Family and genealogy");
    expect(container.querySelector('.genealogy-tree [aria-current="true"]')?.textContent).toContain(
      "Cell 1"
    );
    expect(sent.filter((r) => r.op === "view").every((r) => !("cells" in r.payload))).toBe(true);
  } finally {
    await act(async () => root.unmount());
    session.world.dispose();
    vi.unstubAllGlobals();
    restoreCanvas();
  }
});

function workerFixture(session: Session, sent: Request[], canvases: HTMLCanvasElement[]) {
  const descriptor = Object.getOwnPropertyDescriptor(
    HTMLCanvasElement.prototype,
    "transferControlToOffscreen"
  );
  Object.defineProperty(HTMLCanvasElement.prototype, "transferControlToOffscreen", {
    configurable: true,
    value: function (this: HTMLCanvasElement) {
      canvases.push(this);
      return {};
    },
  });
  class WorkerFixture {
    previous: ObservationView = { status: null, inspection: null };
    onmessage: ((e: { data: Message }) => void) | null = null;
    terminated = false;
    emit(data: Message) {
      if (!this.terminated) this.onmessage?.({ data });
    }
    postMessage(request: Request) {
      sent.push(request);
      queueMicrotask(() => {
        if (this.terminated) return;
        if (request.op === "initialize") {
          this.previous = { status: null, inspection: null };
          this.emit({ kind: "definition", value: session.definition });
        }
        if (request.op === "running") session.setRunning(Boolean(request.payload.value));
        if (request.op === "step") session.step();
        if (["initialize", "running", "inspect", "step"].includes(request.op)) {
          const current = { status: session.status(), inspection: this.previous.inspection };
          if (request.op === "inspect")
            current.inspection = session.world.command<Inspection>("inspect", {
              cell: request.payload.cell,
            });
          this.emit({
            kind: "observation",
            sequence: request.id,
            value: observationDelta(this.previous, current),
          });
          this.previous = current;
        }
        this.emit({ kind: "reply", id: request.id, ok: true, value: undefined });
      });
    }
    terminate() {
      this.terminated = true;
    }
  }
  vi.stubGlobal("Worker", WorkerFixture);
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    }
  );
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

  return () => {
    if (descriptor)
      Object.defineProperty(HTMLCanvasElement.prototype, "transferControlToOffscreen", descriptor);
    else Reflect.deleteProperty(HTMLCanvasElement.prototype, "transferControlToOffscreen");
  };
}

async function checkChemicalSelection(
  container: HTMLElement,
  field: HTMLSelectElement,
  colors: HTMLSelectElement,
  regions: HTMLInputElement
) {
  const step = Array.from(container.querySelectorAll("button")).find(
    (b) => b.textContent === "Step"
  )!;
  await act(async () => step.click());
  const chemical = container.querySelector<HTMLButtonElement>(
    '.chemical-panel button[aria-label^="Show chemical"]'
  )!;
  expect(chemical).not.toBeNull();
  await act(async () => chemical.click());
  expect(field.value).toBe("chemical");
  expect(chemical.getAttribute("aria-pressed")).toBe("true");
  expect(colors.value).toBe("6");
  expect(regions.checked).toBe(false);
}
