# Funded bodies and inheritable learning

September 10: [strategic ecology](strategic-ecology.md) extends the funded-body model to eight
material stocks, two processing pathways, toxin/defense/repair, matrix and decomposition.
Checkpoint v5 replaces v4. The material/energy and inherited-learning principles remain;
single-food equations and death sinks below describe the preceding implementation.

The user approved this direction after reviewing the physical-model proposal on September 9.
Plan `49f9eee2-3e74-4eb8-8643-5e927bf32eda` replaces the allocation tuple and corrects the
non-inherited learning implementation. This document supersedes those portions of
[the first evolutionary extension](bacterial-evolution.md). Substantial further design changes
require user review before implementation.

## Physical information and actual construction

Four independent bounded genes specify reference newborn core size, motor abundance, transporter
abundance and storage scaffold abundance. Zero genes reproduce the reference blueprint. Targets
use positive exponential multipliers; they are not normalized to sum to one. Increasing motor
target leaves the other absolute targets unchanged. Changing core size scales the whole blueprint.

Every cell owns four actual material stocks: core, motor, transport and storage. It also owns
stored nutrient material and usable energy. A genotype is a construction target, never a grant
of machinery. Actual stocks determine capabilities. Deficits toward twice the newborn blueprint
drive physiological construction, bounded by material, usable energy and assembly rate. Available
assembly is shared in proportion to material deficits; stock already built is retained. This is
a resource-limited developmental law, not an evolved construction scheduler.

Each unit of new structure consumes one unit of stored material plus a configurable synthesis
energy cost. Core and each machinery class have explicit maintenance rates. Nothing is dismantled
or replaced automatically when a newborn inherits a different target. It grows toward its own
blueprint using the physically inherited stocks. No material-generating developmental override exists.

## Geometry, motion and acquisition

Positions and motion stay in XY. A spherical reference body has scalar volume
`V = structuralMass/bodyDensity + storedNutrient/reserveDensity`, with radius
`r = cbrt(3*V/(4*pi))`. Empty storage scaffolds have material cost; loading their reserves adds
volume. This collapsible storage approximation does not model organelles or intracellular pressure.

Viscous translational and rotational resistance are `6*pi*viscosity*r` and
`8*pi*viscosity*r^3`. Installed motor power is motor material times power density; efficiency
converts chemical power into useful propulsion. Maximum speed and turn rate follow the square
roots of useful power divided by the corresponding resistance. The squared swimming and turning
efforts share one installed power budget. Affordable expenditure reserves maintenance and solves
the quadratic motor plus linear secretion-energy budget. There is no coasting.

