# Simplify simulation models

September 22, 2026. M0–M2 and their implementation sub-plans are complete.

## Outcome and boundary

Remove elaborate modeled machinery where a simpler artificial rule supports the same
ecological opportunities. The reference correction is replacing sampled, angular contact
machinery with circle overlap and permeable exchange. Success means fewer physical states,
independent rules and special cases to explain, with useful evolutionary choices retained.
LOC and branch counts can identify inspection targets; neither a smaller file nor faster
execution establishes that the model was simplified.

This plan covers machinery refitting, reservoir behavior, and binding/retention. It preserves
the chemical transformation algebra, discrete chemicals, funded capabilities, material/work
accounts, local genome/RNN control and the existing data-ownership boundary. Chemical-space
rotations remain part of the algebra; removing contact rotations does not invalidate them.
Existing behavior and exact trajectories are revisable. Save compatibility is not a goal.

Current authorization covers execution of M2 after completed M0 and M1.
Commit, push and deployment remain outside this request. The unfinished
[structural performance plan](../../SCALING-PLAN.md) remains separate and open. Tiles, caching,
threading and benchmark acceleration do not satisfy this plan's model-simplification outcomes.

## Evidence and reuse

- [Installed machinery](../design/chemistry/installed-machinery.md) records earlier feeding
  failures after mutation. The user explicitly rejected retaining parental capabilities to
  protect mutants from starvation. Those findings remain history, not a survival requirement.
- Before this change, `engine/src/refitting.rs` moved installed coordinates and angles every paid
  interval; `chemical_operators.rs` compiled intermediate identities. M0 removes both paths and
  the independent installed identity.
- [Material habitats](../material-habitats.md) records shared binding, persistent replenishment
  chemistry and bounded results, including negative public-food survival results. Preserve that
  evidence when reviewing the reservoir and binding models.
- [Composed laws](../design/chemistry/composed-runtime.md),
  [funded bodies](../design/funded-bodies.md) and [principles](../principles.md) own current behavior
  until a milestone replaces its relevant contract. M0–M2 laws are installed and verified;
  results and limitations are recorded below.

## Parent milestones

Sulion root: `10b840c9-7fdf-481d-9bc1-f207086a7518`.

| Milestone | Scope and acceptance | Evidence and decision ownership |
| --- | --- | --- |
| M0 Birth-fixed capabilities | Each cell uses its complete birth genotype for its lifetime. Remove refitting, duplicate installed identities and living-cell capability transfer. Daughter mutations act immediately without granting material. Preserve multiple programs, funded quantities and neural regulation. | Expanded below. Verify inheritance, ordinary consumers, restoration and material/work accounts. |
| M1 Reservoir behavior | Review actual inventory, evolving future-supply recipe, timers, random lifetime/rate coupling, dormancy and empty-source motion. Select and implement a simpler finite-mixture, release and external-supply model. Preserve locally changing output chemistry, depletion and accounted external input; no permanent chemical-0 reset. | Before expansion, implementer explains which independent states can disappear and what ecological opportunity each retained rule provides. Compare local depletion, changing medium and replenishment with bounded probes. The single-mixture direction is provisional, not an order to erase supply memory without examining its purpose. |
| M2 Binding and retention | Review chemical attraction/repulsion, two spatial scales, concentration pressure, circle separation, reservoir signal saturation and cohesion-dependent washout together. Select a coherent shared nonlinear interaction and justify any separate retention rule. Preserve chemistry-dependent clustering, local cellular influence and release when supporting conditions change; no fixed wells or prescribed colony arrangement. | Expand after M1's source representation is settled where it affects coupling. Implementer supplies a short rule inventory and constructed attraction, repulsion and loss checks. Human review judges motion; a chosen cluster count is not acceptance. |

Parent phase IDs: M0 `fb8b170e-751d-49fe-b300-581bf9c9643a`;
M1 `bf6ba924-6635-4b7d-aac4-d5cf07b0ecf9`;
M2 `49765240-26bd-4db6-9d43-e58927db784a`.
M0–M2 are complete. Their execution records and evidence follow.

