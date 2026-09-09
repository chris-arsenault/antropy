import { useCallback, useEffect, useRef, useState } from "react";
import { type World } from "../sim/types";
import { drawWorld, resize } from "./worldDrawing";
import { useCamera } from "./useCamera";
import { colonyBounds, fitCamera, viewTransform } from "./camera";
import { MiniMap } from "./MiniMap";
import { ConstructionPanel } from "./ConstructionPanel";
import { isKnowledgeScenario } from "../sim/colony/contract";
import { type Point } from "../sim/geometry";

import { type LayerVisibility } from "./layerVisibility";
export type { LayerVisibility } from "./layerVisibility";

export function WorldView(props: {
  readonly world: World;
  readonly version: number;
  readonly layers: LayerVisibility;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [point, setPoint] = useState<Point>(props.world.nest.home);
  const [edits, setEdits] = useState(0);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const camera = useCamera(canvas, props.world, size);
  const center = useCallback(
    (x: number, y: number) => camera.set({ ...camera.value, x, y }),
    [camera]
  );
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const update = () =>
      setSize({ width: element.clientWidth || 800, height: element.clientHeight || 600 });
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    resize(element);
    const context = element.getContext("2d");
    if (!context) return;
    drawWorld(
      context,
      props.world,
      viewTransform(camera.value, size.width, size.height, window.devicePixelRatio || 1),
      props.layers
    );
  }, [props.world, props.version, props.layers, camera.value, size, edits]);
  const changed = useCallback(() => setEdits((value) => value + 1), []);
  return (
    <section className="world-viewport" aria-label="Map viewport">
      <canvas
        className="world-view"
        ref={canvas}
        tabIndex={0}
        aria-label="Two-dimensional simulation"
        onPointerDown={(event) => {
          if (!event.shiftKey) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          setPoint({
            x: Math.floor(
              camera.value.x + (event.clientX - bounds.left - bounds.width / 2) / camera.value.scale
            ),
            y: Math.floor(
              camera.value.y - (event.clientY - bounds.top - bounds.height / 2) / camera.value.scale
            ),
          });
        }}
      />
      <CameraControls world={props.world} camera={camera} size={size} />
      <MiniMap world={props.world} camera={camera.value} size={size} onCenter={center} />
      {isKnowledgeScenario(props.world.scenario) && (
        <ConstructionPanel world={props.world} point={point} onChange={changed} />
      )}
    </section>
  );
}

function CameraControls({
  world,
  camera,
  size,
}: {
  readonly world: World;
  readonly camera: ReturnType<typeof useCamera>;
  readonly size: { width: number; height: number };
}) {
  const fit = (surroundings: boolean) =>
    camera.set(fitCamera(colonyBounds(world, surroundings), size.width, size.height));
  return (
    <div className="camera-controls">
      <button onClick={() => fit(true)}>Home</button>
      <button onClick={() => fit(false)}>Fit colony</button>
      <button
        onClick={() =>
          camera.set(
            fitCamera(
              { x: 0, y: 0, width: world.grid.width, height: world.grid.height },
              size.width,
              size.height
            )
          )
        }
      >
        Fit world
      </button>
      <span>Drag to pan · wheel to zoom · arrows to scroll</span>
    </div>
  );
}
