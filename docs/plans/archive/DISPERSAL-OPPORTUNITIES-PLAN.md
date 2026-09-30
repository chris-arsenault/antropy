# Dispersal geography and neural response

September 28, 2026. Execute chat recommendations 1 (reservoir placement) and 2 (neural
drive). The evidence document numbers these in the opposite order; both are in scope.
Reservoir pulse/refill timing is excluded. No publication, deployment or live reset.
Sulion: `a153cfca-389d-4ef3-8e75-7f9bba99501b`.

## Outcome and principles

Allow shorter movements to encounter outlying deposits while preserving dense patches,
and keep total neural drive bounded as individual weights and learned recurrence evolve.
Cells need viable transit and feeding after arrival, not growth throughout the gap.
Keep finite source budgets, physical source motion, local sensing, paid actions and private
learning. Add no route, ecological reward, source anchor or independently tuned control.

Placement uses the existing regional centers, weights, angular draws and spread L, with
radial inverse CDF `r=L*sqrt(u/(1-u))`. The existing random stream supplies u in [0,1).
Wrap into the periodic domain. Radius, richness, composition, source counts and renewal
laws are unaffected. Preserve draw counts so matched seeds retain their nonspatial budgets.

For each augmented neural row a (including bias), contract bounded inputs x through
`z=(a dot x)/max(1,sum(abs(a))/3)` and the existing activation. Hidden rows combine input,
bias and effective recurrent coefficients before normalization. Learned recurrence uses
`W+abs(alpha)*H`, not the separate norms of W and H. Cache immutable norms with the shared
compiled program; evaluate learned recurrent norms on the paid physiological clock. Output
rows use the same rule. No additional owned physical state or new serialized cache.

This changes world initialization and controller semantics. Physical v44 will reject v43
saves, without an adapter or migration. The user's continuing server remains untouched.

## Phases

1. Register and capture baseline: source-only seed27 geometry and supply, saved-cell frozen
   controller results, and available short food-access checks. Read existing negative results.
2. Implement ordinary production consumers, immutable norm caches, effective learned norms,
   distribution and meaningful bounded invariants. Verify save/restore and independent clocks.
3. Compare mechanisms separately, update governing contracts/version consumers, run `make ci`,
   inspect the final diff and report negative or incomplete ecological predictions plainly.

## Bounded measurements

Existing evidence: `docs/evidence/dispersal-v43/README.md` and ignored
`frontend/harness/artifacts/dispersal-live-20260928/`. It contains the 64-cell frozen audit,
with 52 motor-equipped cells. Reuse the same input stimuli and private states to test
response changes before switching the checkpoint header to v44; this is a development
comparison, not a shipped old-save compatibility path. Five conditions, 32 neural intervals,
zero World ticks, no mutation or learning, 120-second cap. Baseline is already recorded.

Geometry: exactly two seed27 source-only runs, old and new placement, 240 sources on the
ordinary 720x540 mesh-2 world, no cells or priming, ordinary source budgets and evolution.
Each runs at most 500 ticks (100 model seconds) or 120 wall seconds after creation. Record
initial/final geometry, supply/release totals and actual tick/wall count. Initial source mass
and nominal mean supply must match. This tests early relaxation, not permanent connectivity.

Behavior: the reusable four 300-tick food-access probes before and after (eight total), one
seed and their ordinary fixed fixtures, each capped at 120 seconds. Compare current local
readings, actions, import, work, growth and survival. No population contest or seed sweep is
automatic. Additional bounded checks require a named unresolved mechanism before execution.

Outputs stay under ignored `frontend/harness/artifacts/dispersal-implementation-20260928/`.
Budget excludes long ecological campaigns. Human motion and evolved dispersal remain open.

## Findings and decision

Both mechanisms now run in ordinary production paths. Retain them for the next fresh-world
observation. Geometry supports the intended local opportunity; the neural result supports
removing extreme drive but does not establish generally better sensory control.

The two source-only runs reached 500 ticks in 2.31 and 2.73 wall seconds. With source
centers connected within 15 units, the old/new worlds had 37/89 groups after relaxation,
including 13/60 isolated deposits. The largest groups retained 27/22 sources. Median
nearest surface gap decreased from 16.58 to 13.97 units; 23/37 and 59/89 groups respectively
had another within 20 units. These are matched fresh worlds, not a comparison with the
mature live world's 53.75-unit median gap. More isolated deposits and shorter local gaps
coexist with large patches over this initial 100-model-second interval. Persistence after
longer reservoir motion, usable chemistry and colony establishment remain unmeasured.

Initial source stock matched at 29,152.58 material units, final stock at 24,361.64 and
nominal supply at 9.58189 material units per model second. The placement change therefore
did not obtain its measured spatial benefit by adding food.

The frozen comparison reused the same 64 saved cells, including 52 with motors. Among
those 52, policies with mean absolute turning above 0.99 fell from 11 to zero. Policies
whose mean turn changed by less than 0.01 under reversed chemical contrast fell from 13
to seven. However, median turning response also fell from 0.113 to 0.0265. The number with
swimming response below 0.01 to low/high energy stayed 37/52; median response rose from
zero to 0.00573. Normalization removes saturation in this sample while weakening some
previously strong responses. It does not supply missing conditional policies.

All eight food probes reached their 300-tick horizon. Before/after division counts were
unchanged in each fixture: persistent fast eight, persistent slow six, brief fast two,
brief slow one. For the fast fixtures, paid motor work fell 63% with persistent food and
43% with brief food; cumulative family distance increased slightly in both. Grown material
fell 2.1% and 4.1%, respectively. Account residuals stayed below 1.5e-13 percent. This is
a physical cost result alongside the frozen neural response result, but not a measurement
of improved settlement. The constructed food fixtures use four- and eight-unit starting
distances, not a newly generated inter-system gap. The proposed mobile/stationary crossing
comparison remains a follow-up, not a completed acceptance claim.

The initial baseline probe attempt stopped before stepping because the single-founder
fixture installed two variants. The harness now installs only its selected variant and a
regression test exercises both choices. The failed directory remains local. Successful
baseline ledger rows are 4406–4409; changed-controller rows are 4410–4413. Comparisons ran
before the final checkpoint header change, so their development checkpoints still identify
as v43. The shipped source requires v44 and contains no old-save adapter.

The light-response invariant originally required near-saturated output from large diagnostic
weights. Its fixture now places the emission threshold within the funded sensor range and
checks substantial light-driven activity and complete suppression of emission in light.
This preserves the sensory/action opportunity under the shared row budget.

Reproduce new source geometry with `cargo run --release --manifest-path engine/Cargo.toml
--example dispersal_landscape -- NEW_DIRECTORY` from the repository root. Reproduce current
food behavior with the registered `pnpm harness quick-food-access --stage probe --output
NEW_DIRECTORY` from `frontend`. The ignored comparison directory retains source JSON,
food traces/reports, frozen TSV and local reduction scripts. Those raw results are not
tracked documentation. No live-world behavior has been measured under v44.

## Delivery validation

All three implementation phases are complete locally. `make ci` passed the 337 kernel,
15 server and 17 chemical-definition tests, plus all 82 frontend tests after updating the
Python report consumer for v44. One existing server benchmark remains ignored. Clippy,
formatting, TypeScript and both WASM builds passed; ESLint reported 19 existing warnings
and the threaded compiler reported its existing unstable-atomics warning. Documentation
validation initially caught a missing anchor/index entry; both were corrected and
`make docs-check terraform-fmt-check` passed. No ecological panel was repeated for those
documentation repairs. Changes remain uncommitted and undeployed.
