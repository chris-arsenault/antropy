import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { type World } from "../sim/world";
import { createAntRenderer } from "./antRenderer";
import { createBroodRenderer } from "./broodRenderer";
import { createChunkMeshes } from "./chunkMeshes";
import { createScentRenderer, type ScentLayerKey } from "./scentRenderer";
import { createWeatherTint } from "./weatherTint";

export interface WorldRenderer {
  /** Rebuild meshes for chunks in the world's dirty feed, then clear it. */
  updateDirtyChunks(): void;
  /** Draw one frame. Alpha is the fixed-timestep interpolation factor (M3). */
  render(alpha: number): void;
  /** Ant id under normalized device coordinates, or null. */
  pickAnt(ndcX: number, ndcY: number): number | null;
  /** Ground opacity: 1 = solid, below 1 = x-ray view of tunnel networks. */
  setTerrainOpacity(opacity: number): void;
  /** Toggle a scent map layer. */
  setLayerVisible(layer: ScentLayerKey, visible: boolean): void;
  resize(width: number, height: number): void;
  dispose(): void;
}

function addLights(scene: THREE.Scene): THREE.DirectionalLight {
  const sun = new THREE.DirectionalLight(0xfff4e0, 2.2);
  sun.position.set(80, 140, 60);
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0x8899bb, 0.9));
  return sun;
}

function frameWorld(world: World): { position: THREE.Vector3; target: THREE.Vector3 } {
  const { sizeX, sizeY, sizeZ } = world.grid;
  const colony = world.colonies[0];
  if (!colony) {
    return {
      position: new THREE.Vector3(sizeX * 1.1, sizeY * 1.8, sizeZ * 1.1),
      target: new THREE.Vector3(sizeX / 2, sizeY * 0.6, sizeZ / 2),
    };
  }
  const surfaceY = world.surfaceMap[colony.z * sizeX + colony.x];
  const target = new THREE.Vector3(
    (colony.x + sizeX / 2) / 2,
    (colony.y + surfaceY) / 2,
    (colony.z + sizeZ / 2) / 2
  );
  const distance = Math.max(42, (surfaceY - colony.y) * 2);
  return {
    position: new THREE.Vector3(
      target.x + distance * 1.2,
      target.y + distance * 0.8,
      target.z + distance * 1.2
    ),
    target,
  };
}

export function createWorldRenderer(canvas: HTMLCanvasElement, world: World): WorldRenderer {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x14100c);
  const sun = addLights(scene);
  const weather = createWeatherTint(scene, sun);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 1500);
  const view = frameWorld(world);
  camera.position.copy(view.position);

  const controls = new OrbitControls(camera, canvas);
  controls.target.copy(view.target);
  controls.update();

  const chunks = createChunkMeshes(scene, world);
  const ants = createAntRenderer(scene);
  const brood = createBroodRenderer(scene);
  const scents = createScentRenderer(scene);
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  return {
    updateDirtyChunks() {
      chunks.updateDirty();
    },
    render(alpha: number) {
      ants.update(world, alpha);
      brood.update(world);
      scents.update(world);
      weather.update(world);
      controls.update();
      renderer.render(scene, camera);
    },
    pickAnt(ndcX: number, ndcY: number) {
      pointer.set(ndcX, ndcY);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObject(ants.mesh(), false);
      for (const hit of hits) {
        if (hit.instanceId !== undefined) {
          const ant = ants.antAt(hit.instanceId);
          if (ant) {
            return ant.id;
          }
        }
      }
      return null;
    },
    setTerrainOpacity(opacity: number) {
      chunks.setOpacity(opacity);
    },
    setLayerVisible(layer: ScentLayerKey, visible: boolean) {
      scents.setVisible(layer, visible);
    },
    resize(width: number, height: number) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    },
    dispose() {
      ants.dispose();
      brood.dispose();
      scents.dispose();
      controls.dispose();
      chunks.dispose();
      renderer.dispose();
    },
  };
}
