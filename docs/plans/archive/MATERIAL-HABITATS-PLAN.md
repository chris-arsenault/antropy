# Material-supported habitats and chemical renewal

> Historical execution record, archived September20, 2026. Version-specific instructions and
> pending gates below retain their original meaning; they are not an active work queue.
> See [plan dispositions](../README.md) and [current design](../../design/README.md).

September 20, 2026. Execution authorized by the user for the full recommendation:
shared binding, reversible material retention, public regeneration and locally evolving
source replenishment. No special chemical 0 rule outside initial seeding. Construction
chemistry was an alternative, not the recommendation; it remains unchanged.

Sulion root `9c6c8f25-fbf8-42d6-9fa7-314caf2e713a`, phases M0–M4 (positions 1–5).

## Contract and evidence

The [200k review](../../integrated-200k-review.md) found evolved bodies and optical responses,
but source nearest-neighbor median increased 5.07→21.38; 35/48 sources were empty at 200k.
The final 10k imported 97.7–98.4% supplied IDs. Large cells process intermediates privately.
Preserve that positive evolutionary result and the mathematical foundation. Do not add
chosen roles, anchors, cluster identities, chemical-specific bonuses or survival policies.

Reuse `attraction`, `medium_response`, `field_medium`, `field_vector`, `sources`,
`source_medium`, `weathering`, and the existing group actions, projections and accounts.
Rust retains all physical state. Worker rendering borrows the same views. No new messages,
copied fields, controller inputs, genes or parallel execution are needed.

### Selected rules and provisional calibration

- Mechanical attraction becomes a shared difference of two normalized even kernels at
  lengths ell and 2ell, with an independently named amplitude. The second scale suppresses
  map-wide coalescence; local pressure retains the repulsive core. The scale ratio is the
  fixed octave basis, not another tunable length. All three mechanical consumers use it.
  Start ell=6 and amplitude=4; accept or revise from explicit force curves and cost.
- Cohesion is the positive local contraction of attraction minus repulsion, divided by
  `1+load`. The same bounded response `1/(1+scale*cohesion)` reduces dissolved-material
  washout. Dense deposits remain ordinary material, with finite nonzero loss and no ghost
  mass. Transport already has impedance-dependent mobility; do not introduce another stock.
  Accounts must use actual local loss, not the former uniform-decay shortcut.
- Each source persists a normalized replenishment distribution, initialized from the seed
  landscape. It evolves through the shared environmental operator during active and empty
  periods. Refills sample no privileged chemical and copy no seed mixture. This distribution
  is an external boundary condition, not hidden material; injected material and its complete
  potential are booked at refill. Explicit configured experimental epochs may still prescribe
  an external supply, but defaults never reset. Empty sources emit no mechanical material.
- Public transformations use the existing exact group with a bounded dyadic set of axis
  exchanges over all four coordinate bits, rather than only adjacent identities. These eight
  involutions treat both axes and all identities equally, connect the manifold, and commute
  as a set with D4 relabeling. Shared profile contraction, kinetic distance attenuation and
  external-work funding apply; sparse thresholds remain. No named waste or food route.
- A finite shared photon budget is a separate optional extension, not required to establish
  public regeneration here. Existing explicit external-work accounts remain. No biomass or
  metabolic efficiency redesign, growth rescue or founder retuning is included.

Changing durable source state/configuration advances physical checkpoints to v32; reject old
bytes explicitly. Compatibility/replay requirements must not displace performance or ecology.

## Milestones

### M0 — Contract, identity audit and baseline

Acceptance: identify live chemical-ID assumptions and affected observers; capture the current
WASM before changing physics. Reuse the completed 200k evidence, not another baseline campaign.

Execution: inspect sources/renewal, field/pressure, transformation algebra, rendering ownership,
economy and version consumers; record this contract. Run existing operating cost harness at
48 and 2,000 cells, 10 warmup +100 measured ticks, 60-second cap per case. This is a fixed
cost check, not an ecological test. Baseline source and binary hashes are retained by harness.

### M1 — Shared cohesion and retention [depends on M0]

Acceptance: ordinary field/cell/source forces share the law; close crowding repels, intermediate
separation restores and remote interactions weaken/reverse; changing material changes binding.
Deposits survive longer than dispersed material but still dissolve when support is removed.
Local material/work accounting, D4/translation covariance and no isolated self-force hold.

### M2 — Stateful chemical renewal [depends on M1]

Acceptance: a source that has changed composition refills from that history, including after
an empty interval and restore; no default fallback to seed species. Finite inventory and
full injection accounts hold. Current economy/source displays describe current composition.

### M3 — Public regeneration [depends on M2]

Acceptance: generic exported material can undergo funded uphill public transformations and
be imported/processed by an ordinary diagnostic cell; reject unfunded uphill changes. The
same action set serves source inventory, refill distribution, atlas and field processing.
No chemical-specific branch or lost sparse early exit; quantify added operating cost.

### M4 — Integrated validation and delivery [depends on M3]

Acceptance: bounded live-world checks, full CI, current documentation and retained measurements.
Use deterministic mechanics tests for invariants; headless opportunity evidence for behavior.
Human visual review and evolved long-term cooperation remain unverified until observed.

