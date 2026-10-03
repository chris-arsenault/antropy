# Rugged chemical ecology: implementation and world tuning

**Status:** Locally delivered implementation and tuning, October 3, 2026.
**Sulion:** `ab2dbd97-c26c-48b9-8f02-a20966ed7dbc`.

## Outcome and controlling interpretation

The feature should make inherited differences consequential to how cells live together.
Cells sharing a slowly varying environment can recognize, use, release or suffer from
similar chemicals in substantially different ways. An inherited change can open or break
a way of living and change the opportunities facing its neighbors. Geography stays smooth.
The observer should be able to follow those relationships developing, disappearing or
reorganizing in an ordinary mutating world.

The user chose differences **between cells**, rather than abrupt switching within one
cell, in the original September 30 discussion. The
[white paper](../white-paper.md), [outcomes](../outcomes-and-directions.md),
[principles](../principles.md), [direction](../design/rugged-interaction.md) and
[landscape research](../design/kauffman-landscapes-research.md) govern this work.
The October 3 correction explicitly requires implementation and tuning, with judgment
at the simulation level. Earlier completed local plans delivered code and bounded assays;
they did not complete this requested ecological iteration.

## Decision rules carried by the Sulion root

1. Follow actual parent and descendant behavior in their surroundings. Separate initial
   founder differences, hypothetical capabilities and newly inherited consequences.
2. Compare ordinary rugged and former smooth recognition worlds with matched startup,
   mutation, private learning, sources and geography. Comparing two rugged parameters
   cannot substitute for that baseline.
3. Follow local activity into environmental changes, neighbor responses and funded
   survival or reproduction through source renewal and population replacement. A
   chemical count, binding coefficient, fuel total or short startup advantage is a
   diagnostic, never the verdict.
4. For each consequential choice record: observed ecological limitation, competing
   explanation, proposed shared-law or parameter change, expected neighborhood
   consequence, and a bounded comparison capable of rejecting it.
5. Complete interacting implementation where the causal chain is missing. Do not
   repeatedly replace implementation and calibration with a new narrow assay.
6. Do not assign ecological roles, prescribe cooperation, reward communities or choose
   favored chemicals. Preserve exact chemical actions, funded accounts, immutable
   birth capabilities, ordinary local controllers and the common mutation law.
7. Re-read `sulion plan current` and relevant source bodies at phase starts, resumes and
   contradictory results. State how the next action serves the outcome before tuning.
8. A pilot, test suite or exhausted run budget ends that activity, not the feature
   objective. Do not close this root after another short assay. Preserve negatives;
   use them to decide the next implementation step. Do not invent a positive finding
   or demand indefinite coexistence to justify finishing an actual delivery.

The completion account must address four questions: what inherited change affected a
way of living; how cells in shared surroundings differed; what changed for neighbors;
and what happened through replacement and renewals. Report gaps explicitly. Release
readiness and completion of the user's requested tuning are separate claims.

## Existing evidence and limits

The [constructed community assay](../rugged-community-results.md) establishes paid
export, uptake, conversion and growth through an intermediate, plus susceptibility
differences. Its roles were installed by the experimenter.
The [ordinary calibration](../rugged-ordinary-calibration-results.md) found inherited
binding changes, but compared two settings of the new law over only 4,000 ticks.
Extracted descendants were tested in reset environments without their original
neighborhood or private memories. The [smooth/rugged comparison](../rugged-interaction-results.md)
covered only 2,000 startup ticks. None establishes new ecological relationships through
ordinary turnover. Fuel and recognition measurements explain those limits; they do not
override them.

## Implementation phases

1. **Integrate inherited neighborhood evidence.** Reuse the native study recorder to
   retain births, deaths, genotypes and actual chemical transfers, including cells that
   die between samples. Add bounded temporal local-environment and neighbor records.
   Keep the original world and private controller state intact.
2. **Implement and tune ordinary-world chemical relationships.** Use the former smooth
   law and rugged law in ordinary worlds through renewals and replacement. Identify
   missing physical or behavioral opportunities, implement justified shared changes,
   and calibrate ordinary defaults. Causal follow-ups restore actual checkpoints and
   preserve neighborhood context wherever the comparison allows it.
3. **Deliver the selected active feature locally.** Apply selected defaults to ordinary
   consumers, integrate observation and authored findings, and complete appropriate
   runtime checks. No publication, deployment or live-world replacement is authorized.

