# Local mortality feeding

**Status:** Implemented locally in physical format v55, October 13, 2026.
The startup and v54 supply corrections remain the baseline.

Make the death-to-feeding cycle more consequential during local colony declines.
The selected local term replaces the global response by default. The global response remains
an explicit diagnostic comparison through `mortalityLocal=false`.
The installed [mortality recycling](mortality-recycling.md) and
[composed runtime](chemistry/composed-runtime.md#optional-mortality-recovery--v50)
remain the baseline; the extension below changes severity locality without changing supply ownership.

## Delivered local law

Body footprints distribute actual loss, funded growth and living mass to fixed material nodes.
Sparse histories use existing 8×8 region ownership and exact physical-time exponential decay
with the existing mortality memory. Source footprints sample these histories at their current
positions. Region width controls storage, not catchment size. Moving sources therefore read
their new neighborhood rather than carrying distress with them. Newly occupied support begins
with actual living mass; explicit interventions rebase histories. Observation decays a copy.

Each source applies the existing severity and bounded response to its sampled rates and biomass.
Global totals remain diagnostics. A frozen death batch enters history before recipient responses
are sampled. Normalize each corpse's overlap across recipients once, then multiply each share
by that recipient's response. The remainder spills normally. This bounds total recovered material
by the donor inventory even with overlapping recipients. Free inventory, death heat, normal
release ceilings and future external supply retain their existing accounts.

Constructed checks distinguish remote growth from balanced local turnover: remote growth can
cancel the global response but cannot cancel isolated local loss. Balanced local turnover gives
zero response. Moving-support, restore, observer-neutrality and conservative corpse checks pass.
An actual empty-reservoir check admits 2.656 body material, releases 1.064372, and records
1.166171 paid survivor intake and 2.153177 funded growth over 40 ticks, with no external imports
or rewrite of the supply condition. Intake also includes ordinary spill, so it is not a unique
corpse-to-survivor attribution. This establishes a delivery opportunity, not improved lifetime
or long-term rescue; the earlier negative lifetime result remains negative.

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

The historical October 4 two-hour v52 observation found local depletion and severe population loss
alongside continued growth elsewhere. A family with 52 living members disappeared between
the 40- and 50-minute captures. Its reservoir neighborhood fell from 102 residents to twelve,
so this was family extinction within a diminished colony, not complete colony extinction.
Both local reservoirs were empty before the collapse; ordinary refills were subsequently
observed. There is no established stuck-refill defect or causal mutation-to-dead-end result.
This observation predates both the finite binding partition and v54 supply ownership.
It records a real decline under those earlier laws, not a controlled failure of the current baseline.

Mortality recovery was enabled but contributed little material over the window. The pre-v55
severity subtracts funded growth from deaths across the whole world and normalizes by global
recent biomass. The [existing design](mortality-recycling.md#mortality-severity-and-nonlinear-response)
explicitly allows growth elsewhere to mask a failing colony. Local footprint overlap restricts
recipients, but recipient locality does not make the severity signal local. Gradual loss,
timing and the nonlinear response can also limit recovery.

The [earlier delivery comparison](../mortality-recycling-results.md) found greater growth but
shorter survivor life. No external refill occurred in its finite-food comparison, so copying
corpse chemistry into future imported batches does not explain that negative result. It remains
evidence under its recorded source/interface law; retention is not automatically beneficial.
Review severity, eligible recipients, chemical suitability, release ceilings, seasons and
controller expression as interacting explanations before choosing a further revision.

Local provenance is `frontend/harness/artifacts/live-full-20261004/`, ticks
1,463,107–1,564,445. `FINDINGS.md` and `FOLLOWUP.md` contain the authored interpretation;
numbered reports retain interval detail. Raw captures remain ignored and optional on fresh
checkouts. Reproduce the saved-capture follow-up with
`python frontend/harness/artifacts/live-full-20261004/followup-questions.py` when those artifacts exist.

## Fixed defects and the current question

The [startup correction](../mortality-startup-correction.md), `573b95e`, addressed a different
failure: halving sourceRate also halved finite startup batches and reservoir-derived priming.
Keeping rate 0.1 and increasing sourceLifetime to 1200 restores those batches. The first v50
extinction cannot isolate an ineffective mortality response from inadequate establishment.

The [v54 correction](mortality-recycling.md#october-12-correction-finite-contents-and-external-supply),
`c8404bd`, fixes a confirmed amplification path. A trace corpse deposit could overwrite an empty
source's normalized composition and replace the chemistry of every future external batch and
its full persistent interface. Recovery now changes only the sole finite inventory `Q*p`.
Future imports use an independently weathered boundary condition `b`, account for incoming material
and potential, and mix conservatively with retained contents. Neither nominal refill timing nor
global severity changed. Increasing local recovery is not a substitute for this ownership
correction, and the correction does not implement local distress.

The [three-hour live observation](mortality-recycling.md#october-12-correction-finite-contents-and-external-supply)
shows improved early replacement with recovery enabled, but ends before the previous run's collapse.
It does not prove long-term rescue or identify a local term as necessary. Global masking remains
possible by the installed formula; determine its consequential effect using corrected supply
and binding rather than treating every earlier loss as evidence for locality alone.

## Source requirements retained

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
all deaths. Keep geography, nominal supply, full startup batches and starting chemistry matched.
Use the current finite binding partition and separate inventory/boundary profiles. Observe each
profile and actual imports separately; finite corpse contents must not be mistaken for future
supply chemistry. Archived pre-fix results keep their original meaning.

The bounded checks above implement this registration. They do not
authorize a long campaign or certify sustainable ecology. Preserve external replenishment,
the chemical algebra, Rust-owned state and the continuing live world; no biomass ceiling,
automatic resurrection, food relabeling or role-specific reward belongs in this direction.
