import { controller } from "../../src/sim/controller";
import {
  constantEfforts,
  travelGenome,
  diagnosticChanges,
} from "../../src/sim/controller/diagnostics";
import { constructed, type CapabilityCase } from "./capabilityFixture";

function movementCases(): CapabilityCase[] {
  const fast = travelGenome("fast");
  return (["persistent", "brief"] as const).flatMap((context) => [
    {
      key: `propulsion-${context}`,
      context,
      hypothesis: "Reserve-dependent propulsion preserves intake and lowers motor expense",
      variants: [
        { label: "fast", genome: constructed(fast) },
        {
          label: "reserve brake 0.6",
          genome: constructed(diagnosticChanges(fast, { reserveBrake: 0.6 })),
        },
      ],
    },
    {
      key: `motor-${context}`,
      context,
      mature: true,
      hypothesis:
        "Coordinated motor investment can change the speed versus construction/maintenance tradeoff",
      variants: [
        {
          label: "half motor, gain sqrt(2)",
          genome: constructed(diagnosticChanges(fast, { motorGain: Math.sqrt(2) }), {
            1: Math.log(0.5),
          }),
        },
        {
          label: "double motor, gain 1/sqrt(2)",
          genome: constructed(diagnosticChanges(fast, { motorGain: 1 / Math.sqrt(2) }), {
            1: Math.log(2),
          }),
        },
      ],
    },
    {
      key: `recurrence-${context}`,
      context,
      hypothesis: "Baseline recurrence contributes beyond phasic receptors and local contrast",
      variants: [
        { label: "intact fast", genome: constructed(fast) },
        {
          label: "recurrent block zero",
          genome: constructed(diagnosticChanges(fast, { recurrence: "zero" })),
        },
      ],
    },
  ]);
}

function processingCases(): CapabilityCase[] {
  return (["uniformA", "uniformB"] as const).map((context) => ({
    key: `processing-${context}`,
    context,
    mature: true,
    hypothesis: "Matched total processing stock yields substrate-dependent uptake and division",
    variants: [
      {
        label: "A-biased 0.11 A / 0.02 B",
        genome: constructed(constantEfforts({}), {
          2: Math.log(0.11 / 0.08),
          4: Math.log(0.02 / 0.05),
        }),
      },
      {
        label: "B-biased 0.02 A / 0.11 B",
        genome: constructed(constantEfforts({}), {
          2: Math.log(0.02 / 0.08),
          4: Math.log(0.11 / 0.05),
        }),
      },
    ],
  }));
}

function protectionCases(): CapabilityCase[] {
  return [0, 0.003].flatMap((toxin) => [
    {
      key: `defense-${toxin ? "toxic" : "clean"}`,
      context: "uniformA" as const,
      toxin,
      mature: true,
      hypothesis: "Defense repays its material and maintenance costs under exposure",
      variants: [
        { label: "reference defense", genome: constructed(constantEfforts({ repair: 1 })) },
        {
          label: "fourfold defense",
          genome: constructed(constantEfforts({ repair: 1 }), { 5: Math.log(4) }),
        },
      ],
    },
    {
      key: `matrix-${toxin ? "toxic" : "clean"}`,
      context: "uniformA" as const,
      toxin,
      hypothesis: "Local matrix protection can repay secretion; neighbors may share its benefit",
      variants: [
        { label: "nonbuilder", genome: constructed(constantEfforts({ repair: 1 })) },
        {
          label: "matrix effort 0.1",
          genome: constructed(constantEfforts({ repair: 1, matrix: 0.1 })),
        },
      ],
    },
  ]);
}

export function capabilityScreens(): CapabilityCase[] {
  return [...movementCases(), ...processingCases(), ...protectionCases()];
}

/** Shared seed source for subsequent small interventions; no optimizer or winner filtering. */
export const founderGenotype = () => constructed(controller.seed());
