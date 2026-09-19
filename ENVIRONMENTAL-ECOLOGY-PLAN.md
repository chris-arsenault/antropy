# Environmental ecology

September 19: the [resource-binding proposal](docs/design/resource-binding-proposal.md)
supersedes the fixed-basin remedy in the [50k spatial review](docs/design/spatial-isolation-review.md).
Next work is shared, composition-dependent attraction and nonlinear repulsion that bind
resource neighborhoods. The user rejected prescribed wells and does not require migration,
chaos or perpetual turnover. The proposal selects a six-unit shared attraction length and
its evaluator. Static and short source-only dynamic probes support implementation; integrated
binding and performance remain unverified. B1–B3 in that proposal are the next work sequence.
The v18 evidence and remaining human review below retain their historical scope.

Status: local-medium weathering verified; user reports positive visual review through at least 8,000 ticks.
The requested 50,000-tick observation and deep analysis are complete (ledger 3989).
C3 is complete; C4's registered browser operational check remains. Earlier M0–M3 evidence is retained.
Sulion root: `5e88cd8a-1314-4622-9989-4bb02af68581`.

<a id="weathering-50k"></a>

## September 17 — Authorized50,000-tick observation

The user explicitly requested one50k run with intermittent checkpoints and deep analysis, plus
a life-focused successor name and favicon. Adopt C3 (`9a995b65-1a8e-40d8-b895-e262f8d71527`)
steps2–3 for this study and step4 for the small identity change. No simulation laws or constants
change. Use seed27, chemistry101, checkpointv18 and the verified default configuration.
The completed3,000-tick pilot3986 and the user's positive visual review through8k qualify execution.

**Question:** how do survival, inherited capabilities, local resource access and chemical flows
change across depletion/renewal and repeated population turnover? Competing explanations include
continued exploitation of supplied IDs0/80, use of environmentally transformed inputs, consumption
of exported/death material, relocation among patches, and changing funded costs or compatibility.
Distinguish a changed inherited target from installed machinery and realized import/reaction flux.
Do not require mutation to occur after an environmental change to recognize evolution.

**Prediction and decision:** local environmental processing can alter available substrates and
which descendants expand. Resolve whether observed recoveries retain the same inputs or exploit
different ones, and whether the chemistry provides plausible additional niches. Findings guide
the next ecological/legibility work, not automatic founder replacement or parameter tuning.

**Budget and capture:** one50,000-tick run,30-minute wall cap; stop at horizon, terminal extinction,
account/nonfinite failure or existing resource limits. Reuse ecologyCorrection/main and runRecorded.
Sample every250 ticks; save exact initial, every2,500-tick and terminal physical checkpoints plus
the loaded WASM binary, resolved configuration and hashes. Capture full-population census, sampled
genomes, installed stocks, positions, source inventories/output mixtures, cumulative per-founder
chemical imports/exports/reactions and organism-time accounts. Up to8 representative inspections
every1,000 ticks are illustrative; population conclusions use complete census/flows. Genomes born
and lost between samples may be absent; ancestry remains complete. No seed sweep or second run.
Archive limits:3GiB working case,4GiB study including terminal reserve, RSS3GiB, WASM1.5GiB,
at least20GiB free disk. Available disk at registration is353GiB. The pilot's final snapshot was
25MiB, so21 checkpoint positions would start around0.5GiB before population/history growth.

**Analysis:** use the existing seed_cycle_report reader and plots; inspect each population reversal,
ancestry changes with whole-population denominators, interval food/reaction/waste flows, active
source timing, spatial patches and distance/access, inherited versus funded bodies, and sampled
local exposure. Read checkpoints without advancing ticks for full local inventories, installed
machinery and retrospective ancestry. Compare archived mutation baseline3952 descriptively; its
different environment prevents single-mechanism causal attribution. Preserve negative findings,
including continued reliance on primary resources or lack of waste use. Put detailed local report
and figures under harness/artifacts and a concise evidence-backed study in docs.

**Identity work:** recommend a new name to the user and make a native SVG cell/division favicon.
Keep repository, deployment URL, WASM and persistence identifiers stable. The user has not requested
publication or an infrastructure migration. No new server or live browser-tab control.

### Completed observation and identity work

Ledger **3989** reaches all 50,000 ticks in 680.8 seconds, with 76 cells remaining after 4,800
divisions and 4,772 starvation deaths. The [deep analysis](docs/local-weathering-50k-study.md)
records the 131 → 14 → 130 decline/recovery, inherited product changes, lower funded motor
allocation, a long-lived motorless branch, capacity-limited nonreproducing mutants and transient
biomass reuptake. Raw feed still supplies 95.7% of late imports. No sustained food-web claim.
Archived comparison 3952 was read, not rerun. All 21 distinct checkpoint positions restore and
remain byte-identical after full local observation. Peaks: 406.1 MiB process RSS, 205.6 MiB WASM.
The exact executable and all observations remain in `harness/artifacts/weathering-local-50k-20260917/`.

Display name **Biotropy** and a native dividing-cell SVG favicon are installed. The favicon was
rendered and inspected locally. Repository/deployment/persistence identifiers remain unchanged.
Concurrent header and offline-reader edits cause the recorded harness-source warning; the loaded
kernel and observer did not change, and current/archived WASM hashes match. Full CI passes with
92 Rust and 60 Vitest tests and 13 existing lint warnings. No deployment or additional simulation.

<a id="weathering-redesign"></a>

## September 17 — Weathering from local chemical conditions

The user retained weathering's role and rejected treating the earlier formula as its definition.
This expansion supersedes the environmental-conversion selection below, not the core transport,
cellular metabolism, corrected mutation, ownership or open resource boundary. External publication
and long population campaigns are outside this execution. Sulion expansion
`dff1a07d-ce4e-464b-a734-8df627f63c19` branches from C3 step 2.

**Outcome:** extracellular and reservoir material change according to the actual local mixture;
different neighborhoods can favor different products, and biological deposits can change that
context through the same fields. Preserve finite material, no unfunded usable-work gain, discrete
identities, mesh2, local sensing and borrowed rendering. No requirement for shelter specialists,
evolved recycling or a particular population outcome.

**Selected candidate and rationale:** reuse H, the two shared signed interaction reductions, and
B=H/(1+|H0|+|H1|). For each compact adjacent product t of donor s, compile
a=(p0[t]-p0[s], -(p1[t]-p1[s]))/4. Engagement is max(0,a dot B) when U[t]<U[s],
otherwise zero. This gives the existing attraction/repulsion properties a chemical consequence:
the mixture favors a product whose interaction with it is stronger. There is no constant branch
activity. Opposing mixtures can select different products; neutral or very dilute mixtures do
little or no conversion. The compact four-direction map is retained for cheap compilation and
local chemical continuity, not as a physical requirement. Repeated redistribution may still
broaden support; measure it rather than assuming compactness guarantees sparse evolution.

The environmental rate and existing impedance mobility scale these engagements. Frozen-donor
allocation r/(1+sum(r)) bounds total loss; reference-value drops dissipate without crediting cells.
Source processing retains its separate exposure multiplier. Remove the independent geographic
sinusoid and its period setting: time dependence comes from material movement, transformation,
release and biology. No sunlight/work source is introduced. Habitat feedback remains an explicit
diagnostic knockout of impedance attenuation, not a requirement that shielding repay its cost.

**Work bound:** sum engagement is at most 2|B|_1. Use this local bound before visiting chemical
groups. First measure with the existing field floor. A common local concentration floor of 1e-9
is a separately measured candidate if trace support remains expensive; the prior v17 checkpoint
had only 1.07e-7 of field material below that concentration. Any adoption requires cumulative
roundoff accounts and matched startup evidence. Never prune by global species abundance or
discard tiny owned reservoir/cell stock. Do not reduce diffusion or geographic resolution.

### Execution and acceptance

1. Select laws and bounds (completed): inspect current consumers and previous negative findings;
   document limiting cases, source/field equivalence and experiment registration here.
2. Implement (completed): weathering/climate, source response, render/inspection interpretation,
   retired configuration rejection and checkpoint revision. Tests establish neutral idleness,
   medium-dependent product selection, scalar/paired agreement, frozen donors, accounting,
   sparse activation and exact continuation. Update current contracts with the same semantics.
3. Measure and finish (completed): extend the existing weathering probe and recorded runner, using
   production field updates. Compare equal starting substrate in two equal-mass chemical media
   with a matched zero-rate control for each medium; 75 updates (60 model seconds), no cells or mutation. Record time
   samples, species totals, conversion, active groups and residuals. Prediction: product shares
   differ between media beyond the no-conversion control. This proves a physical opportunity,
   not biological benefit. Compare default seed27 at 600 ticks and 3,000 ticks, weathering on/off,
   at most four startup runs plus two floor-comparison runs, 120 seconds per case (12 minutes
   total maximum). Preserve old v17 evidence; no claim of matched causal speedup against it.
   Read per-interval throughput and active groups, source/field conversion and signed losses.
   Minimum headless ordinary startup 30 ticks/s; target 200; browser throughput remains unverified.
   Run make ci, record failures and operating limits, review the final scoped changes, then return
   the completed expansion. Do not start the old 50,000-tick comparison during this revision.

### Results and disposition

The shared operator now uses positive mixture interaction differences and no constant branch
activity. Removed the geographic basis, clock and period configuration, including explicit
rejection of the retired CLI/config option. Renderer and inspector show bounded medium activity
and its impedance attenuation, with no implication that the display is a species-independent
reaction rate. Physical checkpoint v18 rejects older saves; the outer observation package is
unchanged. The paired implementation and reservoir scalar path share coefficients/allocation.

