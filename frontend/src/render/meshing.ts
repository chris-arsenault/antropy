import { CHUNK_SIZE } from "../sim/chunks";
import { getVoxel, getVoxelSafe, type VoxelGrid } from "../sim/grid";
import { isSolid, type MaterialId } from "../sim/materials";
import { MATERIAL_COLORS } from "./palette";

export interface ChunkGeometry {
  positions: Float32Array;
  normals: Float32Array;
  colors: Float32Array;
  /** Number of vertices (positions.length / 3). */
  vertexCount: number;
}

interface FaceSpec {
  normal: readonly [number, number, number];
  /** Four corners, counter-clockwise seen from outside, as voxel-corner offsets. */
  corners: readonly (readonly [number, number, number])[];
}

const FACES: readonly FaceSpec[] = [
  {
    normal: [1, 0, 0],
    corners: [
      [1, 0, 0],
      [1, 1, 0],
      [1, 1, 1],
      [1, 0, 1],
    ],
  },
  {
    normal: [-1, 0, 0],
    corners: [
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
      [0, 0, 0],
    ],
  },
  {
    normal: [0, 1, 0],
    corners: [
      [0, 1, 0],
      [0, 1, 1],
      [1, 1, 1],
      [1, 1, 0],
    ],
  },
  {
    normal: [0, -1, 0],
    corners: [
      [0, 0, 1],
      [0, 0, 0],
      [1, 0, 0],
      [1, 0, 1],
    ],
  },
  {
    normal: [0, 0, 1],
    corners: [
      [1, 0, 1],
      [1, 1, 1],
      [0, 1, 1],
      [0, 0, 1],
    ],
  },
  {
    normal: [0, 0, -1],
    corners: [
      [0, 0, 0],
      [0, 1, 0],
      [1, 1, 0],
      [1, 0, 0],
    ],
  },
];

/** Two triangles per quad, indices into the 4-corner list. */
const QUAD_ORDER = [0, 1, 2, 0, 2, 3] as const;

function emitFace(
  out: number[],
  normals: number[],
  colors: number[],
  x: number,
  y: number,
  z: number,
  face: FaceSpec,
  color: readonly [number, number, number]
): void {
  for (const cornerIndex of QUAD_ORDER) {
    const corner = face.corners[cornerIndex];
    out.push(x + corner[0], y + corner[1], z + corner[2]);
    normals.push(face.normal[0], face.normal[1], face.normal[2]);
    colors.push(color[0], color[1], color[2]);
  }
}

function emitVoxel(
  grid: VoxelGrid,
  positions: number[],
  normals: number[],
  colors: number[],
  x: number,
  y: number,
  z: number
): void {
  const material = getVoxel(grid, x, y, z) as MaterialId;
  if (!isSolid(material)) {
    return;
  }
  const color = MATERIAL_COLORS[material];
  for (const face of FACES) {
    const neighbor = getVoxelSafe(grid, x + face.normal[0], y + face.normal[1], z + face.normal[2]);
    if (!isSolid(neighbor)) {
      emitFace(positions, normals, colors, x, y, z, face, color);
    }
  }
}

/**
 * Culled-face geometry for one 16-cubed chunk. Neighbor reads span chunk
 * borders via the whole grid, so faces between chunks are culled correctly.
 * Pure: no three.js — the renderer wraps the arrays into a BufferGeometry.
 */
export function buildChunkGeometry(
  grid: VoxelGrid,
  cx: number,
  cy: number,
  cz: number
): ChunkGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];

  const x0 = cx * CHUNK_SIZE;
  const y0 = cy * CHUNK_SIZE;
  const z0 = cz * CHUNK_SIZE;
  const x1 = Math.min(x0 + CHUNK_SIZE, grid.sizeX);
  const y1 = Math.min(y0 + CHUNK_SIZE, grid.sizeY);
  const z1 = Math.min(z0 + CHUNK_SIZE, grid.sizeZ);

  for (let y = y0; y < y1; y++) {
    for (let z = z0; z < z1; z++) {
      for (let x = x0; x < x1; x++) {
        emitVoxel(grid, positions, normals, colors, x, y, z);
      }
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    colors: new Float32Array(colors),
    vertexCount: positions.length / 3,
  };
}
