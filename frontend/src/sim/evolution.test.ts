import { expect, it } from "vitest";
import { DEFAULT_CONFIG } from "./config";
import { controller } from "./controller";
import { INPUTS } from "./interface";
import { seedGenotype, express, inherit, sameGenotype } from "./genetics/genotype";
import { createRandomState } from "./random";
import { createWorld } from "./world";
import { infer } from "./inference";
import { reproduce } from "./reproduction";
import { balance, materialBalance } from "./accounting";
import { fundDivision } from "./testSupport";

const unchanged = { ...DEFAULT_CONFIG, mutationRate: 0, physicalMutationRate: 0 };
it("learns private traces without editing a shared birth genome; static inference ignores traces", () => {
  const genome = controller.seed(),
    state = controller.createState();
  const input = new Float32Array(INPUTS).fill(0.3),
    before = controller.encodeGenome(genome);
  for (let i = 0; i < 20; i++) controller.act(genome, input, state);
  expect(controller.learnedMagnitude(genome, state)).toBeGreaterThan(0);
  expect(state.traces.every((v) => Math.abs(v) <= 1)).toBe(true);
  expect(controller.encodeGenome(genome)).toEqual(before);
  const naive = controller.createState(),
    experienced = controller.createState();
  experienced.traces.fill(1);
  const context = { dt: 0.2, plastic: false, learn: false };
  expect(controller.act(genome, input, experienced, context)).toEqual(
    controller.act(genome, input, naive, context)
  );
});
it("charges learning and preserves old acquired state when a new update is unaffordable", () => {
  const w = createWorld(1, { ...DEFAULT_CONFIG, founders: 1 }),
    cell = w.cells[0];
  infer(w, cell);
  expect(w.ledger.learning).toBeGreaterThan(0);
  expect(Math.abs(balance(w))).toBeLessThan(1e-9);
  const paid = w.ledger.learning;
  cell.energy = 0;
  cell.brain.traces.fill(0.4);
  const old = cell.brain.traces.slice();
  infer(w, cell);
  expect(w.ledger.learning).toBe(paid);
  expect(cell.brain.traces).toEqual(old);
});
it.each(["haploid", "diploid"] as const)(
  "transmits learned weights once through %s inheritance and into grandchildren",
  (ploidy) => {
    const config = { ...unchanged, ploidy },
      parent = seedGenotype(config);
    const state = controller.createState();
    state.traces.fill(0.25);
    state.hidden.fill(0.2);
    const before = controller.encodeGenome(express(parent).behavior);
    const result = inherit(parent, createRandomState(8), config, state);
    expect(result.learned).toBeGreaterThan(0);
    expect(result.mutated).toBe(false);
    expect(controller.encodeGenome(express(parent).behavior)).toEqual(before);
    const childState = controller.createState();
    childState.hidden.set(state.hidden);
    const context = { dt: 0.2, plastic: true, learn: false },
      input = new Float32Array(INPUTS).fill(0.1);
    const experiencedAction = controller.act(express(parent).behavior, input, state, context);
    expect(controller.act(express(result.genome).behavior, input, childState, context)).toEqual(
      experiencedAction
    );
    const grandchild = inherit(
      result.genome,
      createRandomState(9),
      config,
      controller.createState()
    );
    expect(sameGenotype(result.genome, grandchild.genome)).toBe(true);
    expect(grandchild.learned).toBe(0);
    const control = inherit(
      parent,
      createRandomState(9),
      { ...config, learningRetention: 0 },
      state
    );
    expect(sameGenotype(parent, control.genome)).toBe(true);
  }
);
it("only the recurrent block receives acquired information, including partial retention", () => {
  const parent = controller.seed(),
    state = controller.createState();
  state.traces.fill(1);
  const child = controller.assimilate(parent, parent, state, 0.5);
  const start = INPUTS * state.hidden.length,
    end = start + state.traces.length;
  expect(child.weights.slice(0, start)).toEqual(parent.weights.slice(0, start));
  expect(child.weights.slice(end)).toEqual(parent.weights.slice(end));
  expect(child.plasticity).toEqual(parent.plasticity);
  expect(child.weights[start] - parent.weights[start]).toBeCloseTo(0.05, 7);
});
it.each(["uniform", "one-point"] as const)(
  "diploid selfing uses %s gametes and additive expression",
  (crossover) => {
    const config = {
      ...unchanged,
      ploidy: "diploid" as const,
      transmission: "selfing" as const,
      crossover,
    };
    const parent = seedGenotype(config);
    parent.chromosomes[0].physical.fill(-1);
    parent.chromosomes[1].physical.fill(1);
    expect(Array.from(express(parent).physical)).toEqual([0, 0, 0, 0]);
    const offspring = inherit(parent, createRandomState(9), config);
    expect(offspring.recombined).toBe(true);
    expect(offspring.mutated).toBe(false);
    for (const c of offspring.genome.chromosomes)
      expect(c.physical.every((v) => Math.abs(v) === 1)).toBe(true);
    expect(() => createWorld(1, { ...config, ploidy: "haploid" })).toThrow("Selfing requires");
  }
);
it("budding passes learning to both successive children without double counting or changing the parent", () => {
  const w = createWorld(1, { ...unchanged, founders: 1, reproduction: "budding" });
  const parent = fundDivision(w);
  parent.brain.task = 91;
  parent.brain.traces.fill(0.5);
  const original = w.genomes.get(parent.genome)!.genome;
  reproduce(w);
  const first = w.cells.find((c) => c.id !== parent.id)!;
  const inherited = w.genomes.get(first.genome)!.genome;
  expect(first.brain.task).toBe(0);
  expect(first.brain.traces.every((v) => v === 0)).toBe(true);
  expect(sameGenotype(original, inherited)).toBe(false);
  fundDivision(w, parent);
  reproduce(w);
  const second = w.cells.find((c) => c.id !== parent.id && c.id !== first.id)!;
  expect(sameGenotype(inherited, w.genomes.get(second.genome)!.genome)).toBe(true);
  expect(parent.genome).toBe(1);
  expect(parent.brain.task).toBe(91);
  expect(parent.brain.traces[0]).toBe(0.5);
  expect(w.ledger.learnedBirths).toBe(2);
  expect(w.ledger.mutations).toBe(0);
  expect(Math.abs(balance(w))).toBeLessThan(1e-9);
  expect(Math.abs(materialBalance(w))).toBeLessThan(1e-9);
});
