# Environmental chemistry: rules and evidence

September 16, 2026. The [environmental plan](../../../ENVIRONMENTAL-ECOLOGY-PLAN.md)
adds geographic weathering, extracellular transformations and chemical shelter to the ordinary
Rust/WASM world. The [composed runtime](composed-runtime.md) retains the other physical laws.
The implementation uses checkpoint v14 and rejects earlier physical checkpoints.

## Implemented opportunity

Local conditions change how quickly exposed chemicals transform. Accumulated material reduces
that exposure through its concentration-weighted impedance. Cells can pay to produce and export
material that alters those conditions; other cells can benefit from the same deposit. The
deposit also disperses, weathers, impedes movement and can be taken up. Shelter has no owner.

This is an artificial rule system. There is no temperature field, entropy solver, atmospheric
energy source or new controller input. Organisms encounter the resulting chemical mixtures
through their existing receptors and funded machinery. Chemical potential remains a reference
value for the material/work accounts.

### Selected laws

For each chemical, compile a destination by taking the lowest-potential ID among itself and
the four reflected manifold offsets `(±4, 0)` and `(0, ±4)`. Resolve ties by ID. A fixed-point
chemical does not convert. Otherwise its susceptibility is `D / (0.025 + D)`.

With geographic angles `x` and `y` including a seed-derived phase, ambient activity is
`A = 0.5 + 0.25 sin(x) sin(y) + 0.2 cos(x) cos(t) + 0.2 sin(x) sin(t)`.
The temporal phase completes a cycle every 1,200 model seconds. This smooth periodic basis
lies within 0.05–0.95 and consumes no biological or source randomness.

Local exposure is `E = A / (1 + 8I)`, where `I` is nonnegative extracellular impedance.
At each physiology update, convert the fraction `a / (1 + a)`, with
`a = 0.025 × elapsed time × E × susceptibility`. Frozen donors prevent products from reacting
again in the same update. Material is conserved; lost reference potential enters weathering
heat. There is no usable-work credit. The feedback-off control substitutes `A` for `E` while
retaining the same geographic activity, conversion map, source schedule and biological laws.

The field operator applies conversion after the final diffusion/drift substep. It visits
active four-species groups, activates product groups and retains the existing numerical-floor
accounts. A derived cache stores three geographic coefficients per node and 256 compiled
destinations; save/restore reconstructs it from the persisted seed, time, chemistry and config.
No extra full chemical field is retained. Default mesh remains 2 on 320 × 240 geography.

### Observation

**Environment → Chemical weathering** shows low-to-high effective exposure in blue-to-amber.
It reuses the eighth scalar in the existing borrowed WASM/GPU texture. Selected-cell inspection
reports ambient activity, local exposure and fractional shelter. These are observer facts,
not controller inputs. Stats separately report transformed material and weathering heat.

The cumulative suppressed-conversion counter compares each frozen row with its unshielded
rate at that instant. It is not the amount a particular organism saved or a replay of an
alternative ecological history.

## Short causal evidence

All cases use the production field/physiology operators. Living fixtures pay ordinary
transport, synthesis, maintenance, repair and refitting costs. Mutation, private learning,
inherited learning and transfer are frozen in these constructed comparisons.

### Expensive barrier: physical effect, negative return

The zero-tick estimate assumed a stationary patch with fixed impedance. It counted synthesis
and transport but omitted spreading, deposit aging, injury and competition. Its predicted
strong-exposure benefit did not establish a live return.

In the 60-second abiotic comparison, allocating 0.4 of four material units to ID15 retained
1.77314 source units with feedback versus 1.52615 without feedback. The uninvested arm already
retained 1.77313. Accounts closed below `1.2e-14`. Whole-field ID15 remaining was 0.35264 of
the initial 0.4; this does not measure how long it stayed near a producer. Ledger 3904–3905.

A living cell exported 0.38133 ID15 by 300 ticks and reduced its local exposure to 0.26574,
versus 0.68266 with export disabled. It constructed less material: 2.6970 versus 2.9013.
In the two swapped finite-food comparisons, construction was 2.6510/2.6625 versus
2.8439/2.8281 for the idle-production control. It also lost without weathering. All paired
populations exhausted their finite supply before the 1,500-tick ceiling. Ledger 3906–3912.

This strategy fails its payoff prediction. No horizon extension or parameter sweep followed.
The earlier rebuilt-core barrier also failed its predicted reduction in tracer spread;
that [negative result](rebuild-results.md) remains negative.

### Cheaper byproduct: a small conditional construction return

A zero-tick property screen selected one alternative, ID245, for impedance, persistence and
small forgone processing value. It was not selected from population outcomes. One enzyme
produced it in place of terminal product ID240; the control processed/exported ID240 with
the same funded stocks. The membrane remained matched to ID240, retaining compatibility costs.
No physical rate or chemical law changed.

By 300 ticks the producer exported 0.34612 ID245. Local exposure reached 0.50718 versus
0.68252 with export disabled. This establishes paid expression of the physical coupling.

