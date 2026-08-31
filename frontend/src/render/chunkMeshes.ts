import * as THREE from "three";
import { chunkCount, chunkKey } from "../sim/chunks";
import { type World } from "../sim/world";
import { buildChunkGeometry, type ChunkGeometry } from "./meshing";

export interface ChunkMeshes {
  /** Rebuild meshes for chunks in the world's dirty feed, then clear it. */
  updateDirty(): void;
  dispose(): void;
}

function toBufferGeometry(chunk: ChunkGeometry): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(chunk.positions, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(chunk.normals, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(chunk.colors, 3));
  return geometry;
}

/** Terrain chunk meshes: full build at creation, dirty-chunk rebuild after. */
export function createChunkMeshes(scene: THREE.Scene, world: World): ChunkMeshes {
  const material = new THREE.MeshLambertMaterial({ vertexColors: true });
  const meshes = new Map<number, THREE.Mesh>();
  const keyToCoord = new Map<number, [number, number, number]>();

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
  for (let cx = 0; cx < counts.cx; cx++) {
    for (let cy = 0; cy < counts.cy; cy++) {
      for (let cz = 0; cz < counts.cz; cz++) {
        keyToCoord.set(chunkKey(cx, cy, cz), [cx, cy, cz]);
        rebuildChunk(cx, cy, cz);
      }
    }
  }

  return {
    updateDirty() {
      for (const key of world.dirtyChunks) {
        const coord = keyToCoord.get(key);
        if (coord) {
          rebuildChunk(coord[0], coord[1], coord[2]);
        }
      }
      world.dirtyChunks.clear();
    },
    dispose() {
      for (const mesh of meshes.values()) {
        scene.remove(mesh);
        mesh.geometry.dispose();
      }
      material.dispose();
    },
  };
}
