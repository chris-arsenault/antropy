# Performance at the retained population scale

> Historical first TypeScript chemistry implementation (v9). Its measurements and decisions
> remain evidence for that version. The [Rust/WASM numerical contract](numerical-engine.md),
> [current results](numerical-results.md) and [migration dispositions](numerical-migration.md)
> supersede its runtime choices and unfinished work order.


The eight-founder throughput result did not establish the requested performance at
the preceding 48-founder scale. Lower initial competition was an ecological hypothesis,
not a validated reason to reduce the acceptance workload. A previous 48-founder run
already produced 39 divisions and fourth-generation descendants. Restore 48 starters
and keep the material-retention and membrane-compatibility repairs.

Audit row 3599 uses the repaired chemistry with 48 founders. In 2,000 ticks
the population ranges from 48 to 74 and ends at 57, with 56 divisions and 47 deaths.
It takes 72.94 seconds: 27.4 ticks/s overall, falling to 22.3 in the slowest 250-tick
window. The 30-tick/s requirement therefore remains unmet before this repair.

The completed repair (3615) runs that same world at 52.6 ticks/s overall, with every
250-tick window at or above 44.5. The full final checkpoint matches the slower audit
byte for byte. A separate synthetic 128-cell start passes at 30.7 ticks/s; details and
the limits of that larger measurement are below.

## Registered repair

Profile 100 continued ticks from that exact final checkpoint, with field-pixel
calculations, spatial observation and periodic statistics enabled, capped at 30 seconds.
Reuse the saved state for computation comparisons instead of rerunning the ecology.
Preserve complete physical state, inherited variation, random streams and numerical
resolution. Optimize measured repeated calculations, sampling and allocations; no
population ceiling, hidden selection, resource retuning or coarser chemistry is allowed
to make this performance check pass.

Each exact optimization must match the reference checkpoint after 100 continued ticks.
Run bounded tests for changed algorithm boundaries. Then run the restored 48-founder
default for 2,000 ticks or 90 seconds and report every 250-tick timing window alongside
its actual population. Average speed alone cannot hide a failing later window.

After the ordinary run passes, use a bounded larger-load check with duplicated saved
phenotypes placed without overlap, retaining existing chemical diversity. This is a
synthetic computation fixture, not evidence of ecological support at that population.
Measure 300 ticks or 30 seconds at 128 cells; no automatic size or horizon expansion.
Record the resulting limit even if it fails. Finish CI/build and reconcile the earlier
completion claim and default-count documentation with the measured result.

## Exact computation repairs

The saved tick-2,000 world isolates computation from ecological tuning. Its 100-tick
reference continuation (3600) takes 4.09 seconds with 57–54 cells. Metabolism accounts
for 36% of stepping, fields 22%, transport 15%, and damage and inference about 9% each.

Reactions and construction reuse bounded scratch storage. Fixed reflected products and
reaction energetics reuse the same physical laws; conversion-coefficient edits invalidate
their cache. Intracellular mixtures retain ordinary Map entries, with byte-indexed reads
and a canonical material-total cache invalidated on every mutation. Unobserved reactions
use private working quantities and commit after the reaction stage; observed cells retain
immediate writes and identical per-reaction facts. Neither path changes the transfer law.

Field addresses are precomputed. A tile-membership index lets receptors and transporters
sample local chemistry once without looking up absent remote species. Shared uptake uses
one frozen supply and demand array per sampled raster site across all cells and slots.
Population summaries reuse one field-total calculation. Scratch arrays and indices do not
enter checkpoints or select species by amount, role, inheritance or success.

Rows 3601–3604 and 3606 match the full 100-tick reference checkpoint byte for byte. The first
2,000-tick repeat at 48 founders (3605) improves from 27.4 to 38.2 ticks/s, with a 32.1
minimum window, and matches the original slower run's entire final checkpoint. Additional
repairs were then driven by the larger-load profile.

## Larger computational load

The initial synthetic fixture incorrectly represented duplicates as new offspring of living
fission parents. Strict restoration rejected it with `invalid parent lifetime`; that attempt
produced no accepted measurement. The corrected fixture duplicates saved phenotypes with
valid synthetic sibling/founder records, places added cells without overlap near their donors,
and accounts the material/energy grant explicitly. Original cells, resources and physical
parameters stay intact. These records describe a computational fixture, not observed births.

Row 3607 starts at 128 cells and takes 13.90 seconds for 300 ticks: 21.6 ticks/s. Its
population reaches 138 and ends at 111. The measured cost justifies further computation
repairs using that saved initial state, with the same 300-tick/30-second ceiling.
Rows 3608–3611 compare 100 ticks; rows 3612–3614 compare the registered 300 ticks.
All complete final checkpoints match their respective earlier references exactly.

Final larger-load row 3614, [report](../../evidence/digital-chemistry/population-performance-load.json),
takes 9.79 seconds, or 30.7 ticks/s. The first 250-tick window
runs at 30.1 ticks/s with 114–138 living cells; the last 50 run at 33.5 with 111–114.
Its snapshot is 5.83 MB raw / 2.22 MB gzip, encoded in 91 ms and restored in 301 ms,
with three exact continued ticks. This passes the bounded computational comparison with
little margin at the larger load; it is not a guarantee of browser speed or sustained
ecological support for 128 cells. No biological parameter changed to obtain the gain.

## Final restored default

Ledger 3615, [operating report](../../evidence/digital-chemistry/population-performance.json),
completes 2,000 ticks in 38.05 seconds: 52.6 ticks/s. The
[before-repair report](../../evidence/digital-chemistry/population-performance-before.json)
records 72.94 seconds for the identical world. Both end with 57 living cells, 56 divisions,
47 deaths, generation four, 203 extracellular species and 2,541 allocated chemical blocks.

| Ticks | Living cells | Ticks/s |
| --- | --- | --- |
| 1–250 | 48–56 | 78.2 |
| 251–500 | 56–60 | 66.0 |
| 501–750 | 60–66 | 57.0 |
| 751–1,000 | 64–67 | 53.6 |
| 1,001–1,250 | 65–73 | 46.8 |
| 1,251–1,500 | 66–74 | 44.5 |
| 1,501–1,750 | 60–66 | 45.4 |
| 1,751–2,000 | 55–61 | 45.0 |

The checkpoint is 4.36 MB raw / 1.68 MB gzip. Encoding takes 82 ms, compression 86 ms,
and restoration 297 ms; three continued ticks match exactly. Numerical sinks remain
`1.3697e-7` matter and `7.8844e-7` potential energy, identical to the slower implementation.
Conservation residuals are `1.1583e-10` matter and `2.8112e-9` energy. Resolution, viscosity,
resources, founder physiology, mutation, learning and random streams are unchanged.

`make ci` passes 190 tests in 44 files, lint, formatting, TypeScript, documentation and
Terraform checks. `make build` passes. New bounded tests cover partial-tile/seam sampling,
block-index mutation, mixture caches and native cloning, reaction underflow, interleaved
world scratch, observed/unobserved equivalence, coefficient edits and valid synthetic-load
restoration. Type-check failures during integration were corrected before acceptance.

These timings include field-pixel calculation, spatial observation and periodic population
statistics. They exclude browser Canvas upload, React/DOM work, scheduling and recovery writes.
The larger fixture has little timing margin. Neither benchmark certifies arbitrary population
sizes, old ancestry, another device or days/weeks operation. No source, population ceiling,
viscosity or chemical approximation was changed to pass these comparisons. The measured
reproduction is a starting-world opportunity, not evidence of evolved diversity or colonization.
