import { describe, expect, it } from "vitest";
import { foundColony } from "../sim/colony";
import { createWorld, stepWorld } from "../sim/world";
import { deserializeWorld, serializeWorld } from "./checkpoint";

// Temporary probe: first tick and voxel where restored state diverges.
describe("checkpoint divergence probe", () => {
  it("finds the first divergent tick", { timeout: 120_000 }, () => {
    const original = createWorld(8001);
    foundColony(original);
    for (let t = 0; t < 700; t++) {
      stepWorld(original);
    }
    const restored = deserializeWorld(serializeWorld(original));
    expect(restored.rainRemaining).toBe(original.rainRemaining);
    expect(restored.weatherRng.getState()).toEqual(original.weatherRng.getState());
    expect(restored.eggs.length).toBe(original.eggs.length);
    expect(restored.ants.length).toBe(original.ants.length);

    const trace: string[] = [];
    for (let t = 0; t < 500; t++) {
      stepWorld(original);
      stepWorld(restored);
      const ta = original.ants.find((a) => a.id === 24);
      const tb = restored.ants.find((a) => a.id === 24);
      if (ta && tb) {
        trace.push(
          `t=${original.tick} A[e=${ta.energy.toFixed(4)} loads=${ta.spoilLoads} carry=${ta.carrying} out=${Array.from(ta.lastOutputs).map((v) => v.toFixed(2)).join(",")}] B[e=${tb.energy.toFixed(4)} loads=${tb.spoilLoads} carry=${tb.carrying} out=${Array.from(tb.lastOutputs).map((v) => v.toFixed(2)).join(",")}]`
        );
        if (trace.length > 6) {
          trace.shift();
        }
        if (ta.energy !== tb.energy) {
          throw new Error(`divergence window:\n${trace.join("\n")}`);
        }
      }
      if (original.rainRemaining !== restored.rainRemaining) {
        throw new Error(`tick ${original.tick}: rain ${original.rainRemaining} vs ${restored.rainRemaining}`);
      }
      const ra = original.rng.getState();
      const rb = restored.rng.getState();
      if (JSON.stringify(ra) !== JSON.stringify(rb)) {
        throw new Error(`tick ${original.tick}: behavioral rng diverged`);
      }
      const wa = original.weatherRng.getState();
      const wb = restored.weatherRng.getState();
      if (JSON.stringify(wa) !== JSON.stringify(wb)) {
        throw new Error(`tick ${original.tick}: weather rng diverged`);
      }
      const fa = JSON.stringify(Array.from(original.foodSources));
      const fb = JSON.stringify(Array.from(restored.foodSources));
      if (fa !== fb) {
        const la = Array.from(original.foodSources);
        const lb = Array.from(restored.foodSources);
        let firstDiff = -1;
        for (let i = 0; i < Math.max(la.length, lb.length); i++) {
          if (la[i] !== lb[i]) {
            firstDiff = i;
            break;
          }
        }
        throw new Error(
          `tick ${original.tick}: foodSources order/content differs at index ${firstDiff}: ${la[firstDiff]} vs ${lb[firstDiff]} (sizes ${la.length}/${lb.length})`
        );
      }
      for (let i = 0; i < original.ants.length; i++) {
        const oa = original.ants[i];
        const ob = restored.ants[i];
        if (!ob || oa.id !== ob.id) {
          throw new Error(`tick ${original.tick}: ant roster differs at ${i}`);
        }
        if (oa.energy !== ob.energy || oa.x !== ob.x || oa.y !== ob.y || oa.z !== ob.z) {
          throw new Error(
            `tick ${original.tick}: ant ${oa.id} e=${oa.energy} vs ${ob.energy} pos=(${oa.x},${oa.y},${oa.z}) vs (${ob.x},${ob.y},${ob.z}) heading=${oa.heading} vs ${ob.heading} charge=${oa.moveCharge} vs ${ob.moveCharge}`
          );
        }
      }
      const sa = original.colonies[0]?.stockpile;
      const sb = restored.colonies[0]?.stockpile;
      if (sa !== sb) {
        throw new Error(`tick ${original.tick}: stockpile ${sa} vs ${sb}`);
      }
      for (let i = 0; i < original.grid.data.length; i++) {
        if (original.grid.data[i] !== restored.grid.data[i]) {
          throw new Error(
            `tick ${original.tick}: voxel ${i} differs (${original.grid.data[i]} vs ${restored.grid.data[i]})`
          );
        }
      }
    }
  });
});
