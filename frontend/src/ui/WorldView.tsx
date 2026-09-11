import {
  useEffect,
  useRef,
  useState,
  type RefObject,
  type Dispatch,
  type SetStateAction,
} from "react";
import { type World } from "../sim/types";
import { createRenderer, type Layers } from "./drawing";
import { fitCamera, panBy, zoomAt, pickCell, type Camera } from "./camera";
import { MapTools, MapLegend } from "./MapTools";
import { COLOR_MODES, DEFAULT_COLOR_MODE, type ColorMode } from "./populationColors";

interface ViewProps {
  world: World;
  version: number;
  selected: number | null;
  onSelect: (id: number | null) => void;
}
interface CanvasProps extends ViewProps {
  colorMode: ColorMode;
  camera: Camera;
  layers: Layers;
  setCamera: Dispatch<SetStateAction<Camera>>;
}
function useDrawing(canvas: RefObject<HTMLCanvasElement | null>, props: CanvasProps) {
  const { world, version, camera, layers, selected, colorMode } = props;
  const render = useRef<(() => void) | null>(null);
  const renderer = useRef<ReturnType<typeof createRenderer> | null>(null);
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    renderer.current ??= createRenderer(el);
    render.current = () => {
      resizeCanvas(el);
      renderer.current?.render(world, camera, layers, selected, colorMode);
    };
    render.current();
  }, [canvas, world, version, camera, layers, selected, colorMode]);
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
function useWheel(canvas: RefObject<HTMLCanvasElement | null>, props: CanvasProps) {
  const { world, setCamera } = props;
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = el.getBoundingClientRect();
      const amount = event.deltaY * (event.deltaMode === 1 ? 16 : 1);
      setCamera((c) =>
        zoomAt(
          world.config,
          c,
          { width: el.clientWidth, height: el.clientHeight },
          { x: event.clientX - rect.left, y: event.clientY - rect.top },
          Math.exp(-amount * 0.001)
        )
      );
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, [canvas, world, setCamera]);
}
function selectCell(el: HTMLCanvasElement, props: CanvasProps, x: number, y: number) {
  const rect = el.getBoundingClientRect();
  props.onSelect(
    pickCell(
      props.world,
      props.camera,
      { width: el.clientWidth, height: el.clientHeight },
      { x: x - rect.left, y: y - rect.top }
    )
  );
}
function WorldCanvas(props: CanvasProps) {
  const canvas = useRef<HTMLCanvasElement>(null),
    drag = useRef<{ x: number; y: number; distance: number } | null>(null);
  useDrawing(canvas, props);
  useWheel(canvas, props);
  return (
    <canvas
      ref={canvas}
      aria-label="Top-down bacterial population"
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        drag.current = { x: e.clientX, y: e.clientY, distance: 0 };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d) return;
        const view = { width: e.currentTarget.clientWidth, height: e.currentTarget.clientHeight };
        const dx = e.clientX - d.x,
          dy = e.clientY - d.y;
        d.distance += Math.hypot(dx, dy);
        d.x = e.clientX;
        d.y = e.clientY;
        props.setCamera((c) => panBy(props.world.config, c, view, dx, dy));
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
  const [camera, setCamera] = useState<Camera>(fitCamera(world.config));
  const [colorMode, setColorMode] = useState<ColorMode>(DEFAULT_COLOR_MODE);
  const [layers, setLayers] = useState<Layers>({
    nutrient: true,
    chemical: world.config.secretionRate > 0,
    toxin: true,
    matrix: true,
  });
  return (
    <section className="viewport">
      <label className="population-color-control">
        Cell colors{" "}
        <select value={colorMode} onChange={(e) => setColorMode(e.target.value as ColorMode)}>
          {Object.entries(COLOR_MODES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      {["relatedness", "physical", "controller"].includes(colorMode) && props.selected === null && (
        <p>Select a cell on the map to compare with the living population.</p>
      )}
      <MapTools
        camera={camera}
        setCamera={setCamera}
        bounds={world.config}
        layers={layers}
        setLayers={setLayers}
      />
      <WorldCanvas
        {...props}
        camera={camera}
        setCamera={setCamera}
        layers={layers}
        colorMode={colorMode}
      />
      <MapLegend colorMode={colorMode} />
    </section>
  );
}
