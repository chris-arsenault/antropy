# 0004 — Excavation instinct in the structured initialization

- Status: Accepted
- Date: 2026-09-02

## Context

The design spec's structured initialization (§2.1) seeds exactly one instinct: stereo
chemotaxis toward food scent. In practice, founder populations under the wide random prior
expressed digging so rarely that whole runs showed no excavation — whether any founder dug
was seed luck, and the digging trade-off never came under selection. Terrain modification
is a core observable of the simulation (§5.4) and the substrate for later architecture and
caste dynamics.

## Decision

The structured initialization seeds a second instinct alongside chemotaxis: a weak
crowding-driven excavation drive (crowding input → one hidden unit → DIG output and a
downward vertical bias). Like the chemotaxis backbone it is ordinary weights — "instinct in
erasable ink" — and lineages may strengthen, repurpose, or abandon it. Digging therefore
starts where ants bunch (the nest) and radiates outward.

## Alternatives considered

- **Chemotaxis-only backbone (the spec's original reading)** — digging must arise from
  random priors and mutation. Rejected after observation: expression was seed-dependent and
  usually absent, so the dig/energy trade-off sat outside selection's reach indefinitely.
- **Wider random noise on action-output biases** — implemented first and kept, but alone it
  produced tonic, uncoordinated digging in a minority of founders on lucky seeds only.
  Insufficient as the sole mechanism.
- **Hand-coded digging behavior outside the genome** — rejected outright; it would violate
  the interface-not-behavior principle (§1) rather than extend initialization (§10).

## Consequences

- Early-run excavation is a seeded prior, not an emergent result; observers reading
  "colonies dig" must attribute it to initialization until lineage data shows the instinct
  under selection.
- The instinct occupies hidden unit 1 the way chemotaxis occupies hidden unit 0; both are
  mutable genome content with no special protection.
- The design spec's §2.1 description ("food scent → approach" as the backbone) is extended
  by this ADR rather than edited in place.