| Paired placement | Producer minus control construction, coupled | Same difference, feedback off | Increment attributable to coupling |
| --- | ---: | ---: | ---: |
| Forward | 0.011147 | 0.003379 | 0.007768 |
| Swapped | 0.036081 | 0.028976 | 0.007105 |

Ledger 3917–3925. Both products provide shelter; the alternative adds a small net growth
return after paid costs. The producer also has a small construction advantage without
weathering, so shelter does not explain its whole advantage. Survival and divisions do not
improve. These are constructed opportunities, not evolved adaptations or community evidence.

## Operating checks

Ordinary seed27 startup reached 600 ticks with 54 living cells, 54 divisions and maximum
generation 3. Residuals were `3.06e-9` work and `−2.14e-11` material. Its approximately
222 ticks/s overlapped a short assay and is not a matched capacity benchmark. Ledger 3913.

| Fully occupied field fixture | Average ticks/s | Slowest window | WASM high-water bytes |
| --- | ---: | ---: | ---: |
| 48 varied cells | 39.71 | 39.30 | 330,825,728 |
| 2,000 varied cells | 24.45 | 23.92 | 583,008,256 |
| 2,000 with funded growth | 19.89 | 18.02 | 798,687,232 |

Ledger 3914–3916. All three continue exactly after cold restore. The saturated large cases
remain below the 30 ticks/s floor and the 200 ticks/s target; these are recorded operating
limits already accepted for observation, not passing performance claims. Sparse ordinary
operation and a fully occupied field have different costs.

The isolated browser check used the existing server and the actual worker/WebGL2 application.
It rendered the weathering layer, inspected a cell, saved/exported state and recovered from
injected context loss. A half-second sampling loop overshot the 300-tick target to 392 ticks;
stepping took 1.687 seconds. The export was 2,078,963 bytes and WASM memory 209,584,128 bytes.
No user tab or save was touched. This is an operational check, not human motion acceptance
or browser endurance evidence. Final `make ci` passes 73 Rust and 60 Vitest tests, TypeScript,
formatting, documentation and Terraform formatting. ESLint reports 13 existing warnings and
no errors. Ownership guards and observer-neutrality tests remain enabled.

## Registered overnight investigation

Four 3,000-tick pilots passed, ledger 3926–3929. Matched source states and the independent
environment RNG remained identical in both seed pairs. Lineage traces, including dead cells,
reconciled with complete physical imports. Sampled RSS stayed below 250 MB.

The main cases use seeds 27 and 101, each with shielding on/off, ordinary mutable founders
and normal paid learning. Each ends at 500,000 ticks, 75 minutes, extinction or a declared
resource limit. Cases run sequentially in fresh processes. The full registration, candidate
rule and conservative resource bounds are in the plan. All four main cases and the eligible
four-case follow-up have now executed. No case was extended or replaced.

### Actual stopping horizons

| Seed / shielding | Ledger | Stop | Ticks | Living | Maximum sampled generation | Average ticks/s |
| --- | ---: | --- | ---: | ---: | ---: | ---: |
| 27 / on | 3930 | Extinction | 124,051 | 0 | 54 | 145.6 |
| 27 / off | 3931 | Extinction | 28,691 | 0 | 43 | 142.2 |
| 101 / on | 3932 | Archive limit; incomplete | 133,000 | 355 | 262 | 100.5 |
| 101 / off | 3933 | Archive limit; incomplete | 144,000 | 381 | 321 | 103.9 |

Main cases advanced 429,742 ticks in 62.7 minutes of measured execution. The registered
ceilings were limits, not minimum durations. Both resource stops preserved final checkpoints;
the complete cases occupy 1,111,043,307 and 1,122,059,305 bytes, below the 2 GiB per-case hard
envelope. The 1 GiB working threshold was crossed by a sample before the guard stopped stepping.
Full sampled genotypes dominate those archives. This is a headless experiment limit, not a
change to browser history or automatic-save retention.

Peak sampled process RSS was 259.6 MiB and WASM memory 156.7 MiB across the main cases.
These are 1,000-tick samples, not continuous OS peaks. Maximum sampled account residuals were
`6.18e-7` work and `2.68e-8` material. Every case retained the same source and binary digests,
and its harness digest stayed unchanged during execution. All four final checkpoints restored
to the recorded summary and byte-identical snapshots using their archived kernels.

The [local report](../../evidence/digital-chemistry/environmental/README.md),
[recorded trajectories](../../evidence/digital-chemistry/environmental/trajectories.png) and
[detailed flows and regional summaries](../../evidence/digital-chemistry/environmental/report.json)
retain pilots, main outcomes, whole-population founder denominators and provenance.
Raw checkpoints, sampled genotypes and traces remain under
`frontend/harness/artifacts/environment-2026-09-16-overnight/`.

### What changed in the populations and material flows

Source inventories, schedules and recorded environment RNG match at every common sample:
29 samples through tick 28,000 for seed27 and 134 through tick 133,000 for seed101.
The contrasts below therefore do not arise from different exogenous supply schedules.

Seed27 with feedback constructed 2,294.74 material by tick 28,000 versus 1,178.06 without it,
with 21 versus nine living cells. Both ultimately died. The coupled world's long tail was
mostly one cell, with no further construction after the early population collapse. Its later
extinction is not evidence of a proportionately longer functioning community.

