# Interactive chemistry performance

> Historical first TypeScript chemistry implementation (v9). Its measurements and decisions
> remain evidence for that version. The [Rust/WASM numerical contract](numerical-engine.md),
> [current results](numerical-results.md) and [migration dispositions](numerical-migration.md)
> supersede its runtime choices and unfinished work order.


The September 13 human review rejected current throughput as unusable. The minimum is 30 ticks
per wall second in the ordinary default world, with useful observation. Legibility and physical
reasoning remain governing requirements. The user already runs a development server.

Current population-scale evidence is in [population performance](population-performance.md).
Ledger 3598 used eight founders and could not establish performance at the retained 48-founder
scale. That reduction and its completion claim are withdrawn. The selected cutoff remains
`1e-13`; this document preserves its fidelity evidence, earlier policies and failed workloads.

## Registered checks

Profile seed 101, unchanged default dimensions, sources, founders and physical rates. Measure
300 startup ticks with a 60-second wall cap, recording individual tick and observation costs,
species/block counts, balances and an exact final checkpoint. This is a computational workload,
not an ecology test. Retain the baseline checkpoint for repeated 30-tick continuation comparisons,
each capped at 30 seconds. At most six optimization comparisons are initially registered; a new
profile or failed check must justify additional measurements. Do not extend ecological horizons
to claim adaptation. Include field display aggregation and spatial observation costs explicitly.

The leading hypotheses are repeated sparse-field traversal, conversion between tiled and dense
arrays, and growing exact chemical support. Use CPU profiles to distinguish these from organism
cost and allocation. Preserve resolved chemical quantities, shared transport supply, frozen diffusion
impedance, accounting, and exact checkpoint continuation. Numerical approximations must have
documented bounds and validation against the physical behavior they represent.

30 ticks/second allows 33.33 ms per tick including observation and scheduling. Startup averages
alone cannot meet acceptance: measure later ticks and record population/field load. Browser
responsiveness remains a human check on the existing server. No days/weeks guarantee follows from
a bounded throughput measurement.

## Numerical resolution decision

The user explicitly delegated numerical and implementation decisions on September 13: the agent
is responsible for delivering a functioning, legible chemistry system at usable speed. Numerical
resolution is an engineering choice to validate, not a user approval gate.

The tick-207 checkpoint contains 2,427,029 positive field quantities, including 71,002 subnormal
float64 values. Only 108,482 quantities are at least `1e-24`. Those occupy 1,907 blocks, compared
with 38,886 currently allocated blocks. The sum below `1e-24` is `1.2031e-21` material units.
The first exact loop optimization halves computation/observation cost but remains far below
30 ticks/second; the 30-tick continuation still matches the old checkpoint byte for byte.

The first implementation used an extracellular numerical resolution of `1e-24` material units per species
per raster element. At the end of each complete diffusion/washout step, remove positive amounts
below that threshold, recording their actual material and chemical potential in separate numerical
residual counters. Do not classify the loss as physical washout, alter intracellular chemistry,
change affinity, or select species by ecological role. Persist the policy and counters, validate
them on restore, and expose the accumulated error in balance reporting. The default is persisted
as `chemicalResolution`; zero supports exact numerical reference checks in the same engine.
Configuration validation rejects resolutions above `1e-12`. Existing incomplete-development
checkpoints lacking this required setting or the counters fail validation; no old-economy adapter
is added. New exact and resolved comparisons start from current-schema worlds.

For the default 320 × 240 × 256 field, the maximum newly removed material per complete step is
less than `1.96608e-17`, and its chemical potential is at most eight times that. Four weeks at
30 ticks/second gives a worst-case cumulative material bound below `1.427e-9`. Actual loss must
also be reported; this loose bound does not predict the realized loss. At the instant of removal,
the maximum concentration error summed over species at one site is `2.56e-22`; the raw impedance
error is at most `3.072e-21`. These are local truncation bounds, not a proof that a nonlinear
evolutionary trajectory stays identical indefinitely.

Compare exact and resolved execution from the same initial world or checkpoint, retaining
per-species field error, sensor/action differences, material/energy balances and measured speed.
Repeat the bounded diffusion invariants and required physical-opportunity controls where numerical
resolution can change the conclusion. A refinement comparison at `1e-30` must leave
those short causal conclusions unchanged. No long evolution campaign is needed for this decision.