## M2 — One-range binding and ordinary loss

Sulion child: `09574ce6-de7e-4fd6-9468-03b138c1f6c8`, anchored to M2.

### Rule inventory and decision

| Existing rule | Purpose and disposition |
| --- | --- |
| Attraction at ell and opposing attraction at 2*ell | The first supplies finite neighborhood reach. The broad subtraction independently selects a far repulsive region and discourages coalescence. Keep one normalized finite kernel at ell; remove the broad field and its evaluator/storage. A particular cluster count is not the goal. |
| Attraction amplitude 4 | Introduced with the two-scale rule. Remove the separate gain/control; use the existing normalized profile contraction, as in the earlier one-range proposal. This changes force magnitudes and is not a performance-only rewrite. |
| Local signed chemical repulsion | Keep: chemical composition can reverse affinity independently of crowding. It uses the existing second chemical profile, not an added species-specific rule. |
| Positive concentration pressure | Keep: its quadratic load law supplies a short-range nonlinear cost of crowding for field, source and body material, including mixtures with weak signed repulsion. It shares the same load reduction and control across consumers. |
| Circle separation | Keep: body overlap is geometric exclusion and contact access. Geographic concentration pressure does not resolve individual circle penetration. No angular/contact sampling returns. |
| Reservoir interface saturation | Keep: Q/(1+Q/interfaceArea) bounds what a finite exposed area projects. Deep stored stock must not produce unbounded force. This is a representation transform, not another spatial binding rule. |
| Cohesion-dependent washout | Remove: the extra positive-part product and discount protect deposits from the external sink in addition to resisting dispersion. Binding follows transport; the boundary loss has no demonstrated need to reward cohesion. |

The selected common force is `a*grad(K_ell*A)-b*grad(B)-chi*i*L_other*grad(L)`.
Field faces retain the corresponding conservative pressure difference and bounded drift.
For finite owners, matched deposition/sampling and self-load subtraction remain. Keep ell=6,
chi=.003 and existing mobility/velocity bounds. Use the same field for sources, cells and
dissolved transport. Public chemistry and cellular work still use raw local material.
K is the existing normalized even finite-support box composition; no new convolution or
interaction reach is introduced. The length-zero identity limit follows the same law.

Washout is the configured uniform fractional sink: `q_after=q_before*exp(-washout*dt)`.
Material and reference-value loss remain explicit. Support can hold material spatially while
it exists; consuming/converting it changes the force and allows diffusion to redistribute the
deposit. A colony receives no separate lifetime extension because its material is cohesive.
This may reduce dense standing inventory or cause loss of existing colonies; neither persistence
nor a chosen colony arrangement is an acceptance condition. Do not compensate by tuning supply,
washout, cell metabolism or source initialization during this milestone.

### Steps and bounded evidence

1. **B1 Select laws and establish baseline** — `16ab50ab-fb67-4b40-85ed-1bea57f38ffa`.
   Read source/cell/field force consumers and prior one-range and material-habitat findings.
   Earlier studies found local attraction too short-ranged; keep finite neighborhood reach.
   They did not certify long-term binding or profitable public-food survival. Preserve those
   limits. Capture a native v38 baseline executable before source edits.
2. **B2 Replace connected model** — `90e78c6c-0294-4a0b-afda-95576e30e038`.
   Remove the broad kernel, gain/control and cohesion loss formula from ordinary World, derived
   field state and work counters. Apply ordinary washout to active material and update runtime
   contracts. Advance physical version to reject the retired control/schema. No legacy mode.
