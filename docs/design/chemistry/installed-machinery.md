# Birth-fixed chemical capabilities

Physical checkpoint v37 removes machinery refitting. Each cell uses its complete birth
genotype throughout its lifetime: four receptors, four transporters, one to eight enzyme
programs and a membrane coordinate. Recognition neighborhoods and the existing transformation
algebra still allow several chemicals and transformations per cell.

## Current ownership and inheritance

The serialized cell has one genome identity. Its immutable derived operators carry the
configuration used by sensing, transport, reactions, membrane response and observation.
Restoration compiles the birth genotype and shares those operators; there is no separately
persisted installed identity, provenance, revision, refitting progress or work account.

Division conservatively partitions actual stocks, bound material, free material and usable
energy after the existing division cost. Each daughter immediately uses its own mutated
configuration. Mutation grants no additional stock. Program duplication splits existing stock;
deletion leaves inactive material for ordinary paid retirement. Small chemical edits retain
the smooth affinity law, but no rule protects a mutant's access to its parent's food.

During life, neural activity and construction allocation, funded growth/retirement, chemistry,
damage and private learning remain dynamic. The capability repertoire and its chemical
parameters stay fixed. Living-cell genetic transfer is removed; ordinary material exchange
between cells remains. Diagnostic genotype replacements are explicit constructed-state
interventions, not biological adaptation.

The old survival-buffer requirement was an agent-created constraint rejected by the user.
A changed daughter may fail to feed in its birth environment. Neither survival guarantees nor
a replacement price are part of the new rule. The [execution plan](../../plans/MODEL-SIMPLIFICATION-PLAN.md)
records implementation and verification. `make ci` passes with 301 Rust tests and 78 Vitest
tests. Constructed checks cover mutated birth, lost/gained food access, program counts, funded
quantities, shared restoration and selected inspection. They do not establish long-run ecology.

## Historical continuous-refitting rule

Before v37, cells persisted separate installed coordinates and inherited targets. Paid movement
toward targets changed recognition and reactions throughout life; daughters retained their
parents' intermediate machinery. This model and its compiler-refresh path were removed.
The experiments below used earlier laws and do not validate birth-fixed ecology.

## Historical problem and evidence

The previous rule removed a slot's entire stock even for an arbitrarily small target
change. In the registered daughter comparison, an importer target change of +0.12
removed 0.04 installed material per daughter. Unchanged daughters reached their next
division after 304 ticks; changed daughters had rebuilt only about 77% of the importer
after 600 ticks and had not divided. This was a discontinuity in access to resource
acquisition, despite smooth chemical affinity. It was not evidence that the nearby
target was intrinsically unsuitable.

## Historical v11 state and work

Each cell has its inherited `genome` and an installed `machineryGenome`. Both reference
immutable Rust-owned genotype records. The latter determines receptor affinity,
transporter affinity/direction and enzyme substrate/product operators. The former
determines the controller, construction targets and membrane compatibility. Pending
refitting therefore does not give the new chemical function to old machinery for free.

At each physiology update, compare installed and inherited slot identities. The cell
can refit when energy above its protected reserve pays:

`work = constructionEnergy × sum(actual material in changed slots)`

Existing built material is generic biomass with one embodied energy density. Refitting
recycles that material in place and dissipates the paid work as heat; it neither adds
biomass nor changes embodied potential. Until the whole cost is affordable, installed
machinery keeps working. Once paid, the installed identity changes atomically. No
partial expenditure is lost while waiting. Equal machinery needs no refit even when
controller genes or investment targets differ.

New body growth still requires ordinary material and energy. While a refit is pending,
newly constructed stock joins the installed machinery and increases the eventual
work bill. A nearby change pays for remanufacture, not for a distance-dependent discount.
This intentionally simple v1 rule has no production queue, extra machinery slots or
hidden grant. More detailed turnover requires a measured limitation.

Daughters receive half the parent's actual body and retain its installed identity.
Their inherited genome may differ. Whole-slot transfer and controlled inherited
replacement use the same pending-refit path. Explicit initial experimental fixtures
declare their installed machinery; they are not birth events. Pruning retains every
genome referenced by a living cell's inherited or installed identity. Death returns
the same conserved body material regardless of pending refit.

The inspector distinguishes pending installed machinery from inherited instructions.
Refitting work is a separate cumulative energy flow, including in study output.
Checkpoint v11 persists installed identity; earlier physical saves are rejected rather
than adapted. Browser observation packages are independently versioned at 11.

## Historical constructed result and limits

Ledger 3690–3701 records the retirement baseline; 3702–3713 repeats the same six paired
comparisons after refitting. Both use daughters from the same resource-funded first
division at tick 80, stationary diagnostic control, frozen mutation and learning,
and a finite patch. They do not substitute a mature mutant body.

| Changed instruction | Retirement: ticks to next division | Paid refit: ticks to next division |
| --- | ---: | ---: |
| Unchanged control | 304 | 304 |
| Receptor target X +0.12 | 308 | 304 |
| Importer target X +0.12 | Not within 600 | 304 |
| Enzyme target X +0.12 | 320 | 304 |
| Enzyme product X offset +1 | 332 | 316 |
| Importer investment locus +0.12 | 276 | 276 |

The refitted importer pair pays 0.04 usable energy. In both versions, removing external
supply causes extinction after 356 ticks without another division. The opportunity is
funded by local resources. Equal division timing is not equal lifetime fitness, and
these diagnostic comparisons do not establish evolved adaptation. A separate chemical
surface revision follows this comparison; exact binaries and initial/final states are
retained in `frontend/harness/artifacts/reliability-inheritance-01/` and `-02/`.

After the chemistry-version-3 revision, the importer pair and empty-resource pair were repeated
without extending their budgets (ledger 3766–3769). Both unchanged and retargeted daughters reached
their next division after 280 ticks. The empty arm imported no material and became extinct after
360 ticks. This confirms the particular refitting/lifecycle opportunity under that historical surface;
the table above remains the isolated before/after comparison under its earlier surface.