**Physical opportunity:** ledger3981 screened the operator at floor1e-24; the final floor1e-9
[production-field probe](docs/evidence/digital-chemistry/weathering-local-v18/medium-probe.json),
ledger3988, used four units of ID88 plus sixteen units of ID240 or ID255. Property inspection
selected these opposite-sign second profiles before execution. Impedance attenuation was knocked
out in both arms to isolate chemical direction; ordinary transport and washout remained active.
At60 model seconds, ID87 was0.000000556 in medium240 versus0.0484319 in medium255; ID104
was0.0407062 versus0.0309292. Both corresponding zero-rate controls produced neither compound.
The maximum absolute material/reference residuals were1.47e-14/5.97e-15. This establishes
medium-dependent abiotic product availability, not sensing, paid benefit or evolved exploitation.

**Work and numerical resolution:** all six startup cases used seed27, chemistry101, full mesh2,
the ordinary48 founders and identical corrected mutation. No source/food, transport or population
parameter was tuned. Every run stopped at its registered horizon. Timings include stepping and
bounded observations; initial/final checkpoint serialization is outside the timed loop.

| Ledger / evidence | Ticks | Floor | Weathering | Overall ticks/s | Last100 ticks/s | Final active four-species groups |
| --- | ---: | ---: | --- | ---: | ---: | ---: |
| [3982](docs/evidence/digital-chemistry/weathering-local-v18/floor24-on.json) |600|1e-24|on|192.68|142.14|143,250|
| [3983](docs/evidence/digital-chemistry/weathering-local-v18/floor24-off.json) |600|1e-24|off|335.05|284.84|51,538|
| [3984](docs/evidence/digital-chemistry/weathering-local-v18/floor9-on.json) |600|1e-9|on|411.99|337.26|29,962|
| [3985](docs/evidence/digital-chemistry/weathering-local-v18/floor9-off.json) |600|1e-9|off|531.61|450.16|25,486|
| [3986](docs/evidence/digital-chemistry/weathering-local-v18/3000-on.json) |3,000|1e-9|on|238.36|167.62|92,236|
| [3987](docs/evidence/digital-chemistry/weathering-local-v18/3000-off.json) |3,000|1e-9|off|296.20|196.38|76,564|

Adopt1e-9 as the common extracellular numerical floor. At600 ticks, both weathering-on floors
have68 cells and59 divisions. Biomass differs by0.000269 of160.801; held material differs by
0.001353 of6532.17. Field conversion differs by0.00000508 of3.64590. These are matched short
numerical comparisons, not assurance of identical long evolutionary trajectories. Owned tiny
reservoir/cellular stocks remain intact. Losses are included in the existing signed numerical
accounts, which also contain f32 rounding; their net value is not a measurement of gross truncation.

At3,000 ticks, weathering-on has155 cells/331 divisions; off has240/429. This is an environmental
effect, not evidence that fewer cells are better or that adaptation occurred. The on arm processed
30.4511 field material and18.8276 reservoir material. Its signed numerical material/reference
accounts are−0.01609/−0.14069, compared with initial6650.36/45310.76; maximum sampled absolute
closure residuals are4.96e-8/1.87e-7. Source release and external renewal stay accounted.

**Limits:** the on/off populations diverge, so wall-time differences are whole-world feature
comparisons, not isolated arithmetic costs. Work continues growing in both arms; no logarithmic
scaling, long-term plateau or days-long performance is established. The last interval falls below
the200ticks/s target while remaining above30. No browser throughput or new human motion review
was performed. Earlier saturated-capacity limits remain unresolved. Old shelter findings and
v17 checks retain their historical meaning. Do not start another campaign to obtain a desired
population outcome. This expansion is complete; the older long comparison and human review
remain separate pending work in the parent plan.

**CI prerequisite:** first full CI passed92 Rust checks and frontend static checks, then exposed
weathering inspection reading the nonpersistent body projection from the previous physical stage.
Restore reconstructs that cache differently; observations must derive current body contributions
without modifying the physical cache. Branch `e3da87b8-3d9c-4c27-a21d-3481a693a54f` shares the
existing projection arithmetic between ordinary physics and read-only observers. The renderer
reuses a two-component derived body buffer; inspection reduces only its sample sites. No full
chemical/population frame crosses the worker boundary. Existing observation-equivalence tests
and a render-before/after-restore regression cover the correction. A separate retired-option
test used the wrong browser command and is corrected to exercise ordinary restart validation.

**Final verification:** make ci passed92 Rust tests (75 unit,17 integration),60 Vitest tests,
release Clippy, formatting, TypeScript, docs and Terraform formatting. ESLint retains13 existing
warnings and no errors. Both600- and3,000-tick measured checkpoints were continued for20 ticks
using their archived measurement binary and the final binary; the resulting physical snapshots
were byte-identical. The observation repair therefore does not invalidate those physical results.
Reviewed the new operator, its live field/source callers, activity floor, changed display and
strict persistence/configuration boundaries. Raw checkpoints and exact experiment binaries remain
local under `frontend/harness/artifacts/weathering-local-20260917-*`; linked reports above are
the durable numerical record. Archived experimental binaries are required to replay the finer-floor
intermediate candidate. No code was committed, pushed or deployed by this expansion.

<a id="ecology-correction"></a>

## September 17 — Ecology composition correction

This section governs the next work. September 16 laws and results below remain historical
records, not instructions to replay. Correction branch `cc2e9b39-5a35-4abb-9c71-2566f064f08f`
is anchored to M4 (`ba2c513d-16ff-464f-ae15-86fb958bdb8b`). The earlier handoff branch
`9380f93e-71a8-45f1-93ed-0503b73ba5e6` is paused until the corrected implementation is ready.
The completed mobile-source plan retains its evidence. The user authorized execution of all
correction phases after planning. The old overnight campaign is not
automatically repeated.

### Outcome and scope

Make reservoir motion, medium-dependent chemistry and paid habitat modification compose through
the established chemical profiles, geographic fields and bounded operators. Local conditions
should change resource availability and the value of different capabilities. Reservoir contents
should participate during their residence, instead of receiving a separate chemical rewrite only
as they leave a source.

Preserve the core mathematics and corrected mutation/inheritance. Correct the ecology additions;
do not replace the numerical engine, cellular metabolism or physical accounts. Shared formulas
may use different justified constants. Design documents provide direction, not required historical
equations or a mandate for conventional thermodynamics.

Keep accounted external replenishment. Test whether less abundant or less continuously accessible
fresh supply makes local cycling consequential while allowing continued reproduction. Abundance
suppressing waste use is a hypothesis. Source feeding may remain successful; neither waste eaters
nor a particular community composition is an acceptance gate.

Preserve mesh2 at 320 × 240, seed27, 48 founders in two colonies, existing learning settings,
paid machinery, sparse active groups and immutable sharing. Rust/WASM owns state; the same worker
renders borrowed views. Keep scalar stepping, bounded observations and message backpressure.
History, ancestry and save retention are outside scope.

### Evidence and reuse map

| Component or record | Disposition |
| --- | --- |
| `source_medium.rs`, `sources.rs` | Replace independently selected source response and outflow-only conversion with shared operators. Retain finite inventory, release accounts, footprints and explicit external renewal. |
| Movement, chemical projections and field transport | Reuse established reductions, gradients, impedance and bounded transport; preserve working body motion and core transport laws. |
| `weathering.rs`, `climate.rs`, `field.rs` | Audit destination mapping, susceptibility and shelter together. Preserve the fused active-row pass, frozen donors, product activation and derived caches. Moving files alone is insufficient. |
| Chemical product/operator compiler | Reuse bounded mappings and compiled coefficients for environmental processing. Preserve paid cellular reactions and installed machinery identity. |
| Accounting and resource-economy calculation | Predict delivery, conversion and conditional returns using production arithmetic; distinguish external supply from recycling. |
| World, configuration, checkpoints and worker consumers | Integrate into ordinary execution and exact continuation; retain one runtime and explicitly reject retired physical schemas. |
| Quick scenarios, recorded runs, habitat observer, ledger and reports | Extend existing fixtures and bounded observations; no second experiment pipeline. |
| Environmental results | Retain failed expensive-barrier/tracer predictions, the small cheaper-byproduct return and negative selected-genotype shelter comparison. These do not establish evolved habitat engineering. |

Preserve the observed seed27 evolution and die-off/recovery cycles. Explaining their entire causal
history is not a prerequisite for correcting ecology. Corrected-mutation ledger run **3952** is
the comparison baseline: 50,000 ticks, 32 final cells, 100 peak cells and 2,281 divisions. Large
inherited target changes occurred, while the five major waste chemicals had zero recorded uptake.
Keep mutation fixed. Runs 3950/3951 retain their original Gaussian/mistaken-rate meanings.
The archived baseline is `frontend/harness/artifacts/calibrated-mutation-seed27-2026-09-17/`.

### Settled, provisional and deferred decisions

**Settled:** use a small control set and shared vector operations. Reservoirs and field chemicals
derive local response from coherent projections and mappings. No source personalities, named
food/waste roles, lineage-dependent forcing or controller oracles. Paid deposits can change
transport and conversion; their benefit must depend on exposure, persistence and expense and be
accessible to neighboring organisms.

