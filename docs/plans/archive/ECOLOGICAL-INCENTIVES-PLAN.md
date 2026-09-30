# Ecological incentives: crowding, waste and independent light metabolism

**Status:** Delivered plan (archived) — crowding costs, retained/released product costs,
passive exchange and independent light metabolism shipped on physical v42 at `3ee29b3`, with
investigation records at `a3a97ee`. Body is the execution record; its open-gate, "remaining",
"uncommitted/undeployed" and human-review statements are historical and retired by the
September 30 delivery policy ([plans README](../README.md)). Current laws live in
[composed runtime](../../design/chemistry/composed-runtime.md).

September 26, 2026. Authorized: implement all phases and take bounded measurements.
Publication, live reset and changes to numerical chemical participation are outside this work.
Sulion root: `fce0b678-3b92-4234-8ea6-96a66aa76408`.
Final results below supersede the earlier effect sizes.

## Outcome and first principles

A profitable reservoir currently offers little reason to leave. Establish three interacting
opportunities: growth displaces compressed neighbors, retained and released products impose
chemical costs, and isolated cells can harvest light while acquiring dilute material.
Neither colonies nor dispersed cells receive a reward for their spatial arrangement.
Survival away from reservoirs requires energy; reproduction additionally requires matter.
Sunlight supplies work, never material, and is not a depleted communal resource.

Existing machinery owns the response: funded enzymes, chemically identified free and bound
material, membrane recognition, paid receptors and motors. Preserve the finite transformation
algebra, local controller boundary, regional physical ownership, overhead terrain/film shade,
and emitted-light budgets. No population limit, newborn ejection rule, chemical role label,
new neural input, reservoir hostility radius or autonomous avoidance policy is introduced.

## Sources and reuse

`optics.rs` freezes local light and reserves emitted work before physiology;
`reaction_execution.rs` bounds enzyme flux by actual stock, substrate and funding.
`metabolism::retained_response` already contracts free and bound material into a chemical
environment. `prepared_pressure.rs` shares circle contacts with sensing and exchange.
`transport.rs` owns donor contention, regional field commits and chemical flow observation.
`sensing.rs` provides four paid concentration/change/contrast receptors and chemical damage.
The ordinary quick runner owns checkpoints, traces and the local experiment ledger.

Earlier movement probes show that paid movement can help reach finite food. Earlier
overfilled reconstructed mature fixtures do not establish isolated-cell dependence on colonies.
The finite-food transplant extinctions do not identify the remedy. Local resource seasons
remain [deferred](../../design/local-resource-seasons.md); they change timing rather than the
incentive to leave a profitable site. Chemical numerical-floor investigation stays excluded.

## Governing changes

### Intracellular light environment

Let `M_ext` be the existing footprint-sampled material response and let
`M_int = sum_s((I_s+B_s)*p_s)/V` be the intracellular chemical concentration, in the same
material-per-area units as M_ext. Use the existing normalization
`N(x)=x/(1+|x0|+|x1|)` on `M_ext+M_int` for private reactions.
The private concentration is a chemical chamber environment; the public body projection
continues to affect surrounding material. It is not a second material owner.

For reaction coefficient `a=J*Delta_p/4`, light-supported work remains
`w=environmentalWork*max(0,a dot (L*N(M_ext+M_int)))` per accepted substrate unit.
Retained composition still modulates kinetics separately. Zero light supplies zero work;
identity transformations capture none; no enzyme stock means no flux. The L1 bound of N
preserves the existing emitted-light reservation bound. All external/recycled work and heat
continue through the shared reaction accounts. This removes dilution of the private chemical
environment across geographic mesh nodes as a prerequisite for independent light use.

### Membrane diffusion and waste

Add passive bidirectional concentration relaxation to the existing exchange owner. For species
s, membrane susceptibility `sigma_s=1-(1-susceptibilityFloor)*affinity_s` already describes
protection. Use diffusion D_s and funded body radius r to define `k_s=D_s*sigma_s/r²`.
With existing field access beta, let `a=dt*V*beta*k_s` and
`b=sum_n footprintWeight_n²/mesh²`. Request the finite-bath relaxation
`q=a*(C_out-C_in)/(1+a*(1/V+b))`. Transfers are capped by frozen donor quantities and
receiver headroom. Passive exchange pays no pump work; active transport remains paid.
No useful/toxic distinction enters the flux. Membrane matching retains useful solutes and
reduces harmful entry; products unlike the membrane escape more readily. Crowded cells
have reduced clearing, allowing internal product exposure to remain consequential even when
neighbors shield them from external exposure. Damage, repair and recognition remain ordinary.

