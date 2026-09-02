import * as THREE from "three";
import { surfaceStress } from "../sim/weather";
import { RAIN } from "../sim/tunables";
import { type World } from "../sim/world";

/**
 * Weather made visible: the sun light and background breathe with the
 * diurnal/seasonal stress cycle (warm harsh middays, cool nights), and
 * storms wash the scene blue-gray while they last.
 */
export interface WeatherTint {
  update(world: World): void;
}

const SKY_BASE = new THREE.Color(0x14100c);
const SKY_HOT = new THREE.Color(0x3a1f0e);
const SKY_RAIN = new THREE.Color(0x1a2230);
const SUN_BASE = new THREE.Color(0xfff4e0);
const SUN_HOT = new THREE.Color(0xffb46a);
const SUN_RAIN = new THREE.Color(0x9fb4cc);

export function createWeatherTint(scene: THREE.Scene, sun: THREE.DirectionalLight): WeatherTint {
  const sky = new THREE.Color();
  const light = new THREE.Color();
  return {
    update(world) {
      // 0 at baseline, ~1 at the harshest midday.
      const heat = Math.min(1, Math.max(0, (surfaceStress(world.tick) - 1) / 10));
      const rain = Math.min(1, world.rainRemaining / (RAIN.durationTicks * 0.5));
      sky.copy(SKY_BASE).lerp(SKY_HOT, heat).lerp(SKY_RAIN, rain);
      light.copy(SUN_BASE).lerp(SUN_HOT, heat).lerp(SUN_RAIN, rain);
      (scene.background as THREE.Color).copy(sky);
      sun.color.copy(light);
      sun.intensity = 2.2 * (1 - 0.45 * rain);
    },
  };
}
