import { type EngineWorld } from "../../src/engine/client";
import { type CellState, type Genotype } from "../../src/engine/types";
import { frozen, install, pulse } from "./engineFixtures";
import { bindingGenotype, bindingLock } from "./ruggedBindingFixture";
import { type QuickScenario } from "./quickScenario";

export const COMMUNITY_REGISTRATION = "docs/plans/RUGGED-INTERACTION-ITERATION.md";
export const SINGLE_CASES = ["producer", "parent", "consumer", "enzyme-off", "blank"] as const;
export const SHARED_CASES = ["active", "producer-off", "export-held"] as const;
export const ITERATION2_CASES = [
  "membrane-swap",
  "parent-neighbor",
  "parent-swap",
  "parent-donor-off",
] as const;
export const HARM_CASES = [
  "parent-food",
  "parent-food-136",
  "protected-parent-food",
  "protected-parent-food-136",
] as const;
export type CommunityCase =
  | (typeof SINGLE_CASES)[number]
  | (typeof SHARED_CASES)[number]
  | (typeof ITERATION2_CASES)[number]
  | (typeof HARM_CASES)[number];

function genotype(base: Genotype, role: string) {
  const g = bindingGenotype(base, 0);
  const producer = role === "producer";
  const substrate = producer ? 0 : 136;
  const product = producer ? 136 : 128;
  const enzyme = role.startsWith("parent") ? 128 : substrate;
  const membrane = ["unprotected", "parent-unprotected"].includes(role) ? 128 : 136;
  for (const ch of g.chromosomes) {
    ch.physical = structuredClone(base.chromosomes[0].physical);
    ch.physical[7] = ch.physical[8] = ch.physical[11] = 3;
    const m = ch.chemistry;
    m.programs = Array.from({ length: 8 }, (_, i) => i === 0);
    m.enzymes[0] = { x: 0, y: 0, centerX: producer ? 4 : 8, centerY: 4, angle: 0 };
    m.keys!.receptors = Array.from({ length: 4 }, () => bindingLock(substrate));
    m.keys!.transporters[0] = bindingLock(substrate);
    m.keys!.transporters[1] = bindingLock(product);
    m.keys!.enzymes[0] = bindingLock(enzyme);
    m.keys!.membrane = bindingLock(membrane);
  }
  return g;
}

function behavior(world: EngineWorld, role: string, condition: CommunityCase) {
  const logits = Array.from({ length: 28 }, () => -3);
  logits[0] = logits[1] = logits[7] = logits[8] = 0;
  logits[2] = logits[5] = logits[9] = 3;
  const donorOff = ["producer-off", "parent-donor-off"].includes(condition) && role === "producer";
  if (condition === "enzyme-off" || donorOff) logits[9] = -3;
  if (condition === "export-held" && role === "producer") logits[6] = 0;
  return world.command<Genotype["chromosomes"][number]["behavior"]>("diagnosticController", {
    logits,
  });
}

function packets(world: EngineWorld, packet: CellState, count: number) {
  for (let i = 0; i < count; i++)
    world.command("intervene", {
      cell: i + 1,
      inventory: Array.from({ length: 256 }, () => 0),
      boundMaterial: packet.boundMaterial.amounts,
      energy: 0.5,
      damage: 0,
      resetMemory: true,
    });
}

function mixtureFor(condition: CommunityCase, shared: boolean) {
  if (condition === "blank") return [];
  const harm = condition.includes("food");
  const species = shared || condition === "producer" || harm ? 0 : 136;
  const mixture: [number, number][] = [[species, 172.8]];
  if (harm && condition.endsWith("136")) mixture.push([136, 14.4]);
  return mixture;
}

function conditions(condition: CommunityCase, shared: boolean) {
  const neighbor = condition.startsWith("parent-") ? "parent-unprotected" : "unprotected";
  const harm = condition.includes("food");
  const harmRole = condition.startsWith("protected") ? "parent" : "parent-unprotected";
  const singleRole = harm ? harmRole : condition;
  const singleX = harm ? 14 : 12;
  const roles = shared ? ["producer", "consumer", neighbor] : [singleRole];
  const mixture = mixtureFor(condition, shared);
  return { roles, mixture, singleX };
}

export function communityScenario(condition: CommunityCase, shared: boolean): QuickScenario {
  const { roles, mixture, singleX } = conditions(condition, shared);
  return {
    name: `rugged-community-${shared ? "shared" : "single"}-${condition}`,
    hypothesis:
      "Inherited binding changes allow a neighbor to fund growth from an exported intermediate while membrane recognition changes its exposure cost.",
    specification: {
      registration: COMMUNITY_REGISTRATION,
      condition,
      shared,
      roles,
      frozen,
      lambda: 3,
      pulse: mixture,
      initialEnergy: 0.5,
      initialInventory: 0,
      founderPacket: "identical ordinary role-zero bound material; no grants after creation",
    },
    target: { x: 12, y: 12, radius: 6 },
    stopOnExtinction: true,
    create(engine, seed, swap) {
      swap ||= condition.endsWith("swap");
      if (seed !== 27) throw new Error("Registered seed is27");
      const world = engine.create(seed, {
        preset: "diagnostic",
        ...frozen,
        chemistrySeed: 101,
        width: 24,
        height: 24,
        mesh: 2,
        founders: roles.length,
        sourceCount: 0,
        sourcePriming: 0,
        bindingLambda: 3,
      });
      try {
        const base = world.command<Genotype>("genotype", { id: 1 });
        const packet = world.command<{ cell: CellState }>("inspect", { cell: 1 }).cell;
        const variants = roles.map((role) => {
          const g = genotype(base, role);
          const b = behavior(world, role, condition);
          for (const ch of g.chromosomes) ch.behavior = structuredClone(b);
          return { label: role, genotype: g };
        });
        install(
          world,
          variants,
          roles.map((_, i) => ({
            cell: i + 1,
            variant: i,
            x: shared ? [12, swap ? 14 : 10, swap ? 10 : 14][i] : singleX,
            y: 12,
            heading: 0,
          }))
        );
        packets(world, packet, roles.length);
        if (mixture.length) pulse(world, mixture);
        return world;
      } catch (error) {
        world.dispose();
        throw error;
      }
    },
  };
}
