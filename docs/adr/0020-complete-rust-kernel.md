# 0020 — Complete Rust/WASM simulation and worker-owned rendering

- Status: Accepted
- Date: 2026-09-14
- Supersedes: [0019](0019-single-language-kernel.md)

## Context

The first digital chemistry implementation expanded the work required per organism and per field
update beyond usable throughput. Reducing founder count or slowing the physical world would violate
the intended experiment. The user authorized replacing numerical behavior and architecture while
preserving generic chemistry, local control, paid biology and evolutionary opportunity.

ADR 0019 rejected duplicated physical rules split across TypeScript and Rust. Its alternative of
moving the complete step into one language applies here. The rejected shared inference pool is not
being restored.

## Decision

Rust owns all physical and evolutionary state and every simulation rule. Browser and headless tools
load the same WASM binary. TypeScript owns application interaction, observational grouping, artifact
writing and experiment orchestration; it implements no alternative physics.

Use contiguous numerical storage, compiled compact machinery affinities, vector field operations
and separate movement/controller and physiology clocks. Document the approximation and validate
accounting, causal opportunities, refinement sensitivity and operating cost. The
[numerical contract](../design/chemistry/numerical-engine.md) specifies the formulas and layout.

One browser worker owns WASM and an OffscreenCanvas WebGL2 renderer. Rendering borrows typed-array
views of packed WASM buffers. The bridge carries commands and bounded observation summaries, never
the complete chemistry grid every frame. GPU uploads still copy data to device memory. Shared
linear memory, isolation headers and a second execution worker are unnecessary for this boundary.

The [immutable data-sharing contract](../design/chemistry/data-ownership.md) governs every later
implementation and diagnostic addition. Its ownership, borrowed-render and bounded observation
rules cannot be weakened without an explicit user decision. Runtime guards and CI tests enforce
the browser command surface, scalar tick path, borrowed GPU uploads and observation backpressure.

Checkpoint v11 preserves complete physical continuation state, compact parentage and explicit
intervention provenance. Reject older checkpoints; do not retain compatibility physics or restore
old schemas. Observation records remain separate from physical inputs.

## Consequences

Rust/WASM tooling is now required for builds. The removed TypeScript simulation is available in
repository history. There is one rule owner, no JS/WASM agreement test between two implementations,
and no main-thread field-array copy. The browser requires OffscreenCanvas and WebGL2.

The [integrated capacity record](../design/chemistry/numerical-results.md) meets the 30 ticks/s
minimum at 2,000 varied cells, including a reproductive load. The reproductive case has little
headroom and misses the 60 ticks/s target. GPU performance, human motion review and days/weeks
browser operation remain unverified. Neither throughput nor constructed mechanism tests establish
evolved adaptation or sustained ecological diversity.
