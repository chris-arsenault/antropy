import * as THREE from "three";
import { STAGE_LARVA } from "../sim/eggs";
import { type World } from "../sim/world";

const INITIAL_CAPACITY = 64;

/**
 * Brood and queens made visible: eggs as small pale spheres, larvae as
 * larger cream grubs (hunger-tinted toward red as they starve), and each
 * living queen as an oversized amber ant-marker at her chamber. One
 * instanced sphere mesh carries all of it.
 */
export interface BroodRenderer {
  update(world: World): void;
  mesh(): THREE.Object3D;
  dispose(): void;
}

const EGG_COLOR = new THREE.Color(0xe8e2d0);
const LARVA_COLOR = new THREE.Color(0xf2e3b0);
const LARVA_STARVING = new THREE.Color(0xc26a4a);
const QUEEN_COLOR = new THREE.Color(0xe6a817);

export function createBroodRenderer(scene: THREE.Scene): BroodRenderer {
  const geometry = new THREE.SphereGeometry(0.5, 8, 6);
  const material = new THREE.MeshLambertMaterial({ color: 0xffffff });
  let capacity = INITIAL_CAPACITY;
  let mesh = new THREE.InstancedMesh(geometry, material, capacity);
  scene.add(mesh);

  const matrix = new THREE.Matrix4();
  const color = new THREE.Color();

  const grow = (needed: number) => {
    while (capacity < needed) {
      capacity *= 2;
    }
    scene.remove(mesh);
    mesh.dispose();
    mesh = new THREE.InstancedMesh(geometry, material, capacity);
    scene.add(mesh);
  };

  const setBroodInstance = (i: number, egg: World["eggs"][number]): void => {
    const larva = egg.stage === STAGE_LARVA;
    const size = larva ? 0.62 : 0.38;
    matrix.makeScale(size, larva ? size * 0.75 : size, size);
    matrix.setPosition(egg.x + 0.5, egg.y + 0.3, egg.z + 0.5);
    mesh.setMatrixAt(i, matrix);
    if (larva) {
      const hunger = Math.min(1, egg.hungerTicks / 400);
      mesh.setColorAt(i, color.copy(LARVA_COLOR).lerp(LARVA_STARVING, hunger));
    } else {
      mesh.setColorAt(i, EGG_COLOR);
    }
  };

  return {
    update(world) {
      const needed = world.eggs.length + world.colonies.length;
      if (needed > capacity) {
        grow(needed);
      }
      let i = 0;
      for (const egg of world.eggs) {
        setBroodInstance(i, egg);
        i += 1;
      }
      for (const colony of world.colonies) {
        matrix.makeScale(1.6, 1.0, 2.2);
        matrix.setPosition(colony.x + 0.5, colony.y + 0.4, colony.z + 0.5);
        mesh.setMatrixAt(i, matrix);
        mesh.setColorAt(i, QUEEN_COLOR);
        i += 1;
      }
      mesh.count = i;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) {
        mesh.instanceColor.needsUpdate = true;
      }
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
