import {
  useEffect,
  useRef,
  useState,
  type RefObject,
  type Dispatch,
  type SetStateAction,
} from "react";
import { type World } from "../sim/types";
import { distance, wrap } from "../sim/geometry";
import { createRenderer, transform, type Layers, type Camera } from "./drawing";

interface ViewProps {
  world: World;
  version: number;
  selected: number | null;
  onSelect: (id: number | null) => void;
}
interface CanvasProps extends ViewProps {
  camera: Camera;
  layers: Layers;
  setCamera: Dispatch<SetStateAction<Camera>>;
}
function useDrawing(canvas: RefObject<HTMLCanvasElement | null>, props: CanvasProps) {
  const { world, version, camera, layers, selected } = props;
  const render = useRef<(() => void) | null>(null);
  const renderer = useRef<ReturnType<typeof createRenderer> | null>(null);
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    renderer.current ??= createRenderer(el);
    render.current = () => {
      resizeCanvas(el);
      renderer.current?.render(world, camera, layers, selected);
    };
    render.current();
  }, [canvas, world, version, camera, layers, selected]);
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const observer = new ResizeObserver(() => render.current?.());
    observer.observe(el);
    return () => {
      observer.disconnect();
      renderer.current = null;
    };
  }, [canvas]);
}
function resizeCanvas(el: HTMLCanvasElement): void {
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.round(el.clientWidth * ratio));
  const height = Math.max(1, Math.round(el.clientHeight * ratio));
  if (el.width !== width) el.setAttribute("width", String(width));
  if (el.height !== height) el.setAttribute("height", String(height));
}
function useWheel(
  canvas: RefObject<HTMLCanvasElement | null>,
  setCamera: CanvasProps["setCamera"]
) {
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      setCamera((c) => ({
        ...c,
        zoom: Math.max(0.5, Math.min(8, c.zoom * Math.exp(-event.deltaY * 0.001))),
      }));
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, [canvas, setCamera]);
}
function selectCell(el: HTMLCanvasElement, props: CanvasProps, x: number, y: number) {
  const { world, camera } = props,
    t = transform(world, camera, el.clientWidth, el.clientHeight),
    rect = el.getBoundingClientRect();
  const p = { x: (x - rect.left - t.left) / t.scale, y: (y - rect.top - t.top) / t.scale };
  const nearest = [...world.cells].sort(
    (a, b) => distance(a, p, world.config) - distance(b, p, world.config)
  )[0];
  props.onSelect(nearest && distance(nearest, p, world.config) < 2 ? nearest.id : null);
}
function WorldCanvas(props: CanvasProps) {
  const canvas = useRef<HTMLCanvasElement>(null),
    drag = useRef<{ x: number; y: number; distance: number } | null>(null);
  useDrawing(canvas, props);
  useWheel(canvas, props.setCamera);
  return (
    <canvas
      ref={canvas}
      aria-label="Top-down bacterial population"
      onPointerDown={(e) => {
        drag.current = { x: e.clientX, y: e.clientY, distance: 0 };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d) return;
        const scale = transform(
          props.world,
          props.camera,
          e.currentTarget.clientWidth,
          e.currentTarget.clientHeight
        ).scale;
        const dx = e.clientX - d.x,
          dy = e.clientY - d.y;
        d.distance += Math.hypot(dx, dy);
        d.x = e.clientX;
        d.y = e.clientY;
        props.setCamera((c) => ({
          ...c,
          x: wrap(c.x - dx / scale, props.world.config.width),
          y: wrap(c.y - dy / scale, props.world.config.height),
        }));
      }}
      onPointerUp={(e) => {
        if (drag.current && drag.current.distance < 4)
          selectCell(e.currentTarget, props, e.clientX, e.clientY);
        drag.current = null;
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
    />
  );
}
export function WorldView(props: ViewProps) {
  const { world } = props;
  const [camera, setCamera] = useState<Camera>({
    x: world.config.width / 2,
    y: world.config.height / 2,
    zoom: 1,
  });
  const [layers, setLayers] = useState<Layers>({ nutrient: true, chemical: true });
  return (
    <section className="viewport">
      <div className="map-tools">
        <button
          onClick={() =>
            setCamera({ x: world.config.width / 2, y: world.config.height / 2, zoom: 1 })
          }
        >
          Fit world
        </button>
        <label>
          <input
            type="checkbox"
            checked={layers.nutrient}
            onChange={(e) => setLayers({ ...layers, nutrient: e.target.checked })}
          />{" "}
          Nutrient · green
        </label>
        <label>
          <input
            type="checkbox"
            checked={layers.chemical}
            onChange={(e) => setLayers({ ...layers, chemical: e.target.checked })}
          />{" "}
          Released chemical · magenta
        </label>
        <span>Drag to pan · wheel to zoom · click a cell to inspect</span>
      </div>
      <WorldCanvas {...props} camera={camera} setCamera={setCamera} layers={layers} />
    </section>
  );
}
