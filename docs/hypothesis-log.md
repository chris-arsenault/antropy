# Evolution and ecology hypothesis log

Open hypotheses raised while observing the simulation. Entries preserve the question and its
evidence; they are not accepted explanations, implementation specifications or automatic experiment
orders. Append findings and decisions without erasing the original hypothesis.

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

**Raised by:** user, September 16, 2026. **Status:** open.

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
- Cells do inherit substrate recognition, product mappings and machinery allocation. Their
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

**Raised by:** user, September 19, 2026. **Status:** deferred research, not tested or scheduled.

Close neighbors may impose consequential pressure and offer opportunities for chemically
selective harm or feeding. Current pressure, contact, stress, repair and death-release rules
provide parts of that pathway. It remains unestablished whether harming a neighbor repays
its costs, whether the beneficiary is the producer or a bystander, and whether current contact
inputs support useful behavior. Different phenotypes should interact through actual chemical
susceptibility and machinery, rather than an explicit same/different-phenotype rule.

The [research design](design/cell-interaction-research.md) owns proposed shared operations,
conditional damaged-membrane access, accounting constraints and future bounded checks.
This hypothesis does not advance that work ahead of ecology/climate or authorize a campaign.