## Exact optimization results

| Ledger row | Workload | Wall time | Result |
| --- | --- | --- | --- |
| 3535 | Profiled default startup, 300-tick target, all field channels | 60.38 s | Wall cap at tick 207; final step 381 ms, including observation 472 ms |
| 3536 | Original implementation, ticks 208–237 | 12.21 s | 2.46 ticks/s including all field channels |
| 3537 | Direct field loops and projections, precomputed neighbor indices; profiled | 6.27 s | 4.79 ticks/s; exact final checkpoint matches row 3536 |
| 3538 | Additionally compute cell impedance only at sampled sites | 5.34 s | 5.62 ticks/s; exact final checkpoint matches row 3536 |

All continuation comparisons start from the same saved tick-207 world and end with 48 cells,
34 species and 39,366 chemical blocks. These measurements include spatial observation and all
four field projections each tick, but not Canvas painting, React, timer delays or recovery writes.
The actual default renderer now computes only its enabled material layer; selecting additional
layers still computes their exact values. Scheduling also subtracts completed work from its
16-ms timer interval instead of adding an unconditional 16-ms delay after every batch.

The last five simulation steps in row 3538 cost about 119–120 ms each; all-field observation adds
about 50 ms. At that stage 30 ticks/s remained unmet even without browser overhead. Numerical
resolution was not yet applied. Direct loops, local-load caching and display changes retain
all positive float64 quantities and do not retune chemistry, population, geography or movement.

A separate two-step component diagnosis, not an ecological run, measured diffusion at 137 ms
before and 96 ms after zeroing quantities below `1e-200` in a disposable world. It used consecutive
steps without a warm-up, so it does not isolate underflow cost from compilation and state changes.
No altered state was saved or used as biological evidence. The retained-state counts above provide
the stronger evidence that tiny tails dominate storage and spatial traversal.

## Fidelity and operating check registration

The resolved startup completed 300 ticks in 10.02 seconds (row 3539), removing `2.10e-19` material
units, but its approximately 33-ms late ticks leave insufficient browser margin. The next profile
identified source-footprint recomputation, repeated receptor body-radius calculations, scratch
allocation and transporter sampling. Cache geometry and buffers, and reuse physical quantities
within their unchanged phase. Verify the same resolved checkpoint after these exact optimizations.

Run three current-schema default worlds for 300 ticks, resolutions zero, `1e-24` and `1e-30`, each
capped at 60 seconds. Compare cells, neural readings/actions, typed accounts and per-species fields.
The exact arm is numerical reference computation, not a separate physical engine. Retain missing
or wall-capped results instead of extending a horizon to obtain agreement.

Repeat the existing cross-feeding export control, paid barrier stop/removal control and active/self
degradation cases at the default and finer resolution, 300 ticks, seed 101, 30 seconds per case.
These cases exercise low concentrations, sensing, metabolism, impedance, diffusion and paid work.
Their negative findings must stay negative. Other species-independent laws retain bounded unit
checks; do not launch a fresh evolution or broad capability campaign.

After fidelity checks, measure the ordinary default world through tick 2,000, capped at 90 seconds,
including enabled field display aggregation, spatial observation and periodic population summaries.
This tests field growth and the previously reported late slowdown, not adaptation. Record living
population in each timing window; throughput after extinction cannot count as a living-world pass.
Measure snapshot encode/restore separately and verify continued state. If the 30 ticks/s budget
fails, profile the failed window and fix its measured cause before claiming acceptance.

## Results and operating scope

The original nonreproducing computational target passed. Its evidence is the
[2,000-tick operating report](../../evidence/digital-chemistry/performance.json),
[exact/finer comparison](../../evidence/digital-chemistry/fidelity.json) and
[paired probe traces and fields](../../evidence/digital-chemistry/fidelity-probes.json).