**C0 selects:** reservoir participation, the common environmental conversion rule, ambient/deposit
coefficients, update order and cache lifetimes. Specify units, normalization, finite footprints
and self-response. Compare inventory-based and interface-limited coupling before choosing;
do not silently give a large reservoir unlimited influence. Test matching deposition/sampling
and mutual reservoir interactions. Influence must not double-count inventory or make stored
material available for uptake before release.

Process the relevant owned reservoir inventory through the shared rule while stored. Release
must not convert it again or create work. Fixed offsets and susceptibility/shelter formulas are
candidates to justify or replace through the common formulation, not inherited requirements.
Preserve nonnegative stocks, frozen inputs, bounded product support and explicit material/work
disposition. Unaffected core arithmetic remains unchanged.

**C2 selects:** viable open renewal from calculated budgets and short checks. Measure accessible
local supply, external replacement, conversion, washout and demand. Relate shortage duration to
movement, processing and renewal times; global abundance alone cannot establish local surplus.
Change one coupling or parameter at a time. A failed predicted pressure is a structural finding,
not permission to tune until a preferred community appears. The implementer owns numerical
choices and justified constants within these boundaries.

**Deferred:** sunlight supplying accounted work, a fully closed world, altered cell-specific energy
yields, binding/new substrates, genome structure and phenotype explanation UI. No mutation change,
founder promotion, forced strategy quotas or new controller inputs.

### Milestones

All phases are pending and depend on their predecessor. Use plan-phase to expand the imminent
phase immediately before implementation; later phases remain milestones until evidence is available.

| Phase | Sulion phase ID | Deliverable and acceptance |
| --- | --- | --- |
| C0 — Specify the shared extension | `220f28d9-f107-4553-b76b-c5218c00f5bc` | A bounded equation delta, ownership/update-order map, compiler/cache reuse, zero-tick resource and cost predictions, and registered causal checks. Justify each constant and the opportunity it creates. |
| C1 — Integrate common production operators | `6a4e82cc-3cca-4807-b015-92a635a01e9d` | Ordinary World uses shared reservoir/field response, inventory processing and paid-medium feedback. Remove superseded special paths; accounting, economy prediction, persistence and observations agree; invariants and CI pass. |
| C2 — Establish local pressure and calibrate renewal | `385c6ecd-ea54-4fae-b811-fa1df7eb13ab` | Short checks demonstrate local response, conditional paid benefit and loss conditions. Select an open-renewal configuration from budgets and bounded calibration. Preserve negatives; freeze constants before C3. |
| C3 — Verify limits and observe seed27 | `0879026d-90a7-4db4-a91b-e83dad55afe7` | Full-resolution workload, ownership and continuation measurements; after a bounded pilot, at most one 50,000-tick comparison against archived run 3952. No required food web. |
| C4 — Reconcile contracts and prepare handoff | `07d9fcce-5d1f-47a9-b337-d0652820643c` | Current contracts, defaults and local evidence describe the correction. Final CI and registered browser checks state actual limits. Resume human review against the corrected implementation. |

**C0 checks:** state question, alternatives, initial conditions, predicted causal chain and decision
for each assay. Include zero/constant medium, asymmetric medium, interacting reservoirs, a paid
deposit and its loss condition. Specify donor freezing, destination activation, sparse scheduling
and reconstruction of derived state. Select rules and execution cost together.

**C1 checks:** no double-counted inventory, release-time double conversion, free work or same-step
product cascade. Equal physical contexts use consistent operators; arbitrary source iteration
order cannot select different physics. Verify exact cold-restored checkpoint continuation through
motion, processing, depletion and renewal. Coordinate schema changes across readers and reject
retired versions. Keep ownership guards enabled and run full CI.

**C2 checks:** start cell-free, then use hundreds-of-ticks single-cell fixtures with ordinary RNN
inference and diagnostic weights where needed. Freeze mutation and declare learning/transfer
settings. Record funded bodies separately from targets. Only use paired populations after the
physical response exists. Measure local chemistry, actual uptake, movement, work, damage and
construction, including producer cost and neighbor access. An opportunity can pass without
evolved discovery. If it fails, return to the responsible design decision before C3.

**C3 checks:** include growth/refitting, census, inspection and render preparation at full mesh2.
Retain at least 30 ticks/second for representative active use and the existing 200 ticks/second
optimization target. Report 48/2,000/2,000-growth capacity cases and saturated-world limits
separately; do not meet targets by coarsening fields or omitting ordinary consumers. Compare
population pulses, parentage, inherited/funded traits, local resources, chemical flows and external
supply. Do not rerun the archived baseline or require proof of when evolution began.

**C4 checks:** reconcile work order, environmental/source contracts, controls and checkpoint
semantics. Preserve old evidence with its version; keep dumps local and linked summaries durable.
Inspect centered two-colony startup. Any browser check needs a registered purpose and isolated
session on the existing server. Human motion/legibility review remains separate; screenshots and
ratios cannot complete it. Publication and deployment are outside scope.

### Experiment envelope for later execution

C0 finalizes registrations before execution. These are ceilings, not a required campaign:

- Short mechanism/calibration checks: at most 18,000 total ticks, normally 300-tick probes;
  individual cases at most 3,000 ticks or 120 seconds; 30 minutes total wall time.
- Observation: one 3,000-tick pilot, then at most one 50,000-tick seed27 run if mechanical,
  resource and operating checks justify it. Main wall cap 30 minutes. Total ecological ceiling:
  71,000 ticks. No automatic overnight campaign.
- One simulation process; existing bounded observers, exact configuration/kernel identity and
  initial/final checkpoints. Main checkpoints every 10,000 ticks, samples every 250 ticks.
- Sample resource use at least once per second: RSS at most 3 GiB, WASM memory 1.5 GiB,
  case artifacts 3 GiB, total correction artifacts 4 GiB. Require 20 GiB free disk before execution
  and retain 1 GiB for terminal export. Predict artifact growth before the main.
- Stop at horizon, extinction, resource pause, non-finite state, account failure or resource/wall
  limit. Preserve incomplete/negative results. No automatic retry, seed expansion, longer horizon
  or mid-run tuning to produce waste use. Extensions need a new question, registration and scope
  decision. Bounded unit, capacity and browser checks are separate from ecological tick budgets.

### Current state and next action

The initial C0–C2 implementation and pilot3977 are version16 evidence. The user stopped
performance work to question the rules and calculation limits. Repair branch
`f2d57f3a-a77d-4b3c-ac5f-6ef1395fecfc` corrects those defects before any further long comparison.

### Audit repair — rules and work limits

Remove the diffusion/reactivity coupling and potential-drop ranking. The common environmental
operator allocates one quarter of its capacity to each adjacent manifold direction, modulated
by the existing bounded interaction-profile projection. A branch without a positive reference
value drop is inactive because no external work funds it. Reference value constrains the work
account; it does not select faster chemistry. Four directions follow the two-dimensional lattice,
not four independently tuned reaction paths. Field and source inventory retain the same operator.

Compile inert chemical groups out of weathering work. Use the existing local concentration
floor, multiplied by the owner's spatial interface area, to skip negligible reservoir donors;
retain their material unchanged. Zero exposure does no conversion work. Extracellular products
are subject to the existing floor at the final commit, with signed numerical-loss accounting.
No global species pruning, new abundance knob, coarser mesh or changed tick duration is added.

Source material reductions are derived once after inventory changes, shared by response and
projection, and reconstructed on restore. Clear/project only touched geographic nodes, once
after the frozen-response source update. Interventions explicitly rebuild the projection.
Compile a normalized source footprint kernel when radius/grid geometry changes; translation
uses the field's bilinear weights over that kernel. Sampling, projection and release use the
same translated footprint. This replaces repeated Gaussian evaluation with grid interpolation,
preserving continuous motion and self-force cancellation rather than quantizing source motion.

Verification: deterministic checks for diffusion-independent conversion, inert/zero-exposure
work, retained tiny inventory, final product activity, accounting, periodic footprint translation,
cache refresh and exact cold continuation. Then full CI and one six-case300-tick source panel
on the corrected binary (1,800ticks maximum,120seconds/case). This bounded rerun checks changed
local response; it is not another renewal sweep or an extension of the ecological campaign.
After those checks, run the existing startup runner once: seed27, full mesh2,48founders,
600ticks or30seconds. Check startup execution, account closure and elapsed time; this horizon
does not test ecological persistence. Keep version16 findings historical.
One additional600-tick startup is reserved for the final unchanged-source cache guard:
compare its final checkpoint byte-for-byte with run3979. This tests skipped work equivalence,
not a second ecological hypothesis or a changed parameter choice.

#### Repair results

The v17 repair passes91 Rust tests and60 Vitest tests, release Clippy, formatting, TypeScript,
documentation and Terraform format checks. Thirteen existing ESLint warnings remain. The first
full CI run caught an outdated v16 error-message expectation; it was corrected and CI passed.
New checks establish diffusion-independent reaction shares, retained negligible source stocks,
zero/inert work limits, final field activity, exact source-cache reconstruction, periodic footprint
continuity and cold continuation through every integration phase and renewal. These are checks
of artificial rules and ownership, not physical-realism or evolved-community acceptance tests.

