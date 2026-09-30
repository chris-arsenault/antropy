# Cellular organization and exchange implementation

September 20, 2026. All implementation milestones completed locally. Root Sulion plan:
`ec58a567-39b5-49fa-841d-de4da572fa1b`.

## Contract and decisions

Implement [the joint design](design/cellular-organization-and-exchange.md) in the ordinary
Rust/WASM world, its observations and persistence. One well-mixed inventory retains access to
all 256 chemical identities. The user canceled internal compartments before any compartment
edits; the canceled plan is `60e1c9a1-5a0e-4c61-9ba9-362ed6f97a6f`.
Possible meta-organisms arise through private budgets and material exchange, without assigned
roles, kin recognition, community rewards or an assurance that cooperation will evolve.

Preserve the chemical action algebra, per-conversion work law, shared worker memory, periodic
plane, 24-unit recurrent controller, single-threaded execution and existing geographic laws.
Implement the whole connected feature, including antagonistic opportunities. Living bound
structure, adhesion and compartments remain outside this design. Publication is not requested.

Reuse `genetics`, `controller`, `organism`, `metabolism`, `refitting`, `sensing`, `transport`,
`movement`, `lifecycle` and existing bounded observations/harness. Genotypes own instructions;
cells own actual stock and installed identities. Controller operations own neural weights.

Use a bounded arena for enzyme records: occupied genetic programs plus retired installed stock
share the same bound. This avoids identity changes when a program is deleted. Begin with eight
records as a provisional execution bound; measure complete release workloads before accepting
it. Empty records grant no stock or function. Preserve existing first-four and photoreceptor
indices and append extra enzyme records. Repertoire operations move their associated neural
ports through controller-owned functions. All changes use the existing mutation distribution.

## Milestones

### M0 — Durable machinery and controller representation

Scope: bounded variable enzyme programs, inward receptor alleles, associated neural ports,
actual-stock inheritance and explicit schema rejection.
Acceptance: neutral duplication preserves mass, targets and neural response; deletion preserves
retired matter; save validation bounds programs and rejects malformed ports.
Evidence: focused Rust tests and persistence integration checks.

#### Execution steps

Expansion `89c64131-658c-4830-a055-57426584388c`.

1. Represent and inherit programs (completed). Files: `organism`, `genetics/repertoire`,
   `controller/programs`, `chemical_operators`, `lifecycle`, snapshot version.
   Add inward allocation, bounded genetic program occupancy, retired stock ownership and
   associated neural ports. Verify with compile, neutral duplication and malformed restore.
2. Verify representation (completed). Adapt affected fixtures and consumers; run existing
   mechanics tests. Later M1/M3 gates cover physiology and visible consumers respectively;
   this milestone does not claim that newly represented degrees of freedom are functional yet.

### M1 — Funded intracellular organization [depends on M0]

Scope: retained-mixture rate coupling, activity control, funded inward sensing, regulated
construction/retirement, core-funded reproduction and paid refitting.
Acceptance: all work/material costs remain explicit; no same-stage finance; inverse rate
complement and response bounds; optional machinery does not block division.
Evidence: accounting, controller-expression and opportunity tests using ordinary physiology.

#### Execution steps

Expansion `68b6c46e-56b0-4a33-9922-48c61c769c13`.

1. Wire regulated physiology (completed). `metabolism`, `organization`, `sensing`,
   `refitting`, `lifecycle`, `accounting`: implement the paper's frozen-mixture rate modifier,
   inward signals, common handling/work budget and core-funded reproduction.
2. Verify costs and opportunities (completed). Bounded ordinary-operator comparisons cover
   inverse response, conditional composition benefit, no free work, funded sensing and
   storage-safe retirement. Existing conservation/restore tests cover whole-world wiring.

### M2 — Finite shared interfaces [depends on M1]

Scope: shared local contact geometry for access, cues, stress and field/contact transfer.
Acceptance: competing withdrawals reserve one frozen donor; intact cells expose no inventory;
receivers pay transport, donor export cannot exceed remaining stock, order does not determine
allocation. Resolve overlap relaxation dependence without an invented attack radius.
Evidence: permutation, contention, timestep and isolated-interface checks.

#### Execution steps

Expansion `6722f349-ea5d-4d52-90fa-10aeca0fe4a0`.

1. Shared geometry and accessible mixture (completed): `interfaces`, `sensing`, `movement`, `World`.
   Normalize the actual soft overlap graph, reduce accessible receptor/stress readings inside
   Rust and reuse it for transport. Replace per-tick overlap decay with exponential decay per
   model-second, retaining the existing speed cap. This removes a numerical timestep force
   without extending contact reach; separated bodies still have no direct exchange.
2. Allocate contested donors (completed): `transport`, `contact_exchange`, `accounting`.
   Split one request across actual contributions; reserve donor export and all receivers
   against frozen inventory, then commit together. Recipient headroom and work are frozen.
3. Verify interfaces (completed): ordinary exchange tests for intact privacy, shared interface sum, competing
   export/uptake, order invariance, work costs, useful recycled substrate and duration invariance.

### M3 — Live integration and observation [depends on M2]

