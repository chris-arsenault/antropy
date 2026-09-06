import { randNormal, type Rng } from "../rng";
import { COLONY_SEED } from "./seeds/colony";
import { extendFunctionalSeed } from "./functionalSeed";
import { buildColonySeed, colonySeedLocusGroups } from "./colonySeed";
import { deserializeGenomeCopies } from "./genomeSerialization";
import { HIDDEN_COUNT } from "./rnnShape";
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

export { HIDDEN_COUNT };

// Weight layout inside one genome copy (design spec §2.1):
// W_in (H*I) | W_rec (H*H) | b_h (H) | W_out (O*H) | b_out (O) | physical (P)
const W_IN = 0;
const W_REC = W_IN + HIDDEN_COUNT * INPUT_COUNT;
const B_H = W_REC + HIDDEN_COUNT * HIDDEN_COUNT;
const W_OUT = B_H + HIDDEN_COUNT;
const B_OUT = W_OUT + OUTPUT_COUNT * HIDDEN_COUNT;
const PHYS = B_OUT + OUTPUT_COUNT;
const PHYS_COUNT = 7;
export const GENOME_LENGTH = PHYS + PHYS_COUNT;
const LEGACY_INPUT_COUNT = 23;
const PREVIOUS_INPUT_COUNT = 105;

function genomeLengthForInputs(inputCount: number): number {
  return (
    HIDDEN_COUNT * inputCount +
    HIDDEN_COUNT * HIDDEN_COUNT +
    HIDDEN_COUNT +
    OUTPUT_COUNT * HIDDEN_COUNT +
    OUTPUT_COUNT +
    PHYS_COUNT
  );
}

const LEGACY_GENOME_LENGTH = genomeLengthForInputs(LEGACY_INPUT_COUNT);
const PREVIOUS_GENOME_LENGTH = genomeLengthForInputs(PREVIOUS_INPUT_COUNT);

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

  // Homing instinct (ADR-0006, legalized per §C.8): hidden 2 climbs the
  // nest-scent plume — chemotaxis toward home on a world carrier, the
  // same reflex shape as food chemotaxis on unit 0. Local food scent
  // (stronger TURN weight) wins nearby, so ants oscillate between food
  // and home and the orbit crosses the nest (§B.3 R2 colony sink).
  copy[W_IN + 2 * INPUT_COUNT + Input.NEST_SCENT_LEFT] += BACKBONE_GAIN;
  copy[W_IN + 2 * INPUT_COUNT + Input.NEST_SCENT_RIGHT] -= BACKBONE_GAIN;
  copy[W_OUT + Output.TURN * HIDDEN_COUNT + 2] += 0.9;
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

  // Heat-escape reflex (§B.9.1 "exposed + thermal stress → dig downward"):
  // hidden 6 reads the thermoreceptor and drives digging with a downward
  // bias while damping forward drive — a personal burrow against middays,
  // no navigation required. The bias keeps it silent below TEMPERATURE
  // ~0.45 (multiplier ~5, past the shoulder of a lush midday).
  copy[W_IN + 6 * INPUT_COUNT + Input.TEMPERATURE] += 4.0;
  copy[W_IN + 6 * INPUT_COUNT + Input.BIAS] -= 1.8;
  // Sized against the resting negatives the deposit/pickup units project
  // onto DIG (~-2.5): dominates when hot, reinforces quiet when cool.
  // (Config 1 of the delivery-loop budget, ledger runs 11-13 — the
  // best-measured seeded configuration; homing-drive variants all
  // regressed bootstrap foraging, see the M5 structural finding.)
  copy[W_OUT + Output.DIG * HIDDEN_COUNT + 6] += 4.0;
  copy[W_OUT + Output.VERTICAL_BIAS * HIDDEN_COUNT + 6] -= 1.6;
  copy[W_OUT + Output.FORWARD * HIDDEN_COUNT + 6] -= 1.2;
}

const ACTION_BIAS_LOCI = [
  B_OUT + Output.EAT,
  B_OUT + Output.DIG,
  B_OUT + Output.PHEROMONE_A,
  B_OUT + Output.PHEROMONE_B,
  B_OUT + Output.LAY_EGG,
];

/** Loci below this bound are behavioral weights; above is genome-territory
 * physical traits (Rule 9) that derivation must not optimize. */
export const WEIGHT_COUNT = PHYS;

