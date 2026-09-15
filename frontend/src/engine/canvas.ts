import { type Bridge } from "./bridge";
import {
  constrainCamera,
  scaleFor,
  worldPoint,
  panBy,
  zoomAt,
  type Camera,
  type Bounds,
} from "./camera";
import { type ViewOptions } from "./renderer";

export interface CanvasState {
  bounds: Bounds;
  camera: Camera;
  layers: boolean[];
  species: number;
  color: number;
  regions: boolean;
  sources: boolean;
  exposure: number;
}
export interface CanvasControls {
  read(): CanvasState;
  camera(value: Camera): void;
  error(error: unknown): void;
}
/** Each mount owns a fresh canvas: React effect replay cannot transfer one canvas twice. */
export function mountCanvas(host: HTMLDivElement, bridge: Bridge, controls: CanvasControls) {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-label", "Top-down bacterial population");
  canvas.tabIndex = 0;
  const ruler = document.createElement("div");
  ruler.className = "world-scale";
  host.append(canvas, ruler);
  let drag: { x: number; y: number; distance: number } | null = null;
  const bounds = () => ({ width: canvas.clientWidth, height: canvas.clientHeight });
  const point = (event: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };
  const update = () => {
    updateView(canvas, bridge, controls);
    updateRuler(ruler, bounds(), controls.read());
  };
  function wheel(event: WheelEvent) {
    event.preventDefault();
    const s = controls.read();
    const amount = event.deltaY * (event.deltaMode === 1 ? 16 : 1);
    controls.camera(zoomAt(s.bounds, s.camera, bounds(), point(event), Math.exp(-amount * 0.001)));
  }
  function down(event: PointerEvent) {
    if (event.button !== 0) return;
    drag = { x: event.clientX, y: event.clientY, distance: 0 };
    canvas.setPointerCapture(event.pointerId);
  }
  function move(event: PointerEvent) {
    if (!drag) return;
    const dx = event.clientX - drag.x,
      dy = event.clientY - drag.y,
      s = controls.read();
    drag.distance += Math.hypot(dx, dy);
    drag.x = event.clientX;
    drag.y = event.clientY;
    controls.camera(panBy(s.bounds, s.camera, bounds(), dx, dy));
  }
  function up(event: PointerEvent) {
    if (drag && drag.distance < 4) {
      const s = controls.read(),
        view = bounds(),
        p = worldPoint(s.bounds, s.camera, view, point(event));
      if (p.x >= 0 && p.y >= 0 && p.x < s.bounds.width && p.y < s.bounds.height)
        bridge
          .call("pick", {
            ...p,
            padding: Math.min(10, 4 / scaleFor(s.bounds, view, s.camera.zoom)),
          })
          .catch(controls.error);
    }
    drag = null;
  }
  canvas.addEventListener("wheel", wheel, { passive: false });
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", () => {
    drag = null;
  });
  const resize = new ResizeObserver(update);
  resize.observe(canvas);
  startWorker(canvas, bridge, controls.error);
  return {
    update,
    dispose() {
      resize.disconnect();
      bridge.stop();
      canvas.remove();
      ruler.remove();
    },
  };
}
function updateRuler(ruler: HTMLDivElement, view: Bounds, state: CanvasState) {
  const scale = scaleFor(state.bounds, view, state.camera.zoom);
  const ideal = 80 / scale,
    base = 10 ** Math.floor(Math.log10(ideal));
  let factor = ideal / base >= 2 ? 2 : 1;
  if (ideal / base >= 5) factor = 5;
  const units = base * factor;
  ruler.style.width = `${units * scale}px`;
  ruler.textContent = `${Number(units.toPrecision(2))} world units`;
}

function updateView(canvas: HTMLCanvasElement, bridge: Bridge, controls: CanvasControls) {
  const s = controls.read(),
    view = { width: canvas.clientWidth, height: canvas.clientHeight },
    ratio = window.devicePixelRatio || 1;
  const c = constrainCamera(s.bounds, s.camera, view);
  const options: ViewOptions = {
    width: Math.max(1, Math.round(view.width * ratio)),
    height: Math.max(1, Math.round(view.height * ratio)),
    camera: { x: c.x, y: c.y, scale: scaleFor(s.bounds, view, c.zoom) * ratio },
    field: 5,
    species: s.species,
    color: s.color,
    selected: -1,
    exposure: s.exposure,
    layers: s.layers,
    regions: s.regions,
    sources: s.sources,
  };
  bridge.view(options);
}

function startWorker(canvas: HTMLCanvasElement, bridge: Bridge, error: (e: unknown) => void) {
  try {
    bridge.start(
      canvas.transferControlToOffscreen(),
      new URL("antropy-engine.wasm", document.baseURI).href
    );
  } catch (failure) {
    error(failure);
  }
}