Use the same exchange scratch and donor allocator in consecutive passive and active stages;
do not create another field, transport ledger or per-cell dense permanent physical state.
Species work follows occupied local field groups plus intracellular support. Finite exchange
and competition bounds are covered by the tests recorded below.

### Nonlinear compression

For overlap K_ij and crowding W_i=sum_j K_ij, increase pair separation stiffness with
`1+W_i+W_j`. The original finite-time exponential circle relaxation gives the time scale;
retain symmetric pair displacements and no force at separation. Use a bounded finite-step
solve so arbitrary overlap degree cannot create unbounded per-step displacement. Existing
adhesion acts on intended motion; compression acts afterward. Growth increases occupied
area and therefore outward pressure without a birth-specific impulse or loss of material.
Exact coincident centers retain the existing directionless convention.

## Milestones and acceptance

### M0 — Contract and baseline

Read governing laws and consumers, establish units/bounds and register measurements here.
Acceptance: coherent equations, explicit ownership and no forbidden input or free material.
Evidence: source review above; numeric budget reporting accompanies prepared fixtures.

### M1 — Independent light metabolism [depends on M0]

Wire private material response into the common optical reaction input. Verify no-light,
no-stock, conserved matter and emitted-work bounds. Prepare a declared cyclic diagnostic
genotype with actual ordinary funded stock, no replenished field and matched light/shade.
Measure accepted work, upkeep, damage, inventory and survival for 300 ticks. If that exposes
a missing physical link, resolve that link rather than extending the horizon.

### M2 — Crowding and waste [depends on M1]

Integrate stable compression and passive exchange, preserving active transport semantics.
Verify donor contention, no negative inventory, capacity, no pump charge and unchanged
chemical identities during exchange. Measure compression displacement and product leakage.
Use paid chemical receptors connected to the ordinary RNN to compare avoidance against an
otherwise matched motor control. A missing gradient or unprofitable response stays negative.

### M3 — Integrated evidence and handoff [depends on M2]

Run the combined short panel and a bounded startup/populated performance measurement.
Update current equations, observation semantics and version contract if durable shape changes.
Run `make ci`, review diff and retain measured limits. No claim of evolved coexistence or
human-approved motion; no live server change is required to complete local implementation.

## Measurement registration

All outputs stay under ignored `frontend/harness/artifacts/ecological-incentives-*`.
Use seed 701, static private learning, no mutation or inherited assimilation. Constructed
fixtures use the ordinary World and RNN. Record actual stocks separately from genotype targets,
initial matter/work and zero-tick maintenance/transport/motor budgets. Save initial/final worlds,
source hashes, scalar flows and sensor/action/position traces with the existing quick runner.

Initial budget: at most eight single-cell cases of 300 ticks and two paired cases of 1,500
ticks, each with a 120-second wall cap. Inspect probes before populations. Mechanics unit
checks use small finite configurations, not ecological horizons. Performance is one 100-tick
measurement after ten warmup ticks at 48 and 2,000 cells. No seed sweep or automatic extension.
Revisions require an explicit causal reason recorded here before execution.

## Current state

M0–M2 complete. M3 final equation review and corrected measurements in progress.
Existing unrelated workspace changes, including the utterance design and prior investigations,
are preserved.

## Execution expansions

M0 expansion `06329e86-202d-4abe-a87e-99a7a2ea4c73` completed: governing source review
and registration above. M1 expansion `16dc4fe0-bda3-4c6e-9228-24bcda490322`:

1. Integrate the private environment in `engine/src/optics.rs`; use the same input for physical
   physiology and observed estimates. Verify isolated nonzero signal, L1 bound, dark work,
   unchanged finite emission funding and zero funded-enzyme flux in Rust tests.
2. Prepare ordinary physical cyclic genotypes in `engine/examples/ecological_incentives.rs`
   and run the existing quick runner through `frontend/harness/numerical/ecologicalIncentives.ts`.
   Compare identical isolated cells under uniform light and zero transmission for 300 ticks.
   Record zero-tick budgets and actual paid flows. Do not alter production founders.

