import { type Engine } from "../../src/engine/client";
import { ancestralProcessing, type CapabilityCase } from "./capabilityFixture";
import { allocationGenome, chemicalContext } from "./chemicalGenotypes";
import { capabilitySources } from "./capabilitySources";
import { type Flags } from "./flags";
type Source = Awaited<ReturnType<typeof capabilitySources>>;

function access(s: Source): CapabilityCase[] {
  return (["persistent", "brief"] as const).map((context) => ({
    key: `evolved-access-${context}`,
    context,
    hypothesis: "A specified descendant changes resource access with all chemical pathways active",
    variants: [
      { label: "source ancestor", genotype: s.ancestor },
      { label: "specified descendant", genotype: s.descendant },
    ],
  }));
}
function processing(s: Source, engine: Engine): CapabilityCase[] {
  const c = chemicalContext(engine, s.config);
  return (["uniform0", "uniform1"] as const).flatMap((context) => [
    {
      key: `evolved-processing-${context}`,
      context,
      hypothesis: "Observed import/enzyme alleles alter acquisition-funded growth by substrate",
      variants: [
        { label: "trait-selected genotype", genotype: s.processing },
        {
          label: "ancestral processing alleles",
          genotype: ancestralProcessing(s.processing, s.ancestor),
        },
      ],
    },
    {
      key: `generalist-${context}`,
      context,
      mature: true,
      hypothesis: "Equal total machinery permits a specialist/generalist tradeoff",
      variants: [
        { label: "75% first-source investment", genotype: allocationGenome(0.75, c) },
        { label: "balanced investment", genotype: allocationGenome(0.5, c) },
      ],
    },
  ]);
}
function memory(s: Source): CapabilityCase[] {
  return [
    {
      key: "evolved-recurrence",
      context: "uniform1",
      hypothesis: "Observed recurrent weights improve performance beyond local and phasic inputs",
      variants: [
        { label: "sampled genotype", genotype: s.memory },
        { label: "recurrent block zero", genotype: s.memory, changes: { recurrence: "zero" } },
      ],
    },
    {
      key: "evolved-private-learning",
      context: "uniform1",
      config: { learning: "plastic" },
      hypothesis:
        "Paid private plasticity improves performance relative to alpha-zero, which also saves its cost",
      variants: [
        { label: "sampled plasticity", genotype: s.memory },
        { label: "alpha zero", genotype: s.memory, changes: { plasticityAlpha: 0 } },
      ],
    },
    {
      key: "actual-learned-transfer",
      context: "uniform1",
      hypothesis: "The sampled parent's acquired recurrent change benefits fresh descendants",
      variants: [
        { label: "inherited baseline", genotype: s.memory },
        { label: "baseline plus acquired change", genotype: s.learned },
      ],
    },
  ];
}
export async function capabilityFollowups(flags: Flags, engine: Engine): Promise<CapabilityCase[]> {
  const s = await capabilitySources(flags, engine),
    reverted = structuredClone(s.descendant);
  for (const c of reverted.chromosomes) c.behavior = structuredClone(s.ancestralBehavior);
  const cases: CapabilityCase[] = [
    ...access(s),
    ...processing(s, engine),
    ...memory(s),
    {
      key: "nearby-propulsion",
      context: "brief",
      hypothesis: "A mutation-scale swim bias change alters access at measured cost",
      variants: [
        { label: "source ancestor", genotype: s.ancestor },
        { label: "swim bias +0.06", genotype: s.ancestor, changes: { swimBiasDelta: 0.06 } },
      ],
    },
    {
      key: "evolved-access-brain-reversion",
      context: "brief",
      hypothesis:
        "The descendant brain is necessary for its access benefit with chemical and body genes fixed",
      variants: [
        { label: "specified descendant", genotype: s.descendant },
        { label: "ancestral brain", genotype: reverted },
      ],
    },
  ];
  return cases.map((test) => ({
    ...test,
    config: { ...s.config, ...test.config },
    provenance: s.provenance,
  }));
}
