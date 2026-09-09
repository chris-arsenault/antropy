# 0014 — Canonical 2D substrate

- Status: Superseded by [0018](0018-bacterial-runtime.md); body preserved as ant design history
- Date: 2026-09-06

## Context

The project exists to study genetic algorithms in physically motivated creatures. A third spatial
axis substantially increased geometry, sensing, rendering, and verification cost without serving
the immediate evolution question. The previous simulation also accumulated systems whose passing
metrics hid visibly broken movement.

## Decision

Replace the runtime with one X/Y vertical cross-section. Delete old runtime code and dependencies;
do not add a dimension mode, adapter, or checkpoint migration. Preserve the last prior commit at
the annotated tag `3d-simulation-checkpoint-2026-09-06`.

## Consequences

The rebuilt baseline must recertify every behavior on 2D. Historical ideas remain available in
source documents and Git, but no earlier implementation or certification is current.