| Measurement | Result |
| --- | --- |
| Default 300 ticks, exact arithmetic support (3542) | 47.92 s, 39,831 field blocks |
| Default 300 ticks, selected resolution (3543) | 7.69 s, 39.0 ticks/s, 2,220 blocks |
| Default 300 ticks, finer resolution (3544) | 7.96 s, 37.7 ticks/s, 2,568 blocks |
| Default 2,000 ticks with display/statistics work (3545) | 52.71 s, 37.9 ticks/s |
| Slowest 250-tick window | Ticks 501–750, 34.6 ticks/s, all 48 founders living |
| Full 2,000-tick window range | 34.6–43.1 ticks/s; no window below 30 |
| Snapshot at tick 2,000 | 2.69 MB raw / 1.68 MB gzip; encode 79 ms, compress 59 ms, restore 336 ms |
| Checkpoint continuation | Serialized state matched before and after three restored ticks |
| Total numerical material removed at tick 2,000 | `2.2633e-18`; potential removed `1.0222e-17` |

The 300-tick comparisons used identical physical parameters and initial worlds. At selected
resolution, positions, headings, bodies, energy, damage, neural state, receptor readings, actions,
genomes, source inventories, ancestry and all physical ledger totals matched the exact reference.
Maximum internal-inventory difference was `2.02e-28`; summed absolute field difference was
`5.75e-19`. Finer resolution reduced those differences to `1.06e-34` and `3.91e-25` respectively.
These bounds establish numerical fidelity for this workload, not indefinite trajectory identity.

Ledger 3546–3557 repeats six registered 300-tick controls at both resolutions. All retain identical
physical ledger totals and match within `1e-12` absolute error for retained cells, field sums and
sampled traces. Sampled actions, positions, headings, growth, energy and damage are unchanged.
The largest local-mixture difference is approximately `1.96e-23`; the small receptor differences
do not change expressed action. Cross-feeding still benefits the receiver at a donor cost, paid
barriers still impede travel, and active conversion still fails to improve alive-cell clearance
against the self-reaction control. Resolution has not manufactured a positive ecological result.

The operating benchmark calls the same field pixel-painting function as Canvas, spatial observation
each tick and the population summary every eight ticks. It excludes Canvas upload, React/DOM
rendering, browser storage writes and timer overhead. No browser tools were available here; no
additional server or browser simulation was started. Actual browser responsiveness is not measured
by this result. Snapshot timing is separate from stepping, using Node gzip and the shared codec.

The population remained 48 through tick 750 and fell to 19 by tick 2,000; there were no divisions.
Thus the throughput pass includes full-population windows and is not an extinction shortcut.
At that point reproductive viability remained unresolved. Higher cell counts, very old ancestry, arbitrary
chemical occupancies, device differences and days/weeks operation need their own evidence; this
does not claim 30 ticks/s at every configured safety ceiling.

Final local verification: `make ci` passes lint, formatting, TypeScript, 181 bounded tests in
40 files, documentation checks and Terraform formatting; `make build` passes. The local fidelity
reader compiled and all eight saved-state/refinement comparisons passed. Earlier rejected and
incomplete measurements remain above. No commit, push or external publication was performed.

## Reproducing-world performance repair

The viability repair exposed load that the nonreproducing workload did not exercise.
Row 3575 reached 2,000 ticks with 29 living cells, 23 divisions and generation three,
but needed 83.98 seconds. Its final field contained 203 species. A 30-tick saved-state
profile put 38% of stepping in field advance, 16% in metabolism, 15% in sensing and
15% in transport. Use that checkpoint for bounded computation comparisons, not repeated
ecological campaigns.

Exact repairs reuse the five receptor sample positions, copy/clear only reached diffusion
scratch spans, traverse dense intracellular mixtures in canonical species order without
sorting, and cache affinity tables by the actual target and width. Compare complete continued
checkpoints after each repair.

The earlier `1e-24` resolution is unnecessarily expensive once cells reproduce. A candidate
`1e-12` threshold, already within configuration validation, reduces field blocks from 5,205
to 2,532 at tick 2030. The first comparison retained identical actions, ancestry, genomes and
random streams, with maximum position error `2.85e-13` and total field error `2.47e-9`.
The old reader's blanket `1e-12` test fails because accumulated field error and neural float32
rounding exceed that scalar threshold; it does not indicate a changed physical outcome.

