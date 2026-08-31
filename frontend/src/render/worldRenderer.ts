import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { chunkCount, chunkKey } from "../sim/chunks";
import { type World } from "../sim/world";
import { createAntRenderer } from "./antRenderer";
import { buildChunkGeometry, type ChunkGeometry } from "./meshing";

export interface WorldRenderer {
  /** Rebuild meshes for chunks in the world's dirty feed, then clear it. */
  updateDirtyChunks(): void;
  /** Draw one frame. Alpha is the fixed-timestep interpolation factor (M3). */
  render(alpha: number): void;
  resize(width: number, height: number): void;
  dispose(): void;
}

function toBufferGeometry(chunk: ChunkGeometry): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(chunk.positions, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(chunk.normals, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(chunk.colors, 3));
  return geometry;
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

  const material = new THREE.MeshLambertMaterial({ vertexColors: true });
  const meshes = new Map<number, THREE.Mesh>();

  const rebuildChunk = (cx: number, cy: number, cz: number) => {
    const key = chunkKey(cx, cy, cz);
    const existing = meshes.get(key);
    if (existing) {
      scene.remove(existing);
      existing.geometry.dispose();
      meshes.delete(key);
    }
    const chunk = buildChunkGeometry(world.grid, cx, cy, cz);
    if (chunk.vertexCount === 0) {
      return;
    }
    const mesh = new THREE.Mesh(toBufferGeometry(chunk), material);
    meshes.set(key, mesh);
    scene.add(mesh);
  };

  const counts = chunkCount(world.grid);
  const keyToCoord = new Map<number, [number, number, number]>();
  for (let cx = 0; cx < counts.cx; cx++) {
    for (let cy = 0; cy < counts.cy; cy++) {
      for (let cz = 0; cz < counts.cz; cz++) {
        keyToCoord.set(chunkKey(cx, cy, cz), [cx, cy, cz]);
        rebuildChunk(cx, cy, cz);
      }
    }
  }

  const ants = createAntRenderer(scene);

  return {
    updateDirtyChunks() {
      for (const key of world.dirtyChunks) {
        const coord = keyToCoord.get(key);
        if (coord) {
          rebuildChunk(coord[0], coord[1], coord[2]);
        }
      }
      world.dirtyChunks.clear();
    },
    render(alpha: number) {
      ants.update(world, alpha);
      controls.update();
      renderer.render(scene, camera);
    },
    resize(width: number, height: number) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    },
    dispose() {
      ants.dispose();
      controls.dispose();
      for (const mesh of meshes.values()) {
        mesh.geometry.dispose();
      }
      material.dispose();
      renderer.dispose();
    },
  };
}
