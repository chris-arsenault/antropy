import { controller, type Genome } from "../../src/sim/controller";
import {
  constantEfforts,
  diagnosticChanges,
  toxinTriggeredMatrix,
} from "../../src/sim/controller/diagnostics";
import { type Genotype, express } from "../../src/sim/genetics/genotype";
import { ancestralProcessing, constructed, type CapabilityCase } from "./capabilityFixture";
import { capabilitySources } from "./capabilitySources";

function behaviorCopy(g: Genotype, change: (brain: Genome) => Genome): Genotype {
  return {
    chromosomes: g.chromosomes.map((c) => ({
      physical: c.physical.slice(),
      behavior: change(c.behavior),
    })),
  };
}
function evolvedAccess(s: ReturnType<typeof capabilitySources>): CapabilityCase[] {
  return (["persistent", "brief"] as const).map((context) => ({
    key: `evolved-access-${context}`,
    context,
    provenance: s.provenance,
    hypothesis:
      "Observed descendant improves food-access performance independently of toxin/matrix production",
    config: { toxinRate: 0, matrixRate: 0 },
    variants: [
      { label: "actual founder", genome: s.ancestor },
      { label: "actual exported 895", genome: s.descendant },
    ],
  }));
}
function processing(s: ReturnType<typeof capabilitySources>): CapabilityCase[] {
  return (["uniformA", "uniformB"] as const).flatMap((context) => [
    {
      key: `evolved-processing-${context}`,
      context,
      provenance: s.provenance,
      hypothesis: "Observed extra B investment pays in B and costs in A",
      variants: [
        { label: "actual 1847", genome: s.processing },
        {
          label: "1847 with ancestral processing targets",
          genome: ancestralProcessing(s.processing),
        },
      ],
    },
    {
      key: `generalist-${context}`,
      context,
      mature: true,
      hypothesis:
        "Specialist advantage is conditional against a generalist with equal processing stock",
      variants: [
        {
          label: "A-biased",
          genome: constructed(constantEfforts({}), {
            2: Math.log(0.11 / 0.08),
            4: Math.log(0.02 / 0.05),
          }),
        },
        {
          label: "balanced generalist",
          genome: constructed(constantEfforts({}), {
            2: Math.log(0.065 / 0.08),
            4: Math.log(0.065 / 0.05),
          }),
        },
      ],
    },
  ]);
}
function memory(s: ReturnType<typeof capabilitySources>): CapabilityCase[] {
  const learned = behaviorCopy(s.memory, (b) =>
    controller.assimilate(b, express(s.memory).behavior, s.state, 1)
  );
  return [
    {
      key: "evolved-recurrence",
      context: "uniformB",
      hypothesis: "An evolved recurrent block improves performance beyond local/phasic inputs",
      variants: [
        { label: "actual 1783", genome: s.memory },
        {
          label: "1783 recurrence zero",
          genome: behaviorCopy(s.memory, (b) => diagnosticChanges(b, { recurrence: "zero" })),
        },
      ],
    },
    {
      key: "evolved-private-learning",
      context: "uniformB",
      config: { learning: "plastic" },
      hypothesis:
        "Paid private plasticity improves reproduction relative to disabling trace influence and its cost",
      variants: [
        { label: "actual 1783 plasticity", genome: s.memory },
        {
          label: "1783 alpha zero",
          genome: behaviorCopy(s.memory, (b) => diagnosticChanges(b, { plasticityAlpha: 0 })),
        },
      ],
    },
    {
      key: "actual-learned-transfer",
      context: "uniformB",
      hypothesis: "The actual parent's acquired recurrent delta improves fresh offspring",
      variants: [
        { label: "inherited baseline 1783", genome: s.memory },
        { label: "baseline plus actual acquired delta", genome: learned },
      ],
    },
  ].map((test) => ({
    ...test,
    context: "uniformB" as const,
    config: test.config as CapabilityCase["config"],
    provenance: s.provenance,
  }));
}
export function capabilityFollowups(): CapabilityCase[] {
  const s = capabilitySources();
  return [
    ...evolvedAccess(s),
    ...processing(s),
    ...memory(s),
    {
      key: "matrix-triggered",
      context: "uniformA",
      toxin: 0.003,
      hypothesis: "Toxin-dependent secretion retains protection without prolonged matrix expense",
      variants: [
        { label: "nonbuilder repair", genome: constructed(constantEfforts({ repair: 1 })) },
        { label: "toxin-triggered builder", genome: constructed(toxinTriggeredMatrix()) },
      ],
    },
    {
      key: "nearby-propulsion",
      context: "brief",
      config: { toxinRate: 0, matrixRate: 0 },
      hypothesis:
        "A single mutation-scale bias change alters resource access and reproductive outcome",
      variants: [
        { label: "founder", genome: s.ancestor },
        {
          label: "founder swim bias +0.06",
          genome: behaviorCopy(s.ancestor, (b) => diagnosticChanges(b, { swimBiasDelta: 0.06 })),
        },
      ],
    },
    {
      key: "evolved-access-brain-reversion",
      context: "brief",
      provenance: s.provenance,
      config: { toxinRate: 0, matrixRate: 0 },
      hypothesis:
        "The evolved brain is necessary for 895's brief-food advantage with its body genes held constant",
      variants: [
        { label: "actual 895", genome: s.descendant },
        {
          label: "895 physical genes with ancestral brain",
          genome: behaviorCopy(s.descendant, () => express(s.ancestor).behavior),
        },
      ],
    },
  ];
}
