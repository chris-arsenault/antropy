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

it("preserves the world, display controls and drafts through panel navigation", async () => {
  const session = new Session(
    await Engine.load(new Uint8Array(readFileSync("public/antropy-engine.wasm")))
  );
  const sent: Request[] = [],
    canvases: HTMLCanvasElement[] = [];
  const restoreCanvas = workerFixture(session, sent, canvases);
  const container = document.createElement("div"),
    root = createRoot(container);
  document.body.append(container);
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
    const canvas = container.querySelector("canvas");
    expect(container.textContent).toContain("Tick 0");
    expect(container.querySelector("dialog[open]")).toBeNull();
    expect(button(container, "Light").getAttribute("aria-pressed")).toBe("true");
    expect(button(container, "Resistance").getAttribute("aria-pressed")).toBe("true");
    expect(button(container, "Stress").getAttribute("aria-pressed")).toBe("true");
    await click(container, "Light");
    await click(container, "Population");
    expect(container.querySelector(".population-totals dd")?.textContent).toBe("48");
    expect(container.querySelector(".genealogy-panel")).toBeNull();
    await checkMapSelection(container);
    await checkChemicalWeb(container, session);
    await checkPhenotypes(container, session);
    await checkLineage(container);
    await checkSettings(container);
    await click(container, "Run");
    expect(button(container, "Pause")).toBeDefined();
    expect(session.world.command<{ tick: number }>("summary").tick).toBe(1);
    await click(container, "Saves");
    expect(button(container, "Export runtime report").disabled).toBe(false);
    expect(button(container, "Save locally").disabled).toBe(false);
    await act(async () => restoreCanvas.fail());
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("Fixture failure");
    await click(container, "Chemistry");
    await click(container, "Saves");
    expect(button(container, "Export runtime report").disabled).toBe(false);
    expect(container.querySelector("canvas")).toBe(canvas);
    expect(canvases).toHaveLength(2);
    expect(container.textContent).not.toContain("NaN");
    expect(sent.filter((r) => r.op === "view").every((r) => !("cells" in r.payload))).toBe(true);
  } finally {
    await act(async () => root.unmount());
    container.remove();
    session.world.dispose();
    vi.unstubAllGlobals();
    restoreCanvas();
  }
});

function button(container: HTMLElement, name: string) {
  const found = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find(
    (b) => b.textContent?.trim() === name
  );
  expect(found, name).toBeDefined();
  return found!;
}
async function click(container: HTMLElement, name: string) {
  const target = button(container, name);
  await act(async () => {
    target.focus();
    target.click();
  });
}
function control<T extends HTMLInputElement | HTMLSelectElement>(
  container: HTMLElement,
  name: string
) {
  return Array.from(container.querySelectorAll("dialog[open] label"))
    .find((label) => label.textContent?.trim().startsWith(name))!
    .querySelector<T>("input, select")!;
}
async function checkMapSelection(container: HTMLElement) {
  await click(container, "Map");
  expect(container.textContent).toContain("Browse retained spatial samples");
  expect(control<HTMLSelectElement>(container, "Cell colors").value).toBe("3");
  expect(control<HTMLSelectElement>(container, "Environment").value).toBe("potential");
  expect(control<HTMLInputElement>(container, "Sunlight and shadow").checked).toBe(false);
  expect(control<HTMLInputElement>(container, "Movement resistance").checked).toBe(true);
  await act(async () => control<HTMLInputElement>(container, "Stress exposure").click());
  await act(async () => control<HTMLInputElement>(container, "Population regions").click());
  await click(container, "Step");
  await click(container, "Chemistry");
  const chemical = container.querySelector<HTMLButtonElement>(
    '.chemical-panel button[aria-label^="Show chemical"]'
  )!;
  expect(chemical).not.toBeNull();
  await act(async () => chemical.click());
  expect(chemical.getAttribute("aria-pressed")).toBe("true");
  await click(container, "Map");
  expect(control<HTMLSelectElement>(container, "Environment").value).toBe("chemical");
  expect(control<HTMLSelectElement>(container, "Cell colors").value).toBe("3");
  expect(control<HTMLInputElement>(container, "Population regions").checked).toBe(false);
  expect(button(container, "Light").getAttribute("aria-pressed")).toBe("false");
  expect(button(container, "Stress").getAttribute("aria-pressed")).toBe("false");
  expect(button(container, "Resistance").getAttribute("aria-pressed")).toBe("true");
}
async function checkLineage(container: HTMLElement) {
  await click(container, "Lineage");
  container.querySelector<HTMLElement>("dialog[open] .window-content")!.scrollTop = 400;
  expect(
    container.querySelector('[aria-label="Family population shares over time"]')
  ).not.toBeNull();
  expect(
    container.querySelector('[aria-label="Founder population shares over time"]')
  ).not.toBeNull();
  await click(container, "Founder 1");
  expect(container.querySelector("dialog[open] .window-content")?.scrollTop).toBe(0);
  expect(container.querySelector("dialog[open] h2")?.textContent).toBe("Cell");
  expect(container.textContent).toContain("Funded body and inherited genes");
  expect(container.textContent).toContain("Photoreceptor: level");
  expect(container.textContent).toContain("Light left − right");
  expect(container.textContent).toContain("Built photoreceptor capacity");
  expect(container.textContent).toContain("Family and ancestry");
  expect(container.querySelector('.genealogy-tree [aria-current="true"]')?.textContent).toContain(
    "Cell 1"
  );
}
async function checkSettings(container: HTMLElement) {
  await click(container, "Settings");
  const seed = control<HTMLInputElement>(container, "Seed");
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(seed, "81");
    seed.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
  expect(container.querySelector("dialog[open]")).toBeNull();
  expect(document.activeElement).toBe(button(container, "Settings"));
  await click(container, "Chemistry");
  await click(container, "Settings");
  expect(control<HTMLInputElement>(container, "Seed").value).toBe("81");
  await click(container, "Close Esc");
}