Rotational Brownian diffusion uses thermal energy divided by rotational resistance. Contact
correction gives the smaller, more mobile body the larger displacement. The local overlap solver
is approximate; no full fluid or rigid-body solver is introduced. The equations use the low-Reynolds
number reference described by [Purcell](https://www.physics.brocku.ca/Courses/1P92_Kaur/SolidsFluids/Life-at-low-R/).
Parameter magnitudes are dimensionless simulation calibration, not measured bacterial constants.

Transporter material supplies a saturating kinetic uptake ceiling. An unresolved near-body
diffusion conductance `4*pi*D*r` supplies a second ceiling. Their harmonic combination represents
serial transport limitations; the raster field still limits actual available material and shares
it among nearby consumers. The field represents a unit-depth layer. Applying a spherical boundary
law to that layer is an explicit coarse approximation, not a resolved 3D diffusion calculation.
More transporters cannot create nutrient or evade a diffusion bottleneck. The receptor/transport
motivation follows [Berg and Purcell](https://pubmed.ncbi.nlm.nih.gov/911982/).

Storage capacity is actual storage scaffold times a material binding capacity. Usable-energy
capacity is proportional to core material. Catabolism consumes stored nutrient and produces usable
energy at a finite core-dependent rate and efficiency. Spent nutrient enters a recorded waste sink.
Sensing retains local tonic/phasic/contrast readings. Own-body channels report actual motor,
transporter and storage capacity, and a new channel reports stored nutrient fill. Target genes do
not masquerade as actual capability. Receptor noise and propeller morphology remain future work.

## Separate accounting and funded reproduction

One feedstock supplies structural material, metabolic fuel and secreted chemical. Every unit has
a configured chemical energy content. Material and energy have separate ledgers:

```
initial material + supplied material
  = environmental nutrient + secreted chemical + living structure + stored nutrient
    + metabolic waste + field decay + dead material

initial energy + supplied material * chemical energy per unit
  = usable energy + chemical energy in living/environmental material
    + metabolism + motors + learning + synthesis + secretion processing + division
    + catabolic inefficiency + chemical energy lost through decay and death
```

Secreted chemical consumes precursor material as well as processing energy. It retains chemical
energy until decay but is not edible. Death and spent metabolic material enter recorded sinks;
recycling and additional chemical species are not implicit. Initial founders and external sources
are the only external grants, fully accounted at initialization and supply.

Reproduction requires all actual stocks to reach twice the parent's genetic newborn blueprint,
minimum stored food and usable energy for both resulting bodies, division energy and local space.
Fission divides every material stock, stored nutrient and post-cost energy equally. Budding uses
the same split but retains one body's parent identity and memory. Gene mutation changes future
construction, not stocks transferred at birth. Placement uses the actual post-split radius;
existing neighbors cannot be displaced to manufacture space.

## Inheritable learned information

The previous interpretation was wrong: the user requested inheritable learning, not only
inheritable learning rules. The recurrent block is lifetime-dynamic; input/output weights and
biases remain lifetime-static. Both categories remain genetically mutable at birth.

The expressed parent uses `W + abs(alpha)*H`. Before genetic transmission, a birth-local copy of
each parental chromosome receives `retention * abs(expressedAlpha)*H` in its recurrent block.
The same learned delta is added to both homologs for additive diploid expression. Weight bounds
still apply. Crossover and mutation then operate on these learned chromosomes. The parent genome
is not edited: another organism sharing it must not acquire that parent's experience remotely.

Default retention is one. Zero retention provides a non-inheriting experimental control. Offspring
start with zero new plastic traces, hidden activity and task byte, so the learned contribution is
present exactly once in their inherited baseline. A surviving budding parent keeps its original
baseline and traces; successive births do not repeatedly add the same delta into its own genome.
Inherited changes can persist through grandchildren even without further learning or mutation.
Learning transfer and random mutation have separate counters; genetic ancestry records the source
genome and amount of transferred learning. This is an explicit Lamarckian mechanism in an artificial
organism, not a claim about biological bacterial memory.

Checkpoint v4 stores actual stocks, food material, usable energy, both ledgers, construction targets,
acquired traces and learning-transfer provenance. Earlier bacterial schemas are rejected rather
than assigning missing material or invented memory. Static/plastic inference, retention, mutation
and existing ploidy/transmission/reproduction policies remain separately configurable.

## Verification scope

Bounded mechanics must establish construction affordability, independent gene targets, diffusion
limits, stored-food geometry, local division transfers, dual conservation, learned-weight
transmission without double counting, and deterministic checkpoint continuation. A short harness
panel checks reproduction and transmitted learning under the Run default and a retention-zero
control. It does not certify adaptive learning, evolved specialization or human-visible motion.

## Implementation measurements

Ledger runs 2829–2831 use seed 101, 48 founders, persistent sources and 3,000 ticks (600 model
seconds). All three use paid plasticity. Each run's before/after source digest agrees, and the
three digests match (`f6985ca9716612a32f65f747d175490d0e9f8183276d34916ed0f40440e93e53`).
Only inspector whitespace was formatted after this panel; no runtime mechanism was retuned.

| Run | Random mutation | Learning retention | Living | Divisions | Starved | Births receiving learned changes |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| 2830 | Both blocks off | 0 | 342 | 301 | 7 | 0 |
| 2831 | Both blocks off | 1 | 352 | 305 | 1 | 610 |
| 2829 | Both blocks on; Run default | 1 | 347 | 313 | 14 | 626 |

The default constructs 547.75 material units and reaches generation four. Its living bodies have
installed motor power from 0.0135 to 0.0369, storage capacities from 1.348 to 4.318, and radii
from 0.412 to 0.621. These ranges include ordinary growth as well as genotype variation; they
are not estimates of genetic variance. Mean additional acquired recurrent-weight RMS at the
endpoint is `2.62e-5`. Transferred learning and mutation have separate counters.

The mutation-free retention-zero control keeps one genome identity. With retention enabled,
acquired information creates new genotype records without random mutation. Genome identity counts
are ancestry records, not deduplicated sequence diversity; identical siblings can have separate
records. The ten-cell census difference is one seeded observation, not evidence of general adaptive
learning. No candidate was selected or promoted, and the learning rule remains a weak founder rule.

Maximum sampled energy residual is below `3.95e-9`; material residual is below `8.99e-10` in all
three runs. Local traces and complete v4 checkpoints are under
`frontend/harness/artifacts/funded-bodies-2026-09-09/`; the SQLite ledger is the durable index.
The new mechanics and checkpoint continuation pass 53 bounded tests in ten files.
The first full CI attempt stopped on inspector formatting; that whitespace was corrected natively.
The final `make ci` and production build pass.
Changed motion remains for human review. No browser assay, server or offline training was run.