3. **B3 Verify and reconcile** — `96af6bb8-a324-41d3-8c83-2fabc16bbb81`.
   Existing tests cover convolution symmetry/support, frame/chemical relabeling, no self-force,
   crowded separation, circle contacts and accounts. Update expectations tied to removed laws.
   Add bounded production checks for composition-dependent attraction/repulsion, removal of
   supporting material, actual cell work changing local force, and uniform fractional loss
   independent of density/cohesion. No population target, seed sweep or long run.

   Engineering cost comparison reuses `structural_capacity`: seed101, mesh2, native one worker,
   10 warmup + 100 measured ticks, 60-second cap. Two before/after trials for 48 founders and
   2,000 concentrated cells, sequential AB/BA after compilation; eight runs, 880 total ticks.
   Results measure revised rules, not byte-identical trajectories; do not attribute all timing
   change to the deleted kernel. Raw results/executables remain ignored under
   `frontend/harness/artifacts/binding-simplification-20260922/`.
   Run make ci, review connected consumers, record limits and close the child/root when complete.
   Human motion review remains open; constructed forces cannot certify visible trajectories.

### M2 verification and outcome

Ordinary World now uses one attraction cache and six filter passes, with no broad opposing
kernel or amplitude control. The same prepared field serves reservoirs, cells and dissolved
material. Washout computes one exponential factor per field pass, independent of local
composition and density. Physical v39 rejects older checkpoints and the retired control.
No source-supply, chemical-map, controller, contact or metabolic rule changed in this milestone.

Eleven bounded attraction/binding tests pass. Their evidence establishes normalized finite
support, periodic spatial and chemical relabeling, no isolated-body self-force, and reciprocal
source responses: separation at distance 4, attraction at 12/16, no force at 40 in the declared
fixture. Reversing chemical affinity reverses the response; withdrawing its material removes
it. Paired ordinary cells run 40 ticks with mutation disabled and static learning. Their paid
uptake, processing and export change the chemical force on a nearby source relative to an
identity-enzyme control, excluding body projections from the final force measurement.
Loss checks verify uniform fractional washout across amount, chemistry and body support,
including explicit material/reference-value accounts. These establish opportunities, not
evolved cooperation or stable long-run clusters.

Native one-worker cost comparison, pooled across two 100-tick measurements after 10 warmup ticks:

| Workload | Before v38 ticks/s | After v39 ticks/s | Change | Environment ms/tick before → after |
| --- | ---: | ---: | ---: | ---: |
| 48 founders, original world | 226.07 | 325.16 | +43.8% | 4.309 → 2.962 |
| 2,000 concentrated cells, original world | 50.90 | 52.24 | +2.6% | 1.336 → 0.854 |

At tick 110, attraction visits fall 139,140→67,361 in the founder case and 43,512→20,696
in the dense case. Founder population remains 48; both dense cases have 1,937 living cells.
Whole-world material and energy residual magnitudes are below 3e-9 in these measurements.
The dense fixture clears sources; it measures crowded cell/field execution, not reservoir
life cycles. Transfer, physiology and contacts still dominate that fixture. These are short
engineering workloads, not mature-world or browser throughput claims, and different laws
produce different trajectories. The dense improvement is small and has no confidence interval.

The initial four dense timing processes overlapped because the command wrapper yielded before
completion. Those samples are invalid and retained separately. Four sequential replacement
runs restore the registered AB/BA order. Total execution was 12 runs/1,320 ticks including
invalid timings; analysis uses only the eight valid runs. Filenames ending `-sequential.json`
identify valid dense samples in the ignored artifact directory above. No horizons or seeds
were expanded. The earlier material-habitat evidence remains historical.

Full `make ci` passes: 284 Rust library tests, eight server tests, 17 integration tests and
78 Vitest tests across 32 files. One registered server benchmark remains ignored. Both WASM
builds, Clippy, formatting, TypeScript, ownership guards, experiment-storage, documentation and
Terraform checks pass. Nineteen existing ESLint warnings and the WASM atomics warning remain.
The current Python producer/reader contract test passes within Vitest; changed Python files
also compile. Final review finds no production use of the deleted gain, broad cache or
retention function. Historical evidence remains labeled with its original laws.

