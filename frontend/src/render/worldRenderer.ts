import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { type World } from "../sim/world";
import { createAntRenderer } from "./antRenderer";
import { createChunkMeshes } from "./chunkMeshes";

export interface WorldRenderer {
  /** Rebuild meshes for chunks in the world's dirty feed, then clear it. */
  updateDirtyChunks(): void;
  /** Draw one frame. Alpha is the fixed-timestep interpolation factor (M3). */
  render(alpha: number): void;
  /** Ant id under normalized device coordinates, or null. */
  pickAnt(ndcX: number, ndcY: number): number | null;
  /** Ground opacity: 1 = solid, below 1 = x-ray view of tunnel networks. */
  setTerrainOpacity(opacity: number): void;
  resize(width: number, height: number): void;
  dispose(): void;
}

function addLights(scene: THREE.Scene): void {
  const sun = new THREE.DirectionalLight(0xfff4e0, 2.2);
  sun.position.set(80, 140, 60);
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0x8899bb, 0.9));
}

export function createWorldRenderer(canvas: HTMLCanvasElement, world: World): WorldRenderer {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x14100c);
  addLights(scene);

  const { sizeX, sizeY, sizeZ } = world.grid;
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 1500);
  camera.position.set(sizeX * 1.1, sizeY * 1.8, sizeZ * 1.1);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(sizeX / 2, sizeY * 0.6, sizeZ / 2);
  controls.update();

  const chunks = createChunkMeshes(scene, world);
  const ants = createAntRenderer(scene);
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  return {
    updateDirtyChunks() {
      chunks.updateDirty();
    },
    render(alpha: number) {
      ants.update(world, alpha);
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
    resize(width: number, height: number) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    },
    dispose() {
      ants.dispose();
      controls.dispose();
      chunks.dispose();
      renderer.dispose();
    },
  };
}