[Source probes](docs/evidence/digital-chemistry/ecology-correction-v17/source-probes.json), run3978,
execute six300-tick cases with the production operators. A gradient moves the reservoir1.18013units
left; reversing it moves1.18024units right. Dense medium reduces displacement to0.06619units
and conversion to0.08186material units, versus1.79717 in the ordinary gradient. Fixed-source drift
is exactly zero; processing-off conversion is exactly zero. Largest absolute material/reference
account residuals are1.98e-9/1.52e-8. The field and source inventory remain separate owners.

[Default startup](docs/evidence/digital-chemistry/ecology-correction-v17/startup.json), run3979,
completes600ticks at seed27,320×240,mesh2 in9.622seconds (62.35ticks/s), ending with56cells and
52divisions. Absolute material/reference residuals are2.23e-7/1.10e-6 against initial stocks
6650.36/45310.76. This includes bounded headless frame observations, not browser/GPU work.
No changed-law long run or saturated capacity rerun was launched for this repair. Earlier v16
capacity shortfalls remain historical limits; this check establishes ordinary startup only.
The 50,000-tick comparison, browser operational handoff and human motion review remain outstanding.
The final [cache-guard verification](docs/evidence/digital-chemistry/ecology-correction-v17/startup-cache-guard.json),
run3980, completes the same600ticks in9.784seconds (61.32ticks/s). Its final physical checkpoint
is byte-identical to run3979. The additional stationary-source test checks skipped projection
through retirement and renewal. This closes the audit-repair branch; it does not close C3/C4.

After C4, return the correction branch completed and resume the paused handoff branch. Returning
clears the parent block mechanically; it does not satisfy human review. Close M4 and the root
only after actual review is complete.

### C0 execution — initial v16 composition, superseded by the audit repair above

Expansion `5543a219-1e07-422b-875e-cbb95ffbbed6`: equation/owner step
`bc0be7c5-1963-4fca-9740-0c701c1823f1`, budget/registration step
`3795a0a5-9999-4348-8efe-15da5cb51553`.

1. Read production field, body, source, climate and product compiler owners; select the extension
   below. No body physiology or mutation change. Verify by ownership/dependency review.
2. Calculate rates, stocks and costs without ticks, then register bounded causal fixtures and
   renewal comparisons using existing harness infrastructure. Full CI is shared with C1 code
   verification; documentation checks establish this phase's prose contract.

The chemical lattice supplies the four reflected adjacent product directions, compiled with
`product_neighborhood`, replacing the arbitrary four-unit jumps. For donor s and neighbor t,
compile a downhill weight proportional to max(Vs−Vt,0), normalized over its four neighbors.
Compile its two interaction-profile differences into the same sparse product operator. Local
signals H are bounded once per geographic row as B=H/(1+|H0|+|H1|). Branch engagement is
`weight × (1 + (Δp0 B0 − Δp1 B1)/2)`; profiles are bounded by one, so engagement is nonnegative.
This is a short three-column projection followed by conservative donor allocation, not a
chemical-pair solver. Local medium changes product shares as well as overall conversion.

Sensitivity is D/(mean(D)+D), using the existing diffusion property and its definition-wide mean,
without a new chemical-specific tuning scale. Exposure retains the smooth geographic activity
coefficient but uses the existing impedance mobility law and `diffusionImpedance` control for
shielding. For branch rates k, donor fraction is dt×k/(1+dt×sum(k)). All branches reserve against
one frozen donor; products become donors next update. Lost reference value is heat, never usable
work. The same compiler and allocation serve field f32 rows and reservoir f64 inventory.
`sourceProcessing` scales the common `weatheringRate` for reservoir residence; it is not a
release probability. Start the bounded calibration at multiplier0.25, not the old outflow value4.

Reservoir influence uses the same inventory/property projection as material. Interface area A is
the inverse squared norm of its normalized footprint times mesh area; exposed amount is
Q/(1+Q/A), bounded by A. Deposit that amount's mean profile and impedance through the release
footprint; sample through that identical footprint. This gives self-force cancellation under
the existing centered antisymmetric gradient, while neighboring material/reservoirs can respond.
The stock remains solely reservoir-owned and unavailable for uptake. Derived source signals and
load add three scalar values per geographic node, not another N×256 chemical field.

Freeze body/reservoir projections before source responses, process owned inventory, move/release,
then refresh reservoir projection before ordinary field/body transport. All source responses are
collected before any release. Common passive velocity is extracted unchanged from existing body
arithmetic. Renewal remains an explicit external input at the same location; no recycling claim
may count renewed inventory as an internal return. Derived projections reconstruct on restore.

Cost bound: four local chemical branches per active species, shared row coefficients, compiled
chemical-only rows, no dense species-pair operations. Reservoir work is O(48×256 + footprint
support), plus three cleared geographic scalar arrays; unchanged sparse field work dominates.
At default weathering0.025 and source multiplier0.25, susceptibility≤1 and engagement sum≤2,
inventory conversion hazard≤0.0125/model-second before shielding. Residence600seconds can thus
alter inventory substantially, whereas a 0.2-second release step converts at most0.25percent.
Priming remains accounted raw material, supporting initial founder access before stocks age.

Registered short checks: six300-tick source probes (bare, gradient, reversed, dense, fixed, raw),
the existing three75-step cell-free weathering comparisons, and bounded paid habitat fixtures
selected after zero-tick budget inspection. Controls freeze mutation/learning as their fixtures
declare. Predict gradient reversal reverses passive drift; impedance reduces mobility/conversion;
source processing changes retained inventory before release; shielding preserves susceptible food
but can lose its benefit through expense or low exposure. Unit tests cover self-force, source
order response, sparse activation, accounts and cold continuation. C2 may compare default renewal
against doubled gap at one fixed processing rate, at most3,000ticks each; no seed sweep.

### C1 execution — production operators and consumers

Expansion `8212d9ee-1fb2-4370-96f9-fc69aabc8f83`, steps
`85adcfc1-e686-48af-8eef-4e769a079fe0` and `a594ab52-b052-41fb-860e-5e98ead9a22a`.

1. Integrate the selected operator in weathering/climate, source inventory and World stepping;
   extend the field's derived projections and reuse body passive drift. Remove source-only
   products. Verify frozen donors, sparse products, bounded interface and self response.
2. Update economy/probes, observations and physical checkpoint version together. Verify cold
   continuation, resource accounts and ordinary consumers; run full CI. Record actual limits.

#### C1 evidence

The ordinary World now deposits bounded reservoir interfaces, uses the shared passive response,
processes inventory before release and applies the same compiled chemical operator in field rows.
Version16 rejects earlier physical saves. Tests cover no self propulsion/material grant, frozen
source responses, retained inventory changing without release, field/reservoir agreement, no
same-update cascade, sparse product activation and cold continuation through renewal.
Rendering and existing readouts include reservoir impedance; field material ownership is unchanged.
CI exposed and corrected old version assertions and source retirement at floating-point duration
boundaries. The retirement tolerance matches the existing physiology clock tolerance.

Zero-tick predictions are archived under `frontend/harness/artifacts/ecology-correction-2026-09-17/`.
Mean renewal supply is2.96965material/model-second at gap1200 and1.95148 at gap2400, a34.3percent
reduction. Active fractions are47.83/31.43percent. Initial founder processing surplus spans
0.02951–0.03696work/model-second under the report's explicit fixed-mixture assumptions.
The updated conditional shelter budget predicts a gain at high exposure and a loss at low
exposure; spatial escape, controller expression and deposit aging remain unmeasured.

### C2 execution — registered local checks and renewal

Expansion `0e5a52b9-4d2f-4e26-a85e-4bd42ed0fbe6`, steps
`974f6328-b56f-4260-8ee4-9bb816d97176` and `551d4dc8-b28a-41ac-b619-adb919582da8`.

1. Run the six source probes, three cell-free weathering arms and three300-tick paid producer
   probes through the existing runners. Inspect before the three cheap-byproduct probes or any
   paired comparison. Compare feedback/export knockouts; a preserved-food effect must survive
   the producer's paid costs to support a return claim. At most four1,500-tick paired arms are
   reserved, only after expression exists. Mutation, learning and transfer are frozen in these
   diagnostic fixtures. They do not replace startup founders.
2. Compare gap1200 against2400, same seed27 and source processing0.25, at most3,000ticks/120seconds
   per case. Ordinary default learning/mutation remain on for startup viability checks; these
   are not isolated genetic-selection tests. Prediction: longer waits lower external replacement
   while local reproduction remains possible. Inspect supply, release, retained products, uptake,
   funded construction and cell-local access. Select once, then freeze for the C3 pilot/main.

All outputs use `frontend/harness/artifacts/ecology-correction-2026-09-17/`. Existing source,
habitat and recorded-run helpers own artifacts and ledger rows; no new observation pipeline.

#### C2 results and selection

Ledger3953: source gradient/reversal move1.16510/1.16515units in opposite directions over300ticks;
dense medium reduces distance to0.06791; fixed/raw controls give zero drift/conversion respectively.
Bare inventory still ages (9.64107material conversion events); empty outside medium is not an
exemption from ambient chemistry. The source fixture's initial derived projection was stale after
manual relocation; final physics rebuilt it before advancing and remains valid. Refresh the fixture
before its initial observation and rerun the six probes once (1,800 additional ticks) to verify
the corrected diagnostic. This keeps actual short execution below18,000ticks.

Ledger3954–3960: all cell-free and300-tick paid probes completed with closed accounts. Feedback
retains1.76318 units of food versus1.69747 with feedback off for the same paid deposit; no-deposit
retains1.90398, so this does not repay that feedstock expense. Producer construction is3.14335
versus3.13906 with feedback off, while export-off gives3.51370. Cheap-byproduct producer gives
3.17671 versus3.17339 without feedback, but export-off gives3.51038. Thus feedback provides a
small paid return, and this short expression does not beat suppressing the export.