Human motion review and long-run ecological effects remain unverified.
In particular, loss of the cohesion discount can reduce dense standing inventory;
removing broad repulsion permits compatible regions to coalesce. No tuning conceals those changes.

## M1 — Single-composition reservoirs

Sulion child: `5224c0e6-41bb-433f-add6-578eaf8ee959`, anchored to M1.

### State and selected laws

Keep one normalized chemical composition p, an actual material amount Q, a release rate r,
and one empty-interval countdown. Delete the separate inventory vector, independent remaining
lifetime and continuously simulated future-supply mixture. Inventory is Q*p. The shared public
conversion acts on p once; its work, heat and converted amount are multiplied by Q. When Q=0,
composition continues responding to the local medium as an external supply condition, but
contributes no material, work, force or velocity. This retains the reason supply memory was
introduced: renewal must not reset ordinary sources to the initial feedstock.

Release min(Q,r*dt) proportionally. Depletion alone samples an independent exponential delay
W=-sourceGap*ln(1-U), where U is uniform on [0,1) and sourceGap is the mean empty interval;
there is no expiry-triggered dump of remaining inventory. At renewal, supply r*sourceLifetime
material in the current composition and account its full potential. sourceLifetime now means
nominal batch amount divided by release rate, not a second clock. Retain explicit experimental
zone/epoch overrides at refill; they replace the one composition only when no inventory remains.

Set r=sourceRate*habitat.richness at initialization; it does not rerandomize at renewal.
Initial Q=r*sourceLifetime*(0.5+U), U uniform on [0,1), gives unequal starting depletion times.
Random initial conditions and independent renewal waits remain; random lifetime/rate coupling disappears.
Mean ongoing release is r*T/(T+G), ignoring timestep quantization, where T=sourceLifetime and
G=sourceGap. No new parameters, attraction law, transformation actions or cell behaviors.
Initial amounts and subsequent supply statistics change; exact old ecological trajectories are
not retained. Rate zero retains material indefinitely and produces no new supply.

At unchanged defaults T=600 and G=2400, ongoing supply is 0.2 times the configured rate and
site richness. The previous random-batch expectation was approximately 0.2196006 times that
base rate. This is an 8.93% reduction; mean initial batch material falls 21.94%. These are
zero-tick calculations from the two laws, not measured ecological outcomes. No compensating
calibration constant is introduced. The original implementation selected fixed subsequent gaps,
mistakenly treating independent renewal as dispensable timing noise. Staggered initial depletion
did not prevent a common long outage: mean supply was insufficient evidence for that change.
The correction retains the prior exponential wait law, sampled once per exhaustion. Some sources
can return early while others remain empty; individual long outages remain possible. This changes
neither the aggregate mean-gap budget nor the chemical and material-mediated response laws.

Retained rules have distinct purposes: amount limits accessible supply; composition enables
locally changing food; finite release creates local access; the refill delay creates deprivation;
accounted external batches keep the world open. M2 owns revisiting binding/retention equations.

### Execution steps

1. **R1 Settle state and laws** — `132a19d1-165a-4728-af99-930eba57a731`.
   Read production source lifecycle, chemistry, projection, observations, interventions and prior
   material-habitat findings. Record removed states and retained opportunities here. Complete.
2. **R2 Implement connected model** — `786126a4-e98f-487a-9c3a-d115431ef723`.
   Replace source storage/update and wire accounts, force projection, render activity, budgets,
   chemical web, research fixtures and checkpoint validation. Advance physical schema with no
   adapter. Ordinary World uses the new state; no second runtime source path. Complete.
3. **R3 Verify and reconcile** — `02cb7f27-c979-4755-9c35-4873a016833b`.
   Use bounded production-operator tests: release/depletion/delayed refill; rate-zero retention;
   composition change with and without material; no empty force/motion; shared conversion work
   closure; explicit supply overrides; observation and restore. Reuse existing local medium,
   source cache and ordinary-World account checks, then run make ci. No long ecology campaign.
   Update composed laws, source budget and runtime guides; preserve old findings as historical.
   These checks establish physical opportunities and accounting, not evolved diversity or motion
   quality. Human review remains the motion gate. Complete; evidence below.

