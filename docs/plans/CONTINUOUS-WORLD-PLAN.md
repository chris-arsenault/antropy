# Continuous worlds and current phenotype

September 27, 2026. The user requires days/weeks operation without bookkeeping pauses and
current functional diversity rather than founder lineage as the ecological description.
Root Sulion plan: `84480ab8-e1c0-493f-a846-3b83abc11a94`.

## Contract and source evidence

`lifecycle.rs` currently blocks funded reproduction at two million ancestry records.
`world.rs` and history consumers equate cell ID with vector offset. This makes accumulated
history a biological stopping condition. Remove that coupling without unbounded memory growth.
`phenotype.rs`, census and chemical roles already report current machinery, investments,
actions and recent flows; these are the basis for ecological observation. Identity and
genealogical distance remain optional diagnostics, never proxies for functional diversity.

Keep every living record plus at most the configured number of ended records. When ended
records exceed the budget, retain the newest half-budget ended records, ordered by birth ID,
and every living record. IDs, parent references, material, energy, genomes, private learning
and random streams do not change. Batch compaction costs O(retained history) after O(budget)
additional ended records; lookup uses binary search, not arrays indexed by lifetime births.
History gaps must terminate ancestry queries with explicit incomplete coverage. They never
invent a founder or reset biological generation. Current descendants of an active pinned
cohort continue through the existing birth callback; reconstructing expired lineage on
restore may report unavailable history rather than fabricate membership.

The checkpoint shape remains v42: the existing record vector can contain sorted gaps.
Existing complete snapshots still validate. Old ancestry-limit/extinction stop reasons no
longer prevent continuation under the new runtime. Empty worlds keep environmental time;
there is no automatic reseeding. Recoverable browser-save failures report failed recovery
while simulation continues. User pause and actual fatal execution errors remain distinct.
No software can promise survival of host shutdown or an invalid physical state.

## Milestones

M0: bounded history and continuous runtime. Acceptance: repeated births/deaths across a tiny
history budget preserve funded physics, stable IDs, restart and bounded records; every history
consumer handles missing records; extinction and save failures do not impose scheduled stops.

M1 [depends on M0]: observation, validation and live delivery. Current phenotype remains the
default basis for diversity; expose retention limits explicitly. Run focused tests and full
CI, commit/push the complete change, verify pipeline deployment and continuation of the saved
live world. No new world reset and no ecological campaign.

## M0 expansion

Sulion expansion `1f575f96-97e8-462f-a5b0-32348cb337d7`, root milestone position 1.

1. Add sorted record lookup/compaction in `ancestry.rs`; reconcile lifecycle, validation,
   presentation, genealogy, census, phenotype and study/fixture consumers. Remove historical
   stopping and make save failure non-pausing. Keep physical checkpoint fields unchanged.
2. Test many retention cycles, fission and budding, restored history gaps, old stopped worlds,
   read-only observers and browser recovery. Check bounded working memory by construction and
   a short synthetic turnover case; do not wait days to discover a deterministic history limit.

M0 result: 327 Rust tests pass, including 128 repeated retention cycles for both fission and
budding against an unbounded-history control. Cells and accounts agree; live records survive
a smaller history budget; restart preserves continuation and clears the retired stopping reasons.
Browser tests cover expired cohort/selection handling and failed-save continuation. No live
controls or resets performed by this work. Full repository validation remains in M1.

## M1 expansion

Root milestone position 2, observation, validation and live delivery. Sulion expansion
`3b4b901b-d4d2-432b-8253-fa2b386c5696`.

1. Lead population observation with current funded stock and recent efforts, retaining inherited
   targets separately. Move sequence counts into optional diagnostics, remove founder-distance
   emphasis and explain missing historical coverage. Update current contracts and documentation
   links. These are descriptive distributions, not a new species classifier or inheritance law.
2. Review the whole diff and run `make ci`. Commit and push on main through shared CI/CD. Confirm
   the deployed digest, restored seed/tick, subsequent stepping and successful recovery save.
   Observe a bounded live interval; do not reset the world or claim days/weeks certification.

Local validation: `make ci` passes: 327 kernel tests, 15 server tests, 17 chemical-definition
tests and 81 Vitest tests. The existing publication benchmark remains explicitly ignored.
Clippy, formatting, TypeScript, documentation/storage checks and Terraform formatting pass;
ESLint reports 19 warnings and no errors. Both WASM variants build with the existing atomics
feature warning. These checks establish continuation through bounded history and recovery
failures, not hardware/browser endurance or ecological persistence.

Delivery status: ready for the authorized main push. GitHub API inspection currently returns
`HTTP 401: Bad credentials` through `with-cred -- gh`; no alternate credential path was used.
Verify the deployed digest and continuing world directly through the existing spectator and
management endpoints. The Sulion execution record retains the eventual delivery outcome.