// The Phase 2 digger seed (docs/sources/seed-spec.md): five reflexes, about twenty
// loci, six memoryless relays, and no recurrence. Hidden units are indices
// into a layer that is otherwise all zero, so each relay is isolated.
const H_AMPLIFY = 0;
const H_CROWD = 1;
const H_HAUL = 2;
const H_DIG_SITE = 3;
const H_DUMP = 4;
const H_CAST = 5;
/** Constant down bias; tanh(-2) = -0.96, past the -0.33 dig-down band. */
const DOWN_DRIVE = -2;
/**
 * Constant locomotion drive. Without it the ant digs the voxel below and
 * never enters it: motion needs forward thrust even to descend, so a
 * digger with no drive sinks exactly one voxel and then starves in place.
 */
const FORWARD_DRIVE = 0.700221;
/** Channel-A stereo gain into the amplify relay. */
const AMPLIFY_GAIN = 3.098311;
/** Amplify relay to TURN: how hard the ant swings toward the mark. */
const AMPLIFY_TURN = 1.752951;
/** Total-A relay: a marked dig face drives DIG and reinforces its mark. */
const DIG_SITE_GAIN = 4.611572;
const DIG_SITE_DRIVE = 4.610979;
const DIG_SITE_MARK = 0.44646;
/**
 * Crowding gain and lift. Sized so one neighbour leaves the down bias
 * intact (net -0.58, still digging down) and two or more cancel it into
 * the neutral band (net ~-0.1), where the dig targets the faced voxel —
 * an effective threshold of two, matching the oracle's overflowCrowding.
 */
const CROWD_GAIN = 6;
const CROWD_LIFT = 2.1;
/** Load relay: climb and inhibit DIG while carrying through a marked shaft. */
const HAUL_LOAD_GAIN = 3.154215;
const HAUL_LIFT = 6.702527;
const HAUL_DIG_INHIBITION = -2.206419;
/**
 * Dump relay. Load excites it while total local A inhibits it. Together
 * with the haul inhibitor and marked-site relay this yields the four cases
 * required by the shared DIG/deposit actuator: quiet+empty off,
 * marked+empty DIG, marked+loaded off, quiet+loaded deposit.
 */
const DUMP_LOAD_GAIN = 4.190144;
const DUMP_SCENT_INHIBITION = -11.80862;
const DUMP_DRIVE = 2.901328;
/**
 * Casting is a constant turn cancelled by high total A. At zero A the
 * relay is zero and the bias turns; at high A it saturates negative and
 * cancels that bias, leaving the stereo amplify relay in control.
 */
const CAST_SCENT_INHIBITION = -5.601472;
const CAST_DRIVE = 0.986716;

/**
 * Hand-written founder weights for the Phase 2 digger (docs/sources/seed-spec.md).
 * Reflex 1 sinks a marked shaft; reflex 2 hauls spoil to quiet ground and
 * deposits it; reflex 3 reinforces and follows the mark; reflex 4 turns a
 * crowded digger sideways; reflex 5 casts until it reacquires channel A.
 */
export function diggerSeedVector(): Float32Array {
  const v = new Float32Array(GENOME_LENGTH);

  // Reflex 1 — marked-site dig-down. Aim down and supply the thrust that
  // enters the hole; total channel A gates DIG to the founded shaft site.
  v[B_OUT + Output.VERTICAL_BIAS] = DOWN_DRIVE;
  v[B_OUT + Output.FORWARD] = FORWARD_DRIVE;
  v[W_IN + H_DIG_SITE * INPUT_COUNT + Input.PHEROMONE_A_LEFT] = DIG_SITE_GAIN;
  v[W_IN + H_DIG_SITE * INPUT_COUNT + Input.PHEROMONE_A_RIGHT] = DIG_SITE_GAIN;
  v[W_OUT + Output.DIG * HIDDEN_COUNT + H_DIG_SITE] = DIG_SITE_DRIVE;

  // Reflex 2 — spoil haul/deposit. Load flips the vertical preference up
  // and inhibits digging in the marked shaft. The dump relay re-enables
  // the shared terrain trigger only when a loaded ant reaches low-A ground.
  v[W_IN + H_HAUL * INPUT_COUNT + Input.CARRY_LOAD] = HAUL_LOAD_GAIN;
  v[W_OUT + Output.VERTICAL_BIAS * HIDDEN_COUNT + H_HAUL] = HAUL_LIFT;
  v[W_OUT + Output.DIG * HIDDEN_COUNT + H_HAUL] = HAUL_DIG_INHIBITION;
  v[W_IN + H_DUMP * INPUT_COUNT + Input.CARRY_LOAD] = DUMP_LOAD_GAIN;
  v[W_IN + H_DUMP * INPUT_COUNT + Input.PHEROMONE_A_LEFT] = DUMP_SCENT_INHIBITION;
  v[W_IN + H_DUMP * INPUT_COUNT + Input.PHEROMONE_A_RIGHT] = DUMP_SCENT_INHIBITION;
  v[W_OUT + Output.DIG * HIDDEN_COUNT + H_DUMP] = DUMP_DRIVE;

  // Reflex 3 — amplify: reinforce channel A only at its marked site and
  // turn toward the stronger forward sample.
  v[W_OUT + Output.PHEROMONE_A * HIDDEN_COUNT + H_DIG_SITE] = DIG_SITE_MARK;
  v[W_IN + H_AMPLIFY * INPUT_COUNT + Input.PHEROMONE_A_LEFT] = AMPLIFY_GAIN;
  v[W_IN + H_AMPLIFY * INPUT_COUNT + Input.PHEROMONE_A_RIGHT] = -AMPLIFY_GAIN;
  v[W_OUT + Output.TURN * HIDDEN_COUNT + H_AMPLIFY] = AMPLIFY_TURN;

  // Reflex 4 — overflow: crowding cancels the down bias into neutral,
  // so the terrain channel takes the faced voxel instead of the floor.
  v[W_IN + H_CROWD * INPUT_COUNT + Input.CROWDING] = CROWD_GAIN;
  v[W_OUT + Output.VERTICAL_BIAS * HIDDEN_COUNT + H_CROWD] = CROWD_LIFT;

  // Reflex 5 — reacquisition by casting. Uniform low A leaves a constant
  // turn; total A cancels it so the amplify differential controls taxis.
  v[B_OUT + Output.TURN] = CAST_DRIVE;
  v[W_IN + H_CAST * INPUT_COUNT + Input.PHEROMONE_A_LEFT] = CAST_SCENT_INHIBITION;
  v[W_IN + H_CAST * INPUT_COUNT + Input.PHEROMONE_A_RIGHT] = CAST_SCENT_INHIBITION;
  v[W_OUT + Output.TURN * HIDDEN_COUNT + H_CAST] = CAST_DRIVE;

  return v;
}