Checks belong inside these implementation phases. An actual prerequisite that needs
multiple steps uses a blocked phase and Sulion child plan; an inconclusive observation
does not automatically become a blocker or a new acceptance stage.

## Registered first ordinary-world comparison

Question: does rugged recognition change inherited ways of using shared surroundings
and the relationships between neighboring cells after startup and source renewal?
Competing explanations are a new inherited local dependency, transient changes that
fail to reproduce, initial founder sorting, and differences in chemical processing
without a consequential change in relationships.

Use the shared native World, ordinary seed27 / chemistry101, 720 × 540, mesh2,
48 founders, 240 reservoirs, normal mutable genotypes, private learning and inheritance.
The two arms differ only in founder recognition representation: former radial versus
ordinary keyed recognition at the current shared defaults. No diagnostic RNN or assigned
role enters either world. Generate zero-tick resource budgets before advancing.

Each arm has a declared maximum of 24,000 ticks (4,800 model seconds), 600 seconds
wall time, 3 GiB RSS and 2 GiB generated files. Together: two worlds, 48,000 ticks,
1,200 seconds. The horizon includes the nominal 1,200-second release / 600-second
wait cycle more than twice; actual reservoir renewals are recorded rather than inferred
from nominal clocks. Stream step-captured facts every200 ticks, sample local surroundings
at the same cadence, and keep physical checkpoints every2,000 ticks. Stop an arm at
extinction, a runtime failure, a resource limit or the declared horizon. A wall-limited
arm remains incomplete. No automatic seed expansion or horizon extension.

A 400-tick pilot in each arm measures execution and output cost and checks observer
transparency. It is a pilot of this registered comparison, not a substitute result.
After the comparison, inspect inherited changes with persistent nearby cells and actual
chemical activity. Select a follow-up only when its predicted outcome can choose an
implementation or tuning change. Retain negative results and temporal coverage limits.

All generated records and checkpoints stay under ignored
`frontend/harness/artifacts/rugged-ecology-*`. Only authored registrations, decisions,
findings and reproduction instructions belong in Git.

### First context-preserving follow-up registration

The ordinary keyed world produced cell63 / genotype19 from cell50 / genotype6 at
tick2,612. Its diet changed from primarily0 to substantial0 and8, and it subsequently
divided. Its largest key change is enzyme2 bias−7 to−4.088893508585411. At the tick4,000
checkpoint it remains beside ordinary136→8 cells. This is a case selection, not a
population-level estimate or proof that8 is beneficial.

Compare two copies of that actual checkpoint for2,000 additional ticks, at most60 wall
seconds each: unchanged recognition versus only that scalar restored to−7. Keep every
cell's biomass, inventory, age, location, private reflex and strategic state, sources,
fields and existing neighbors. Both copies freeze future neural/physical mutation and
birth assimilation; private learning remains as in the checkpoint. No authored controller
or extra material is installed. Counterfactual replacement is an explicit assay operation,
not a production refitting mechanism. Generate zero-tick budgets before advancing.

Predicted causal chain: the new key changes access to8, changes the cell's conversions
and release into the shared mixture, and may alter its descendants' growth or nearby
cells' opportunities. Competing explanation: the change only adds processing with no
consequential return, or surroundings and other inherited genes explain the apparent
new diet. Follow the focal descendants and pre-existing neighbors separately. Effects
on the focal cell alone do not establish a new relationship. A negative result rules
out treating this selected mutation as the ecological success case and informs the
next implementation/tuning decision. Total: two copied worlds,4,000 ticks,120 wall
seconds; the same RSS/disk limits and200-tick streaming apply.

### Shared steepness calibration registration

The first comparison reached ordinary descendant turnover and resource renewals. The
keyed arm stopped at its wall cap at tick17,248 with247 living cells; the radial arm
reached24,000 ticks. The context-preserving follow-up changed a neighbor's chemical
readings and motion before the focal division, followed by starvation in the new-key
copy and survival in the scalar-restored copy. Both focal clades reproduced. This
establishes a consequential local perturbation, not an adaptive advantage or donor
provenance for every transferred molecule.

Test one justified shared setting: lambda6 against the existing lambda3 and radial
records over their common first16,000 ticks. A full-weight bit mismatch then crosses
twice the binding-logit distance, reducing the finite tails that blur recognition of
adjacent chemical identities. Prediction: inherited recognition differences remain
more distinct in shared mixtures through replacement, without destroying opportunities
for descendants to grow and reproduce. Competing explanations are fewer viable
intermediates, merely stronger founder sorting, or convergence toward broad keys that
ignores steepness. More cells or chemical processing alone cannot select the setting.

