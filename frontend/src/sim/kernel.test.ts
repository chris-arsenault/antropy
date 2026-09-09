import { describe, expect, it } from "vitest";
import { createKernel, type SimulationSystem } from "./kernel";
import { simulationManifest, validateSimulationManifest } from "./simulation";
import { createWorld, summarizeWorld } from "./world";
import { FORAGER_CONFIG } from "./config";

describe("deterministic simulation kernel", () => {
  interface TestContexts {
    settling: unknown;
    resources: { growFood(): void };
    fields: { transport(): void };
    actors: { resolveSerially(): void };
    lifecycle: { maintain(): void };
  }
  const resources: SimulationSystem<TestContexts> = {
    id: "food",
    version: 1,
    phase: "resources",
    run: (capability) => capability.growFood(),
  };
  const actors: SimulationSystem<TestContexts> = {
    id: "actions",
    version: 1,
    phase: "actors",
    run: (capability) => capability.resolveSerially(),
  };

  it("preserves registered phase order and isolates phase capabilities", () => {
    const calls: string[] = [];
    const capabilities: TestContexts = {
      settling: null,
      resources: { growFood: () => calls.push("growth") },
      fields: { transport: () => calls.push("fields") },
      actors: { resolveSerially: () => calls.push("actors") },
      lifecycle: { maintain: () => calls.push("lifecycle") },
    };
    createKernel<TestContexts>([resources, actors]).step(capabilities);
    expect(calls).toEqual(["growth", "actors"]);
  });

  it("rejects duplicate identities and reverse phase registration", () => {
    expect(() => createKernel<TestContexts>([resources, resources])).toThrow("duplicate");
    expect(() => createKernel<TestContexts>([actors, resources])).toThrow("phase order");
    const invalid = { ...resources, phase: "unknown" } as unknown as SimulationSystem<TestContexts>;
    expect(() => createKernel<TestContexts>([invalid])).toThrow("invalid simulation phase");
  });

  it("rejects a checkpoint claiming different mechanism versions or order", () => {
    expect(() => validateSimulationManifest(structuredClone(simulationManifest))).not.toThrow();
    expect(() =>
      validateSimulationManifest(
        simulationManifest.map(({ id, phase, version }) => ({ phase, version, id }))
      )
    ).not.toThrow();
    expect(() => validateSimulationManifest([...simulationManifest].reverse())).toThrow("manifest");
    expect(() =>
      validateSimulationManifest(simulationManifest.map((item) => ({ ...item, version: 2 })))
    ).toThrow("manifest");
  });

  it("does not retain a phantom single-worker reference after extinction", () => {
    const world = createWorld(101, "programmed", FORAGER_CONFIG, false);
    world.ants.splice(0);
    expect(() => world.ant).toThrow("living worker");
    expect(summarizeWorld(world)).toMatchObject({
      energy: 0,
      carryingFood: false,
      distanceMoved: 0,
    });
  });
});
