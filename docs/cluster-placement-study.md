# Cluster placement experiment

**Status:** Historical record (physical v42 before the September 26 ecological incentives, September 25) — effect sizes belong to the archived kernel; the current work order is in [design/README.md](design/README.md).

Registered September 25, 2026, before stepping. The user requested the next experiment and
observation of the running server. This asks whether starting together helps two sampled
descendants acquire and use resources, compared with starting spread out. It does not change
the live world or select a replacement founder.

Historical results use the kernel before the September 26
[ecological incentives](plans/archive/ECOLOGICAL-INCENTIVES-PLAN.md) changes. The driver remains usable
with the current kernel; such runs are new comparisons, not reproductions of these effect sizes.

## Question and prior evidence

The [design work order](design/README.md#design-goal-and-present-evidence) seeks conditions
where different inherited choices repay their costs. [Geography](design/persistent-geography.md)
distinguishes a change in relative returns from a uniformly harder environment. The
[light checks](light-ecology-results.md) established sensory/physical responses but no profitable
whole-cell shelter or emitter result. Do not assume another light variation will disperse cells.

Read-only inspection of the saved v42 world at tick 134,921 found large, energy-rich clumps,
little motor tissue in many cells and little immediate response to directional light.
Bodies can improve neighboring chemical work conditions, while contact adhesion suppresses
relative motion. Neither fact tells us which effect determines an actual funded outcome.

Competing predictions:

- Together: shared body effects improve chemical work enough to outweigh competition,
  contact, repair and movement costs. Net construction and surviving descendants improve.
- Spread: independent access and movement outweigh loss of neighbor effects. Intake and
  growth improve, particularly for the sampled genotype with larger inherited motor stock.
- Neither: finite food, lost private experience or inappropriate starting mixtures prevent
  a useful comparison. Preserve this outcome; do not extend the horizon to find a winner.

## Inputs and controlled conditions

Source: ignored local checkpoint `live-before-terrain-20260925T075717Z/world-g1-t134921.bin`,
SHA-256 `1e24fc5acb7d10ec0748b7a9263aed14dde59f5fe48ed2d4c256f62b1694c171`.
Candidates were selected before running by median inherited motor/core ratio within the
largest and third-largest groups connected at six world units; tie by cell ID. They are
cell 421509/genotype 421465 and cell 439026/genotype 438982. Their source groups have 2,648
and 319 cells; both descend from founder 13. This samples two existing inherited choices,
not an unbiased survey of all genotypes or certified stationary/mobile strategies.

Use ordinary seed-27 physics and the saved configuration except these explicit controls:

- 32×32 periodic plane, unchanged mesh 2. No reservoirs, zones or epochs.
- Finite uniform supply: 51.2 material each of chemicals 0 and 136, concentration 0.05 each.
  No replenishment. Ordinary public chemistry, binding, diffusion and washout remain active.
- Uniform constant external light 1: contrast and geographic shade strength zero. This
  removes geographic quality as a confound; it does not test terrain navigation or night.
- Mutation, private learning and inherited learning disabled. Saved genes are used unchanged;
  fresh cells do not carry the source cells' private neural state or acquired tissue.
- The existing fixture pays for the inherited target bodies from ordinary founder packets,
  returning surplus tissue to inventory. Record actual initial stock and energy separately.
- Populations contain eight descendants of each sampled genotype. Each genotype receives
  all four original founder packet compositions and heading directions equally.
- Close placement: centered 4×4 array with spacing 0.45. Spread placement: centered 4×4 array
  with spacing 6. Each placement runs twice with genotype rows exchanged. No teleporting or
  action override during the run; cells can move, grow, divide, die and cluster freely.

Initial fixture preparation records basal upkeep, maximum translation/turning expenditure,
reserve duration without income and total importer turnover ceiling using actual funded
stocks. The 102.4 supplied material and common body packets are identical across placement
arms; body-dependent reaction income is measured, not assumed from chemical potential alone.
These bounds exclude repair and construction costs and do not promise positive surplus.

## Budget and decision gates

1. Two single-cell probes, one per sampled genotype: at most 300 ticks each, 120 wall seconds
   each. Inspect local readings, actual intake, chemical work, paid movement and expenses.
2. Four matched population runs: at most 1,500 ticks each, 120 wall seconds each. Proceed only
   if the probes execute valid accounting and show actual chemical processing; extinction
   of an isolated cell can itself motivate testing whether neighbors rescue it. A mechanical,
   accounting or fixture failure blocks the populations until diagnosed.
3. Maximum six runs, 6,600 ticks and 720 stepping wall seconds. Stop at the horizon, extinction,
   error or wall cap. No automatic seed, concentration, horizon or genotype expansion.

The 300-model-second population horizon checks resource access and funded construction;
it does not span a light cycle or establish evolved coexistence. Record results per initial
founder, actual survivor counts, organism time, imports, reaction work, motor/maintenance/
transport/repair/construction expenses, net standing biomass and observed motion. Compare both
swapped placements; a disagreement is evidence of sensitivity, not permission to average away
the inconvenient arm. More descendants alone is not proof of invasion or cooperation.

Run the existing QuickScenario/QuickObserver/ledger pipeline. Save initial/final checkpoints,
configuration, source/binary hashes, budgets, traces, chemical flows and stopping reasons in
new ignored directories. No extra physical law, observer path or production tuning is added.

Separately observe the live server for 180 seconds using the existing spectator collector,
one socket and ten-second samples. Record population, contacts, motion and optical investment.
This continuing run has mutation and learning enabled and is not a control for the experiment.

## Reproduction

From `frontend`, use a new output root and the current saved checkpoint:

```sh
pnpm exec tsx harness/numerical/clusterPlacement.ts harness/artifacts/cluster-placement-20260925 prepare harness/artifacts/live-before-terrain-20260925T075717Z/world-g1-t134921.bin
pnpm exec tsx harness/numerical/clusterPlacement.ts harness/artifacts/cluster-placement-20260925 budget
pnpm exec tsx harness/numerical/clusterPlacement.ts harness/artifacts/cluster-placement-20260925 probe
# Inspect probe results before this step.
pnpm exec tsx harness/numerical/clusterPlacement.ts harness/artifacts/cluster-placement-20260925 contest
```

## Results

**Interpretation corrected in the [follow-up](cluster-bottleneck-study.md):** the target-body
fixture overfilled storage, blocking early imports. Its proximity benefit is a result about
that constructed starting state, not evidence that actual saved cells cannot live alone.
The follow-up retains actual-state transplants and the later scope correction excluding
chemical-conversion investigation. Current implementation decisions are recorded in the
[ecological incentives plan](plans/archive/ECOLOGICAL-INCENTIVES-PLAN.md).

Completed all six registered cases without extending a horizon or changing the conditions.
Ledger rows 4362–4367 and raw artifacts remain local in
`frontend/harness/artifacts/cluster-placement-20260925/`.

**Starting together rescued one sampled genotype; spreading out rescued neither.** This
establishes a benefit of proximity in this constructed environment. It does not establish
which neighboring effect caused it, or that either genotype represents all live cells.

| Placement | End tick | Living cells | Standing biomass | Material imported |
| --- | ---: | ---: | ---: | ---: |
| Together, assignment 1 | 1,500 | 50 | 17.122 | 15.019 |
| Together, assignment 2 | 1,500 | 47 | 17.066 | 15.034 |
| Spread, assignment 1 | 77 | 0 | 0 | 0 |
| Spread, assignment 2 | 77 | 0 | 0 | 0 |

Every population started with 16 cells and 4.168 standing biomass. Each placement pair had
byte-identical initial field files and equal per-cell body stocks, inventories, energy,
heading and genotype. Only positions differed. Both assignment swaps gave the same direction
of result. These are placement checks with one seed, not independent evolutionary replicates.

The isolated probes died at ticks 60 and 50. They sensed local chemicals, moved 0.594 and
1.058 units, processed internal material and captured some reaction work, but imported nothing.
Accounting closed in both cases. The registered gate allowed the population comparison to
test whether neighbors rescue this failure; survival was not required to pass the probe.

### What survived and what paid

All final survivors descended from the large-clump genotype. Its eight initial cells produced
50 and 47 living descendants; the other eight left none. Four of those eight large-clump
founder families survived in each close-placement run. They started with packets containing
chemical 136; the other packet types died. Initial composition therefore matters alongside
placement. The single-cell probes used only the first packet type and did not represent all
four population starting inventories.

The early rescue preceded food intake: original founders recorded no import before division.
At tick 60, matched surviving large-clump cells in the close placement captured about
0.014–0.024 work per sampled tick, versus 0.0015–0.0023 when spread. Their descendants later
imported material and increased standing biomass by about 12.9 above the common initial total.
Approximately 94% of their imported material was chemicals 0 and 136. This was not merely
longer survival without external intake, though cumulative imports do not identify whether
each molecule originated in the added field or a released founder packet.

Across the full close-placement runs, the surviving genotype captured 77.36 and 78.03 work;
maintenance cost 32.25 and 32.28, construction 8.68 and 8.63, repair 13.41 and 13.37, and motors
0.187 and 0.187. Direct contact supplied only about 0.6% of imports. These totals cover different
surviving populations and durations; they are not per-cell causal comparisons with extinction.
The nearby chemical environment, embodied effects, deposited cover, death releases and
controller responses all remained coupled. The run does not isolate any one of them.

### Validation and limits

Maximum material and energy accounting residuals were below 2×10⁻¹² percent in all six cases.
This checks closure under the kernel's recorded accounts, including numerical losses; it is
not a claim of exact numerical trajectories. The original budget file reports energy before
the first capacity clamp. Founder energy exceeded these small evolved bodies' capacity, so
the applicable upkeep-only reserve bounds are about 40 and 32 model seconds, not the raw
170 and 157. Repair and construction shorten those bounds. The driver now records both.

Fresh founder packets, paid target-body assembly, reset private state, uniform light and
frozen learning differ from the source world. No terrain preference, evolved dispersal,
indefinite survival or benefit to the more mobile genotype was established. There is no basis
here to call these clumps cooperative superorganisms. The evidence supports a narrower
decision: diagnose what makes proximity profitable before adding more environmental variation.
The next discriminating comparison should preserve the successful starting state and separate
neighbor contributions to chemical work from local chemical accumulation and retention.

### Running server

A separate three-minute spectator watch observed ticks 40,852–47,177 of the reset v42 world
on kernel `f3521f20cae3a50ac0fadf441a07cca9d9bd8bd7`. Population changed from 1,366 to 1,582,
with intermediate falls and rises. Median reported throughput was 37.5 ticks/second; the
minimum was 21.3, below the 30-tick target. At the end, the largest proximity group held
601 of 1,582 cells (38%); only ten cells had no neighbor within six units. Actual contact rose
from 30.3% to 40.9% of cells. The saved maps visibly retain concentrated groups.

This confirms that clustering is developing under the new terrain. Comparing this young
world with the mature saved world cannot measure terrain's causal effect. Observation artifacts
and maps remain in `frontend/harness/artifacts/live-terrain-progress-20260925/`.
An authenticated status read after the experiment confirmed generation 2 still running at
tick 65,234 with 2,623 cells and a successful automatic checkpoint at tick 56,225. No live
controls or physical parameters were changed during this experiment.
