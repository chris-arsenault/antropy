/**
 * Single home for simulation constants (MVP-PLAN confirmed decisions).
 * Values are calibrated inside the phase that first exercises them.
 */

// World dimensions in voxels. Y is up, matching the renderer's axis.
export const WORLD_SIZE_X = 128;
export const WORLD_SIZE_Y = 64;
export const WORLD_SIZE_Z = 128;

// Terrain generation (M1).
export const TERRAIN = {
  /** Mean surface height. */
  surfaceBase: 40,
  /** fBm amplitude of the surface, in voxels. */
  surfaceAmplitude: 10,
  /** Horizontal feature scale: noise-space units per voxel. */
  surfaceScale: 1 / 48,
  /** Octaves for the surface heightmap. */
  surfaceOctaves: 4,
  /** Mean topsoil skin thickness below the surface. */
  topsoilDepth: 4,
  /** Warp amplitude on the topsoil/clay boundary. */
  topsoilWarp: 2,
  /** Mean clay band thickness below the topsoil. */
  clayDepth: 12,
  /** Warp amplitude on the clay/rock boundary. */
  clayWarp: 5,
  /** Boundary-warp feature scale. */
  warpScale: 1 / 24,
  /** Rows at the bottom that are always rock. */
  basementRows: 2,
} as const;