### M1 verification and outcome

The source now has one chemical vector and three physical scalars: amount, fixed release rate,
and empty delay. The lifetime countdown, second chemical update, coupled random lifetime/rate selection,
expiry dump, empty-source force response and obsolete chemical mask are removed. Existing
public transformations, geographic binding and cellular rules are unchanged. Rendering and the
chemical web identify an occupied source from its actual amount. Budgets use the new batch law;
research readers consume the revised observations. Physical schema v38 rejects earlier saves.

Four new bounded tests and the updated source tests establish finite withdrawal and delayed
accounted refill, no rate-zero expiry, zero empty-source motion/projection, local composition
memory through depletion/restore, and explicit supply overrides only at empty refill. Applying
the shared operator to actual material agrees with composition conversion scaled by amount
at Q=0, 0.01, 2 and 1000. Ordinary World source/field/material/work closure and read-only
observations also pass. A stale empty-source seed fallback in the force-analysis example was
removed during final review.

Final `make ci` passes: 280 Rust library tests, eight server tests, 17 integration tests and
78 Vitest tests in 32 files. One registered server benchmark remains ignored. Both WASM builds,
formatting, Clippy, TypeScript, ownership guards, experiment-storage, documentation and Terraform
checks pass. Nineteen existing ESLint warnings and the WASM atomics warning remain. Initial
validation exposed outdated v37 expectations and a report-reader version whitelist; those were
updated and the full gate rerun. The four changed Python analysis readers also compile.

These are bounded mechanism/integration checks. No long simulation, browser motion review or
performance comparison was run; no speedup or long-term ecological benefit is claimed.

### M1 renewal correction

Sulion follow-up: `0b2cd54b-cbcf-44b4-9b21-86abdfc96d00`.
The fixed-delay implementation above failed to preserve independently returning sources.
Restore only the prior exponential empty wait, using the existing environment random stream.
Retain one composition, finite amount, fixed local release rate and nominal refill batch;
do not restore an expiry clock, second mixture, random rate or duration coupling. Shared
chemistry, attraction, repulsion and crowding remain unchanged. No continuous-refill model,
population-dependent supply policy or additional force is introduced.

Bounded regression checks cover independently sampled waits after simultaneous depletion and
again on the next cycle, mean-gap scale, finite release, delayed accounted refill and retained
chemical composition. These establish the lifecycle correction, not long-run ecological success.
Implemented and validated: `make ci` passes with 312 Rust tests and 79 frontend tests; one
registered server benchmark remains ignored. Existing ESLint and WASM atomics warnings remain.
No new long simulation or performance campaign was run for this correction.

## Refitting execution

Sulion child: `47fa13d9-4657-4f0b-a349-0638258d2eba`, anchored to M0.
The earlier paid whole-slot replacement proposal is superseded by the user's lifetime rule.

### Selected direction

A cell's immutable birth genotype owns its complete chemical configuration: four receptors,
four transporters, up to eight enzyme programs, and a membrane coordinate. The configuration
does not change during life. Receptors may recognize several neighboring chemicals, and enzymes
retain the existing chemical transformation algebra; this is not one chemical per cell.

At division, mutation establishes each daughter's configuration immediately. Split actual body
stocks, bound and free material, and energy conservatively. Program duplication redistributes
inherited enzyme stock; deletion leaves material for ordinary paid retirement. Mutation does
not create material or impose a new identity-change price. It may make a daughter unable to
feed in its birth environment. Do not preserve parental function as a survival buffer.

Growth, retirement, activity allocation, stored chemistry, damage, neural learning and private
memory remain dynamic. Remove living-cell genetic transfer because it changes capabilities
after birth. Do not add deferred transfer, replacement queues, refit prices or compatibility modes.
Explicit diagnostic interventions remain constructed-state operations, not biological processes.

