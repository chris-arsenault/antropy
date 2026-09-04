# 0011 — Liability shapes price asset placement; dominance de-scoped to asset ledgers

- Status: Accepted
- Date: 2026-09-02

## Context

Appendix B Rule 6 asks for a strict strategy-dominance ordering (O-surface ≺ O-shelter ≺
O-architect) so that underground construction wins. Roughly ten measured tournament
configurations showed the ordering inverted on worker-days in every liability shape that
keeps the surface survivable (Rule 6's own founding constraint): metabolic stress up to 15×
is out-eaten near food, storm losses stay small because brood consumes every surplus before
stores form, and brood exposure losses do not bind because population is food-limited — an
egg costs ~1.1 energy, hatches into a self-provisioning forager in 600 ticks, and corpses
recycle as food. The economy is r-selected: forage-hours dominate all time-sharing
strategies at the population level.

The release goal (bootstrap, Rule 4 and §B.9) does not require unaided evolutionary
invention of digging: underground behavior is seeded, and the world must make the seeded
lifestyle *long-term viable* and its assets *better placed underground*.

## Decision

Liabilities price **asset placement**, and are all keyed to the one microclimate stress
field: adults pay a depth-attenuated basal multiplier when idling exposed; eggs perish in
proportion to the local multiplier above a safe band (the founding chamber sits at the edge:
safe in lush, hazarded at harsh peaks, deeper vaults buy the difference); storms strike
year-round, destroying exposed food; hoards beyond the queen's small crop are physical FOOD
voxels whose placement decides whether rain reaches them. Colonies restock the crop from any
larder within reach (scripted logistics, like trophallaxis).

The tournament gates on the §B.8.2 asset ledgers — egg-survival fraction and hoard
retention, plus underground-lifestyle viability over a season — not on worker-days.
The worker-days inversion is recorded as a property of the current reproduction economy;
making construction evolutionarily stable without seed support (brood as costly capital:
long tended juvenile phases) is deferred to the evolution releases via the backlog.

## Alternatives

- **Acute surface lethality** (desiccation death): produces the dominance ordering but
  violates Rule 6's survivable-but-inferior constraint and, measured, kills founding
  viability. Rejected.
- **Brood-as-capital now** (long, fed juvenile phases): restructures the reproduction
  economy this release and re-opens every calibrated gate. Deferred, not rejected.
- **Scripted labor choreography for construction** (haul loops, refuel cycles): repeatedly
  produced starvation traps and churn against the movement primitives; construction is
  instead a harness-side dig plan billed to the stockpile (ADR-0009 cheat surface), with the
  scripted queen descending into the vault she pays for.

## Addendum (post-Appendix-C legalization)

Removing the nest-bearing inputs (illegal per §C.8) and replacing them with a
nest-scent plume carrier inverted the recorded worker-days finding: the compass
had been subsidizing O-surface's forage efficiency. On the legal interface,
O-surface ≺ O-shelter holds strictly on the master ledger, and the tournament
gates are pinned there (no longer sub-ledger-provisional for that inequality).
The later brood-as-capital measurement still found O-architect below O-shelter on worker-days;
deep construction remains a priced investment whose current return is brood protection rather
than population dominance (see [the calibration record](../calibration.md)).

## Consequences

- Rule 6 is satisfied in spirit on the reproductive and storage channels; anyone reading
  Appendix B's letter should start from this ADR.
- The `TEMPERATURE` sensory input (thermoreception) ships so shelter and dig reflexes are
  reflex-expressible (Rule 4); seeds may use it, behavior remains fully evolvable.
- `FULL` retains the calibrated 2×2 founding entrance. The later locomotion correction made a
  1×1 entrance navigable, so isolated Phase 2 configurations use the narrower form.
- Evolution keeping or eroding the seeded underground preference becomes a Release 4+
  observable, with the backlog carrying deeper climate and raid repricing.
