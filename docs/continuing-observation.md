# Continuing observation

The Rust/WASM system supports a continuing local run with worker rendering, checkpoint recovery
and bounded observation history. Days/weeks ecological persistence and browser endurance remain
unverified. Development establishes physical opportunities; it does not precompute the user's
future community.

The September 15 unattended tab crash prompted a separate
[memory investigation and repair](plans/archive/LONG-RUN-RELIABILITY-PLAN.md). Active development-page
checks reproduced retained React performance records and rapid renderer-process growth.
Development startup now releases completed React timing records after observer delivery;
the simulation and shared WASM renderer are unchanged. The lost tab's exact cause remains
unverified without its runtime trace. Those version-specific repair measurements belong to that record. The separate September20
[reload slowdown investigation](session-runtime-review.md) does not reproduce a JavaScript
collection benefit: forced GC left throughput near8 ticks/s in the short isolated test. WASM
high-water memory and multi-second save costs remain operational concerns; the user's reported
8→40 improvement is not yet causally explained.

The September 14 [reliability evidence](design/chemistry/reliability-results.md) adds browser
retention, save-concurrency and presentation measurements. The older headless figures below
retain their original scope. The repaired actual browser sustains 54 ticks/s at 2,000 varied cells
and 32.6 during constructed growth, using software graphics, full layers and expanded diagnostics.
Presentation rates are approximately 15 and 9 frames/s. Cold saves interrupt stepping; these
figures do not certify the user's device or unattended days/weeks operation.

## Historical operating workload — September 14

[Version-specific measurements](design/chemistry/numerical-results.md), ledger 3666–3668, use 100 ticks
after ten warm-up ticks, 320 × 240 units, mesh 2, all 256 external channels, distinct genomes
and private learning. Packed five-layer rendering preparation, 25-tick census and selected
inspection are included.

| Constructed load | Mean ticks/s | Lowest 20-tick window |
| --- | ---: | ---: |
| 48 cells | 217.1 | 192.9 |
| 2,000 varied cells | 59.9 | 59.3 |
| 2,000 cells with funded growth/division | 33.4 | 31.0 |

All pass the 30-tick minimum. The 60-tick target is narrowly missed at the resting 2,000-cell
load and not met during growth. GPU uploads/execution and browser rendering are excluded.
The growth fixture is an explicitly funded computation load, not a viable ecosystem.
Default startup separately retained 36 of 48 cells at tick 600 with one division
(ledger 3663). After [resource-economy calibration](design/chemistry/resource-economy.md),
the same 600-tick horizon reaches 74 cells with 26 divisions and no deaths (3777).
These short checks do not establish endurance or colonization.

Earlier TypeScript measurements, including the 52.6-tick/s default and quantization work,
remain in [population performance](design/chemistry/population-performance.md).
They do not describe the current engine.

## Current operating evidence

V32 fixture measurements reach63.78 ticks/s at48 cells and32.00 at2,000; the mature3,774-cell
checkpoint reaches17.79 headless with measured observation closed and15.95 active. These loads
are different and cannot be used as a time-series speed comparison. See [habitat evidence](material-habitats.md)
and [session measurements](session-runtime-review.md). Current mature-state throughput misses
the30-tick target on this host. The older figures below must not be presented as current capacity.

## Recovery behavior

The worker saves every 30 wall seconds while running and on pause; visibility/page-exit attempts
are best effort. IndexedDB transactions retain up to six automatic and two manual compressed packages
within 256 MiB. The September20 repair removes the former requirement that all preferred save
counts fit before expiry: that requirement paused the3,774-cell run when five roughly53MiB
packages exceeded the budget. Four such packages fit. The newest save always takes priority; older manual saves have priority over older
automatic saves, and only points fitting the remaining byte budget are retained. Each raw physical
checkpoint is limited to 192 MiB. Failed saves pause the
simulation and preserve the last good save and live world. Explicit restore starts paused.

V32 physical bytes contain chemistry, sources, bodies, installed machinery identity, neural state, inherited genomes, parentage,
random streams, integration clock, ledgers and interventions. Gzip packages separately include
bounded observations and execution provenance. Old physical schemas are rejected; no adapter
guesses missing chemistry. The previous manual-save store is untouched and never used as fallback.
Run IDs work without `crypto.randomUUID`.
Save, export and restore serialize before allocating snapshots; busy automatic saves are skipped.
The Save panel's **Export runtime report** downloads local scalar breadcrumbs independently of the
worker. It can preserve the last recorded tick/build/fault after reload, but cannot recover the
physical state of a killed process without a valid checkpoint.

## Memory and history limits

Defaults stop at 10,000 living cells or two million ancestor records. These are operating limits,
not biological carrying capacities. Complete ancestry uses 56-byte resident records with compact
binary serialization. Full dead non-founder genotype payloads can be pruned independently.

A registered two-million-record synthetic history used 406 MiB WASM high-water memory, down
from 906 MiB before removing string allocation and redundant snapshot copies. The raw physical
file was 68.1 MB and its browser gzip package 11.1 MB. That measurement includes temporary
snapshots and two worlds during verification; it is not steady browser memory or an ecological run.
Large combined population/field loads use more memory.

Physical state contains the most recent 512 ordinary events plus up to 4,096 explicit manual
interventions. Exhausting the intervention budget rejects another manual edit before it changes
the world. Observations retain 240 thinned chart/spatial samples, 81 recent behavior samples and
2,048 recent spatial events.
Old unobserved motion is not reconstructed. Exports preserve retained data but do not reset
ancestry limits or remove memory costs.

The field allocation is bounded by geometry (default 160 × 120 nodes × 256 float32 amounts).
There is no sparse-block-count ceiling or quantization setting. Very large state can hit the
raw checkpoint/storage budget before another configured ceiling. The error remains visible.

## Human review and completion boundary

Use the existing server's Run view to judge occupied neighborhoods and gaps, moving dispersers,
headings, seams, independent field controls, zoom from regions into cells, and chemistry inspection.
A recovery should restore tick, population, ancestry and retained samples. These visual and device
checks on the user's device remain open. Isolated Chromium operational checks are recorded in
the reliability evidence, separately from human motion acceptance.

Timers cannot overcome tab throttling, sleep, eviction or a failed browser process. Worker ownership
keeps physical work and snapshot serialization off React's thread, but saves still interrupt that
worker's stepping while encoding. GPU/context recovery and IndexedDB have bounded integration
tests; those do not certify a particular browser/device. The [backlog](backlog.md#backlog-runtime-and-observation-limits)
retains enduring observation requirements.
