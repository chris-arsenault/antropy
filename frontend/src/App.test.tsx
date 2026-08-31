import { describe, expect, it } from "vitest";
import { StrictMode, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { App } from "./App";

async function renderApp(): Promise<{ container: HTMLElement; root: Root }> {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  });
  return { container, root };
}

async function cleanup(container: HTMLElement, root: Root): Promise<void> {
  await act(async () => {
    root.unmount();
  });
  container.remove();
}

describe("App", () => {
  it("renders the shell with tick counter and speed controls", async () => {
    const { container, root } = await renderApp();

    expect(container.querySelector("h1")?.textContent).toBe("Antropy");
    expect(container.querySelector('[data-testid="tick"]')?.textContent).toBe("0");
    expect(container.querySelector("select")).not.toBeNull();
    expect(container.querySelector("button")?.textContent).toBe("Run");

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
