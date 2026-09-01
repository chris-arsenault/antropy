import * as THREE from "three";
import { type ScentField } from "../sim/scent";
import { type World } from "../sim/world";

const INITIAL_CAPACITY = 4096;

export type ScentLayerKey = "pheromoneA" | "pheromoneB" | "foodBeacon" | "nestBeacon";

interface LayerSpec {
  key: ScentLayerKey;
  color: readonly [number, number, number];
  field(world: World): ScentField;
}

/** Layer glow colors: additive, distinct from materials and ant hues. */
const LAYERS: readonly LayerSpec[] = [
  { key: "pheromoneA", color: [0.15, 0.8, 1.0], field: (w) => w.pheromoneA },
  { key: "pheromoneB", color: [1.0, 0.25, 0.85], field: (w) => w.pheromoneB },
  { key: "foodBeacon", color: [0.35, 1.0, 0.3], field: (w) => w.foodScent },
  { key: "nestBeacon", color: [1.0, 0.7, 0.15], field: (w) => w.nestScent },
];

export interface ScentRenderer {
  /** Refresh the visible scent clouds from the fields' active lists. */
  update(world: World): void;
  setVisible(layer: ScentLayerKey, visible: boolean): void;
  dispose(): void;
}

interface Cloud {
  spec: LayerSpec;
  points: THREE.Points;
  geometry: THREE.BufferGeometry;
  positions: Float32Array;
  colors: Float32Array;
  capacity: number;
}

function createCloud(scene: THREE.Scene, spec: LayerSpec): Cloud {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(INITIAL_CAPACITY * 3);
  const colors = new Float32Array(INITIAL_CAPACITY * 3);
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setDrawRange(0, 0);
  const material = new THREE.PointsMaterial({
    size: 0.7,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  scene.add(points);
  return { spec, points, geometry, positions, colors, capacity: INITIAL_CAPACITY };
}

function growCloud(cloud: Cloud, needed: number): void {
  while (cloud.capacity < needed) {
    cloud.capacity *= 2;
  }
  cloud.positions = new Float32Array(cloud.capacity * 3);
  cloud.colors = new Float32Array(cloud.capacity * 3);
  cloud.geometry.setAttribute("position", new THREE.BufferAttribute(cloud.positions, 3));
  cloud.geometry.setAttribute("color", new THREE.BufferAttribute(cloud.colors, 3));
}

function fillCloud(cloud: Cloud, world: World): void {
  const field = cloud.spec.field(world);
  if (field.activeCount > cloud.capacity) {
    growCloud(cloud, field.activeCount);
  }
  const { sizeX, sizeZ } = world.grid;
  const slab = sizeX * sizeZ;
  const color = cloud.spec.color;
  for (let i = 0; i < field.activeCount; i++) {
    const index = field.activeList[i];
    const x = index % sizeX;
    const z = Math.floor(index / sizeX) % sizeZ;
    const y = Math.floor(index / slab);
    cloud.positions[i * 3] = x + 0.5;
    cloud.positions[i * 3 + 1] = y + 0.5;
    cloud.positions[i * 3 + 2] = z + 0.5;
    // Square-root response lifts faint trail edges into visibility.
    const v = Math.sqrt(Math.min(1, field.values[index]));
    cloud.colors[i * 3] = color[0] * v;
    cloud.colors[i * 3 + 1] = color[1] * v;
    cloud.colors[i * 3 + 2] = color[2] * v;
  }
  cloud.geometry.setDrawRange(0, field.activeCount);
  cloud.geometry.attributes.position.needsUpdate = true;
  cloud.geometry.attributes.color.needsUpdate = true;
}

/** Scent map layers as additive point clouds (design spec §11 legibility). */
export function createScentRenderer(scene: THREE.Scene): ScentRenderer {
  const clouds = LAYERS.map((spec) => createCloud(scene, spec));

  return {
    update(world) {
      for (const cloud of clouds) {
        if (cloud.points.visible) {
          fillCloud(cloud, world);
        }
      }
    },
    setVisible(layer, visible) {
      const cloud = clouds.find((c) => c.spec.key === layer);
      if (cloud) {
        cloud.points.visible = visible;
      }
    },
    dispose() {
      for (const cloud of clouds) {
        scene.remove(cloud.points);
        cloud.geometry.dispose();
        (cloud.points.material as THREE.Material).dispose();
      }
    },
  };
}