Use one ordinary seed27 world, the same sources, founders, private learning, mutations
and smooth geography. Change only the one existing shared binding parameter. Generate
zero-tick budgets first. Maximum16,000 ticks,600 wall seconds,3 GiB RSS and2 GiB files;
200-tick facts/surroundings and2,000-tick checkpoints. Stop at the declared cap or
extinction and preserve an incomplete result. No additional setting or seed sweep is
registered. Select a setting only after comparing inherited neighborhood behavior;
otherwise retain the current default and record the unresolved explanation.

### Birth-local specificity follow-up registration

The longer ordinary record also contains a more specific inherited change: cell551 /
genotype507, born at tick12,000 from cell525 / genotype481. One enzyme1 weight changes
from−0.9702400571924419 to+0.6266591286874159 at locus6. The parent's observed processing
favored136 and104; the descendant processes substantial134 and102 and divides at12,712.
Its sibling552 starves at12,529, but other inherited differences prevent attributing that
sibling contrast to this weight. The retained checkpoint is exactly at the selected birth,
so this comparison does not remove its neighborhood or invent a new startup packet.

Compare two actual tick12,000 worlds for1,600 additional ticks /120 wall seconds each:
unchanged recognition and only the enzyme weight restored to its parental value. Apply
the same mutation/assimilation policy as the cell63 follow-up and preserve private state,
all other genes, material, age and neighbors. Generate budgets first. Prediction: the
changed weight opens a different use of the evolved local mixture that supports actual
growth or reproduction and changes local release/access. Competing explanation: the new
diet is incidental processing while other genes or surroundings fund reproduction.
Track focal descendants, their common initial whole-world denominator and pre-existing
neighbors. Total3,200 ticks /240 wall seconds; same resource and sampling limits. This
follow-up can distinguish a specificity change from the earlier broadening case; it is
not a seed search or an estimate of adaptation frequency.

## Execution and disposition

All three implementation phases are locally delivered. The
[authored findings](../rugged-ecology-results.md) preserve positive, negative and incomplete
results; generated records remain ignored. No commit, publication, deployment or live-world
replacement was performed.

The four completion questions now have concrete answers:

- **Inherited way of living:** restoring one actual newborn's enzyme weight removes its
  changed chemical processing and reproduction. Its offspring later die; persistence is
  not inferred from that division.
- **Shared surroundings:** ordinary descendants express different actual routes while
  sampling nearly the same local mixture, including later descendants at the selected6
  setting. Possible transformations alone are not the evidence.
- **Neighbors:** restoring another cell's bias changes a pre-existing neighbor's chemical
  readings, path and survival. This is a whole-world consequence, not isolated toxicity
  or proven molecular donor attribution.
- **Renewal/replacement:** matched law comparisons cover16,000 ticks, repeated recorded
  stock renewals and extensive descendant replacement. The setting3 arm stops at17,248
  on its wall cap; its registered24,000 horizon remains incomplete. The selected6 arm
  reaches16,000 with all original founders replaced.

The implementation adds the native temporal runner, footprint-level surroundings records,
context-preserving scalar restoration and local reports/figures. It selects shared
recognition steepness6 for new ordinary native/browser worlds. The causal checkpoint
comparisons retain3; no optimum or long-term ecological superiority at6 is claimed.
Saved configuration, shared chemical algebra, mutation law and source settings remain intact.

Seven ecology worlds advance64,448 ticks; observer pilots advance4,800 more including
controls. Material/work and population balances pass at every retained sample. Observer
pilots preserve all non-ledger physical state exactly; global account reduction differs
only within1e-12 relative tolerance. Failed byte-equality pilots and their diagnostic
copies remain preserved.

Delivery checks pass: Rust tests and release clippy, frontend lint/format/typecheck,
Vitest, documentation/storage checks, Terraform formatting and production build. The
initial frontend suite passed93 tests and failed one assertion expecting the previous
compiled breadth; its corrected focused rerun passes. Existing lint warnings remain.
The rebuilt WASM uses6 for a new ordinary world and retains3 on restoration of an archived
checkpoint, checked without advancing either world.

The decision rules remain the starting guidance for future work. Sustained complementary
cross-feeding, persistent roles, cross-pollination and new colony founding are unestablished
here; those gaps are recorded observations rather than invented passed gates.
