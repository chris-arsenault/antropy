import { useEffect, useMemo, useState, useRef, type RefObject } from "react";
import { type World } from "../sim/types";
import { clampCamera, colonyBounds, fitCamera, panCamera, zoomCamera, type Camera } from "./camera";

export function useCamera(
  ref: RefObject<HTMLCanvasElement | null>,
  world: World,
  size: { width: number; height: number }
) {
  const drag = useRef<{ x: number; y: number } | null>(null);
  const [chosen, setChosen] = useState<Camera | null>(null);
  const value = useMemo(
    () => chosen ?? fitCamera(colonyBounds(world), size.width, size.height),
    [chosen, world, size]
  );
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const set = (next: Camera) => setChosen(clampCamera(next, world));
    const down = (event: PointerEvent) => {
      if (event.button !== 0 || event.shiftKey) return;
      drag.current = { x: event.clientX, y: event.clientY };
      canvas.setPointerCapture(event.pointerId);
      canvas.focus();
    };
    const move = (event: PointerEvent) => {
      if (!drag.current) return;
      const dx = event.clientX - drag.current.x,
        dy = event.clientY - drag.current.y;
      drag.current = { x: event.clientX, y: event.clientY };
      setChosen((previous) => clampCamera(panCamera(previous ?? value, dx, dy), world));
    };
    const up = () => {
      drag.current = null;
    };
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      if (event.deltaX !== 0 && !event.ctrlKey) set(panCamera(value, -event.deltaX, -event.deltaY));
      else
        set(
          zoomCamera(
            value,
            Math.exp(-event.deltaY * 0.002),
            event.clientX - rect.left - rect.width / 2,
            event.clientY - rect.top - rect.height / 2
          )
        );
    };
    const key = (event: KeyboardEvent) => {
      const offsets: Record<string, readonly [number, number]> = {
        ArrowLeft: [60, 0],
        ArrowRight: [-60, 0],
        ArrowUp: [0, 60],
        ArrowDown: [0, -60],
      };
      const offset = offsets[event.key];
      if (!offset) return;
      event.preventDefault();
      set(panCamera(value, ...offset));
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("wheel", wheel, { passive: false });
    canvas.addEventListener("keydown", key);
    return () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      canvas.removeEventListener("wheel", wheel);
      canvas.removeEventListener("keydown", key);
    };
  }, [ref, world, value]);
  return { value, set: setChosen };
}
