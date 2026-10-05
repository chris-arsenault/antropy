# Local mortality feeding

**Status:** Exploratory design direction — design incomplete, October 5, 2026.

Make the death-to-feeding cycle more consequential during local colony declines.
The user identifies a local term as the likely direction. Its spatial definition,
composition with the existing global response and delivery law remain to be designed.
The installed [mortality recycling](mortality-recycling.md) and
[composed runtime](chemistry/composed-runtime.md#optional-mortality-recovery--v50)
remain the baseline; this document selects no runtime change or experiment campaign.

## Intended consequence

Deaths near a declining colony should create finite, usable local feeding opportunities
soon enough to affect survivors' intake, funded growth and replacement. Growth in unrelated
colonies should not suppress the response to that local decline. Follow the complete chain:
local loss, retained body chemistry, reservoir admission and release, survivor access,
paid uptake and processing, then growth, reproduction or improved endurance.

More recovered material alone does not establish that consequence. Body chemistry may be
unusable to survivors, release may arrive too late, or uptake may fail to repay its costs.
The direction does not require every colony to survive or impose a target population.

## Why this direction is open

The October 4 two-hour v52 observation found local depletion and severe population loss
alongside continued growth elsewhere. A family with 52 living members disappeared between
the 40- and 50-minute captures. Its reservoir neighborhood fell from 102 residents to twelve,
so this was family extinction within a diminished colony, not complete colony extinction.
Both local reservoirs were empty before the collapse; ordinary refills were subsequently
observed. There is no established stuck-refill defect or causal mutation-to-dead-end result.

Mortality recovery was enabled but contributed little material over the window. The current
severity subtracts funded growth from deaths across the whole world and normalizes by global
recent biomass. The [existing design](mortality-recycling.md#mortality-severity-and-nonlinear-response)
explicitly allows growth elsewhere to mask a failing colony. Local footprint overlap restricts
recipients, but recipient locality does not make the severity signal local. Gradual loss,
timing and the nonlinear response can also limit recovery.

The [earlier delivery comparison](../mortality-recycling-results.md) found greater growth but
shorter survivor life. Retention is therefore not automatically beneficial. Review severity,
eligible recipients, chemical suitability, release ceilings, seasons and controller expression
as interacting explanations before choosing a correction.

Local provenance is `frontend/harness/artifacts/live-full-20261004/`, ticks
1,463,107–1,564,445. `FINDINGS.md` and `FOLLOWUP.md` contain the authored interpretation;
numbered reports retain interval detail. Raw captures remain ignored and optional on fresh
checkouts. Reproduce the saved-capture follow-up with
`python frontend/harness/artifacts/live-full-20261004/followup-questions.py` when those artifacts exist.

## Design still to complete

- Define local dead body material, funded growth and living biomass through shared spatial
  weights and physical-time history. Start from existing footprints, regional ownership and
  the current mortality memory. Observer colony labels, ancestry and population-count triggers
  must not become physical inputs. Explain the spatial scale, boundary behavior and dilution.
- Decide whether local severity replaces or composes with global severity. Use one shared
  response across places; do not add separately tuned colony thresholds, blend coefficients
  or favored recipients without a demonstrated need the common rule cannot express.
- Trace why eligible deaths do or do not become useful food: overlap, admission, composition,
  release during empty waits, access and physiological return. Determine whether locality alone
  addresses the missing consequence or the delivery relationship also needs revision.
- Specify conservative ownership and avoid counting a corpse repeatedly through overlapping
  neighborhoods. Recovery redirects existing bound-body chemistry; it creates no material or
  usable work. Keep free inventory spill and independent normal replenishment accounted.
- Describe durable state, locally bounded computation, ordinary configuration and observation.
  Explain how balanced local turnover remains weak while an isolated decline can receive a
  stronger response without creating a permanent subsidy for successful residents.

## Evidence that can change the design

Begin with a bounded ordinary-simulation comparison of an isolated declining neighborhood
beside a healthy growing one. Competing explanations are global masking, insufficient local
capture, delayed delivery and unsuitable chemistry. Record the response and all transfers,
but judge consequence through paid survivor intake, costs, growth and birth/death replacement.
Include balanced local turnover to check that the proposed feedback does not merely reward
all deaths. Keep geography, nominal supply and starting chemistry matched.

Select the comparison and its budget when the design is developed. This registration does not
authorize a long campaign or certify sustainable ecology. Preserve external replenishment,
the chemical algebra, Rust-owned state and the continuing live world; no biomass ceiling,
automatic resurrection, food relabeling or role-specific reward belongs in this direction.
