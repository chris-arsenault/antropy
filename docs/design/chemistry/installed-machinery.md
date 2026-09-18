# Paid refitting and installed machinery

The [fresh composed runtime](composed-runtime.md) implements paid continuous refitting in
physical checkpoint v23. Enzyme parameters now describe mixtures of exact finite chemical
actions; refitting follows a funded path through those coefficients, not an interpolated
group element. The September14 measurements below preserve the reason to retain
installed function; their whole-slot v11 replacement law is historical.

## Current installed owner

Each cell persists actual `installed` coordinates and `machineryRevision` separately from
immutable inherited `genome` targets. `machineryGenome` retains provenance; live response comes
from actual coordinates and their immutable compiled operators, including membrane response.
No target change, birth or contact transfer grants replacement function.

Paid refitting charges constructionEnergy × affected actual stock × coordinate distance moved.
Each funded slot requests at most .25 units/model-second. Distance is Euclidean for a coordinate
pair; an enzyme sums its center and offset-vector edit lengths plus recognition radius times
the shortest angular edit in radians. Angular interpolation wraps through the circle's seam.
Shared work above the full
interval reserve funds all requests proportionally. Partial changes persist and change function
continuously. Zero-stock slots can finish without work while funded slots remain partial;
constructing functioning stock still costs material/work.
Only changed slots recompile; completed slots borrow matching target coefficients. Unaffected
allocations remain shared. Body material is conserved and paid work dissipates. Daughters inherit
the actual intermediate installation, stock and damage; private contact/controller state resets.

Rust checks cover unpaid/partial/completed changes, retained allocations, changed targets across
birth and exact checkpoint continuation. [Current evidence](rebuild-results.md) separates these
mechanics from the historical reproductive comparisons below.

## Problem and evidence

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
360 ticks. This confirms the particular refitting/lifecycle opportunity under the current surface;
the table above remains the isolated before/after comparison under its earlier surface.