M1 completed: five optical tests pass. Ledger 4388–4389, local directory
`ecological-incentives-m1`: light survives 300 ticks with energy 0.7973 (initial 0.5),
external work 10.6983, maintenance 0.81 and repair 0.5301. No import or growth. Dark dies at
tick 43 with zero external work. Material and work residual percentages below 8e-14.
This is before passive exchange; the integrated rerun is required.

M2 expansion `5e6e60e0-18b5-4bb7-a8fb-00032f7500ad`:

1. `prepared_pressure.rs`: reductions produce W and contact degree d. A pair uses
   `C=Wi+Wj`, `z=max(di,dj)`, `h=1-exp(-dt*z)`, and separation speed
   `penetration*h*(1+C)/(2*dt*z*(1+C*h))`. Each row's summed finite-step weights stay
   below one half, even for dense graphs. The isolated pair exactly integrates
   `dK/dt=-K*(1+2K)`; small-dt response follows the nonlinear stiffness.
   The first frozen-stiffness exponential failed the existing elapsed-time test; this
   exact pair relaxation resolves that error without weakening the test tolerance.
2. `transport_passive.rs`, `transport.rs`, `transport_compose.rs`, `world.rs`: reuse the
   exchange owner in a passive stage before paid transport. For finite receiving field volume,
   use backward-Euler concentration relaxation with conductance `g=V*beta*D*sigma/r²`:
   `q=dt*g*(Cout-Cin)/(1+dt*g*(1/V+sum footprintWeight²/mesh²))`.
   This replaces the initial infinite-bath exponential; a finite bath cannot reverse its
   own concentration gradient in a single isolated exchange. Existing donor competition
   and headroom bounds remain mandatory. Reuse current flow records; transport work records
   pump work only. No persistent physical shape changes and no checkpoint migration.
3. Extend prepared fixtures for the combined light/shade and chemical-avoidance probes.
   Measure current receptor contrasts, motor work, exposure and repair. Add diffusion and
   compression invariants before marking the implementation complete.

M2 evidence: all 323 Rust library tests pass, including finite-bath exchange, donor/capacity
bounds, dense compression and the unchanged elapsed-time tolerance. Ledger 4390–4393 in
`ecological-incentives-m2`: combined light survives 300 ticks, energy 0.6992; dark dies at 59.
The light cell exports 0.7992 and imports 0.00436 material from an initial 0.8; its remaining
free material is about 0.00517. This is short-term energy support, not indefinite survival.

The receptor-steered swimmer reduces exposure from 27.722 to 17.404 (37.2%), repair work
from 0.29544 to 0.20287, for additional motor work 0.00557. It receives less material and
external work, however, finishing at energy 0.37845 versus 0.51766. Both survive 300 ticks.
At tick 10 the local lateral receptor contrast is 0.0202 and steering effort −0.316 versus
zero in the control. Avoidance therefore expresses the local cue and reduces harm, but this
mixed food/hazard case does not show greater total energy. No controller was installed in
production founders. Maximum work residual percentage across these four cases is 1.23e-13.

M3 registration adds two 300-tick dilute-material growth probes (remaining initial budget),
and at most two 1,500-tick paired growth placements if the probes show funded growth.
The causal question is whether light plus distributed matter pays ordinary construction and
movement without a reservoir. This addresses the substrate loss found above, rather than
extending the no-food horizon. Use uniform species 0 concentration 0.05 (51.2 total), active
input transport and ordinary construction; compare light/shade with matched motor effort.
Production supply and founders remain unchanged. Prepare 48/2,000 ordinary-capacity
checkpoints for the already registered 100-tick performance checks, four native workers.

M3 expansion `47d1838b-6110-46c8-9e1e-bc70d1f33eea`:

1. Extend the existing fixture preparer with the two growth cases and optional capacity
   snapshots. Use the existing quick runner and `parallel_capacity` example, retaining
   their ordinary accounting and finite bounds. Record growth, import, motor expense and
   operating throughput; inspect growth before choosing the paired follow-up.
2. Update `composed-runtime.md`, world/body contracts and current work-order pointer with
   the implemented laws, then apply formatter output through the native editor and run
   `make ci`. Review material ownership, optical funding and sparse exchange costs; record
   limits and reproduction instructions here. No new presentation or telemetry pipeline.

