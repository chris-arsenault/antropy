# Phenotypes and measured metabolic activity

> Historical execution record, archived September20, 2026. Version-specific instructions and
> pending gates below retain their original meaning; they are not an active work queue.
> See [plan dispositions](../README.md) and [current design](../../design/README.md).

User authorized the complete feature September 19, 2026. Sulion plan
`b4e0c24e-88fa-4053-a183-26c90e10afda` tracks delivery.

## Deliverable

Extend Web with accepted cellular conversion amounts per model second. Keep installed
capability and possible environmental routes explicitly separate. A linked Phenotypes window
compares the whole population, a primary chemical role or current spatial region, and one
pinned descendant cohort. Show actual body distributions beside inherited targets, membrane
coordinates, usable energy, damage, local illumination, measured uptake/export and work costs.
Highlight selection or pinned descendants without replacing independent cell colors.

Pinning captures all current members, then follows actual parentage regardless of later trait
changes or migration. A pin is an observation cohort, never a species or a controller input.
An empty cohort stays visible. Replacing/removing a pin is explicit. Its compact distribution
samples use the existing 240-point history and thinning/delta protocol. Cold save/export retains
the initial root IDs and pin metadata; restore reconstructs current descendants from ancestry.
Recent flux restarts at restore and must label its actual coverage. No retrospective flux is
invented. Existing v30 physical saves remain valid; physical serialization and laws do not change.

## Ownership and cost

Rust owns the opt-in observer. Accepted reaction and transport commits feed bounded reductions;
no per-cell private state or population frame crosses into React. A 250-tick window keeps one
current and one completed interval, at most three aggregates (world, selection, pin), each with
65,536 possible route counters cleared only on touched support. Imports/exports have 256 species.
Closed views without a pin stop recording. Pins retain collection while panels are closed.
Spatial IDs already belong to the worker-local census; only the chosen region's membership
travels from that existing observer to the Rust observer. Main-thread commands contain filters,
never membership arrays. Ordinary replies remain within 16 KiB; route/root pages are bounded.

Grouping for activity uses the start-of-tick installed primary role or latest 25-tick region
membership. Pin membership follows division/death immediately. Trait snapshots show current
living members; interval flows include members that died during that interval. Report coverage
and organism-time denominators. Cell colors/outline membership are computed inside borrowed
Rust render preparation. No physical version bump, feedback, RNG call or new economy.

## Work

1. Define selection, interval and pin contracts plus observer ownership.
2. Record actual accepted flows, reduce traits and preserve cohort membership through birth/death.
3. Connect Web, Phenotypes, regions and independent map highlights.
4. Retain compact pin history through cold saves, with validation and bounded delta publication.
5. Verify ordinary browser operation, cost, budgets and observer-neutral physical continuation.

## Verification registration

Use bounded Rust/Vitest checks for observer neutrality, exact accepted-flow reconciliation,
death/division/refitting, full-cohort pinning, paging, empty groups, restore and history thinning.
No evolutionary campaign. Benchmark closed/active/pinned observation on the existing fixed
48/2,000-cell fixtures: 10 warmup plus 100 measured ticks per arm, 60 seconds/arm. Measure reply bytes
and retained memory separately. Target under 5% closed-view overhead; report active cost.
Browser: existing localhost:26000, isolated profile, desktop/mobile, at most 100 ticks and
120 seconds. Exercise measured routes, filters, pin/highlight, panel closure and save/restore;
inspect screenshots and errors. Never touch the user's running tab. Run make ci before handoff.

### Cost replication decision

The first closed-view comparison measured 84.44→79.11 ticks/s at 48 cells (6.3% lower),
but 36.97→36.59 at 2,000 cells (1.0% lower). The active-observer 48-cell arm subsequently
measured 82.54 ticks/s, faster than the closed arm despite doing more work. This crosses the
5% closed-view target with inconsistent ordering. Repeat only the same closed current/baseline
pair, in reversed order, at the same 10+100 ticks and 60-second caps. Keep both results; no
ecological horizon, seed or mechanism expansion.

The reversed pair retained a 4.6% 48-cell difference (80.26 versus 84.09), with no 2,000-cell
difference (36.78 versus 36.71). Inspection found the disabled observer's fixed window arrays
still embedded in every World through an inline Option. Move this optional observer behind a Box
so unopened worlds do not carry those arrays in their physical owner. Repeat the three current
arms against the retained baseline; same cases and caps, no ecology changes.

## Completion

All five phases implemented. [Evidence](../../evidence/digital-chemistry/phenotype-observation/README.md)
records passing CI, ordinary desktop/mobile use, pin save/restore and bounded measurements.
Final closed throughput is within 1% of baseline at both loads. Active collection/reporting costs
about 9–12% at 2,000 cells, with 32.34–33.38 ticks/s. Physical rules and v30 serialization remain
unchanged; borrowed rendering and the existing observation message limits are preserved.