Ledger3962–3965: cheap-byproduct paired cases have positive producer-minus-idle construction
of0.01777/0.02914 at the two strong-exposure placements and0.02264 in both mild placements.
All finite-food cases end in extinction at1,116–1,415ticks. The additional strong-exposure
advantage is not consistent across placements; no shelter-specialist selection claim follows.

Ledger3961/3966: renewal waits1200/2400 both complete3,000ticks with239divisions. Final populations
are46/53, peaks101/101. New external supply is540.490/298.954material; released material is
3648.906/3622.653 because both retain their initial finite inventories. Non-raw identity imports
are29.76/29.42percent, mainly nearby environmental products, not demonstrated waste recycling.
Both cases take about85seconds (35.3ticks/second including recorded observations). Select gap2400
and sourceProcessing0.25; keep sourceDrift4, weathering0.025, mesh2, seed27 and mutation unchanged.
The long-term predicted replacement reduction is34.3percent; short startup is still dominated by
initial inventory. C3 observes turnover after that initial subsidy rather than extrapolating it.

### C3 execution — operating envelope and fixed observation

Expansion `9a995b65-1a8e-40d8-b895-e262f8d71527`; steps
`1ecbaed6-46c3-4bba-a1d5-b40c50c3a34c`, `fb142700-03bf-4164-8028-231aeaeba321`,
`b24f7cfb-5507-497b-a801-90bea8d9f2b5`.

1. Run existing capacity48/2,000/2,000-growth at mesh2,10warmup/100measured ticks,60seconds/case,
   with census, inspection, render preparation and cold restore/three-step continuation. Preserve
   measured saturated limitations. Any implementation optimization must preserve selected laws.
2. Run one3,000-tick/120second seed27 pilot with final defaults and recorded observers. Main is
   qualified only with continuing reproduction, closed accounts, unchanged ownership and resource
   headroom. One50,000-tick/1,800second main then asks how population cycles and resource use change
   across reservoir depletion/renewal and multiple generations. Compare archived3952; no rerun.
3. Read snapshots and existing genome/chemical traces; report input identity separately from
   material origin, consumption separately from import, and paid traits separately from targets.
   Preserve extinction or incomplete horizon. No genotype promotion or further search.

Browser registration for C4: existing localhost26000, isolated Chromium profile, default300-tick
or30second observation, weathering display enabled. Existing application runner exercises worker,
WebGL2, borrowed buffers, local save/restore and failure visibility. No user-tab control or server
startup. Browser evidence is operational; human motion judgment remains outstanding.

#### C3 prerequisite — vector execution

Capacity3968–3970 measures20.08/15.25/13.50ticks/s with exact continuation, a regression against
the earlier single-product environmental pass. Branch `ea188cc0-5a22-4318-8037-3c7647a51336`
blocks C3 operating acceptance. Step `45220fba-808c-4e6d-b2e2-5c0d3ad79519` transposes static
coefficients for existing paired WASM arithmetic, shares local engagement across sheltered/bare
diagnostics and commits each rounded field row once. Step `4338b684-e22f-41d0-a402-ae1f37ade359`
checks scalar equivalence, accounts/continuation, full CI and repeats the fixed capacity panel.
Selected equations, source/renewal constants, mesh and physical opportunities remain unchanged;
field rounding order may change within the existing measured numerical account. No ecological
panel repeats merely to improve its outcome. Preserve the first cost measurement as negative.

The paired implementation passes85Rust/60Vitest checks and full CI. Capacity3971–3973 improves
to25.75/18.46/15.92ticks/s; paired account reductions and one donor subtraction then reach
26.62/18.99/16.33 (3974–3976). All nine capacity saves continue exactly. This restores32.5percent
of throughput relative to the initial correction's48-cell saturated case, but remains slower
than the older single-product rule and below30 in saturated chemistry. Preserve that operating
limit; do not claim the200ticks/s target. The ordinary sparse pilot and browser remain the gates
for representative use. No resolution or physical-rate concession was made for these timings.

## September 16 — Original outcome and authority

Make local conditions, extracellular chemistry and organism-built habitat affect one another
in the ordinary observable world. An organism should be able to spend material and work to
change its neighborhood, with a return that depends on place, time and neighboring organisms.
The resulting world should offer more consequential choices than efficient fresh-source uptake.
Source feeding can remain a successful strategy; eliminating it is not the objective.

The user subsequently authorized all phases, including the long overnight tests. Implementation,
bounded experiments and local validation are now in scope; publication and deployment are not.
The preceding concrete review fixes are locally implemented and validated, still uncommitted;
preserve that work. The completed digital-chemistry rebuild is the starting implementation.

## Evidence and design intent

- [Current work order](docs/design/README.md): prepare opportunities for an unresolved live
  ecosystem, without prescribing surviving groups or requiring a certification campaign.
- [Computational foundation](docs/design/chemistry/computational-foundation.md) and
  [composed runtime](docs/design/chemistry/composed-runtime.md): select artificial rules,
  shared reductions, local accounts and execution cost together. Physical vocabulary does
  not require conventional thermodynamics or a physical PDE solver.
- [Current measurements](docs/design/chemistry/rebuild-results.md): paid export exists,
  conditional recipient benefit exists, and chemical exposure changes injury cost. The
  paid-barrier follow-up barely changed movement and **failed** its predicted reduction
  in tracer spread. Those results do not establish useful habitat engineering.
- [Strategic ecology](docs/design/strategic-ecology.md) describes the intended opportunities,
  but its tracer-spread claim predates and contradicts the rebuild result. Reconcile this
  during implementation; do not use that sentence as positive evidence.
