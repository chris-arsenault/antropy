import { randNormal, type Rng } from "../rng";
import { ENERGY } from "../tunables";
import {
  Input,
  INPUT_COUNT,
  Output,
  OUTPUT_COUNT,
  type ActResult,
  type Controller,
  type ControllerState,
  type Genome,
  type PhysicalTraits,
} from "./contract";

export const HIDDEN_COUNT = 12;

// Weight layout inside one genome copy (design spec §2.1, ~550 loci):
// W_in (H*I) | W_rec (H*H) | b_h (H) | W_out (O*H) | b_out (O) | physical (P)
const W_IN = 0;
const W_REC = W_IN + HIDDEN_COUNT * INPUT_COUNT;
const B_H = W_REC + HIDDEN_COUNT * HIDDEN_COUNT;
const W_OUT = B_H + HIDDEN_COUNT;
const B_OUT = W_OUT + OUTPUT_COUNT * HIDDEN_COUNT;
const PHYS = B_OUT + OUTPUT_COUNT;
const PHYS_COUNT = 7;
export const GENOME_LENGTH = PHYS + PHYS_COUNT;

const PhysGene = {
  BODY_SCALE: 0,
  LEG_LENGTH: 1,
  SENSOR_GAIN: 2,
  STORAGE: 3,
  EGG_ENDOWMENT: 4,
  LIFESPAN: 5,
  MUTATION_SIGMA: 6,
} as const;

const THINK_COST = 0.00008;
const SEED_WEIGHT_NOISE = 0.15;
const SEED_PHYS_NOISE = 0.7;
/**
 * Wider prior on the action-output biases (dig, pheromones, lay-egg) so a
 * real fraction of founders express those behaviors for selection to prune
 * (design spec §10 — diversity is free at t=0). Not a behavioral backbone:
 * signs are random, evolution decides what survives.
 */
const SEED_ACTION_BIAS_NOISE = 0.6;
const BACKBONE_GAIN = 2.5;
const MUTATION_SCALE = 0.12;
const STRUCTURAL_KICK_PROBABILITY = 0.03;

/**
 * Haplodiploid genome (spec §7.1): females carry two copies expressed as
 * their average; males carry one copy expressed raw.
 */
interface RnnGenome {
  copies: Float32Array[];
}

interface RnnState {
  hidden: Float32Array;
}

function asRnn(genome: Genome): RnnGenome {
  return genome as unknown as RnnGenome;
}

function expressed(genome: RnnGenome, locus: number): number {
  const copies = genome.copies;
  if (copies.length === 1) {
    return copies[0][locus];
  }
  return (copies[0][locus] + copies[1][locus]) / 2;
}

/**
 * The structured-init backbone ("instinct in erasable ink", spec §2.1):
 * hidden unit 0 computes the stereo food-scent difference and steers TURN;
 * forward drive and eating are biased on. Hidden unit 1 is a weak
 * excavation instinct — crowding drives DIG and a downward vertical bias,
 * so digging starts where ants bunch (the nest) and radiates. Both are just
 * weights; lineages may strengthen, repurpose, or abandon them.
 */