Scope: default world, selected-cell inspection, chemistry roles and bounded flow observations.
Acceptance: ordinary live consumers use all new machinery and report active/retired programs,
internal sensing and actual exchange. No full-state message expansion.
Evidence: startup configuration, frontend type/tests and ownership checks.

#### Execution steps

Expansion `1c25057b-b517-4dff-8506-15b8e7a3ad30`.

1. Visible consumers (completed): inspector program state/activity/allocation, inward receptor
   fractions, construction/retirement/contact flows, chemical atlas and all-program stock/route
   summaries. Shared labels own the photoreceptor gap in the bounded record arena.
2. Integration checks (completed): TypeScript, actual release-WASM frontend tests and ownership invariants.
   No server or browser simulation is started; existing user tab/storage is untouched.

### M4 — Evidence and closeout [depends on M3]

Scope: registered bounded physical comparisons, complete release-WASM costs and documentation.
Acceptance: useful conditional opportunities are measured with costs and limitations; required
CI passes; durable design/runtime docs distinguish implementation from evolved outcomes.
No long evolutionary campaign is needed to pre-produce a meta-organism.

#### Execution steps

Expansion `9dc1d352-5e62-4dd4-bc28-e252f94f71ec`.

1. Measure conditional opportunities and complete release-WASM costs (completed).
2. Resolve concrete failures; run full CI and review shared-state boundaries (completed).
3. Reconcile governing contracts, decisions, measurements and actual remaining limits (completed).

### Registered delivery checks

Question: do the new degrees of freedom obey their accounts, offer a conditional private
return and fit ordinary single-threaded operating costs? Competing explanations are a true
rate/access benefit versus free stock/work, uncapped donor reuse or hidden execution growth.
Existing material-habitat public-food death and mature 17.79 ticks/s findings remain negative.

- Rust comparisons freeze mutation/private learning: equal-stock alternative bound chemistry,
  inward versus unfunded sensing, paid retirement, optional-stock birth, and a three-cell
  contested injured donor. The latter reports accepted work minus transport and one second
  of actual upkeep; it does not establish the return on deliberately injuring another cell.
- Ordinary startup: seed27, 600 ticks, 120-second wall cap, unchanged authored founders,
  normal mutation/plasticity, no transfers/disturbance. Stop on terminal outcome or cap.
  This checks functioning startup; no horizon/seed expansion to obtain a desired community.
- Release cost: the registered 48/2000/2000-growth capacity panel, 10 warmup and 100 measured
  ticks each, 60-second per-case wall cap, including census, inspection and borrowed render
  preparation. Compare the retained pre-feature release binary on the same standard panel.
- Bound selection: add one 2000-cell eight-program fixture (100 measured ticks) and one
  deliberately coincident 96-cell injured eight-program fixture (50 measured ticks), each
  capped at 60 seconds. Count all contact donors. These are execution limits, not ecology.
  Use the existing capacity runner and ledger; declare synthetic material grants as fixtures.

Total budget: 1,490 ticks including warmups, at most 11 minutes; no simultaneous simulations
or builds during timing. Stop and inspect any failed accounting or execution result. Any
repeat needs a relevant correction or unresolved comparison that can change the decision.

Headroom repair sub-plan `b153e3d8-73fd-45ec-bda8-9e65a43b94c0`: initial 2000-cell result
28.75 ticks/s versus baseline31.69. Removing unused operators/empty contact arrays reduced
memory but did not recover throughput (28.72). Add exactly20 profiled ticks from each saved
2000-cell initial fixture, with its own recorded binary, to locate the remaining stage cost
before selecting another optimization. This is40 diagnostic ticks, not an ecological extension.

The20-tick profile found additional per-tick costs in control (2.91→3.60ms), physiology
(4.18→4.88ms) and lifecycle (0.83→1.44ms); the field stayed16.8ms. The next correction compiles
immutable controller matrix support, skipping exact-zero connections and constant readouts while
retaining the SIMD dense path and dynamic private traces. A sparse/dense controller equivalence
test covered actions and acquired learning. The repeated panel was slower (27.79 ticks/s), so
this experiment was removed. Subsequent no-op skips and in-place lifecycle compaction recovered
the standard mean to30.07; growth/eight-program workloads remain below30. See the
[delivery record](cellular-organization-results.md) for all corrections, repetitions and limits.

## Current state

M0–M4 completed. `make ci` passes: 168 Rust unit tests, 17 integration tests and 71 release-WASM
frontend tests, including shared-memory ownership guards. Clippy, formatting, TypeScript,
documentation and Terraform format checks pass; 17 existing frontend warnings remain.
Registered startup/capacity checks completed (ledger4250–4255); the
[delivery record](cellular-organization-results.md) preserves full costs, negative findings and
remaining limits. Earlier v32 schema assertions, redundant lifecycle borrows and an oversized
capacity-runner function were corrected. Native editing was used for source and formatter output.
No browser session, server, live save modification, commit, push or deployment occurred.

User motion review and continuing evolution remain observations, not retroactively passed gates.
No meta-organism, cooperative strategy or profitable deliberate attack is claimed. Projection
caching and sparse contact accumulation remain measured-future optimization opportunities;
they are not required new physical mechanisms. Multicore remains paused in its existing backlog.
