# Evolution and ecology hypothesis log

**Status:** Current reference — open hypotheses with dated dispositions; H1's mutation law is implemented, H4 is partly implemented by v33 cellular exchange, and H2/H3 remain questions.

Open hypotheses raised while observing the simulation. Entries preserve the question and its
evidence; they are not accepted explanations, implementation specifications or automatic experiment
orders. Append findings and decisions without erasing the original hypothesis.

## Disposition update — September 30

V43 replaced machinery construction and
allocation with genetic body proportions expressed at current biomass; the September 26
ecological incentives added crowding costs, passive membrane exchange and private
light-supported metabolism. H4's shared crowding, paid exchange and injured-neighbour access
were implemented by the v33 [cellular exchange design](design/cellular-organization-and-exchange.md);
whether a strategy using them repays its costs remains open.

## Disposition — September 20

The dated descriptions below retain their original equations and evidence. They are not all
current runtime behavior. H1 led to the shared heavy-tail law and geometric mutation now
documented in [funded inheritance](design/funded-bodies.md#bodies-policy-composition-and-mutation);
the first formula's suppressed physical changes and later excessive domain scaling remain
failed steps in the [decision record](design/decisions-and-evidence.md). Accessible large changes
are implemented, but mutation alone did not establish waste feeding.

H2 remains open as a question about inherited extraction differences. Shared local external
work now changes reaction returns with the medium and illumination; conversion efficiency for
an otherwise identical transition remains shared. This is not implementation of a heritable
efficiency gene. The v31 [200k review](integrated-200k-review.md) found feedstock dependence;
the v32 [user checkpoint](material-habitats-review.md) broadens uptake but still has feedstock-heavy
net flow. H3 keeps its original history-dependent conclusion; H4 remains deferred.

## Context: September 16, 2026

The [default seed 27 run](default-seed-cycles-study.md) produced an interesting positive result:
population die-offs and recovery, replacement by an evolved branch, different diets, changed
metabolic products and increased material recycling. Evolution is occurring. The questions below
concern access to more distinct ecological roles and a food web, not whether that evolution counts.

The user expects most observations to carry over after the microclimate correction. That work
must bring the climate/ecology additions into the established mathematical architecture; it is
not a mandate to rewrite the mathematical foundation. These hypotheses do not expand that work.
Explaining individual phenotypes will eventually support better UI legibility.

## H1 — Mutation magnitude may prevent major evolutionary departures

**Raised by:** user, September 16, 2026. **Status:** heavy-tail mutation mechanism
implemented; waste feeding unestablished.

The concern is the magnitude and distribution of individual mutations, not simply how often
mutation happens. If changes are effectively confined to small steps, cells may keep refining an
existing phenotype while rarely or never reaching a substantially different one. Drastic mutations
should be possible, including changes large enough to open a different chemical input neighborhood.
Increasing the overall mutation frequency would not by itself answer this concern.

### Evidence and current implementation

- In the 50,000-tick run, none of the 3,843 sampled genomes had enzymes recognizing the main
  waste chemicals 170, 185, 186, 187 or 202. Complete reaction accounting recorded no metabolic
  consumption of those chemicals. Sampled genomes exclude variants born and lost between samples.
- Enzyme recognition reaches three chemical-coordinate units; the closest observed enzyme to
  those wastes was still more than ten units away. Cells could import waste without burning it.
- Chemical-coordinate mutation in [genetics.rs](../engine/src/genetics.rs) uses Gaussian steps
  scaled by `physicalMutationScale`, currently 0.12, with coordinates reflected into the domain.
  It does not explicitly clamp each jump to 0.12. The hypothesis concerns the effective absence
  of substantial jumps under this distribution, rather than an established literal step clamp.
- The run contained 2,318 divisions and reached maximum living generation 104. This observation
  does not distinguish insufficient opportunity from an ineffective mutation distribution.

**Question to retain:** Can mutation produce viable, substantially different chemical machinery
on useful observation timescales, or does its magnitude distribution practically trap descendants
near the founder's roles? Consider the frequency of rare large changes separately from ordinary
small changes. No replacement distribution or parameter value is selected here.

## H2 — Universal energy yield may favor the same chemical transitions

**Raised by:** user, September 16, 2026. **Status:** open.

If every cell extracts the same energy per unit from a given resource-to-product transition,
there may always be a universally preferable transition. Evolution could repeatedly converge
on the same processing choices instead of supporting organisms that obtain different returns
from the same resources and leave different opportunities for other organisms.

The concern is cell-dependent extraction yield and its tradeoffs, not merely different uptake
rates, enzyme quantities, food availability or preferences. Those can change how much a cell
processes without changing the energy it extracts from each unit of the same transition.

### Evidence and current implementation

- [Reaction accounting](../engine/src/chemistry.rs) derives yield from the fixed chemical
  potential difference and the world-wide `conversionEfficiency`, currently 0.8.
  [Compiled enzyme operators](../engine/src/chemical_operators.rs) also account for the shared
  conversion charge. There is no inherited cell-specific efficiency for an identical transition.
- Cells do inherit substrate recognition, product mappings and body-capacity proportions. Their
  processing rates, operating costs and net returns can therefore differ. The unresolved concern
  is whether those differences are enough to prevent convergence driven by the shared yield rule.
- The observed cells diversified their products, but continued drawing metabolic energy from
  the original food neighborhood. They reimported waste as material without evolving waste-fueled
  metabolism. This motivates the hypothesis; it does not establish a universal optimum.

**Question to retain:** Does fixed yield make the same resource-processing outcome preferable
across phenotypes? Could inherited differences in extraction, with explicit costs or tradeoffs,
support different uses of the same food and leave usable resources for other organisms?
No efficiency mechanism, energy-account change or mathematical redesign is selected here.

## H3 — Escape from the founder's waste product depends on early evolutionary history

**Raised by:** investigation requested by the user, September 18, 2026.
**Status:** supported for the measured 20k histories; general reliability remains unresolved.

The symmetry version's larger #186 stock may primarily reflect which metabolic variants
establish, rather than a new chemical preference for #186. Chemical mutation now consumes a
different number of shared genetic random draws, changing subsequent neural/body mutations
despite their unchanged formulas. The same world seed therefore does not pair the same
genetic opportunities across versions.

The [causal investigation](186-symmetry-causality.md) finds a specific old-run enzyme mutation
at tick 2960 whose descendants redirect production toward #218. Removing just that inherited
scalar under the original mathematics increases 20k #186 share from 17.13% to 25.18%; the
symmetry control is 26.30%. Keeping all new rules unchanged but skipping one initial genetic
draw gives 37.27%. Alternative pathways remain accessible, and #218 has a measured conditional
advantage when intracellular #186 inhibits the original enzyme.

These interventions support sensitivity to successful early metabolic branches. They do not
prove that symmetry has no systematic effect across repeated histories, or that the same
explanation accounts for every later snapshot. Preserve the distinction between removing the
forced death-product sink and reliably evolving away from the founder's inherited metabolism.

## H4 — Local cell interactions may support additional conditional strategies

**Raised by:** user, September 19, 2026. **Status:** partly implemented in v33 (crowded
access, paid exchange, injured-neighbour access); strategic payoff untested.

Close neighbors may impose consequential pressure and offer opportunities for chemically
selective harm or feeding. Current pressure, contact, stress, repair and death-release rules
provide parts of that pathway. It remains unestablished whether harming a neighbor repays
its costs, whether the beneficiary is the producer or a bystander, and whether current contact
inputs support useful behavior. Different phenotypes should interact through actual chemical
susceptibility and machinery, rather than an explicit same/different-phenotype rule.

The [research design](design/cell-interaction-research.md) owns proposed shared operations,
conditional damaged-membrane access, accounting constraints and future bounded checks.
This hypothesis does not advance that work ahead of ecology/climate or authorize a campaign.

## H5 — Physical mutation load can erase viable inherited function

**Raised by:** the user's repeated-extinction repair request, October22,2026.
**Status:** supported as a contributor in a matched late-world comparison; weeks-long persistence
remains unestablished. This concerns mutation frequency, independently of H1's requirement that
large changes remain accessible.

The v56 world repeatedly recovers population while losing occupied reservoir neighborhoods,
then goes extinct at tick2,524,755. Its final parent still divides; both daughters starve within
19 model seconds and change13 and10 recognition sites respectively. Extinction alone does not
establish that selection favors maladaptation. The represented genome receives an expected20.6
physical mutation opportunities per haploid birth at the old per-coordinate probability0.1.
Useful inherited combinations can be disrupted across multiple sites before selection acts.

From the same329-cell late checkpoint,600-model-second controls end at114 cells in reference,
267 with all new mutation off,260 with physical mutation alone off, and136 with birth assimilation
off. Ordinary behavioral mutation and paid private learning remain active in the physical-only
control. At3,600 model seconds, a nonzero physical probability1/206 ends with526 cells versus101
in reference,6,423 versus3,169 divisions, and4,118.5 versus1,323.8 funded biomass growth. The
selected branch has197 more living cells than it started with; reference loses228. These are
one checkpoint's trajectories, not independent ecological replicates or a complete cause of
every earlier extinction.

The selected default averages one physical opportunity per daughter in the current keyed
representation. It changes neither the common heavy-tail magnitude law nor the possibility of
large recognition and transformation innovations. Existing saved configurations retain their
settings; prospective operator patches affect only future births. No frozen evolution, survivor
promotion, assigned chemical role, automatic reseeding or free material/work is introduced.
The [execution registration](plans/CHECKPOINT-ANALYSIS-PLAN.md#october22-sustained-evolution-repair-registration)
owns the comparison and its limits. Resource accessibility, environmental change and unmeasured
long-run population exchange remain possible additional constraints.

## H6 — Activity assimilation permanently amplifies inherited output bias

**Raised by:** the user's October24 correction that the goal is indefinite evolving persistence,
not a longer extinction horizon. **Status:** a directional inheritance defect is reproduced and
corrected in physical v57; its share of whole-world extinction remains unresolved.

The October22 change adjusted physical mutation probability. It did not repair this mechanism.
V56 adds each permitted acquired actuator bias to an ordinary neural output weight at birth.
Private response relaxes when activity stops, but the earlier additions are now immutable
genotype values and cannot relax. Enzyme activity is nonnegative, so its repeated assimilation
pushes inherited bias upward even without random mutation or evidence of useful return.
This can persistently favor costly processing and reduce conditional control. Accepted activity
is participation, not a measure of benefit; the selected uphill-loss cases from October16 remain
relevant consequences rather than evidence that every uphill reaction is waste.
A live v56 reinforcement ablation could remove current private influence but could not remove
ancestral additions already stored in ordinary weights. Those earlier contrasts therefore do
not isolate the mechanism's complete inherited history.

The retained final21 ending records of the extinct v56 world have enzyme-policy bias median14.21
across168 stored slots, including inactive slots; two active biases of the final dividing parent
are at16. This is a selected terminal history, not a prevalence estimate or an isolated causal
intervention. A controller regression separates the mechanism from ecology:32 identical paid
activity/birth cycles with no mutation move an initially zero policy bias to16 in v56. Inactivity
cannot remove it in descendants. No world advancement is needed to reproduce the defect.

V57 stores the assimilated responsiveness separately in the immutable birth genotype. New private
response starts at that bounded vector and follows the existing paid affine update. Birth copies
the retained current response instead of adding it to ordinary policy weights. Repeated identical
experience converges to the same response, and withdrawal removes the inherited response through
ordinary paid relaxation. Diploid expression, recombination, common behavioral mutation, enzyme
program changes, physical birth and checkpoint persistence include the vector. No new reward,
successful-mutant filter, population repair, resource multiplier or independent control is added.
Recurrent plasticity and its separate assimilation remain unchanged.

The regression first fails against v56 with actual bias16 versus expected0. After correction it
covers repeated births and withdrawal; physical fission/budding checks preserve material and work
while transmitting responsiveness without rewriting policy. The goal is a repair of a known
directional failure, not a declaration of indefinite survival from another finite trajectory.
