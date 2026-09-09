import { useEffect, useRef } from "react";
import { type World } from "../sim/types";
import { MATERIALS, Material } from "../sim/materials";
import { type Camera } from "./camera";

export function MiniMap(props: {
  world: World;
  camera: Camera;
  size: { width: number; height: number };
  onCenter(x: number, y: number): void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current,
      context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const { grid } = props.world;
    context.fillStyle = "#203342";
    context.fillRect(0, 0, canvas.width, canvas.height);
    for (let py = 0; py < canvas.height; py++)
      for (let px = 0; px < canvas.width; px++) {
        const x = Math.floor((px * grid.width) / canvas.width),
          y = grid.height - 1 - Math.floor((py * grid.height) / canvas.height);
        const material = grid.cells[y * grid.width + x] as Material;
        if (material === Material.AIR) continue;
        context.fillStyle = MATERIALS[material].color;
        context.fillRect(px, py, 1, 1);
      }
    context.fillStyle = "#f7bc70";
    context.fillRect(
      (props.world.queen.x / grid.width) * canvas.width - 2,
      (1 - props.world.queen.y / grid.height) * canvas.height - 2,
      4,
      4
    );
    const width = (props.size.width / props.camera.scale / grid.width) * canvas.width;
    const height = (props.size.height / props.camera.scale / grid.height) * canvas.height;
    context.strokeStyle = "#ffffff";
    context.strokeRect(
      (props.camera.x / grid.width) * canvas.width - width / 2,
      (1 - props.camera.y / grid.height) * canvas.height - height / 2,
      width,
      height
    );
  }, [props.world, props.world.grid.revision, props.camera, props.size]);
  return (
    <canvas
      ref={ref}
      className="minimap"
      width={240}
      height={90}
      aria-label="World overview"
      onPointerDown={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        props.onCenter(
          ((event.clientX - rect.left) / rect.width) * props.world.grid.width,
          (1 - (event.clientY - rect.top) / rect.height) * props.world.grid.height
        );
      }}
    />
  );
}