One serialized genome identity owns function. Derived immutable chemical operators are shared
and rebuilt from that genotype on restoration. Inspection and chemical-role views use this same
configuration; body quantities remain cell-owned. Preserve all unrelated physical laws.

### R1 — Settle birth ownership

Step ID: `b55cb4ce-da99-4e13-ac64-cb565983084c`. Completed.

Reviewed inheritance, repertoire mutation, operator compilation, sensing and restoration.
Remove independently serialized installed machinery, machinery provenance and refit revisions.
Keep a derived immutable configuration alongside shared compiled operators so local kernels
can read capabilities without copying genotypes. Bind daughters after all birth mutations.
No affordability model remains to design.

### R2 — Remove refitting and connect ordinary consumers

Step ID: `6190522d-30a2-4e44-8500-fce8b5da4b09`. Completed. [depends on R1]

Remove continuous refitting, its operator interpolation, flow accounting and optional living-cell
gene transfer. Connect founder creation, division, repertoire mutation, restoration, inspection,
chemical roles and diagnostics to the single genotype-owned capability configuration.
Preserve funded body targets and actual stocks as distinct quantities. Advance checkpoint version;
reject old schemas without adapters. Remove obsolete controls and assertions.

### R3 — Verify and reconcile contracts

Step ID: `35f005f4-2a03-4d0b-99db-c1e08bfedb48`. Completed. [depends on R2]

Constructed mechanics checks must establish immediate daughter recognition, conserved inherited
stocks/material/energy, unchanged parental capabilities, multiple enzyme programs and ordinary
activity/growth using the birth configuration. Test a changed importer against old and new food;
loss of access to old food is permitted. Verify shared operators on restore, bounded inspection,
and the absence of living-cell capability changes. Use production operators and short deterministic
tests; no population-survival target or long evolutionary campaign is required.

Update current machinery, funded-body, composed-law and UI contracts. Preserve historical negative
findings with their original laws. Run `make ci`, review the connected changes and record evidence.
At M0 closeout, M1/M2 remained pending. Their later execution records above supersede that state.

## Verification and outcome

All M0 phases are complete. Production mechanics checks establish:

- Mutated daughters immediately use their complete birth configuration; a budding parent retains
  its original configuration. Actual body mass, each stored mixture and post-division work close.
- A constructed importer configuration recognizes new food and cannot consume the distant parental
  food. Both configurations retain multiple enzyme programs; no survival buffer is supplied.
- Birth clears parental contact recognition before initializing daughter receptor baselines.
- Program duplication splits funded stock; deletion retains inactive material for paid retirement.
  Ordinary activity, inward sensing, growth and chemical-frame checks pass.
- Restoration shares operators compiled from the sole birth genotype. Bounded selected inspection
  uses the same configuration and no longer publishes a second machinery identity.

`make ci` passed: 276 Rust library tests, eight server tests, 17 integration tests and 78 Vitest
tests in 32 files; one registered server benchmark remains intentionally ignored. Formatting,
Clippy, TypeScript, ownership guards, experiment-storage checks, documentation and Terraform
format checks pass. Existing 19 ESLint warnings and the Rust/WASM atomics warning remain.
The first full pass exposed stale v36 expectations in two consumers; both were updated to v37
and the full gate rerun successfully. The final review also removed the unused transfer decoder
and corrected a retired audit's refitting claim.

Checkpoint v37 rejects earlier physical saves. No long simulation or browser visual review was
run; these checks establish the revised mechanics, not evolved survival or diversity.
The historical refitting evidence remains labeled with its original laws.

## Current state and next action

M0, M1, M2 and their children are complete. The root model-simplification plan is closed.
The structural performance plan remains open; persistent tiles and meaningful-change scheduling
have not been delivered by this work. Human review of the revised binding remains unverified.
No commit, push or deployment was requested.
