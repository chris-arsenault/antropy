# Continuing observation

The v8 implementation adds rolling recovery and retained spatial history. This prepares the
client for longer observation; it does not establish days or weeks of uninterrupted execution.
The simulation can go extinct, hit a declared safety limit, or be suspended by the browser.

## Operational check registration — September 13, 2026

Question: does accumulated parentage make saving and restoring impractical before the declared
memory limit, and can the new default advance with its ordinary mutation and learning enabled?
These are execution checks, not evolutionary experiments.

Run one seed-101 startup check capped at 500 ticks or 60 wall seconds, stopping on extinction or
any simulation stop. Record accounting residuals, births, living cells, occupancy, elapsed time,
serialization and restore time. Compare the next five ticks of original and restored state exactly.
No seed expansion or horizon extension follows a favorable result.

Separately build synthetic linear ancestry fixtures with 100,000 and 2,000,000 lifetime records.
Only one living organism remains; this is not a population produced by the simulation. Compact
every 4,096 inserted records. Measure insertion, serialization, gzip size, restore and sampled
parentage equality, process memory and retained observer history. No physical ticks are advanced.
Each fixture has a 60-second wall budget; the entire command is capped at 180 seconds. A failure
changes storage design or its declared limit, not ecological tuning. Reuse the harness ledger and
source digest; save the measurement summary locally.

Further browser responsiveness, actual suspension recovery and human motion review remain separate
checks. A Node timing and emulated IndexedDB test cannot certify those browser behaviors.

The first check (ledger 3478) found 3.75-second serialization and 26.11-second restore at two million
records. The storage revision caches unchanged closed pages, decodes byte strings with an indexed
loop and shares one decoded ancestry store across validation and restoration. One follow-up repeats
only the same two synthetic fixtures, adds repeated-save timing/equality, and retains the same wall
budgets. It does not repeat or extend the ecological startup check.

## Results and limits

Ledger 3478, before the two-colony startup revision: the seed-101 default reached 500 ticks in 8.07 seconds with 122 living cells,
148 daughter births, no stop, and one observed spatial group. These are startup measurements, not
an occupancy target or evidence of long-term viability. Energy/material residuals were
9.25e-11 / 2.29e-11. The 9.32 MB checkpoint serialized in 108 ms and restored in 92 ms; the next
five physical ticks matched exactly. The initial three seeded sites are close enough to become one
observed neighborhood. Persistent colonization of distant opportunities was not tested.

User review subsequently required at least two starting colonies. New worlds now seed separated
existing food sites; the earlier startup census above does not describe that revised initialization.
Saved worlds retain their positions. Bounded initialization tests check two distinct occupied groups,
all 48 founders accounted for, and a common founder genotype.

Ledger 3479, revised storage, no physical ticks:

| Synthetic ancestry | First serialization | Repeated serialization | Restore | JSON / gzip |
| --- | ---: | ---: | ---: | ---: |
| 100,000 records | 197 ms | 17 ms | 113 ms | 6.51 / 0.55 MB |
| 2,000,000 records | 3,754 ms | 311 ms | 1,681 ms | 128.16 / 10.88 MB |

Repeated serialization matched byte for byte. Sampled parentage at the beginning, middle and
end matched after restoration; bounded tests also compare all 10,000 records of a smaller fixture.
Raw closed records use six float64 values each, about 96 MB for two million. Cached base64 adds
memory; serialization and restore temporarily hold additional copies. Process RSS at the final
two-million fixture was 1,053,696,000 bytes, with both worlds, two JSON strings and earlier fixture
allocations present. This is neither isolated live-world memory nor a measured browser peak.

The [original generated report](evidence/continuation-check/report.json) and
[storage follow-up](evidence/continuation-check-cached/report.json) retain source digests and exact
figures. No automatic horizon or seed expansion followed these checks.

## Recovery behavior

Every 30 wall seconds while running, and after a pause, the UI captures a same-version checkpoint.
Visibility/page-exit handlers make an additional best-effort attempt. IndexedDB stores gzip blobs
and metadata; replacement and retention happen in one transaction. It keeps six automatic and two
manual points across all runs, within 256 MiB. A single raw checkpoint is limited to 192 MiB.
Failed automatic saving pauses execution and reports the error; older completed points remain.
Export a separate file through the UI when an independent copy is needed.

A reported recovery failure exposed browsers without `crypto.randomUUID`. Both run and recovery
identities now use UUIDs built from `crypto.getRandomValues`, independently of simulation randomness.
The regression test removes `randomUUID` and checks checkpoint capture, IndexedDB save, restore,
retained run identity and unchanged physical state.

Restores are explicit and paused. They preserve source provenance, complete parentage and bounded
observer history. A browser checkpoint with no observation payload begins observation at its saved
tick; missing history is not reconstructed. v7 and older scientific states are rejected rather
than reinterpreted; the older IndexedDB manual-save store remains untouched.

The default ancestry limit is two million organism records and the live population safety ceiling
is 10,000. Reproduction pauses before exceeding either, without dropping parentage or deleting cells.
These are finite safety budgets, not carrying capacity or guarantees of a run duration. Continuing
beyond an ancestry limit needs an explicit configuration/storage decision; exporting alone does
not make an already-full world resume. Genotype pruning retains living and founder genomes, so
some dead organisms have parentage but no remaining genotype for genetic-distance comparison.

Timer-based pacing avoids relying on animation callbacks and caps accumulated debt after a pause.
It cannot make a sleeping device execute or prevent browser throttling, tab eviction or storage
eviction. Compressed IndexedDB round trips, retention and failed-transaction preservation are tested
with fake-indexeddb; pacer tests bound suspension catch-up. Actual browser suspension recovery,
quota failure presentation, render responsiveness and days/weeks endurance remain unverified.

## Human handoff

Review the same tick-zero default through Run. At world scale, occupied neighborhoods and empty
gaps should be easy to distinguish, including individual dispersers. Zoom into a population and
check that its soft region resolves into constituent cells with readable headings and motion.
Pan across a periodic seam, change a field layer independently of population colors, and inspect
a cell and its population. Judge circling, jitter and congestion directly.

During ordinary observation, confirm a recovery point appears, pause, and explicitly restore it:
tick, population and retained samples should continue from that point, paused.
These checks concern operation and legibility, not a chosen number of populations or coexistence.
No browser server was started by the agent.

Implementation validation: `make ci` passed all 139 bounded tests across 31 files, lint,
formatting, TypeScript, documentation checks and Terraform formatting. `make build` produced the
SPA successfully. These checks include observer non-interference, periodic grouping, population
picking and zoom detail, independent controls, exact restored continuation, full small-fixture
parentage equality, failed recovery writes and ancestry-limit pauses. The user accepted the world
after the two-colony startup and recovery identity fixes on September 13, 2026, and closed all
seven phases. This acceptance does not establish days/weeks browser endurance.
