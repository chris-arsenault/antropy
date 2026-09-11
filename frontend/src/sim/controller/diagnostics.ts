import { seed, HIDDEN, OUTPUTS, PARAMETERS, type Genome } from "./rnn";
import { type Action, INPUTS } from "../interface";
import { seedPlasticity } from "./plasticity";

/** Harness-only genotypes. They still execute through ordinary RNN inference and physics. */
export function constantEfforts(efforts: Partial<Action>): Genome {
  const weights = new Float32Array(PARAMETERS),
    outputBias = PARAMETERS - OUTPUTS;
  const values = [
    efforts.swim ?? 0,
    efforts.turn ?? 0,
    efforts.secrete ?? 0,
    0,
    -0.5,
    efforts.toxin ?? 0,
    efforts.matrix ?? 0,
    efforts.repair ?? 0,
  ];
  values.forEach((v, i) => {
    weights[outputBias + i] = Math.atanh(Math.max(-0.999, Math.min(0.999, v)));
  });
  return { weights, plasticity: seedPlasticity() };
}
export function travelGenome(speed: "fast" | "slow"): Genome {
  const genome = seed(),
    outputBias = PARAMETERS - OUTPUTS;
  genome.weights[outputBias] = speed === "fast" ? 1 : 0.15;
  genome.weights[outputBias + 5] = -16;
  genome.weights[outputBias + 6] = -16;
  // Retain nutrient-dependent steering/slowing, but remove spontaneous signal cost.
  const output = INPUTS * HIDDEN + HIDDEN * HIDDEN + HIDDEN;
  genome.weights.fill(0, output + 2 * HIDDEN, output + 3 * HIDDEN);
  genome.weights[outputBias + 2] = 0;
  return genome;
}

/** Named harness interventions keep neural layout inside the controller boundary. */
export type DiagnosticChanges = Partial<{
  swimBiasDelta: number;
  reserveBrake: number;
  motorGain: number;
  recurrence: "zero";
  toxin: "off";
  matrix: "off";
  toxinTaskConnection: number;
  plasticityAlpha: number;
}>;

function scaleMotors(w: Float32Array, output: number, bias: number, gain: number): void {
  for (const action of [0, 1]) {
    for (let h = 0; h < HIDDEN; h++) w[output + action * HIDDEN + h] *= gain;
    w[bias + action] *= gain;
  }
}

function disableEmissions(
  w: Float32Array,
  output: number,
  bias: number,
  c: DiagnosticChanges
): void {
  for (const action of [c.toxin === "off" ? 5 : -1, c.matrix === "off" ? 6 : -1])
    if (action >= 0) {
      w.fill(0, output + action * HIDDEN, output + (action + 1) * HIDDEN);
      w[bias + action] = -16;
    }
}
export function diagnosticChanges(base: Genome, changes: DiagnosticChanges): Genome {
  const genome = { weights: base.weights.slice(), plasticity: base.plasticity.slice() };
  const recurrent = INPUTS * HIDDEN,
    output = recurrent + HIDDEN * HIDDEN + HIDDEN,
    bias = output + OUTPUTS * HIDDEN;
  const w = genome.weights;
  if (changes.plasticityAlpha !== undefined) genome.plasticity[0] = changes.plasticityAlpha;
  w[bias] += changes.swimBiasDelta ?? 0;
  if (changes.recurrence === "zero") w.fill(0, recurrent, recurrent + HIDDEN * HIDDEN);
  if (changes.reserveBrake !== undefined) {
    // Founder hidden unit 9 has no output use. A declared constructed sensor-response path.
    w.fill(0, 9 * INPUTS, 10 * INPUTS);
    w[9 * INPUTS + 18] = 1.5;
    w[output + 9] = -changes.reserveBrake;
  }
  scaleMotors(w, output, bias, changes.motorGain ?? 1);
  if (changes.toxinTaskConnection !== undefined)
    w[output + 5 * HIDDEN + 14] = changes.toxinTaskConnection;
  disableEmissions(w, output, bias, changes);
  return genome;
}

export function toxinTriggeredMatrix(): Genome {
  const genome = constantEfforts({ repair: 1 });
  genome.weights[23] = 1.5;
  const output = INPUTS * HIDDEN + HIDDEN * HIDDEN + HIDDEN;
  genome.weights[output + 6 * HIDDEN] = 0.625;
  return genome;
}
