import { act, useRef } from "react";
import { createRoot } from "react-dom/client";
import { expect, it } from "vitest";
import { useCamera } from "./useCamera";
import { createWorld } from "../sim/world";
import { FORAGER_CONFIG } from "../sim/config";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

it("continues a drag across React renders without advancing the simulation", async () => {
  const world = createWorld(3, "programmed", FORAGER_CONFIG, false);
  const size = { width: 800, height: 600 };
  function CameraProbe() {
    const ref = useRef<HTMLCanvasElement>(null);
    const { value } = useCamera(ref, world, size);
    return (
      <>
        <canvas ref={ref} />
        <output data-x={value.x} data-scale={value.scale} />
      </>
    );
  }
  const container = document.createElement("div"),
    root = createRoot(container);
  document.body.appendChild(container);
  await act(async () => root.render(<CameraProbe />));
  const canvas = container.querySelector("canvas")!;
  Object.defineProperty(canvas, "setPointerCapture", { value: () => {} });
  const initial = Number(container.querySelector("output")!.dataset.x);
  const scale = Number(container.querySelector("output")!.dataset.scale);
  await act(async () =>
    canvas.dispatchEvent(new PointerEvent("pointerdown", { button: 0, clientX: 10, clientY: 10 }))
  );
  for (const clientX of [30, 50, 70])
    await act(async () =>
      canvas.dispatchEvent(new PointerEvent("pointermove", { clientX, clientY: 10 }))
    );
  expect(Number(container.querySelector("output")!.dataset.x)).toBeCloseTo(initial - 60 / scale);
  expect(world.tick).toBe(0);
  await act(async () => root.unmount());
  container.remove();
});
