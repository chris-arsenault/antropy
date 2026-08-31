import { describe, expect, it } from "vitest";
import { StrictMode, act } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

describe("App", () => {
  it("renders the application shell", async () => {
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

    expect(container.querySelector("h1")?.textContent).toBe("Antropy");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
