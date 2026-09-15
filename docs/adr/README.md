# Architecture decision records

| ADR | Decision | Status |
| --- | --- | --- |
| [0014](0014-canonical-2d-substrate.md) | Canonical ant cross-section | Superseded by 0018 |
| [0015](0015-deterministic-core.md) | Deterministic core and ant checkpoint schemas | Superseded by 0018; determinism retained |
| [0016](0016-shared-action-boundary.md) | Oracle and local ant controllers share physical actions | Superseded by 0018 |
| [0017](0017-harness-ledger.md) | Behavioral campaigns live in the SQLite harness | Accepted |
| [0018](0018-bacterial-runtime.md) | Top-down bacteria, isolated random domains and controller/state boundaries | Accepted |
| [0019](0019-single-language-kernel.md) | One TypeScript simulation kernel; reasoning outranks speed | Superseded by 0020; single rule ownership retained |
| [0020](0020-complete-rust-kernel.md) | Complete Rust/WASM simulation and worker-owned rendering | Accepted |
| [0021](0021-integrated-digital-chemistry.md) | Integrated chemistry, embodied evolution and shared medium | Amended by 0022 |
| [0022](0022-computable-chemistry.md) | Design artificial rules for composed manifold computation and measured cost | Accepted direction; replacement selection pending |

ADRs 0001–0013 described the retired runtime and are preserved unchanged in the
[legacy ADR archive](../sources/legacy-3d-adrs/). They are provenance, not current constraints.