Growth probes (4394–4395) support the paired follow-up: light builds 0.91893 material and
ends with energy 1.25249; shade builds 0.38462 and ends with 0.01807. Neither divides within
300 ticks. Both swim about 24 units. The light treatment pays upkeep 1.06376, motors 0.27838,
pumping 0.11807, construction 0.45947 and repair 0.14644. Initial body is 1.61, free matter 0.8,
energy 0.5 in each. This establishes funded mobile growth away from reservoirs in dilute food.

Register the two allowed paired placements at 300 ticks each, reducing the 1,500-tick cap:
16 copies of this genotype and actual founder stock, four headings, a 4×4 grid centered
at (16,16) with spacing 0.45 or 4, identical uniform 51.2 material food and light. Compare
occupied extent, real overlaps, displacement, construction and divisions. These are
placement comparisons, not evolutionary competition. The shorter horizon measures
compression and growth before a finite-food population extinction could dominate.

Both paired placements survive with 16 cells at tick 300, without division (ledger 4396–4397).
The initially crowded population expands its RMS distance from the starting center from 0.712
to 13.685 units; the spread population goes from 6.325 to 10.111. Swimming and pressure both
contribute, so this is not an isolated estimate of pressure's effect. Crowded exposure is
147.426 versus 121.359; repair costs 4.532 versus 4.138. Crowded construction is 7.163 versus
6.574. Actual overlapping pairs fall from 42 to 33, 14, 9 and 0 at ticks 0, 10, 50, 100 and
300 in the crowded case. Crowding creates a cost but retains some benefits; this does not establish a universal
advantage for leaving or a daughter-expulsion frequency.

Four-worker native performance, ten warmup plus 100 measured ticks: startup 48 reaches 54 cells
at 222.1 ticks/s; the 2,000-cell fixture remains 2,000 at 44.0 ticks/s. Both exceed 30 ticks/s.
The latter uses the existing distributed random-genotype capacity fixture, with sources removed
and initial inventory 0.001 of each species; it is an operating load, not a mature live colony.
Cold rendering/census are measured separately: 9.0/6.9 ms and 10.5/33.8 ms respectively.
These exclude network encoding, GPU upload and human review. Passive plus active exchange
costs 9.61 ms/tick averaged over the populated case; no days-long operating claim is made.
JSON results and exact initial snapshots are in `ecological-incentives-m3`.

Consumer review found two analytical tools that needed reconciliation: the resource-economy
estimate now shares `metabolism::light_environment`, and the execution-budget diagnostic
includes ordinary passive flux proposals. The economy estimate explicitly remains an
active-pump conditional budget, excluding passive gain/loss. Runtime and observed optics
share the private-environment helper. This is diagnostic consistency, with no change to
chemical participation thresholds or their investigation.

## Reproduction

From the repository root, prepare into a new ignored directory:

```sh
cargo run --manifest-path engine/Cargo.toml --example ecological_incentives -- frontend/harness/artifacts/ecological-incentives-new capacity
node frontend/scripts/build-engine.mjs
```

From `frontend`, run only the registered cases needed for the question:

```sh
pnpm exec tsx harness/numerical/ecologicalIncentives.ts harness/artifacts/ecological-incentives-new isolated-light isolated-dark avoidance straight growth-light growth-dark
```

Use preparer mode `colonies` instead of `capacity` to also prepare `crowded` and `spread`.
The runner stops each case at 300 ticks, extinction or 120 seconds and records ledger entries,
checkpoints, kernel/source hashes, typed flows and local traces. Existing results are never
overwritten. The earlier M1 and M2 artifacts preserve their exact pre-combination kernels.
For capacity, reuse `parallel_capacity` with four workers and the corresponding prepared
`capacity-48.bin` or `capacity-2000.bin`; it stops at 100 ticks or 60 seconds after warmup.

## Final unit correction and recheck registration

The first private-environment implementation divided intracellular concentration by receptorK
but left external concentration unscaled. Final review caught this inconsistent addition.
Both now use material per area and the existing common normalization; receptor sensitivity
does not set chemical-work magnitude. The earlier numerical results above retain that initial
formula and are superseded for final effect sizes. This is a dimensional correction, not a
parameter search. Optical bounds and material/work accounts remain unchanged.