function applyBackbone(copy: Float32Array): void {
  copy[W_IN + 0 * INPUT_COUNT + Input.FOOD_SCENT_LEFT] += BACKBONE_GAIN;
  copy[W_IN + 0 * INPUT_COUNT + Input.FOOD_SCENT_RIGHT] -= BACKBONE_GAIN;
  copy[W_OUT + Output.TURN * HIDDEN_COUNT + 0] += BACKBONE_GAIN;
  copy[B_OUT + Output.FORWARD] += 1.2;
  copy[B_OUT + Output.EAT] += 1.2;

  copy[W_IN + 1 * INPUT_COUNT + Input.CROWDING] += 1.0;
  copy[W_IN + 1 * INPUT_COUNT + Input.BIAS] += 0.2;
  copy[W_OUT + Output.DIG * HIDDEN_COUNT + 1] += 1.2;
  copy[W_OUT + Output.VERTICAL_BIAS * HIDDEN_COUNT + 1] -= 1.0;

  // Homing instinct (ADR-0006): hidden 2 turns toward the path-integrated
  // home bearing — the weak tether that brings foragers back in range of the
  // nest, where trophallaxis and deposit happen. Local food scent (unit 0,
  // stronger gain) wins nearby, so ants oscillate between food and home.
  // Deliberately weak: a wide foraging orbit that drifts homeward, not a
  // leash. Strong tethers overgraze the nest zone and starve the colony.
  copy[W_IN + 2 * INPUT_COUNT + Input.HOME_ANGLE] += 1.5;
  copy[W_OUT + Output.TURN * HIDDEN_COUNT + 2] += 0.4;
  copy[W_IN + 3 * INPUT_COUNT + Input.NEST_SCENT_LEFT] += 1.0;
  copy[W_IN + 3 * INPUT_COUNT + Input.NEST_SCENT_RIGHT] += 1.0;
  copy[W_IN + 3 * INPUT_COUNT + Input.CARRY_LOAD] += 2.0;
  copy[W_IN + 3 * INPUT_COUNT + Input.BIAS] -= 1.5;
  copy[W_OUT + Output.DIG * HIDDEN_COUNT + 3] += 1.5;

  // Brood-care instinct (ADR-0008): egg contact inhibits eating, so brood
  // survives incubation by default while policing and cannibalism remain
  // reachable by erasing these weights.
  copy[W_IN + 4 * INPUT_COUNT + Input.CONTACT_EGG] += 2.0;
  copy[W_OUT + Output.EAT * HIDDEN_COUNT + 4] -= 2.6;

  // Pickup drive (ADR-0006, first link of the transport chain): a satiated
  // ant at food fires the terrain channel to load it instead of walking by.
  copy[W_IN + 5 * INPUT_COUNT + Input.CONTACT_FOOD] += 1.5;
  copy[W_IN + 5 * INPUT_COUNT + Input.ENERGY] += 2.0;
  copy[W_IN + 5 * INPUT_COUNT + Input.BIAS] -= 2.5;
  copy[W_OUT + Output.DIG * HIDDEN_COUNT + 5] += 1.4;
}

const ACTION_BIAS_LOCI = [
  B_OUT + Output.EAT,
  B_OUT + Output.DIG,
  B_OUT + Output.PHEROMONE_A,
  B_OUT + Output.PHEROMONE_B,
  B_OUT + Output.LAY_EGG,
];

function seedCopy(rng: Rng): Float32Array {
  const copy = new Float32Array(GENOME_LENGTH);
  for (let i = 0; i < GENOME_LENGTH; i++) {
    copy[i] = randNormal(rng) * (i >= PHYS ? SEED_PHYS_NOISE : SEED_WEIGHT_NOISE);
  }
  for (const locus of ACTION_BIAS_LOCI) {
    copy[locus] = randNormal(rng) * SEED_ACTION_BIAS_NOISE;
  }
  applyBackbone(copy);
  return copy;
}

/**
 * One gamete: a per-locus random pick from a diploid parent's copies, or a
 * haploid father's entire single copy (real haplodiploidy — males pass
 * everything).
 */
function gamete(genome: RnnGenome, rng: Rng): Float32Array {
  if (genome.copies.length === 1) {
    return Float32Array.from(genome.copies[0]);
  }
  const out = new Float32Array(GENOME_LENGTH);
  for (let i = 0; i < GENOME_LENGTH; i++) {
    out[i] = genome.copies[rng.next() < 0.5 ? 0 : 1][i];
  }
  return out;
}

function mutateCopy(copy: Float32Array, sigma: number, rng: Rng): void {
  const scale = sigma * MUTATION_SCALE;
  for (let i = 0; i < GENOME_LENGTH; i++) {
    copy[i] += randNormal(rng) * scale;
  }
  if (rng.next() < STRUCTURAL_KICK_PROBABILITY) {
    const locus = Math.floor(rng.next() * GENOME_LENGTH);
    copy[locus] = rng.next() < 0.5 ? 0 : randNormal(rng) * 0.5;
  }
}

// Single-threaded scratch buffers — valid until the next forward call.
const HIDDEN_SCRATCH = new Float32Array(HIDDEN_COUNT);
const OUTPUT_SCRATCH = new Float32Array(OUTPUT_COUNT);

function forward(genome: RnnGenome, inputs: Float32Array, hidden: Float32Array): Float32Array {
  const nextHidden = HIDDEN_SCRATCH;
  for (let h = 0; h < HIDDEN_COUNT; h++) {
    let sum = expressed(genome, B_H + h);
    for (let i = 0; i < INPUT_COUNT; i++) {
      sum += expressed(genome, W_IN + h * INPUT_COUNT + i) * inputs[i];
    }
    for (let r = 0; r < HIDDEN_COUNT; r++) {
      sum += expressed(genome, W_REC + h * HIDDEN_COUNT + r) * hidden[r];
    }
    nextHidden[h] = Math.tanh(sum);
  }
  hidden.set(nextHidden);

  const outputs = OUTPUT_SCRATCH;
  for (let o = 0; o < OUTPUT_COUNT; o++) {
    let sum = expressed(genome, B_OUT + o);
    for (let h = 0; h < HIDDEN_COUNT; h++) {
      sum += expressed(genome, W_OUT + o * HIDDEN_COUNT + h) * hidden[h];
    }
    outputs[o] = Math.tanh(sum);
  }
  return outputs;
}

