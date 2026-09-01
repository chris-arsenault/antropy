import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Low-poly ant body facing +x (heading 0), feet at y = -0.25 so the
 * renderer's +0.25 lift stands it on the voxel floor. One merged geometry —
 * cheap enough for thousands of instances.
 */
export function createAntGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];

  const segment = (radius: number, sx: number, x: number, y: number) => {
    const g = new THREE.SphereGeometry(radius, 8, 6);
    g.scale(sx, 1, 1);
    g.translate(x, y, 0);
    parts.push(g);
  };
  segment(0.17, 1.5, -0.26, -0.02); // abdomen
  segment(0.1, 1.1, 0.02, -0.04); // thorax
  segment(0.12, 1.0, 0.24, 0.0); // head

  const leg = (x: number, side: number, splay: number) => {
    const g = new THREE.BoxGeometry(0.025, 0.025, 0.3);
    g.translate(0, 0, side * 0.15);
    g.rotateX(side * 0.55);
    g.rotateY(splay);
    g.translate(x, -0.12, 0);
    parts.push(g);
  };
  for (const side of [1, -1]) {
    leg(-0.12, side, side * -0.5);
    leg(0.0, side, 0);
    leg(0.12, side, side * 0.5);
  }

  const antenna = (side: number) => {
    const g = new THREE.BoxGeometry(0.02, 0.02, 0.22);
    g.translate(0, 0, side * 0.11);
    g.rotateX(side * -0.4);
    g.rotateY(side * 1.1);
    g.translate(0.3, 0.08, 0);
    parts.push(g);
  };
  antenna(1);
  antenna(-1);

  const merged = mergeGeometries(parts);
  for (const part of parts) {
    part.dispose();
  }
  if (!merged) {
    throw new Error("ant geometry merge failed");
  }
  return merged;
}