Recheck the six final single-cell fixtures for 300 ticks under the corrected formula, inspect
them, then repeat the two 300-tick placements only if growth remains expressed. Store them in
`ecological-incentives-final`, keeping all earlier evidence. This adds at most 2,400 ticks;
each case retains its 120-second wall cap. Repeat the two existing 100-tick capacity checks
because changed chemical occupancy can affect measured work. No seeds, thresholds, controllers
or horizons change. CI first passed Rust and all 80 Vitest checks, then caught the missing
`design-ecological-incentives` anchor; that one-line documentation error is corrected.

## Final results and delivery

The corrected six probes and two placements completed as registered, ledger 4398–4405 in
`frontend/harness/artifacts/ecological-incentives-final`. Each used the same physical kernel,
seed, controller and horizon as its earlier counterpart. These are authored findings; raw
measurements, traces, checkpoints and generated reports remain ignored local artifacts.

| Question | Corrected result | Interpretation |
| --- | --- | --- |
| Can isolated metabolism use light? | Light survives 300 ticks with energy 0.65170 from 0.5; dark dies at tick 59. Light receives 2.65605 external work. | Energy support exists without reservoirs, but free material falls from 0.8 to about 0.00517. This does not establish indefinite survival without food. |
| Can local chemical sensing reduce harm? | Receptor steering lowers exposure from 27.72197 to 17.40357, or 37.2%. Repair saves 0.09257 work for 0.00557 extra motor work. | Avoidance is expressed and reduces damage. Final energy is lower, 0.35948 versus 0.50351, because the avoided mixture also supplies material and light-supported work. |
| Can a moving cell grow away from reservoirs? | With uniform dilute material, light builds 0.91893 body material versus 0.38462 in shade, about 2.39 times as much. Both survive 300 ticks; neither divides. | Light pays for mobile growth when matter is available. Final energy is 1.25249 versus 0.01807. Sunlight supplies no matter. |
| Does crowded growth carry a cost and permit dispersal? | All 16 cells survive in each placement. Crowded overlaps fall from 42 to zero, while RMS radius rises from 0.712 to 13.685. Crowded repair costs 4.53157 versus 4.13820 when initially spread. | Swimming and pressure both contribute. Crowded construction remains higher, 7.16292 versus 6.57359. This is not a universal advantage to leaving, a measurement of daughter expulsion, or evidence of evolved coexistence. |

Across these eight final cases, maximum material and work residual percentages are
5.62e-14 and 3.90e-13 respectively. The fixtures freeze mutation and learning and use diagnostic
controllers; production founders are unchanged. No final case exceeded its declared horizon.

Final native capacity checks used four workers, ten warmup ticks and 100 measured ticks.
The startup fixture grows from 48 to 54 cells at 208.5 ticks/s; the 2,000-cell fixture remains
at 2,000 and runs at 33.9 ticks/s. Both meet the 30-tick/s requirement, but the populated case
has little headroom. Exchange averages 12.84 ms/tick there. Cold rendering/census costs are
9.27/7.35 ms for startup and 10.79/26.99 ms for the populated fixture, measured separately.
These replace the earlier throughput figures, do not represent a mature live colony, and
exclude network encoding, GPU upload and human motion review. Do not rerun to select a
more favorable timing.

The full `make ci` gate passes: 355 Rust tests, 80 Vitest tests, the Python producer check,
serial and threaded WASM builds, formatting, Clippy, ESLint, type checks, documentation,
experiment-storage guards and Terraform formatting. One Rust benchmark remains intentionally
ignored; ESLint reports 19 existing warnings. `git diff --check` passes. The added optical
regression verifies that receptor sensitivity does not change physical light-work magnitude.

Delivered mechanisms use existing physical parameters and observations: nonlinear contact
relaxation, membrane-dependent passive exchange and intracellular light-supported reactions.
There is no new population cap, toxin category, avoidance policy, neural input, persistent
physical field or checkpoint migration. The current contracts and analytical consumers match
the implementation. Chemical participation thresholds remain unchanged.

The next ecological judgment belongs to observation of an authorized running world: whether
its inherited controllers exploit these opportunities, whether daughters actually disperse,
and whether colonies and mobile cells persist together. These bounded checks establish useful
physical opportunities and their costs; they do not settle those population outcomes.