function physGene(genome: RnnGenome, gene: number): number {
  return expressed(genome, PHYS + gene);
}

// Reused act() result per the contract's transient-result rule.
const ACT_RESULT: ActResult = { outputs: OUTPUT_SCRATCH, thinkCost: THINK_COST };

/**
 * The MVP behavioral controller (design spec §2.1): fixed-topology recurrent
 * network whose weights and physical genes are the genome. MVP ploidy
 * simplification: every genome is diploid and recombine draws one gamete
 * from each parent; expressed haploid males arrive with Release 2.
 */
export const rnnController: Controller = {
  id: "rnn",

  act(genome, inputs, state): ActResult {
    const rnnState = state as unknown as RnnState;
    ACT_RESULT.outputs = forward(asRnn(genome), inputs, rnnState.hidden);
    return ACT_RESULT;
  },

  mutate(genome, sigma, rng) {
    const copies = asRnn(genome).copies.map((copy) => Float32Array.from(copy));
    for (const copy of copies) {
      mutateCopy(copy, sigma, rng);
    }
    return { copies } as unknown as Genome;
  },

  recombine(a, b, rng) {
    const copies = [gamete(asRnn(a), rng), gamete(asRnn(b), rng)];
    return { copies } as unknown as Genome;
  },

  seed(rng) {
    return { copies: [seedCopy(rng), seedCopy(rng)] } as unknown as Genome;
  },

  haploidOffspring(genome, rng) {
    return { copies: [gamete(asRnn(genome), rng)] } as unknown as Genome;
  },

  createState(): ControllerState {
    return { hidden: new Float32Array(HIDDEN_COUNT) } as unknown as ControllerState;
  },

  inspectState(state) {
    return Array.from((state as unknown as RnnState).hidden);
  },

  serializeGenome(genome) {
    const g = asRnn(genome);
    const out = new Float32Array(GENOME_LENGTH * g.copies.length);
    for (let c = 0; c < g.copies.length; c++) {
      out.set(g.copies[c], c * GENOME_LENGTH);
    }
    return out;
  },

  deserializeGenome(data) {
    if (data.length !== GENOME_LENGTH && data.length !== GENOME_LENGTH * 2) {
      throw new Error(
        `rnn genome payload has length ${data.length}, expected ${GENOME_LENGTH} or ${GENOME_LENGTH * 2}`
      );
    }
    const copies: Float32Array[] = [];
    for (let offset = 0; offset < data.length; offset += GENOME_LENGTH) {
      copies.push(data.slice(offset, offset + GENOME_LENGTH));
    }
    return { copies } as unknown as Genome;
  },

  serializeState(state) {
    return Float32Array.from((state as unknown as RnnState).hidden);
  },

  deserializeState(data) {
    if (data.length !== HIDDEN_COUNT) {
      throw new Error(`rnn state payload has length ${data.length}, expected ${HIDDEN_COUNT}`);
    }
    return { hidden: Float32Array.from(data) } as unknown as ControllerState;
  },

  physical(genome): PhysicalTraits {
    const g = asRnn(genome);
    return {
      bodyScale: 1 + 0.5 * Math.tanh(physGene(g, PhysGene.BODY_SCALE)),
      legLength: 1 + 0.5 * Math.tanh(physGene(g, PhysGene.LEG_LENGTH)),
      sensorGain: 1 + 0.75 * Math.tanh(physGene(g, PhysGene.SENSOR_GAIN)),
      storage: 1 + 0.5 * Math.tanh(physGene(g, PhysGene.STORAGE)),
      eggEndowment: 0.3 + 0.15 * Math.tanh(physGene(g, PhysGene.EGG_ENDOWMENT)),
      lifespanTicks: Math.round(
        ENERGY.ageCap * (1 + 0.5 * Math.tanh(physGene(g, PhysGene.LIFESPAN)))
      ),
      mutationSigma: 0.5 + 0.5 * Math.tanh(physGene(g, PhysGene.MUTATION_SIGMA)),
    };
  },
};

/** All-zero genome — the assay control: no drives, no movement. */
export function zeroGenome(): Genome {
  return {
    copies: [new Float32Array(GENOME_LENGTH), new Float32Array(GENOME_LENGTH)],
  } as unknown as Genome;
}