function workerFixture(session: Session, sent: Request[], canvases: HTMLCanvasElement[]) {
  const workers: WorkerFixture[] = [];
  const restore = stubCanvas(canvases);
  class WorkerFixture {
    constructor() {
      workers.push(this);
    }
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
        if (request.op === "chemicalWeb") session.setChemicalWeb(request.payload);
        if (request.op === "phenotype") session.setPhenotype(request.payload);
        if (
          ["initialize", "running", "inspect", "step", "chemicalWeb", "phenotype"].includes(
            request.op
          )
        ) {
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
        this.emit({
          kind: "reply",
          id: request.id,
          ok: true,
          value: request.op === "recoveries" ? [] : undefined,
        });
      });
    }
    terminate() {
      this.terminated = true;
    }
  }
  vi.stubGlobal("Worker", WorkerFixture);
  vi.stubGlobal("ResizeObserver", ResizeFixture);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

  return Object.assign(restore, {
    fail: () => workers.at(-1)!.emit({ kind: "fault", value: "Fixture failure" }),
  });
}

function stubCanvas(canvases: HTMLCanvasElement[]) {
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
  return () => {
    if (descriptor)
      Object.defineProperty(HTMLCanvasElement.prototype, "transferControlToOffscreen", descriptor);
    else Reflect.deleteProperty(HTMLCanvasElement.prototype, "transferControlToOffscreen");
  };
}

class ResizeFixture {
  observe() {}
  disconnect() {}
}

async function checkPhenotypes(container: HTMLElement, session: Session) {
  await click(container, "Web");
  const mode = control<HTMLSelectElement>(container, "Routes");
  await act(async () => {
    mode.value = "primary";
    mode.dispatchEvent(new Event("change", { bubbles: true }));
  });
  const compare = container.querySelector<HTMLButtonElement>(
    ".web-route-table tbody tr td:last-child button"
  )!;
  await act(async () => compare.click());
  expect(session.status().phenotype!.selection.kind).toBe("role");
  expect(container.querySelector(".phenotype-panel")).not.toBeNull();
  await click(container, "Pin selected descendants");
  const pin = session.status().phenotype!.pin!;
  expect(pin.roots).toBe(session.status().phenotype!.groups[1].count);
  await click(container, "Highlight selected group");
  await click(container, "Phenotypes");
  expect(container.querySelector(".phenotype-panel")).toBeNull();
  expect(container.querySelector(".group-highlight")).not.toBeNull();
  await click(container, "Clear highlight");
  await click(container, "Phenotypes");
  await click(container, "Pinned descendants");
  expect(container.querySelector(".phenotype-history")).not.toBeNull();
  await click(container, "Remove pin");
  expect(session.observation.pin).toBeNull();
  await click(container, "Map");
  expect(control<HTMLSelectElement>(container, "Cell colors").value).toBe("15");
  expect(control<HTMLSelectElement>(container, "Environment").value).toBe("chemical");
}

async function checkChemicalWeb(container: HTMLElement, session: Session) {
  await click(container, "Web");
  expect(session.status().chemicalWeb!.mode).toBe("measured");
  const modes = control<HTMLSelectElement>(container, "Routes");
  await act(async () => {
    modes.value = "primary";
    modes.dispatchEvent(new Event("change", { bubbles: true }));
  });
  const current = session.status().chemicalWeb!;
  expect(current.rows.reduce((sum, row) => sum + row.primary, current.unassigned)).toBe(48);
  expect(container.querySelectorAll(".web-route-table tbody tr")).toHaveLength(current.rows.length);
  expect(container.querySelectorAll(".web-edge path")).toHaveLength(current.rows.length);
  await click(container, "Enzyme input");
  expect(button(container, "Enzyme input").getAttribute("aria-pressed")).toBe("true");
  await click(container, "Enzyme output");
  await act(async () => {
    modes.value = "supported";
    modes.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(session.status().chemicalWeb!.mode).toBe("supported");
  expect(container.textContent).toContain("Counts overlap");
  await act(async () => {
    modes.value = "environment";
    modes.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(container.textContent).toContain("not measured flow");
  expect(container.querySelectorAll(".web-edge.environmental")).toHaveLength(64);
  await click(container, "Next routes");
  expect(session.status().chemicalWeb!.offset).toBe(64);
  const node = container.querySelector<SVGGElement>(".web-node")!;
  await act(async () =>
    node.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))
  );
  expect(session.status().chemicalWeb!.focus).not.toBeNull();
  await click(container, "Show chemical on map");
  await click(container, "Map");
  expect(session.status().chemicalWeb).toBeNull();
  expect(control<HTMLSelectElement>(container, "Cell colors").value).toBe("15");
  expect(control<HTMLSelectElement>(container, "Environment").value).toBe("chemical");
  expect(control<HTMLInputElement>(container, "Population regions").checked).toBe(false);
}
