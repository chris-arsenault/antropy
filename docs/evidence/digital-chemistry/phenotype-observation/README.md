# Phenotype observation delivery evidence

September 19, 2026. [Feature guide](../../../phenotype-observation.md) and
[registration](../../../plans/archive/PHENOTYPE-OBSERVATION-PLAN.md).

## Fixed-load cost

Seed 101; 320 × 240 world, mesh 2, dt 0.2. Existing distinct-genotype 48/2,000-cell
fixtures, no resource sites, no funded-growth arm. Each case advances 10 warmup and
100 measured ticks with a 60-second cap. All completed. Timing includes packed render
preparation, census and selected-cell inspection. Active cases additionally read reductions
every 25 ticks. These are constructed capacity loads, not evolved communities or GPU/React
throughput measurements.

| Mode | 48 cells, ticks/s | 2,000 cells, ticks/s | Ledger |
| --- | ---: | ---: | --- |
| Before feature | 84.44 | 36.97 | 4189–4190 |
| Before feature, reversed-order repeat | 84.09 | 36.71 | 4199–4200 |
| Final, observer unopened | 83.68 | 36.77 | 4201–4202 |
| Final, collecting + Web + group reports | 77.93 | 32.34 | 4203–4204 |
| Final, all cells pinned + group reports | 82.79 | 33.38 | 4205–4206 |

Closed-view throughput is within 1% of both baseline measurements. At 2,000 cells the
active arm costs about 12% and the pinned arm about 9% against the final closed arm.
The 48-cell active arm costs about 7%, while the pinned arm costs about 1%. These short
measurements establish operating cost, not precise universal overhead percentages.
Closed arms never enabled collection. Closing panels without a pin disables collection;
previously allocated bounded scratch remains reusable.

The active arm reads both Web and group replies, although ordinary UI panels are mutually
exclusive. Pinning keeps collection running with panels closed. Four group/Web reads at
2,000 cells took 27.52 ms total; four pinned group reads took 12.61 ms. Largest observed
replies were 7,248 bytes for Web and 6,284 bytes for a pinned group, below the unchanged
16 KiB ceiling. At 2,000 cells the WASM heap high-water mark was 242,417,664 bytes closed,
246,939,648 active and 247,201,792 pinned. These include physical state and reusable allocator
storage, not just observer data.

An initial inline observer enlarged World even while disabled. It measured 79.11 and 80.26
ticks/s closed at 48 cells, versus 84.44 and 84.09 baseline. Moving the optional observer
behind a Box restored the closed-view result above. Earlier measurements remain in the
`inline-*` reports; they are not the final implementation's cost.

Final binary SHA-256: `0ac70edf8678699ec5ef35732603e9a91ca61bd3f3ff56e6c28072b7a044de9a`.
Baseline: `962af4541d266472095397a00b7a76b472a12cbe6177721b409cbd3efec054c7`.
Loaded binaries remain in local `frontend/harness/artifacts/phenotype-observation/` directories.
Exact summaries: [baseline](baseline.json), [repeat](baseline-repeat.json),
[closed](closed.json), [active](active.json), [pinned](pinned.json).

## Functional verification

`make ci` passes 148 Rust unit tests, 17 chemical-definition integration tests and 66 Vitest
tests; formatting, type checking, documentation and Terraform formatting also pass. ESLint
retains 17 nonblocking warnings, including optional fields absent from earlier v30 saves and
non-measured Web views.

New checks reconcile accepted conversion amounts with reaction accounts and transporter
species totals with imported/exported amounts. Observer-enabled and disabled worlds retain
identical physical snapshots and continuation. Tests cover fission, changed roles, extinction,
root restoration, complete 300-member paged pinning, body-color preservation, empty groups,
reply budgets, corrupt retained data, save/restore, existing 240-point history thinning and
delta reconstruction. No physical rules, initial conditions or checkpoint version changed.

The [isolated browser check](browser.json) uses the existing local server, one fresh seed-27
world and 30 ticks. It opens measured flow, follows a primary role, pins 12 cells, highlights
them, closes the panel, saves and restores through the ordinary UI, and checks desktop/mobile
views. Pin metadata matches after restore; browser exceptions and alert lists are empty.
Earlier automation attempts needed boolean DOM predicates and a saved-option selector scoped
to the visible dialog; neither changed the application. The user's running tab was untouched.

Screenshots: [Web](web.png), [desktop comparison](desktop.png),
[map highlight](highlight.png), [mobile](mobile.png).
This is a UI and observer-cost check, not a long ecological run or a claim of adaptation.