/** Step-12 founder: the five digging reflexes plus local brood/food transport. */
export function functionalSeedVector(): Float32Array {
  return extendFunctionalSeed(diggerSeedVector());
}

/** Appendix E constructive seed before randomized integration derivation. */
export function colonySeedVector(): Float32Array {
  return buildColonySeed(GENOME_LENGTH);
}

/** Appendix E seed after randomized in-world integration derivation. */
export function derivedColonySeedVector(): Float32Array {
  return normalizedSeedBase(COLONY_SEED) ?? backboneVector();
}

export { colonySeedLocusGroups };

/** Behavioral loci belonging to the five-reflex digger topology. */
export function diggerSeedLoci(): number[] {
  return diggerSeedLocusGroups().flat();
}

/**
 * Parameter-sharing groups for derivation. Paired stereo, total-A, and
 * casting-cancellation loci must retain equal magnitude; otherwise the
 * optimizer can replace a reflex with an accidental constant turn.
 */
export function diggerSeedLocusGroups(): number[][] {
  return [
    [
      W_IN + H_AMPLIFY * INPUT_COUNT + Input.PHEROMONE_A_LEFT,
      W_IN + H_AMPLIFY * INPUT_COUNT + Input.PHEROMONE_A_RIGHT,
    ],
    [W_OUT + Output.TURN * HIDDEN_COUNT + H_AMPLIFY],
    [W_IN + H_CROWD * INPUT_COUNT + Input.CROWDING],
    [W_OUT + Output.VERTICAL_BIAS * HIDDEN_COUNT + H_CROWD],
    [W_IN + H_HAUL * INPUT_COUNT + Input.CARRY_LOAD],
    [W_OUT + Output.VERTICAL_BIAS * HIDDEN_COUNT + H_HAUL],
    [W_OUT + Output.DIG * HIDDEN_COUNT + H_HAUL],
    [
      W_IN + H_DIG_SITE * INPUT_COUNT + Input.PHEROMONE_A_LEFT,
      W_IN + H_DIG_SITE * INPUT_COUNT + Input.PHEROMONE_A_RIGHT,
    ],
    [W_OUT + Output.DIG * HIDDEN_COUNT + H_DIG_SITE],
    [W_OUT + Output.PHEROMONE_A * HIDDEN_COUNT + H_DIG_SITE],
    [W_IN + H_DUMP * INPUT_COUNT + Input.CARRY_LOAD],
    [
      W_IN + H_DUMP * INPUT_COUNT + Input.PHEROMONE_A_LEFT,
      W_IN + H_DUMP * INPUT_COUNT + Input.PHEROMONE_A_RIGHT,
    ],
    [W_OUT + Output.DIG * HIDDEN_COUNT + H_DUMP],
    [
      W_IN + H_CAST * INPUT_COUNT + Input.PHEROMONE_A_LEFT,
      W_IN + H_CAST * INPUT_COUNT + Input.PHEROMONE_A_RIGHT,
    ],
    [B_OUT + Output.TURN, W_OUT + Output.TURN * HIDDEN_COUNT + H_CAST],
    [B_OUT + Output.FORWARD],
    [B_OUT + Output.VERTICAL_BIAS],
  ];
}