At the common tick 133,000, seed101 with feedback had constructed 50,361.89 material versus
37,683.51 without feedback, a 33.6% difference in these two histories. Non-source chemical IDs
accounted for 26.11% versus 16.14% of cumulative imports; their final 1,000-tick interval
shares were 33.89% versus 11.25%. This measures a changed chemical diet, not independence
from renewed source material.

The coupled seed101 run imported 44,484.25 material of ID0, 37,008.62 of ID80 and 22,151.82
of ID186. Cells converted source IDs mainly into ID186 and neighboring products including
185, 170 and 202, and exported 16,487.80 of ID186. ID186 is the ordinary founder's terminal
product and generic decomposition material; it also has high impedance. Its production,
retention and reuptake connect metabolism, shelter and material reuse. ID64 uptake supplies
another path through abiotic weathering products. These chemical identities do not track
individual atoms or identify which producer supplied a consumer.

Mean local exposure at tick 133,000 was 0.01766 with feedback versus 0.41315 without it.
The coupled mean shelter fraction was 95.84%. The physically active shelter is therefore
common around surviving cells. Much of its material is ordinary metabolic output; this
does not establish deliberate or newly evolved investment in a special building chemical.

Both seed101 populations shifted toward smaller motor stocks. Mean funded motor/core ratios
at the common tick were 0.00558 coupled and 0.01122 uncoupled, versus 0.08 in the founder.
Mean inherited targets were 0.00552 and 0.01109: this is not only starvation leaving motors
unbuilt. Cumulative motor work per constructed material was 0.273 versus 0.368. Lower motor
investment also occurred without shielding, so it cannot be attributed solely to that feedback.
The data suggest a resident, lower-movement allocation worth testing; they do not prove its
causal advantage or that movement has become useless.

At the coupled endpoint, cells occupied seven of twelve fixed geographic bins. The largest
held 142/355 cells (40%), and mean funded motor/core ratios ranged from 0.00303 to 0.01376
across occupied bins. The upper endpoint came from a one-cell bin. Those descriptive
differences do not establish regional specialization. One founder lineage remained in each
seed101 arm, but hundreds of inherited genotypes remained; neither count establishes the
number of strategies or sustained coexistence.

### Selected-genotype comparison: no shelter-specific construction gain

The fixed nomination rule selected genotype156, carried by cell203 of lineage21 at tick2,000
in seed27/on. It qualified through actual high-impedance exports and the registered lineage
accounting screen. Nomination did not establish adaptation. Compare it with the original
founder using ordinary controllers, common paid installation, finite patches, frozen mutation,
private learning and inherited learning, feedback on/off and swapped placement.

| Placement | Candidate minus founder construction, coupled | Same difference, feedback off | Coupling-specific difference |
| --- | ---: | ---: | ---: |
| Forward | 1.313280 | 1.338439 | −0.025159 |
| Swapped | 1.328076 | 1.358428 | −0.030351 |

Ledger3934–3937; all four ended in extinction at 331–335 ticks, within the 1,500-tick ceiling.
The candidate divided once per initial cell; the founder did not divide. The common initial
paid construction was 1.52 material per founder and cancels in these differences. The candidate
had a construction advantage in both environments, slightly smaller with feedback. This
rejects the predicted shelter-specific construction advantage for this candidate and fixture.
It does not test the later low-motor seed101 genotypes. No substitute candidate was tried.
All four final checkpoints also restore exactly.

The four generated records are preserved as
[coupled forward](../../evidence/digital-chemistry/environmental/followup-on-forward.json),
[coupled swapped](../../evidence/digital-chemistry/environmental/followup-on-swapped.json),
[uncoupled forward](../../evidence/digital-chemistry/environmental/followup-off-forward.json) and
[uncoupled swapped](../../evidence/digital-chemistry/environmental/followup-off-swapped.json).

`flows.repair` includes paid repair work and dissipated material potential. The unchanged
nomination screen subtracts that whole recorded quantity; its score is not exact net usable
work. The report separates base repair work from total repair dissipation. Funded construction
and the controlled contrast, rather than that screening score, support the payoff statements.

### Next recommendation and handoff

Next, run a short paid comparison of saved low-motor descendants under persistent food and
food relocation, with a matched motor-allocation intervention. Establish whether resource
renewal gives movement a benefit that repays its construction and upkeep. First verify the
ordinary controller actually leaves a depleted patch and reaches renewed food. This tests
the emerging resident allocation and its counterpressure before changing more chemistry or
launching another long campaign. It is a recommendation, not an additional authorized run.

The environmental feedback now operates in the ordinary world and changes material flows,
exposure and funded growth. The short constructed byproduct opportunity remains positive;
the selected evolved genotype's shelter-specific construction prediction is negative.
Enduring ecological diversity and days/weeks browser operation remain unresolved. The centered
seed27 default and ordinary founder remain unchanged. Human review of motion, centered
activity and the new weathering display is pending; the isolated browser check cannot replace it.
