import { type World } from "../sim/types";

export interface Camera {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
}
export interface ViewTransform {
  readonly scale: number;
  readonly left: number;
  readonly top: number;
  readonly startX: number;
  readonly startY: number;
  readonly width: number;
  readonly height: number;
}
export interface Bounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export function fitCamera(bounds: Bounds, width: number, height: number): Camera {
  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
    scale: Math.max(0.1, Math.min(width / bounds.width, height / bounds.height)),
  };
}

export function colonyBounds(world: World, surroundings = false): Bounds {
  const rooms = world.nest.chambers;
  const margin = surroundings ? 140 : 12;
  const left = Math.min(...rooms.map((room) => room.center.x - room.radius.x)) - margin;
  const bottom = Math.min(...rooms.map((room) => room.center.y - room.radius.y)) - 12;
  const right = Math.max(...rooms.map((room) => room.center.x + room.radius.x)) + margin;
  const top = world.nest.entrance.y + (surroundings ? 75 : 12);
  return { x: left, y: bottom, width: right - left, height: top - bottom };
}

export function viewTransform(
  camera: Camera,
  width: number,
  height: number,
  ratio = 1
): ViewTransform {
  return {
    scale: camera.scale * ratio,
    left: 0,
    top: 0,
    startX: camera.x - width / camera.scale / 2,
    startY: camera.y - height / camera.scale / 2,
    width: width / camera.scale,
    height: height / camera.scale,
  };
}

export function zoomCamera(camera: Camera, factor: number, dx: number, dy: number): Camera {
  const scale = Math.max(0.1, Math.min(24, camera.scale * factor));
  return {
    scale,
    x: camera.x + dx / camera.scale - dx / scale,
    y: camera.y - dy / camera.scale + dy / scale,
  };
}

export function panCamera(camera: Camera, dx: number, dy: number): Camera {
  return { ...camera, x: camera.x - dx / camera.scale, y: camera.y + dy / camera.scale };
}

export function clampCamera(camera: Camera, world: World): Camera {
  return {
    ...camera,
    x: Math.max(0, Math.min(world.grid.width, camera.x)),
    y: Math.max(0, Math.min(world.grid.height, camera.y)),
  };
}