- [Historical microclimates](docs/sources/ant-sim-appendix-b.md#b-7-3) motivate shelter with
  recurring exposure and incremental returns. Depth, eggs, scripted architects and a
  required ordering of strategies are not requirements for this bacterial world.
- [Chemistry migration](docs/design/chemistry/sources/migration-proposal.txt) connects paid
  deposits, altered transport and degradation. Its formulas and experiment checklist are
  direction, not an obligation to reproduce a particular barrier.
- [Sparse spatial ecology](docs/design/spatial-ecology.md) motivates local history and
  consequential movement. A useful medium must not simply immobilize the world.

The existing system already has cell-free profile drift and concentration-dependent impedance.
It does not have extracellular identity conversion or a binding reservoir. Adding those is a
design choice, not correction of a falsely claimed existing feature.

## Recommended feature

Build one coupled environmental feedback, with three interacting parts:

1. **Local environmental variation.** A smooth, slowly varying abiotic condition creates
   different exposure or chemical-persistence conditions across the periodic XY world.
   Its timescale must allow both residence and relocation to matter. It carries no lineage
   information and makes no response to population success.
2. **Chemistry outside cells.** Local conditions change how extracellular material persists
   or transforms. Prefer bounded generic chemical mappings and existing shared profiles.
   A candidate is environment-dependent conversion that preserves material and dissipates
   accounted potential. No named food/toxin roles, free work or all-pairs reaction table.
3. **Paid habitat modification.** Exported material changes the local response to those
   conditions, then disperses, weathers or can be consumed and transformed. A candidate
   is a deposit that protects useful chemistry from exposure while impeding access or
   movement. Its owner has no exclusive entitlement; neighbors can benefit too.

The causal chain is: paid production and export → persistent local chemistry → changed
delivery or exposure → changed net return on an action or body investment. The proposal
includes circumstances where investment loses its advantage, such as mild exposure,
departure, degradation or access costs. Small deposits need a possible incremental return;
a fully formed shelter being useful is insufficient.

The recommended first implementation uses chemical deposits as the modifiable medium,
without a separate solid terrain grid. Microclimate here describes local environmental
conditions, not a temperature simulation. M0 selects the actual rates, maps and couplings
from their ecological effects and cost. It may revise the proposed weathering mechanism if
the budget does not work, while retaining all three relationships above.

Increasing global impedance alone is inadequate: it does not supply the missing feedback
and could erase mobility. A full binding reservoir, extracellular enzyme system or new body
stock is justified only if the selected interaction needs it; do not install all of them
as speculative infrastructure. Conversely, existing coefficients are not a reason to patch
around a representation that cannot express the selected interaction.

## Boundaries and reuse

| Owner | Planned responsibility |
| --- | --- |
| `engine/src/field.rs`, chemical compiler and shared profiles | Local abiotic interaction over active chemical groups; explicit field accounts |
| `engine/src/world.rs`, `sources.rs` | Deterministic environment schedule, ordinary update order and finite supply |
| `engine/src/footprint.rs`, `metabolism.rs`, `movement.rs` | Funded production/removal and consequences for living bodies |
| `engine/src/economy.rs`, `economy_report.rs` | Current-law supply, investment, persistence and conditional payback calculations |
| Physical checkpoint and chemical-definition owners | Versioned continuation of every new physical state and rule parameter |
| Existing worker renderer and inspections | Borrowed display projections and bounded local/environment summaries |
| Existing quick/evolution runners, ledger and reports | Short interventions, bounded long runs, provenance and causal analysis |

Preserve the [immutable ownership contract](docs/design/chemistry/data-ownership.md): Rust owns
physics; the same worker renders borrowed WASM views. No copied full-field messages, second
renderer, second economy, or controller access to coordinates, climate phase or hidden forecasts.
Receptors and body exposure supply local physical consequences. A new neural channel requires
a demonstrated missing local cue, not convenience for an experiment.

Keep the 320 × 240 world, mesh2 and two-colony seed27 review startup as the comparison baseline.
Do not coarsen the field, slow model time, shrink the population or remove observation cost to
meet performance. Retain active-group processing; new work should follow occupied chemistry
plus a bounded low-dimensional environment update, not dense processing of zero species.
Budget any new arrays and checkpoint bytes before allocating them. Keep at least 30 ticks/s
for representative active operation, with 200 ticks/s as the optimization target. Remeasure
the existing saturated workloads and report changes; their accepted worst-case limits are
not a new mandatory ecological gate or a claim of logarithmic scaling.

Keep existing save/history retention policy. Checkpoint schema changes must reject obsolete
physical versions explicitly and be coordinated with reports and browser recovery; no adapter
or silent migration. Preserve older user exports. No new server, hosted artifact service,
backend, online optimizer or automatic founder selection.

## Decisions and uncertainty

Settled: implement one coherent production environment, preserve funded/local evolution and
shared ownership, use short causal checks before long observation, retain negative findings.
No diversity count, crossfeeding quota or elimination of source specialists is an acceptance
condition. The design documents inform the direction rather than supply a literal feature list.

Provisional: smooth environmental forcing, passive extracellular conversion and chemical
shielding/retention are the recommended coupling. M0's implementer owns the exact law and its
calculated rates, including whether existing profile reductions express the required effect.
Do not promote this candidate description to an implemented contract before those choices.

Deferred to M0: environment lifetime, product mapping, response profile, material/work accounts,
sparse activation, source-normalized controls, memory/disk ceilings and observation fields.
Resolve these from calculations and bounded cost probes before M1, not from a long seed search.

Deferred to M2: whether small physical investments repay their costs and whether an ordinary
controller can express the opportunity. Missing behavior is a finding; add neither an oracle
nor a special default genotype to make the overnight study work.

Provisional overnight window: six hours maximum for M3, excluding implementation. Freeze the
exact registration before any run. A short successful run does not need padding to fill a night.
No user-owned decision blocks planning or the next design milestone.

## Milestones

### M0 — Select coupled environmental rules and budgets

Scope: select the complete feedback and its state, update order, accounts, product mapping,
environment forcing, observables and computational cost. Calculate donor costs and potential
returns against current supply; the old resource-economy spatial approximation is not sufficient
for new nonlinear rules. Predict both useful and unfavorable investment conditions.

Acceptance: a reproducible zero-tick budget and explicit equations/data layout explain how
small paid modifications can matter, how they disappear, what neighbors can exploit and how
cost scales. Register short tests with competing explanations and stopping criteria. Resolve
technical unknowns without inventing a user approval gate for ordinary formula selection.

Evidence: calculations and bounded arithmetic probes, linked to current production owners.
Sulion: `8cf406fd-01df-4dae-a16a-e596712f1da6`.

#### Execution steps

Expansion: `19b3beb9-17c7-4956-aba6-5f726b5d296e`.

1. Select laws and accounts (`7c765151-0c44-4719-96d5-d88bbb227070`, completed).
   Read `field.rs`, `world.rs`, chemistry, source and accounting owners. Select a bounded
   sparse conversion with spatial/temporal forcing and an existing material-derived
   protection response. Specify continuation, compiled caches and production consumers.
2. Calculate opportunity and register checks (`f674706a-3aaa-4cb4-9eeb-f0e15ca845d7`, completed).
   Implement reusable arithmetic and zero-tick reporting, calculate incremental protection
   against actual chemical properties and funded export/conversion costs, and register M2.
   Verify conservation/bounds and the calculated conditional opportunity before integrating.

#### Selected rules and zero-tick evidence

`weathering.rs` now defines reusable arithmetic. For each species, compile one destination:
the lowest-potential member of itself and four reflected manifold offsets (±4, 0), (0, ±4).
An unchanged destination is inert. Otherwise susceptibility is D/(0.025+D). This is a bounded
artificial identity mapping, not a thermodynamic reaction solver. It has no uphill cycle.

Ambient activity A is a periodic geographic basis plus a 1,200-model-second temporal cycle,
bounded between 0.05 and 0.95. Precompute three geographic coefficients per node; evaluate
two temporal coefficients once per physiology update. Seed/tick/config determine the whole
forcing without consuming source or genetic randomness. Effective exposure is A/(1+8I),
where I is the existing concentration-weighted impedance. The registered feedback-off control
uses A, retaining identical weathering, supply and other laws. There is no new neural input.

Each physiology update converts fraction r*dt*E*S/(1+r*dt*E*S), r=0.025 per model second,
of frozen extracellular donors. Commit products once, with no same-update conversion cascade.
Material is conserved; potential loss is accounted as weathering heat. Deposits are ordinary
chemicals and weather too; no permanent shelter stock. Washout and existing drift/diffusion
remain. Run conversion after the last spatial substep, before refreshing reductions, so its
new species wake the existing active-group mask and its changed medium affects the next step.

`resourceEconomy.environmentalOpportunity` calculates a conditional example without stepping:
four source units over area16, an investment of 0/0.1/0.4 units synthesized as ID15 from the
same food, sixty model seconds. It counts paid import/export and synthesis; remaining source
has the source-specialist terminal-work bound. With ambient0.95, conditional work is
7.9593/9.7129/11.7250; at ambient0.05 it is17.8238/17.5503/16.3171. Small investment therefore
has a possible favorable and unfavorable context. This freezes impedance and omits spreading,
deposit aging, additional stock/upkeep, injury and competing uptake. M2 must measure the full
return; these calculations do not claim that a living producer benefits.

Derived geography costs 24 bytes/node, 460,800 bytes at mesh2, plus approximately6KiB of
compiled species operators and bounded row scratch. No new physical field array is serialized;
existing chemical material, seed/tick, configuration and explicit flow totals determine
continuation. New rules/config/accounts require checkpointv14; obsolete physical versions fail.
The chemical-definition manifold remainsv4. Target additional work is linear in active species
groups, with no per-node trigonometry in stepping and no dense species pass for empty nodes.

Register M2 before implementation results: no-cell material/energy closure and shielded versus
unshielded source retention; a 300-tick paid-production probe with export disabled and feedback
disabled controls; then, only if the physical link exists, up to four swapped 1,500-tick living
comparisons in strong versus mild exposure. At most120 wall seconds/case. Mutation and learning
are frozen; transfer/disturbance off. Trace actual production, import, local exposure, repair,
maintenance and funded construction/divisions, including neighbors if a benefit spills over.
Use complete runtime and existing runner/ledger; do not introduce a fixture-specific step law.

At 500,000 ticks the main case ceiling spans100,000model seconds: about83 forcing cycles and
43 mean source renewal cycles using the current mean lifetime plus gap. This is long enough
to ask about recurring habitat use and inherited expression; actual generations remain measured.
Preflight found25GiB available RAM and361GiB free disk. M3 limits: one process, 4GiB RSS,
2GiB WASM, 2GiB artifacts/case, 12GiB study total, and at least20GiB free disk. Stop before
the reserve is exhausted; leave room for a final snapshot. M2 and pilots verify these ceilings.

### M1 — Implement the coupled production environment

Scope: integrate the selected rules into ordinary World, beginning with cell-free dynamics
and then funded cellular modification. Include versioned continuation, source/work accounts,
current report readers, bounded inspection and existing-renderer display of the local effect.
[depends on M0]

Acceptance: ordinary startup executes the new environment; paid deposits and their removal
use the same rules as every other chemical. Empty/sparse worlds do not run dense chemistry.
Restore continues environmental phase and deposits exactly. Observers do not change physics.

Evidence: bounded conservation, continuation and producer/consumer tests; ownership guards;
`make ci`. No parallel diagnostic-only implementation is sufficient.
Sulion: `50427e92-9d3b-4964-aeb3-a77fd6d0fc5f`.

#### Execution steps

Expansion: `b62572be-1ce0-4548-b457-4b2c27670bd3`.

1. Integrate physics and continuation (`1bcba148-3e64-4f32-bf3f-5729f0dea2da`).
   Extend `field.rs` through a compiled `climate.rs` cache, wire ordinary World and explicit
   weathering accounts, validate new config, and require checkpointv14. Test sparse activation,
   passive material/energy closure and exact restore across physiology phases.
2. Integrate display and consumers (`5f4fae89-4643-49fc-b2bd-d92be6acc2d2`).
   Use the spare packed field channel for exposure, add a layer and bounded inspection,
   update schema/report consumers and expose the experimental feedback control to the harness.
3. Verify production integration (`2c07093a-9a84-49ec-b414-8a2e90a4a138`).
   Run ownership/producer-consumer tests and `make ci`; record failures and actual limits.
   Keep historical fixtures explicitly identified when their abiotic conditions are disabled.

#### M1 evidence

Ordinary World now executes weathering after spatial redistribution and records conversion,
suppressed conversion and heat. Checkpointv14 persists the new rules/accounts and reconstructs
the geographic/compiler cache. The new weathering view uses the spare eighth value in the
existing borrowed field texture. Selected inspection adds three local scalars; no ownership
guard was disabled. Historical v13 reports remain readable; physical v13 restores are rejected.
`make ci` passes73 Rust and59 Vitest tests, with13 existing lint warnings. Tests cover active
product groups, no same-step reaction cascade, material/energy closure, empty-field inactivity,
feedback controls, source schedule independence, exact restore, rendering and current report
production. Biological benefit and full-runtime performance remain M2 measurements.

### M2 — Establish causal opportunities and operating limits

Scope: use no-cell tests for persistence/conversion, single-cell tests for paid modification,
and small swapped-placement comparisons for conditional net return. Freeze mutation and
declare learning/transfer settings. Compare incremental deposits, mild/adverse conditions,
production disabled and environmental coupling disabled as appropriate. Separate investment
cost, exposure/transport change, capture, repair, maintenance and funded growth. Avoid the
earlier disabled-division construction ceiling when measuring growth. [depends on M1]

Acceptance: establish one complete affordable feedback and a condition where it weakens or
reverses; demonstrate local sensing/action if the claim requires behavior. Negative findings
stay negative. If the proposed mechanism fails, return to the identified design assumption;
do not launch M3 or keep sweeping parameters for a positive result.

Evidence: registered hundreds-of-ticks probes, followed only where needed by paired runs
capped at 3,000 ticks. Reuse quick-run fixtures, traces and ledger. Measure ordinary mesh2
startup, a representative modified habitat and existing capacity cases. Inspect readable
deposits/exposure using an isolated session on the existing server with a registered purpose.
Human motion review belongs to M4 and cannot be replaced by an automated check.
Sulion: `d25543fb-42f8-4362-ad61-b2d5bdef5419`.

#### Execution steps and frozen short registration

Expansion: `a6c1e665-8c0b-4d4a-9158-92b81a32fbc3`.

1. Implement and run causal probes (`3e630393-08f5-4087-a5f1-a0ca7f0f375d`).
   Add an abiotic probe over the same production field operator: seed101 chemistry,24×24,
   mesh2,75 updates of0.8model seconds, four source units split with0 or0.4deposit units
   across four nodes around(6,6); compare no deposit, deposit, and deposit/feedback-off.
   Keep diffusion, drift, washout and deposit weathering active. Report residuals and species
   retention. Then use QuickScenario/runQuick for three300-tick single-cell probes in24×24:
   producer, export-off and feedback-off. Finite ID0 patch12units, sigma2, centered(6,6).
   Diagnostic RNN imports0 and exports15/240; one enzyme makes15 and three process0→240.
   Common founder funding and all ordinary physiology remain; mutation/learning/transfer off.
2. Measure conditional return (`06d9e93d-8f90-4da4-bd35-0fb44a4e8918`).
   Conditional on the first result: four1,500-tick comparisons, two cells in separated64×64
   neighborhoods(16,16)/(48,48),12source units per patch. Producer versus production-idle
   genotype with the same stock, swapped assignments; repeat with weathering absent to test
   its cost in a mild limiting condition. Growth/division remain enabled. Track lineage-wide
   expenses and chemical flows, full initial population denominators and actual movement.
3. Measure operating integration (`889183fe-0a09-48e0-9f4f-ce276d35bad5`).
   Once:600-tick ordinary seed27 and registered48/2,000/2,000-growth capacity. Browser purpose:
   verify the actual new layer, ordinary rendering, inspection and save/restore in an isolated
   profile on the existing server, at most300ticks/30seconds. No new server or user-tab control.
   Run CI after changed behavior. Human motion review remains unfulfilled until supplied.

#### Negative result and bounded economic follow-up

Ledger3904/3905: cell-free field accounts close below1.2e-14. At60seconds the deposited arm
retains1.77314 source units versus1.52615 with feedback off, but the no-investment arm already
retains1.77313 from its larger initial source allocation. Spreading/aging erase most of the
fixed-patch budget's predicted advantage. Ledger3906–3908: a living producer exports0.38133
ID15 and reaches local exposure0.26574 versus0.68266 with export disabled. It builds2.6970
material versus2.9013; this is a negative short payoff result despite a real physical effect.

Ledger3909–3912: both swapped finite-food comparisons go extinct before1,500ticks. Producer
construction2.6510/2.6625 is below idle2.8439/2.8281, and organism time is lower. In the no-
weathering comparisons it also loses,3.2338 versus3.5686. Do not extend these runs. The earlier
Sulion blocker note says the budget omitted uphill expense; that wording is incorrect. The
budget included synthesis expense, but froze impedance and omitted geographic escape/aging.

Branch `212b7cb2-cd02-47e8-89f8-4d35349b811e` resolves that investment assumption under unchanged
physics. Step `723571c8-b72a-4dd6-b557-8065fd7fe477` selects one alternative from a zero-tick
property screen: rank I/[(0.001+D/4+0.0125D/(0.025+D))*(0.1+0.8max(U-U240,0))]. This approximates
persistence and forgone processing plus two transport payments; it does not predict injury,
spatial capture or a live benefit. ID245 ranks first: U0.64395,D0.01562,I3.15497. Its potential
is only0.00583 above the original terminal product240, whereas ID15 required uphill synthesis.
This tests useful low-potential byproducts rather than a high-potential barrier material.

Step `e3e93d85-7930-47ae-a835-75a23ebf815a` registers three300-tick byproduct probes with the same
export/feedback controls. If the physical link holds, run exactly four swapped1,500-tick
comparisons at the original food/geometry/budgets. One enzyme produces245 and its transporter
exports245; the control instead processes and exports240 with the same stocks. Keep membrane240,
all other genes, mutation/learning settings and laws fixed. This includes compatibility costs.
No further chemical sweep or horizon increase follows automatically from a negative result.

Ledger3917–3923: ID245 export is expressed(0.34612 by300ticks), and local exposure falls to
0.50718 versus0.68252 with export disabled. In the paired runs, producer construction exceeds
the240-product control by0.01115/0.03608 under weathering and0.02264 in both no-weathering
placements. This small advantage does not isolate habitat benefit; processing/compatibility
differences remain competing explanations. Register one diagnostic follow-up before interpreting:
two matched feedback-off placements, same1,500-tick ceiling,120seconds/case,seed27,ID245/control240.
Compare the producer-minus-control construction difference with the existing coupled result.
No new chemical, seed, horizon or physical rule. This additional3,000-tick ceiling resolves a
specific attribution question; it does not extend any earlier run or supply a community gate.

Ledger3924–3925 resolve that contrast: with feedback off the producer-minus-control construction
difference is0.003379/0.028976. Subtracting these from the coupled differences leaves an
incremental feedback return of0.007768/0.007105 material in the two placements. This is a small
positive funded-growth effect after ordinary paid costs, not a survival advantage. Both arms
benefit from shielding by their excreted products; the alternative adds a little more. The
stronger claim that environmental benefit explains the whole producer advantage is rejected.
The no-weathering arm retains a processing-related advantage. No further tuning follows.

Ordinary startup(ledger3913) reaches600ticks,54living cells and54divisions with closed accounts.
The measured222ticks/second overlaps a short assay and is only a startup observation. Fixed
saturated capacity(3914–3916) gives39.71/24.45/19.89ticks/second for48/2,000/2,000-growth,
with exact cold continuation. These retain the accepted saturated-load operating limitation.
The isolated browser check on the existing server rendered the smooth weathering layer,
inspection, save/export and context-loss recovery. Its half-second observation loop overshot
the300-tick target to392ticks; actual stepping took1.687seconds. No user tab was touched.
This establishes operational wiring, not human motion review or browser endurance.

### M3 — Run the bounded overnight investigation

Scope: test whether the established feedback becomes expressed and changes inherited resource
use under ordinary local reproduction. Many generations and deposit turnover are needed for
this question; single-cell fixtures cannot answer it. This is exploratory evidence, not proof
of enduring diversity. [depends on M2 and its physical-opportunity result]

#### Registration to finalize before execution

- **Contrast:** coupled environment versus the same new kernel with the selected feedback
  disabled, holding supply, forcing, founders and other laws fixed. Name the exact removed
  coupling in M0. Preserve independent environment randomness so divergent births do not
  silently change exogenous schedules. No comparison against an old binary with other changes.
- **Cases:** two predetermined world seeds, 27 and 101; chemistry seed101 in all cases.
  Two arms per seed, four runs total, paired ordering. The seeds check sensitivity; they do
  not represent a population estimate. Never expand the set because an outcome is dull.
- **Evolution:** ordinary founder, mutation and paid inherited learning enabled; disturbance
  and horizontal transfer disabled. Record all rates. No selected winner replaces a founder.
- **Pilot:** four cases at 3,000 ticks and five wall minutes each, maximum 12,000 ticks and
  20 minutes total. Check source/account equivalence, measurable coupling, throughput,
  memory slope, archive size and reliable stopping/export. Growth or diversity is not a pass
  condition. Evaluate the pilot before starting the main batch; scaling is not automatic.
- **Main ceiling:** four cases, each at most 500,000 ticks or 75 wall minutes, whichever comes
  first. Maximum two million ticks and five hours total. M0 must relate that horizon to
  predicted turnover/generation times; reduce it if unnecessary. If the cap is insufficient,
  report the unresolved question rather than silently extending it.
- **Resource envelope:** one headless case at a time, separate from the user's browser run.
  Preflight available memory/disk; freeze numeric process and artifact limits from M0/M2
  measurements before starting. Sample process/WASM memory and stop safely on the declared
  limit. Use bounded samples and initial/final checkpoints, not repeated full-state dumps.
  Preserve exact source/config/binary provenance, stopping reasons and partial results.
- **Early stops:** extinction, invalid/nonfinite state, account failure, memory/storage limit,
  per-case wall cap or total budget. An invariant failure stops the batch; an ecological
  extinction ends its case. No automatic retries, seed replacement or horizon extension.
- **Follow-up reserve:** at most four 1,500-tick cases and ten minutes total for one selected
  causal comparison with swapped placement, frozen mutation and explicit learning settings.
  Fix the candidate-selection rule before the main batch using measured environmental
  investment and cost-adjusted return, not the largest family or a convenient cluster. Use
  the first qualifying candidate under that rule; if none qualifies, omit the comparison.
  The intervention must test the claimed trait or medium effect without granting resources.
- **Analysis:** reserve 30 minutes for local reports and interpretation. Total M3 ceiling is
  six hours and 2,018,000 simulation ticks, including pilots and optional follow-up. Record
  incomplete analysis if the ceiling is reached. Do not rerun simulations to fill gaps in
  presentation. No hosted artifact upload.

#### M3 execution expansion and fixed observation rules

Expansion: `72664089-0534-4a5d-aa43-7fa957961e0c`.

1. Prepare bounded recording through `runRecorded`, its existing optional lineage trace and
   ledger. Add a synchronous resource-stop callback with final checkpoint salvage, and a
   compact headless sample of installed machinery, funded stocks and local exposure. No new
   browser channel or private controller dumps. Tests cover observer neutrality and stopping.
2. Execute and inspect the four registered pilots in order27/on,27/off,101/on,101/off. Sample
   every1,000ticks. Enable the existing lineage chemical/work trace to retain dead-cell flows;
   measure its observer overhead as part of the pilot. Record full initial source schedules.
3. If accounts, resources and observations pass, run the same four cases from tick zero at
   the registered500,000tick/75minute ceilings. Record initial/final checkpoints only. A new
   process per case releases WASM high-water memory. No other ecological job runs concurrently.
4. Analyze sampled histories and exact final states without advancing them. The six-hour M3
   clock begins with pilots; harness preparation is implementation work. The main five-hour
   budget and all tick ceilings remain unchanged.

Working-stop thresholds leave room for final export:3GiB process RSS,1.5GiB WASM and1GiB
case artifacts, below the4/2/2GiB hard envelopes. Check resources at least once per second
between steps; reserve1GiB for final export and require20GiB free disk. Invalid accounts or
nonfinite sampled state stop the batch. Resource-limited cases remain incomplete. Report any
limit overshoot from an indivisible operation rather than claiming an OS-enforced hard cap.

Candidate rule, fixed before pilots: only coupled main cases can nominate. In case order then
sample tick then cell ID order, select the first nonfounder genotype carried by a cell at
least1,000ticks old that has exported at least0.1material of species with impedance>=2.5
and potential<=the founder terminal product+0.05, with at least10% of its lifetime exports
in that set. Its lineage must have positive captured work minus maintenance, motors, learning,
transport, repair and refitting, plus positive constructed material. This screens actual
investment and paid return; it does not attribute either to the candidate genotype. Save its
genotype and observed body separately; never promote it into the population or default.
If one qualifies, the four-case reserve compares that genotype against the original founder
in the M2 finite-patch geometry, with feedback on/off and swapped placement, frozen mutation,
private learning and inherited learning. Paid fixture installation uses common initial funding.
The difference between genotype effects under on/off is the causal question. A negative result
stays negative. If none qualifies, record no eligible candidate and omit these cases.

Per-species imports report chemical identity, not atom provenance: uptake of a source identity
can include recycled material, and a non-source identity can arise abiotically. Do not label
these as proven fresh-source versus recycled uptake. Local climate/stock associations are
descriptive; inherited benefit requires the controlled follow-up.

Accounting interpretation clarified during read-only analysis: `flows.repair` includes both
paid repair work and material-potential dissipation. The unchanged candidate predicate therefore
subtracts recorded energy expenses, not an exact work-bank bill. Preserve the predeclared
predicate and all runs; do not call its score net profit or adaptation. The report separates
base repair work (`repaired × repairEnergy`) from total repair dissipation; any uphill repair
conversion work is additional. Funded construction and the on/off follow-up remain the payoff
evidence. This clarification changes interpretation only, not selection or physics.

Pilot review, September16: ledger3926–3929 all reach3,000ticks. Both pairs retain exactly
identical source inventories, schedules and environment RNG at every sample despite divergent
populations. Trace imports reconcile with the complete physical ledger. Shielding is expressed;
its suppressed-conversion counter is zero in both knockout cases. Sampled RSS/WASM stay below
the working caps, account residuals close, and final exports complete. CI passes73Rust and
60Vitest checks, including stopping after two steps with exact restored partial state.

Pilot artifacts occupy47–56MiB/case. Full sampled genotype records dominate growth: the
highest observed10MiB/3,000ticks would project to about1.67GiB at500,000ticks before other
records. That linear extrapolation is uncertain as population changes; the1GiB working
artifact stop may therefore end a main case early. Retain that conservative stop and report
the resulting horizon as incomplete. Do not change history, silently omit observations or
weaken the resource bound to achieve the tick ceiling. The pilot supports proceeding within
the declared envelope; it does not assure every case reaches500,000ticks.

A local report should connect environmental investment and deposit lifetime to chemical
conversion, source/recycled uptake, exposure, movement costs and funded reproduction. Show
inherited targets separately from installed machinery and compare regional trait distributions
over time. Use full-population denominators for shares; family count, biomass and k-means
groups do not establish strategies or coexistence. Include paired trajectories, source and
work accounts, peak memory, throughput and all stopped/incomplete cases.

The report must distinguish physical opportunity, controller expression, inherited benefit
and unresolved sustained ecology. It should make one recommendation for the next change or
continued user observation. An unchanged source-dominated outcome can be informative; locate
whether investment was absent, unaffordable, ineffective, exploited by neighbors or locally
beneficial but globally uncommon. Do not diagnose those alternatives from population counts.

Acceptance: execute the registered eligible cases within the envelope and preserve their
actual outcomes, including negatives. A particular ecological endpoint is not required.
Evidence: existing ledger entries, exact checkpoint/config artifacts and local report.
Sulion: `d06a3414-8944-477e-ae2c-8e8508dd338c`.

### M4 — Reconcile findings and hand off the observable world

Scope: reconcile current design/work-order documents with the implemented rules and evidence,
including the stale barrier claim. Prepare ordinary startup with the new environment and
legible local effects, preserving the centered layout and two colonies unless measured geometry
requires a documented change. Do not install an overnight winner. [depends on M2 and M3 report]

Acceptance: complete production integration and current `make ci`; reported operating limits;
explicit human review of motion, spatial activity and environmental legibility. Keep that review
pending until the user supplies it. No days/weeks ecology certification is required. Publication
and deployment are separate actions requiring authorization.

Evidence: final diff, CI, bounded startup/render/recovery checks on the actual implementation,
M3 report and user review. The overnight headless batch does not certify browser endurance.
Sulion: `ba2c513d-16ff-464f-ae15-86fb958bdb8b`.

#### M4 execution expansion

Expansion: `9380f93e-71a8-45f1-93ed-0503b73ba5e6`.

1. Reconcile current runtime documentation: v14, weathering/shelter laws, preserved ownership,
   actual field resolution, observable display and the negative barrier finding. This part
   proceeds while the fixed M3 cases run; no physical laws or study code change mid-batch.
2. Integrate M3 outcomes, one next recommendation and recorded limits. Review the complete
   local diff and run final CI. No publication is authorized.
3. Obtain human review of actual motion, centered activity and environmental legibility.
   An asynchronous review request is pending; automated screenshots cannot complete this step.

## September 16 execution record

M0–M3 are complete. M3 pilots passed. Seed27 on/off ended in extinction at124,051/28,691ticks
(ledger3930/3931). Seed101 on/off stopped safely at133,000/144,000ticks with355/381living cells
at the declared working archive limit (ledger3932/3933); these horizons remain incomplete.
Their complete cases occupy1,111,043,307/1,122,059,305bytes, within the2GiB hard case envelope.
After the first resource stop, the batch paused for resource review; the remaining registered
case ran once. No run was extended or replaced. The four mains advanced429,742ticks in62.7
minutes of measured execution. Peak sampled RSS was259.6MiB. All final checkpoints restored
to exact recorded summaries and byte-identical snapshots using archived kernels.

The first eligible candidate was genotype156 in seed27/on at2,000ticks. Its four registered
comparisons (ledger3934–3937) all ended in finite-patch extinction at331–335ticks. It divided
and outconstructed the founder in both environments, but coupling reduced its construction
advantage by0.02516/0.03035material in the two placements. The predicted shelter-specific
construction advantage is negative. All four follow-up final checkpoints also restore exactly.

The [evidence record](docs/design/chemistry/environmental-results.md) and
[local report](docs/evidence/digital-chemistry/environmental/README.md) preserve matched-tick
chemical flows, actual funded versus inherited traits, regional distributions and limits.
The next recommendation is a short paid test of low-motor descendants against food relocation,
including an expressed movement opportunity and matched allocation intervention. No new
campaign, founder promotion or default change follows automatically.

M4's current-law documentation and results are reconciled. Final `make ci` passes73Rust and
60Vitest checks, TypeScript, formatting, documentation and Terraform formatting;13existing
ESLint warnings remain. Human visual review is the only unfinished gate, through the earlier
asynchronous request. All changes remain local; publication is separate.
