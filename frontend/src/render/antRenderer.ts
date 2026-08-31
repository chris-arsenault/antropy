import * as THREE from "three";
import { type Ant } from "../sim/ant";
import { type World } from "../sim/world";

const INITIAL_CAPACITY = 256;

export interface AntRenderer {
  /** Update instance transforms and lineage colors at the interpolation factor. */
  update(world: World, alpha: number): void;
  /** The ant behind an instanceId from a raycast hit, if any. */
  antAt(instanceId: number): Ant | null;
  mesh(): THREE.Object3D;
  dispose(): void;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Stable per-patriline color via golden-angle hue spacing (spec §11.4). */
export function patrilineColor(patrilineId: number, out: THREE.Color): THREE.Color {
  const hue = ((patrilineId * 137.508) % 360) / 360;
  return out.setHSL(hue, 0.65, 0.55);
}

export function createAntRenderer(scene: THREE.Scene): AntRenderer {
  const geometry = new THREE.BoxGeometry(0.8, 0.5, 0.8);
  const material = new THREE.MeshLambertMaterial({ color: 0xffffff });
  let capacity = INITIAL_CAPACITY;
  let mesh = new THREE.InstancedMesh(geometry, material, capacity);
  scene.add(mesh);

  const matrix = new THREE.Matrix4();
  const color = new THREE.Color();
  let drawn: Ant[] = [];

  const grow = (needed: number) => {
    while (capacity < needed) {
      capacity *= 2;
    }
    scene.remove(mesh);
    mesh.dispose();
    mesh = new THREE.InstancedMesh(geometry, material, capacity);
    scene.add(mesh);
  };

  return {
    update(world, alpha) {
      const alive = world.ants.filter((ant) => ant.alive);
      if (alive.length > capacity) {
        grow(alive.length);
      }
      for (let i = 0; i < alive.length; i++) {
        const ant = alive[i];
        matrix.makeRotationY(-ant.heading);
        matrix.scale(new THREE.Vector3(ant.bodyScale, ant.bodyScale, ant.bodyScale));
        matrix.setPosition(
          lerp(ant.prevX, ant.x, alpha) + 0.5,
          lerp(ant.prevY, ant.y, alpha) + 0.25,
          lerp(ant.prevZ, ant.z, alpha) + 0.5
        );
        mesh.setMatrixAt(i, matrix);
        mesh.setColorAt(i, patrilineColor(ant.patrilineId, color));
      }
      mesh.count = alive.length;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) {
        mesh.instanceColor.needsUpdate = true;
      }
      drawn = alive;
    },
    antAt(instanceId) {
      return drawn[instanceId] ?? null;
    },
    mesh() {
      return mesh;
    },
    dispose() {
      scene.remove(mesh);
      mesh.dispose();
      geometry.dispose();
      material.dispose();
    },
  };
}