Acceptance for the next bounded comparisons: identical organism identities, parentage, genotype
and random streams; cell and sampled-observation errors below `1e-7`, physical-account errors
below `1e-7`, and summed field error below `1e-6`. These tolerate less than one ten-millionth of
a world unit or unit-normalized sensor scale. Report actual errors as well as thresholds.
Compare the revised default with `1e-15` in the existing cross-feeding, barrier stop/removal
and degradation active/self cases (six paired cases, 300 ticks, 30 seconds each). Also compare
the compatible renewing deposit through daughter reproduction, 3,000 ticks, 30 seconds per arm.
Then rerun the integrated default through 2,000 ticks with the existing 90-second cap.

At `1e-12`, per-step worst-case removed matter is below `1.96608e-5` for a completely full
256-species world; four weeks at 30 ticks/s gives a loose bound of 1,426.91 material units.
Per-site instantaneous concentration and impedance errors are below `2.56e-10` and `3.072e-9`.
This worst-case long-duration bound is not small and must not be presented as an endurance proof.
Actual accumulated numerical sinks remain visible and part of conservation accounting.

The saved-state inspection also finds that only nine of 203 extracellular species have any
site at or above `1e-12`; the rest sum to `4.90e-15` material. A stable conservative diffusion
step is a convex combination of its inputs, so it cannot lift a whole sub-threshold species
above that threshold. Such a species may skip spatial diffusion and receive its exact uniform
washout and numerical sink directly, after the common impedance field is computed. Validate
this optimization against the ordinary diffusion path, including partial tiles and substeps.

The `1e-12` daughter-cycle comparison failed the predeclared cumulative physical-account
tolerance: washout energy differed by `1.6483e-7` after 3,000 ticks, although ancestry,
genomes, division/death ticks and random streams matched. Preserve that failed comparison.
Refine the default to `1e-13` and compare the same registered case against `1e-15`;
do not relax the acceptance threshold. The six shorter chemistry comparisons already passed
at the coarser resolution. Recheck final operating throughput with the refined default.

The selected `1e-13` cutoff reduces the bounds above tenfold: per-step material loss below
`1.96608e-6`, four-week worst-case below 142.691, per-site concentration below `2.56e-11`
and impedance below `3.072e-10`. These remain worst-case truncation bounds, not a long-run
ecological-error guarantee. No intracellular cutoff or species-specific exception is introduced.

## Historical eight-founder result

Ledger 3598, [operating report](../../evidence/digital-chemistry/viability-performance.json):
2,000 ticks in 36.47 seconds, 54.8 ticks/s overall. Successive 250-tick windows run at
98.6, 78.3, 63.7, 59.9, 50.4, 44.3, 42.7 and 40.5 ticks/s. Population rises from eight
to 24; 21 divisions include 13 by descendants, five cells die, and maximum generation is three.
This was the temporary default with four compactly placed founders per colony, retained feedstock,
compatible membranes, mutation and learning enabled, and the refined numerical cutoff.

The final checkpoint is 2.56 MB raw / 1.21 MB gzip. Encoding takes 58 ms, compression 54 ms
and restoration 226 ms; three continued ticks match exactly after restoration. The field has
2,150 allocated blocks. Actual numerical sinks total `1.1712e-7` material and `7.5158e-7`
potential energy; conservation residuals are `1.032e-10` material and `1.165e-9` energy.

[Six chemistry controls](../../evidence/digital-chemistry/viability-fidelity-probes.json) pass at
the coarser `1e-12` versus `1e-15`, with maximum field error `7.14e-9` and sampled-state error
`2.99e-8`. [Daughter-cycle refinement](../../evidence/digital-chemistry/viability-fidelity-cycle.json)
passes at the selected `1e-13` versus `1e-15`: field error `2.566e-8`, maximum physical-account
error `1.658e-8`, unchanged sampled actions and identical ancestry, genotypes and random streams.
The [coarser failed comparison](../../evidence/digital-chemistry/viability-fidelity-cycle-rejected.json)
remains evidence for the refinement. All tolerances are the ones registered before that comparison.

Main-thread browser rendering, device-specific speed, storage writes and long-duration endurance
remain outside these headless timings. The declining speed across population growth is real;
this result does not promise 30 ticks/s at the 10,000-cell safety limit. No large ecological
campaign, replayed evolutionary endpoint or browser server was used to obtain the result.
