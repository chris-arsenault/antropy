# Mobile medium-reactive resource reservoirs

> Historical execution record, archived September20, 2026. Version-specific instructions and
> pending gates below retain their original meaning; they are not an active work queue.
> See [plan dispositions](../README.md) and [current design](../../design/README.md).

**September 17:** implementation evidence below is retained, but the source-specific composition
was rejected. The [ecology correction](ENVIRONMENTAL-ECOLOGY-PLAN.md#ecology-correction) owns
the next work under the existing environmental plan. This completed plan is not replayed.

September 16, 2026. Execution and a limited short-horizon constant investigation are authorized.
Sulion root: `7494a047-45e7-42db-9915-becf86c9be24`. The earlier environmental plan and its
pending human review remain intact. No publication, server startup or long campaign is in scope.

## Outcome and selected rules

Resource reservoirs move according to local chemical interactions and release mixtures modified
by their local medium. Retain externally replenished material for continuing evolution. Do not
teleport sites, select destinations from population success, or call indefinite renewal finite
global supply. The future sun will supply accounted work for chemical transformations; it is
deferred. This change creates no usable work and no new thermodynamic state.

Use the existing two chemical interaction profiles, their geographic gradients and impedance.
A reservoir's interaction profile is its inventory-weighted mean. An empty reservoir uses the
profile of its configured incoming mixture, so it can drift during its renewal wait. For profile
`p`, local gradient `G`, and impedance `I`, let `F[k] = p[0]G[k][0] - p[1]G[k][1]` and velocity
`v = sourceDrift * F / ((1 + movementImpedance * I)(1 + |Fx| + |Fy|))`.
This is bounded passive spatial transport, like existing constitutive field/body drift; there
is no kinetic-energy store or free usable-work credit. Uniform empty medium gives zero drift.
Sources may become trapped; perpetual motion is not an acceptance criterion.

For the emitted stream, sample the two local material signals `S`. Their positive and negative
components weight four reflected chemical offsets `(4,0),(-4,0),(0,4),(0,-4)`. Define channel
fractions `sourceProcessing * weight / (1 + sourceProcessing * sum(weights))`. Reject each
uphill/equal-potential branch by retaining that fraction as the donor. Allowed branches preserve
material and charge their potential drop to a separate source-conversion heat account. Products
do not cascade in one release. The medium acts as a catalyst; it is not consumed or relabeled.
This deliberately artificial rule uses the shared reductions and four bounded candidates,
without all-pairs chemistry. Empty medium leaves the stream unchanged.

Sample all source responses before sources move or release, preventing source iteration order
from changing their response within that stage. Renewal uses the current location and retains
existing randomized rates/lifetimes/gaps and configured feedstock policies. No new unlimited
high-potential output appears through processing. Initial priming remains raw feedstock.

Rebuild a moved source's Gaussian delivery footprint by visiting only its periodic bounding
box, with unique nodes and the same normalized weights as the existing full-grid calculation.
No scan over empty world geography per source movement. No new full field, renderer or bridge
payload. Existing borrowed markers follow actual source locations. Headless observations may
report prospective output and velocity; browser stats receive only scalar counters.

Config, accounts and physical rules require checkpoint v15; reject earlier physical versions.
Keep current mesh2, world dimensions, seed 27, two founder colonies, inheritance and save retention.
Runtime consumers: `sources.rs`, new `source_medium.rs`, World stepping/restore, config/accounting,
existing source markers, bounded stats/settings, CLI and headless recorded runner.

## Evidence and experimental decisions

The prior weathering study established chemical shelter but not a shelter-specific inherited
advantage. Fixed-site indefinite renewal remained. This change addresses that structural source
behavior directly. Do not use population counts alone as evidence of strategy or adaptation.

Provisional constants: drift 1, processing 1. Drift values0.25/1/4 bound speed at those units per
model second; dt0.2 implies at most0.05/0.2/0.8 units per tick, all below mesh2. For a total
local signal magnitude0.25, processing 0.25/1/4 offers conversion fractions0.059/0.2/0.5 before
uphill rejection. With force magnitude0.1 and no impedance, drift 1 can travel about 5.45 units
in 300 ticks. These bounds identify hundreds-to-low-thousands of ticks as a plausible window;
they do not establish actual ordinary-world displacement or ecological payoff.

### Registered short study

1. Constructed production-operator probes: at most six 300-tick cases, one seed 27, no cells,
   finite reservoir, with empty medium, contrasting chemical gradients, high impedance,
   drift disabled and processing disabled. Record trajectory, emitted identities, conversion
   heat, held/supplied accounts and initial/final state. Compare actual release with its raw
   inventory withdrawal. Stop on account failure; no tuning around a failed physical invariant.
2. Once causal probes pass, compare ordinary seed 27 for 1,500 ticks at drift 0.25/1/4 with
   processing 1, plus static/unprocessed control. Sample every50 ticks. Mutation and ordinary
   private/inherited learning remain enabled; transfer/disturbance remain off.
3. Choose the drift from source displacement relative to radius, remaining local food access,
   changes in output, movement cost and funded construction. Seek visible, consequential
   change without sweeping away all accessible supply. This is engineering calibration,
   not a diversity target. At that drift, try processing 0.25/4; reuse processing 1 evidence.
   Exactly six initial ordinary cases, no factorial seed sweep.
4. Select the smallest horizon at which measured source movement/output changes and cell access
   respond. Confirm selected settings for at most3,000 ticks each at predetermined seeds27/101.
   Also retain a frozen-cell diagnostic if needed to distinguish physical opportunity from
   neural expression: at most two swapped1,500 tick cases, same shared runner and paid fixtures.
   No run exceeds3,000 ticks. No escalation to 100k or overnight runs.

Total ceilings:19,800 ticks,120 seconds/case and 30minutes execution, one case at a time. Budget
initial/final checkpoints and 50 tick scalar/source samples; reuse existing runRecorded, ledger
and resource guard with generous bounded export reserve. Stop on extinction, nonfinite state,
account failure or declared resource/wall limits. Preserve failures and stop tuning after the
fixed small comparison. Further mechanisms or horizons require a new reason and registration.

Before interpreting return, distinguish stock from target, cell imports from source releases,
chemical ID from atom provenance, and causal mechanical changes from evolved adaptation.
Report negatives and actual operating cost. Headless paths do not certify human motion quality.

## Milestones

### M0 — Select laws and short experiment budget

Acceptance: concrete local motion/conversion rules, resource accounting, bounded implementation
cost and a short causal/calibration registration. Expansion `65fa436c-b0ae-4ccb-a638-360d08be710d`.

1. Specify laws and integration boundaries (`bd8575c1-8abd-4b06-a36e-0c488a9599c4`). Read source,
   field-gradient, profile, World, ledger and rendering owners; preserve ordinary consumers.
2. Register causal probes and bounded constant comparisons (`eaa1d252-7408-408a-8d91-d68b55c9d9f9`).
   Use rate/displacement bounds above to select short horizons; meaningful changes and cost,
   rather than an impressive final population, determine the engineering choice.

### M1 — Integrate mobile reactive reservoirs

Depends on M0. Acceptance: ordinary World sources move and process released material through
local medium; exact persistence, source/field accounts, periodic footprints and ownership hold.
Controls, stats and diagnostic recording use the same production rules. Evidence: causal
invariants, Rust/WASM integration, existing ownership checks and short physical probes.

Expansion `81280968-bd1e-4b7f-9114-089e09065539`:
1. Implement bounded response/stream operators, local Gaussian footprints, World stage and v15
   config/accounts. Test empty/uniform gradients, medium-dependent products, no uphill work,
   periodic footprint equality and cold continuation.
2. Wire scalar UI controls/counters and headless source responses into existing observations.
   Add one bounded source probe command and a short study entry point using existing runners.
3. Run causal probes and shared CI; use recorded movement/conversion and account closure before
   calibration. Shared checks cover both implementation and consumer wiring.

### M2 — Calibrate short-horizon behavior and hand off

Depends on M1. Execute only the registered short comparisons, select and install justified
defaults, report mechanisms, cell response and limitations. Final CI and current docs required.
Human visual acceptance remains a separate pending review; no agent screenshot substitutes.

Expansion `13381452-4a55-4e8f-ad6a-d1c8da7f139e`:
1. Run the four registered drift comparisons, inspect access and displacement, then the two
   processing comparisons at the selected drift. Preserve every outcome.
2. Install selected defaults and confirm at seeds27/101 for at most3,000 ticks each. Measure
   short-run cost and use the existing bounded capacity workload if needed.
3. Generate local evidence, update current contracts and run final CI. Keep the earlier
   environmental plan's human review gate pending.

## Current state

M0 and M1 complete. CI passes 76 Rust tests and 60 Vitest tests. Ledger 3938 records six 300-tick
physical probes: reversing the gradient reverses motion; dense medium reduces travel from 1.441
to 0.075 units; fixed/raw knockouts isolate the operators. No probe renewed inventory. Maximum
absolute material/work residuals are below 4e-11. Empty medium starts motionless, then develops
small self-plume responses. Cold continuation required source drift to read persistent chemical
gradients rather than the transient body-signal cache; cells retain their existing full gradient.
M2's six 1,500-tick comparisons are complete (ledger 3939–3944). Select drift 4: by tick 500,
37.5% of sources have moved beyond their original radius with processing 1; weaker drift 0.25
leaves median displacement at 0.091 radii even at 1,500 ticks. Select processing 4: 29.0% of releases
change identity versus 12.8% at 1 and 4.1% at 0.25. At 4/4, funded construction retains 80.8% of the
static/raw control and cell imports retain 79.0%; this supplies a consequential chemical change
without eliminating ordinary founder access. This is a calibration choice, not an optimum or
an evolved benefit. Confirmations at seeds 27/101 are capped at 3,000 ticks, with 500 ticks selected
as the first practical ordinary-world inspection window. No additional cell diagnostic is
needed for this setting decision; evolved pursuit remains untested.

Confirmations complete: ledger 3945–3946, seeds 27/101 at 3,000 ticks, end with 39/113 living cells and
42/48 versus 45/48 sources beyond their starting radius. At 500 ticks the corresponding fractions
are 16/48 and 15/48 with 29.77%/30.84% converted releases. Both horizons completed; neither is
evidence of sustained ecology. Total study: 16,800 ticks, no optional paired-cell cases. The fixed
capacity check (ledger 3947–3949) retains the known saturated 2,000-cell performance shortfall.
Evidence and exact limitations are in [source results](../../design/chemistry/mobile-source-results.md)
and its local generated report. Current/archived kernels continue both final checkpoints byte
exactly for four checked ticks after a bounded extreme-radius guard. M2 is complete. Final
`make ci` passes: 76 Rust tests, 60 Vitest tests, formatting, types, docs and Terraform formatting;
ESLint retains 13 warnings and no errors. No publication or deployment was performed.
The previous environmental plan's human gate remains pending; this implementation does not close it.
