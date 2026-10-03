import { type CellState, type Genotype } from "../../src/engine/types";
import { type BindingKey } from "../../src/engine/bindingTypes";
import { frozen, install, pulse } from "./engineFixtures";
import { type QuickScenario } from "./quickScenario";

export const BINDING_REGISTRATION = "docs/plans/RUGGED-BINDING-CANDIDATE-PLAN.md";
export const LABELS = ["G00", "G10", "G01", "G11"] as const;
export const MIXTURE: [number, number][] = [
  [0, 172.8],
  [136, 172.8],
];
const CIRCUIT = [0, 128, 136, 8];

export function bindingLock(species: number): BindingKey {
  return {
    weights: Array.from({ length: 8 }, (_, j) =>
      species & (1 << (7 - j)) ? 1 : -1
    ) as BindingKey["weights"],
    bias: -7,
  };
}

export function bindingGenotype(g: Genotype, variant: number): Genotype {
  const genome = structuredClone(g);
  for (const ch of genome.chromosomes) {
    ch.physical[7] = 3;
    for (let i = 11; i < 15; i++) ch.physical[i] = 3;
    const m = ch.chemistry;
    m.programs = Array.from({ length: 8 }, (_, i) => i < 4);
    m.enzymes = Array.from({ length: 8 }, (_, i) => {
      const from = CIRCUIT[i % 4],
        to = CIRCUIT[(i + 1) % 4];
      return {
        x: Math.floor(from / 16),
        y: from % 16,
        centerX: (Math.floor(from / 16) + Math.floor(to / 16)) / 2,
        centerY: ((from % 16) + (to % 16)) / 2,
        angle: 0,
      };
    });
    m.keys = {
      receptors: CIRCUIT.map(bindingLock),
      transporters: [
        bindingLock(0),
        bindingLock(0),
        { weights: [0, 0, 0, 0, 0, 0, 0, 0], bias: 9 },
        { weights: [0, 0, 0, 0, 0, 0, 0, 0], bias: 9 },
      ],
      enzymes: Array.from({ length: 8 }, (_, i) => bindingLock(CIRCUIT[i % 4])),
      membrane: { weights: [0, 0, 0, 0, 0, 0, 0, 0], bias: 9 },
    };
    m.keys.transporters[0].weights[0] = variant & 1 ? 1 : -1;
    m.keys.transporters[0].weights[4] = variant & 2 ? 1 : -1;
  }
  return genome;
}

export function bindingScenario(
  lambda: number,
  empty: boolean,
  variant: number | null
): QuickScenario {
  const shared = variant === null;
  const context = empty ? "empty" : "keyed";
  const condition = lambda === 0.25 ? "smooth" : context;
  return {
    name: `rugged-binding-${shared ? "shared" : LABELS[variant]}-${condition}`,
    hypothesis:
      "Two single binding-key mutations reduce net funded biomass return; their combination restores it in the same mixture.",
    specification: {
      registration: BINDING_REGISTRATION,
      lambda,
      empty,
      variant,
      mixture: empty ? [] : MIXTURE,
      changingLoci: ["transporters[0].weights[0]", "transporters[0].weights[4]"],
      frozen,
      founderPacket: "unchanged ordinary role-zero packet",
      shared,
    },
    target: { x: 12, y: 12, radius: 6 },
    stopOnExtinction: true,
    create(engine, seed, swap) {
      if (seed !== 27) throw new Error("Registered world seed is 27");
      const w = engine.create(seed, {
        preset: "diagnostic",
        ...frozen,
        width: 24,
        height: 24,
        mesh: 2,
        chemistrySeed: 101,
        founders: shared ? 8 : 1,
        sourceCount: 0,
        sourcePriming: 0,
        bindingLambda: lambda,
      });
      try {
        const base = w.command<Genotype>("genotype", { id: 1 });
        const packet = w.command<{ cell: CellState }>("inspect", { cell: 1 }).cell;
        const logits = Array.from({ length: 28 }, () => -3);
        logits[0] = logits[1] = 0;
        logits[2] = logits[5] = 3;
        logits[6] = 0;
        for (let i = 9; i < 13; i++) logits[i] = 3;
        const behavior = w.command<Genotype["chromosomes"][number]["behavior"]>(
          "diagnosticController",
          { logits }
        );
        const variants = (shared ? LABELS.map((_, i) => i) : [variant!]).map((i) => {
          const genotype = bindingGenotype(base, i);
          for (const ch of genotype.chromosomes) ch.behavior = structuredClone(behavior);
          return { label: LABELS[i], genotype };
        });
        install(w, variants, bindingAssignments(shared, swap));
        matchPackets(w, packet, shared ? 8 : 1);
        if (!empty) pulse(w, MIXTURE);
        return w;
      } catch (error) {
        w.dispose();
        throw error;
      }
    },
  };
}

function bindingAssignments(shared: boolean, swap: boolean) {
  const offset = swap ? 2 : 0;
  return Array.from({ length: shared ? 8 : 1 }, (_, i) => ({
    cell: i + 1,
    variant: shared ? (i + offset) % 4 : 0,
    x: shared ? 9 + 2 * (i % 4) : 12,
    y: shared ? 11 + 2 * Math.floor(i / 4) : 12,
    heading: 0,
  }));
}
function matchPackets(
  w: import("../../src/engine/client").EngineWorld,
  packet: CellState,
  count: number
) {
  for (let i = 0; i < count; i++)
    w.command("intervene", {
      cell: i + 1,
      inventory: packet.inventory.amounts,
      boundMaterial: packet.boundMaterial.amounts,
      energy: packet.energy,
      damage: 0,
      resetMemory: true,
    });
}
