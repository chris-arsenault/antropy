# 0022 — Design chemical laws for composed computation

- Status: Accepted; M0 arithmetic selection and core feasibility verified, live integration pending
- Date: 2026-09-15
- Governing design: [Computable chemistry](../design/chemistry/computational-foundation.md)
- Plan: [Integrated chemistry](../../DIGITAL-CHEMISTRY-PLAN.md)
- Amends: [ADR 0021](0021-integrated-digital-chemistry.md), M0 formula selections and the old M2 expansion
- Preserves: [ADR 0020](0020-complete-rust-kernel.md) and [immutable sharing](../design/chemistry/data-ownership.md)

## Context

The user clarified that Antropy borrows concepts from physics to design a purpose-built artificial
ecosystem. The mathematics must be designed for affordable execution. The 16×16 chemical manifold
should organize composed functions and matrix operations throughout transport, cellular response
and machinery, rather than only generate attributes for a conventional physical solver.

M2's measured spatial subset exceeded its 16 ms allocation by about fifteen times, before motion,
biology or rendering. Shared-field convolution was cheap; species-wise nonlinear exchange and
repeated full energy/projection work dominated the profiled build. The existing diffusion already
handled all 256 channels. Mathematical consistency and SIMD eligibility did not establish that
the selected solver was suitable for the operating workload.

## Decision

Design discrete laws, accounts, bounds and data shapes together. Use compact chemical-space bases,
weighted reductions, local mappings, shared geographic operators and short vector arithmetic.
Preserve this structure through the final update. Physics informs conceptual relationships;
reproducing a known process or an inherited continuum equation is not the correctness target.

Retain diffusion plus drift as the transport direction. Compose drift from shared directional
fields and manifold-derived chemical responses. Apply the same design discipline to receptors,
transporters, enzymes, installed membranes, injury and funded bodies. The canonical design gives
an illustrative factorization, not a newly fixed formula, field rank or attribute list.

Preserve discrete chemicals, fixed heritable slots, individual genome/RNN cells, actual installed
and built state, local causality, funded evolution, finite uneven resources, common washout,
48 founders/two colonies and continuing observation. Preserve material/work consistency,
bounded computation, deterministic supported continuation and the immutable worker boundary.

The M0 logarithmic activity, fitted exponential flux, capacitor, exact thermodynamic ratios,
cubic crowding, quadrature and global free-energy acceptance are reference choices to reassess.
They are not architectural constraints. The implementer selects replacements and demonstrates
their invariants, useful conditional effects and measured cost before integration. Account for
the protections each replaced rule provided; do not hide work creation or material loss.

## Consequences and evidence

The current mathematical specifications distinguish retained outcomes from their superseded M0
formula records. M0/M1 completion remains historical evidence, not approval of those formulas for
the replacement runtime. Existing implementations, tests and failed measurements stay available
for reuse or explicit retirement when implementation resumes.

The old M2 execution and cache branches are canceled as work orders. The subsequent plan
reconciliation reopens M0 for concrete mathematical selection and measured core cost, and M1 for
representation compatibility. M2 remains unfinished and follows those outcomes. M0 resolves
machinery/lifecycle accounts jointly; M3/M4 integrate them. Old completed child records retain
their original evidence. Refresh each milestone just before execution.

Subsequent M0 execution selected revision-4 computable laws and implemented reusable Rust
arithmetic. Fourteen new bounded checks and full CI pass; release WASM measures 8.82/19.24 ms
per core tick at 48/2,000 cells. The [evidence record](../specs/digital-chemistry/validation.md)
defines scope, accounts, cost, memory and exclusions. M1 subsequently consolidated the compiler,
then corrected composition through field commitment, geographic W/W-transpose delivery, compiled
engagement and dependency-based material/operator reuse. The final core pair measures
7.165/15.728 ms at 48/2,000 cells. Ordinary-world integration remains M2–M4; neither a passing
allocation nor this improvement establishes implementation of the complete intended system.

Numerical details remain implementer-owned. Selection starts with operation/memory budgets and
small release-WASM proof points; complete 30 ticks/s and model-time throughput remain required.
Human motion review remains separate. A change to the immutable sharing boundary requires an
explicit user decision; matrix-oriented design does not implicitly authorize GPU physics.

## Alternatives and rationale

- Continue formula-preserving micro-optimization: removes waste but leaves the unproven dominant
  operation intact. It cannot serve as the sole strategy after the user clarified the objective.
- Restore diffusion alone: recovers a useful computational baseline but drops required cell/field
  coupling. Reuse its execution structure while adding designed drift and embodied response.
- Select a cheap discrete chemistry: preserves experimental identity and makes computational
  feasibility a property of the chosen rules. This is the accepted direction; the current
  specification now records the selected and measured arithmetic.
