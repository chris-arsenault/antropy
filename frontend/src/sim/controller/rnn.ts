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
const BACKBONE_GAIN = 2.5;
const MUTATION_SCALE = 0.12;
const STRUCTURAL_KICK_PROBABILITY = 0.03;

/** Diploid genome: two full copies, expressed as their average (spec §7.1). */
interface RnnGenome {
  copies: [Float32Array, Float32Array];
}

interface RnnState {
  hidden: Float32Array;
}

function asRnn(genome: Genome): RnnGenome {
  return genome as unknown as RnnGenome;
}

function expressed(genome: RnnGenome, locus: number): number {
  return (genome.copies[0][locus] + genome.copies[1][locus]) / 2;
}

/**
 * The chemotaxis backbone ("instinct in erasable ink", spec §2.1): hidden
 * unit 0 computes the stereo food-scent difference and steers TURN; forward
 * drive and eating are biased on. Everything else starts near zero.
 */
function applyBackbone(copy: Float32Array): void {
  copy[W_IN + 0 * INPUT_COUNT + Input.FOOD_SCENT_LEFT] += BACKBONE_GAIN;
  copy[W_IN + 0 * INPUT_COUNT + Input.FOOD_SCENT_RIGHT] -= BACKBONE_GAIN;
  copy[W_OUT + Output.TURN * HIDDEN_COUNT + 0] += BACKBONE_GAIN;
  copy[B_OUT + Output.FORWARD] += 1.2;
  copy[B_OUT + Output.EAT] += 1.2;
}

function seedCopy(rng: Rng): Float32Array {
  const copy = new Float32Array(GENOME_LENGTH);
  for (let i = 0; i < GENOME_LENGTH; i++) {
    copy[i] = randNormal(rng) * (i >= PHYS ? SEED_PHYS_NOISE : SEED_WEIGHT_NOISE);
  }
  applyBackbone(copy);
  return copy;
}

/** Per-locus random pick from the parent's two copies — one gamete. */
function gamete(genome: RnnGenome, rng: Rng): Float32Array {
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

function forward(genome: RnnGenome, inputs: Float32Array, hidden: Float32Array): Float32Array {
  const nextHidden = new Float32Array(HIDDEN_COUNT);
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

  const outputs = new Float32Array(OUTPUT_COUNT);
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
    return {
      outputs: forward(asRnn(genome), inputs, rnnState.hidden),
      thinkCost: THINK_COST,
    };
  },

  mutate(genome, sigma, rng) {
    const source = asRnn(genome);
    const copies: [Float32Array, Float32Array] = [
      new Float32Array(source.copies[0]),
      new Float32Array(source.copies[1]),
    ];
    mutateCopy(copies[0], sigma, rng);
    mutateCopy(copies[1], sigma, rng);
    return { copies } as unknown as Genome;
  },

  recombine(a, b, rng) {
    const copies: [Float32Array, Float32Array] = [gamete(asRnn(a), rng), gamete(asRnn(b), rng)];
    return { copies } as unknown as Genome;
  },

  seed(rng) {
    return { copies: [seedCopy(rng), seedCopy(rng)] } as unknown as Genome;
  },

  createState(): ControllerState {
    return { hidden: new Float32Array(HIDDEN_COUNT) } as unknown as ControllerState;
  },

  inspectState(state) {
    return Array.from((state as unknown as RnnState).hidden);
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
