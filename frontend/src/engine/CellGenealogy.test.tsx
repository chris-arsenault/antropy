import { act } from "react";
import { createRoot } from "react-dom/client";
import { readFileSync } from "node:fs";
import { expect, it, vi } from "vitest";
import { Engine } from "./client";
import { type Bridge } from "./bridge";
import { type Inspection } from "./types";
import { CellGenealogy } from "./CellGenealogy";

it("navigates from a divided parent to a living daughter using restored parentage", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const engine = await Engine.load(new Uint8Array(readFileSync("public/antropy-engine.wasm")));
  const source = engine.diagnostic("nutrition");
  const initial = source.command<Inspection>("inspect", { cell: 1 });
  source.command("intervene", { cell: 1, body: initial.cell!.body.map((q) => q * 2), energy: 1 });
  source.step(16);
  const world = engine.restore(source.snapshot());
  const element = document.createElement("div"),
    root = createRoot(element),
    errors = vi.fn();
  const bridge = {
    call: async (op: string, payload: { cell: number }) => {
      const p = world.command<Inspection>(op, payload);
      root.render(
        <CellGenealogy inspection={p} bridge={bridge as unknown as Bridge} error={errors} />
      );
    },
  };
  try {
    await act(() => bridge.call("inspect", { cell: 1 }));
    expect(element.textContent).toContain("2 living descendants");
    expect(element.textContent).toContain("The parent divided");
    const child = Array.from(element.querySelectorAll("button")).find(
      (b) => b.textContent === "Cell 2 · alive"
    )!;
    expect(child).toBeDefined();
    await act(async () => child.click());
    expect(element.querySelector('[aria-current="true"]')?.textContent).toContain("Cell 2");
    expect(element.textContent).toContain("Generation 1");
    expect(element.textContent).toContain("Siblings · 1");
    expect(errors).not.toHaveBeenCalled();
  } finally {
    await act(() => root.unmount());
    world.dispose();
    source.dispose();
    vi.unstubAllGlobals();
  }
});