Registration: one default seed27 1,000-tick pilot and a 4,000-tick continuation to tick 5,000,
120-second cap per segment. Stop on extinction, account failure or wall cap. No seed sweep,
100k/200k campaign or horizon extension. Short diagnostic neighborhood cases (active stock,
depletion, local material change) use at most 3,000 ticks each; a cell feeding on publicly
transformed material uses at most 300 ticks, frozen mutation/learning/transfer, with a paired
no-conversion control. Register exact fixtures before running them. Final fixed cost checks
repeat the baseline workload once. Preserve negative results and resource/account stops.

## Current state

M0 sub-plan `80eeb203-cc25-49f4-9954-0ca2e2c7a8d3` completed both steps: identity/ownership
audit and baseline. Ledger 4218/4219 records 84.32/36.72 ticks/sec at 48/2000 cells;
binary and checkpoints are in `frontend/harness/artifacts/material-habitats-baseline`.
Initial chemical choices occur in landscape/configuration/founder initialization. The live
defect is source renewal and empty-source response copying that initial distribution.

M1 sub-plan `c5738556-3123-46b3-916b-ea47ad0167ab`: step 1 edits attraction/config/field
and projection accounting; step 2 adds mechanism tests for paired forces, symmetry, finite
retention and local loss accounts. Existing raw-filter tests retain their original purpose.
Public operator kinetics will normalize eight branches independently of work: the shared
transformation-work coefficient remains unchanged, so branching does not halve work per unit.

M1 complete: five mechanism tests passed. M2 sub-plan
`89518ad1-bd55-465c-a73d-949fc1644e68`: step 1 adds a normalized persisted source distribution,
generic empty-source response, current-composition budgets and v32 validation; step 2 verifies
evolution while empty, zero ghost material, renewal from history and continuation after restore.
Explicit user-configured zones/epochs remain prescribed external boundary conditions. They
contain no implicit species identity and are the only renewal override.

M2 complete: nine source tests passed. M3 sub-plan `5d454c8e-b249-4159-83c0-8415afdcc6ae`:
step 1 compiles eight dyadic group actions with the shared distance attenuation and work
coefficient; updates SIMD branch allocation and environmental-web consumers. Step 2 verifies
all D4 frames, reciprocal directions, work closure, field/source agreement, finite kinetics
and a paired diagnostic public-feeding opportunity. No time horizon expansion is needed.

Public-feeding registration: `engine/examples/public_regeneration.rs`, two 300-tick arms,
30-second wall cap each. Select one route before stepping by largest predicted pure-donor
rate times uphill potential gain, restricting distance to at least 4 (outside transporter
recognition). Uniform finite donor concentration 0.5 in a 24×24 world; no sources, no mutations,
static learning and no transfer. One ordinary funded cell imports the regenerated product and
processes it back to the donor, using authored RNN effort. Paired control disables weathering.
Measure species-specific import/reaction trace, captured work, expenses and remaining energy.
This establishes a public-food opportunity only, not evolved discovery or stable coexistence.

Neighborhood registration reuses `engine/examples/binding_integrated.rs`: seven finite sources
in a 16–17-unit ring, central source depleted after 40 model seconds, one initially empty source
returning after 120 seconds. Compare local response with the shared extended interaction for
3,000 ticks each, capped at 120 seconds. Two existing 300-tick active/identity cell fixtures
test cellular modification of local forces, same caps. Their prior registrations define the
fixed starting bodies and media; no founders or routes are selected by population outcomes.

M4 sub-plan `ac2c7ab6-4eca-4e72-a111-66108dfef925`: bounded startup/mechanisms completed;
cost/CI and documentation remain. Startup ledger4224/4229/4230 reached tick5000 with234 cells.
The runner accepts an absolute terminal tick; the first continuation stopped at4000 and was
continued exactly to the registered5000, without additional simulation horizon.

CI allocation repair sub-plan `91fc8795-27fa-4cdc-a48c-063187221abf` branches from M4 step2:
step1 moves enlarged compiled weathering tables from stack arrays to heap vectors; step2
checks failing WASM diagnostic creation consumers and repeats the cost panel without another
simulation or build running concurrently. Initial candidate cost overlapped the startup pilot
and is retained as a potentially contended measurement, not a clean final comparison.

## Completion

M0–M4 completed locally. The allocation sub-plan is complete; all previously failing WASM
consumers pass. Final `make ci` passed:156 Rust unit tests,17 integration tests,66 frontend
tests, current Python producer contract, formatting, clippy, type checking, documentation and
Terraform formatting. The17 existing ESLint warnings remain. `git diff --check` passed.

[Results and limits](../../material-habitats.md) record the implemented laws and retained
[evidence](../../evidence/digital-chemistry/material-habitats). Final fixed capacity is
63.78/32.00 ticks/sec, versus84.32/36.72 before this change. The computational cost remains
visible; no claim of unchanged performance or expanded-map readiness is made.
The source neighborhood forms closer local groups; default startup reaches234 cells at5000.
Public feeding captures usable work but its diagnostic survival result is negative. Source
replenishment evolves slowly and still contains98.4% starting species at5000. Durable ecological
diversity, persistent clusters and human motion acceptance remain observation questions.

No commit, push, deployment, external publication or new server was performed.

Earlier user changes remain in the working tree. No commit,
push, deployment, new server or external publication is authorized by this request.