/** Step-9 ablation: reflex 1 without amplification or overflow. */
export function shaftSeedVector(): Float32Array {
  const v = new Float32Array(GENOME_LENGTH);
  v[B_OUT + Output.DIG] = 2;
  v[B_OUT + Output.VERTICAL_BIAS] = DOWN_DRIVE;
  v[B_OUT + Output.FORWARD] = FORWARD_DRIVE;
  return v;
}

/** The pure hand-derived instinct vector, noise-free (derivation start). */
export function backboneVector(): Float32Array {
  const copy = new Float32Array(GENOME_LENGTH);
  applyBackbone(copy);
  return copy;
}

function seedCopy(rng: Rng): Float32Array {
  const copy = new Float32Array(GENOME_LENGTH);
  for (let i = 0; i < GENOME_LENGTH; i++) {
    copy[i] = randNormal(rng) * (i >= PHYS ? SEED_PHYS_NOISE : SEED_WEIGHT_NOISE);
  }
  for (const locus of ACTION_BIAS_LOCI) {
    copy[locus] = randNormal(rng) * SEED_ACTION_BIAS_NOISE;
  }
  const base = normalizedSeedBase(runtimeSeedBase ?? COLONY_SEED);
  if (base !== null) {
    // Derived founder weights (ADR-0010): the baked artifact (or the
    // derivation harness's runtime candidate) replaces the hand-derived
    // instincts as the mean; seed noise stays on top.
    for (let i = 0; i < WEIGHT_COUNT; i++) {
      copy[i] += base[i];
    }
    return copy;
  }
  applyBackbone(copy);
  return copy;
}

function fixedSeedGenome(): Genome {
  const base = normalizedSeedBase(runtimeSeedBase ?? COLONY_SEED);
  const copy = base ?? backboneVector();
  return { copies: [copy, Float32Array.from(copy)] } as unknown as Genome;
}

// Runtime override of the seed base, used only by the derivation harness
// to evaluate candidate vectors through the real seed() noise pipeline.
let runtimeSeedBase: ArrayLike<number> | null = null;

function inputCountForGenomeLength(length: number): number | null {
  if (length === LEGACY_GENOME_LENGTH) return LEGACY_INPUT_COUNT;
  if (length === PREVIOUS_GENOME_LENGTH) return PREVIOUS_INPUT_COUNT;
  return null;
}

/** Rebase older artifacts into the append-only wider input matrix.
 * Existing input weights retain their loci; new channels begin disconnected. */
function normalizedSeedBase(base: ArrayLike<number> | null): Float32Array | null {
  if (base === null) return null;
  if (base.length === GENOME_LENGTH) return Float32Array.from(base);
  const sourceInputCount = inputCountForGenomeLength(base.length);
  if (sourceInputCount === null) return null;
  const sourceWeightEnd = HIDDEN_COUNT * sourceInputCount;
  const migrated = new Float32Array(GENOME_LENGTH);
  const sourceValues = Float32Array.from(base);
  for (let hidden = 0; hidden < HIDDEN_COUNT; hidden++) {
    const source = hidden * sourceInputCount;
    migrated.set(sourceValues.subarray(source, source + sourceInputCount), hidden * INPUT_COUNT);
  }
  for (let index = sourceWeightEnd; index < base.length; index++) {
    migrated[W_REC + index - sourceWeightEnd] = base[index];
  }
  return migrated;
}

/** Harness hook (S-layer evaluation): null restores the baked artifact. */
export function setRuntimeSeedBase(base: ArrayLike<number> | null): void {
  runtimeSeedBase = base;
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

  fixedSeed: fixedSeedGenome,

  genomeDistance(a, b) {
    const left = asRnn(a);
    const right = asRnn(b);
    let squared = 0;
    for (let locus = 0; locus < GENOME_LENGTH; locus++) {
      const difference = expressed(left, locus) - expressed(right, locus);
      squared += difference * difference;
    }
    return Math.sqrt(squared / GENOME_LENGTH);
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
    const lengths = [GENOME_LENGTH, PREVIOUS_GENOME_LENGTH, LEGACY_GENOME_LENGTH];
    return {
      copies: deserializeGenomeCopies(data, lengths, normalizedSeedBase),
    } as unknown as Genome;
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
