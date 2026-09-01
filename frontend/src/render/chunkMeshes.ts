import * as THREE from "three";
import { chunkCount, chunkKey } from "../sim/chunks";
import { surfaceHeight } from "../sim/terrain";
import { type World } from "../sim/world";
import { buildChunkGeometries, type ChunkGeometry } from "./meshing";

export interface ChunkMeshes {
  /** Rebuild meshes for chunks in the world's dirty feed, then clear it. */
  updateDirty(): void;
  /**
   * Surface-skin opacity: 1 renders solid ground; below 1 the skin goes
   * x-ray (depth writes off). Subsurface tunnel walls always render at full
   * opacity so tunnel networks stay legible.
   */
  setOpacity(opacity: number): void;
  dispose(): void;
}

interface ChunkPair {
  surface: THREE.Mesh | null;
  tunnel: THREE.Mesh | null;
}

function toBufferGeometry(chunk: ChunkGeometry): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(chunk.positions, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(chunk.normals, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(chunk.colors, 3));
  return geometry;
}

/** The initial terrain surface per column — the tunnel/skin classifier. */
function buildSurfaceMap(world: World): Int16Array {
  const map = new Int16Array(world.grid.sizeX * world.grid.sizeZ);
  for (let z = 0; z < world.grid.sizeZ; z++) {
    for (let x = 0; x < world.grid.sizeX; x++) {
      map[z * world.grid.sizeX + x] = surfaceHeight(world.seed, x, z);
    }
  }
  return map;
}

/** Terrain chunk meshes: full build at creation, dirty-chunk rebuild after. */
export function createChunkMeshes(scene: THREE.Scene, world: World): ChunkMeshes {
  const surfaceMaterial = new THREE.MeshLambertMaterial({ vertexColors: true });
  const tunnelMaterial = new THREE.MeshLambertMaterial({ vertexColors: true });
  const surfaceMap = buildSurfaceMap(world);
  const meshes = new Map<number, ChunkPair>();
  const keyToCoord = new Map<number, [number, number, number]>();

  const replaceMesh = (
    existing: THREE.Mesh | null,
    chunk: ChunkGeometry,
    material: THREE.Material
  ): THREE.Mesh | null => {
    if (existing) {
      scene.remove(existing);
      existing.geometry.dispose();
    }
    if (chunk.vertexCount === 0) {
      return null;
    }
    const mesh = new THREE.Mesh(toBufferGeometry(chunk), material);
    scene.add(mesh);
    return mesh;
  };

  const rebuildChunk = (cx: number, cy: number, cz: number) => {
    const key = chunkKey(cx, cy, cz);
    const pair = meshes.get(key) ?? { surface: null, tunnel: null };
    const built = buildChunkGeometries(world.grid, surfaceMap, cx, cy, cz);
    pair.surface = replaceMesh(pair.surface, built.surface, surfaceMaterial);
    pair.tunnel = replaceMesh(pair.tunnel, built.tunnel, tunnelMaterial);
    meshes.set(key, pair);
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
    setOpacity(opacity: number) {
      surfaceMaterial.opacity = opacity;
      surfaceMaterial.transparent = opacity < 1;
      surfaceMaterial.depthWrite = opacity >= 1;
      surfaceMaterial.needsUpdate = true;
    },
    dispose() {
      for (const pair of meshes.values()) {
        for (const mesh of [pair.surface, pair.tunnel]) {
          if (mesh) {
            scene.remove(mesh);
            mesh.geometry.dispose();
          }
        }
      }
      surfaceMaterial.dispose();
      tunnelMaterial.dispose();
    },
  };
}
