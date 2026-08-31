import * as THREE from "three";
import { type World } from "../sim/world";

const ANT_COLOR = 0x2a1a10;
const INITIAL_CAPACITY = 256;

export interface AntRenderer {
  /** Update instance transforms at the given interpolation factor. */
  update(world: World, alpha: number): void;
  dispose(): void;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function createAntRenderer(scene: THREE.Scene): AntRenderer {
  const geometry = new THREE.BoxGeometry(0.8, 0.5, 0.8);
  const material = new THREE.MeshLambertMaterial({ color: ANT_COLOR });
  let capacity = INITIAL_CAPACITY;
  let mesh = new THREE.InstancedMesh(geometry, material, capacity);
  scene.add(mesh);

  const matrix = new THREE.Matrix4();

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
      }
      mesh.count = alive.length;
      mesh.instanceMatrix.needsUpdate = true;
    },
    dispose() {
      scene.remove(mesh);
      mesh.dispose();
      geometry.dispose();
      material.dispose();
    },
  };
}
