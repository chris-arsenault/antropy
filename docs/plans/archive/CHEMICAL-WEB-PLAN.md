# Chemical roles and transformation web

> Historical execution record, archived September20, 2026. Version-specific instructions and
> pending gates below retain their original meaning; they are not an active work queue.
> See [plan dispositions](../README.md) and [current design](../../design/README.md).

September 18, 2026. Implementation authorized by the user's request for enzyme-input/output
colors, cell counts by chemical pair and a visual transformation web. Root:
`fe62d8f5-b7ce-4768-b7e3-e579606fa2da`. Existing UI edits remain in the working tree.

## Contract and decisions

Use the actual installed compiler output, including mixed products and paid machinery stock.
Never infer products from rounded genome offsets or inherited targets. This is an observer:
no physics, mutation, controller, checkpoint or retention change.

- Two additional map colors identify the input/output of the strongest installed enzyme route.
  Strength is funded enzyme stock × compiled catalytic coefficient × product weight. Ignore
  identity products and zero funded stock; deterministic ties prefer smaller chemical IDs.
  Cache each enzyme's strongest route in its immutable compiled operator, keeping map work
  at four slots per cell. Gray means no installed conversion. This classification describes
  capability, not current intake, waste export or measured reaction flux.
- A Rust reduction counts every living cell once per supported input→output pair, including
  all nonzero compiled product branches, and separately counts its primary route used for
  colors. Primary counts plus unassigned cells equal the whole population. Supported counts
  overlap because a cell can perform several transformations. No population sampling.
- The default table/web groups primary roles. A supported-routes view includes secondary
  capabilities. A chemical filter and 64-row pages retain access to every pair; totals and
  omitted rows are explicit. No IDs outside the 256-species domain are generated.
- The web uses fixed positions from the existing 16×16 chemical manifold. Directed paths
  connect actual input/output identities, use matching chemical hues, and show counts.
  This stable process diagram needs no animated force simulation or new dependency.
- An environmental-pathways view uses the current world's compiled weathering operator,
  including the existing energy gate and profile coefficients. It shows possible local-medium
  conversions, explicitly not measured flux. These are distinct from cell-supported routes.
  The current reservoir inventory species mark source chemicals. No fabricated sun or ecology.
- Request the reduced web only while its panel is open. Cache by tick and query; unchanged
  observations keep their identity. Use the existing one-envelope acknowledgement/backpressure,
  16 KiB ordinary reply limit and 400,000-visit envelope guard. Add explicit 64-row guards.
  All reductions stay inside Rust; rendering continues to borrow the same packed WASM views.
  Keep current usable-energy cell colors and energy-per-material map defaults.

The phrase "static process ideas" is provisionally interpreted as a stable process diagram,
including environmental pathways. A clarification was requested while independent work proceeds.
Actual per-reaction time-window flux recording and inferred cross-feeding remain outside this
capability view: existing per-cell consumed/produced totals cannot reconstruct paired transfers.

## Source and reuse map

`chemical_operators.rs` owns discrete compiled input/product weights. `presentation.rs` and
`render.rs` own worker-local colors. `commands.rs`, `Session.status`, `observationDelta.ts` and
`observationBudget.ts` own bounded observations. The new Web panel extends the existing dock,
Overlay and Map controls. `weathering::Operators` owns environmental topology; `sources` owns
current reservoir inventory. Existing ChemicalAtlas coordinates and identity hues guide display.
The immutable [ownership contract](../../design/chemistry/data-ownership.md) remains governing.

## Milestones

### M0 — Bounded observations and colors

Phase `bcaa702c-dac1-4f07-81b9-e67b80ef8a5c`. Add compiler-derived primary route metadata,
complete-population pair reductions, pagination/filter validation, borrowed color modes 14/15,
and opt-in cached worker observation. Acceptance: installed identity/funding respected, all
counts reconcile, ordinary reply fits 16 KiB, no changes to physical bytes or continuation.

### M1 — Chemical web and role browser

Phase `cbf793a6-2573-4336-9ad6-a9885a43f0d7`, depends on M0. Add the Web panel, stable SVG graph,
matching colors, route table and filtering/paging. Explain primary versus supported counts and
environmental potential. Acceptance: all requested views accessible, map controls independent,
navigation retains the canvas, process nodes/edges and omissions are legible.

### M2 — Boundaries, cost and UI verification

Phase `51710664-693b-43a4-a4de-397d5014d2e7`, depends on M1. Run full CI and bounded checks below,
document semantics and measurements, review final scope. No commit, deployment or long run.

## Verification registration

- Rust fixtures: funded/unfunded and mixed-product machinery, duplicate slots, partial refit,
  whole-population counts, exact primary/map correspondence, filtering/pages, environmental
  topology, reply size, snapshot equality and deterministic continuation with observers.
- Vitest: browser query guard, caching/reset/disabled state, observation delta/budgets and
  web/map navigation; graph direction and count semantics through actual reduced data.
- Short cost check: current release WASM, existing startup/capacity fixtures, 48 and 2,000 cells,
  20 read-only web queries and color preparations per size, no tick campaign. Include varied
  machinery if the existing capacity fixture supplies it. Hard wall budget 60 seconds. Record
  query/prepare cost, payload and exact state equality; do not infer saturated tick throughput.
- Existing-server browser check: isolated Chromium profile on localhost:26000, desktop and
  narrow layouts, new colors, route selection, filter/pages and diagram. At most 300 ticks and
  120 seconds. No new server or user storage. Local artifacts under a new harness directory.
- `make ci` and `git diff --check` before handoff. Existing mathematical/environmental evidence
  retains its original scope; static pathways do not establish an evolved food web.

## Current state

M0–M2 complete. Cost, browser, Rust, TypeScript and ownership checks pass.
The full-population reduction respects installed identity, stock and every mixed product.
No physical arithmetic or checkpoint bytes changed.

<a id="M0-expansion"></a>

### M0 expansion

Branch `2e2993cc-068a-4c90-84aa-78e03ed6f7a6`.

1. `21736d66-2a1c-4163-a1db-02e849b69457`: implement `chemical_roles.rs`, shared compiler
   metadata and color consumers. Add the bounded `chemicalWeb` command. Verify physical snapshot
   equality, count partitions, funded/installed identity, mixed outputs and pagination in Rust.
2. `cf8eb341-be54-4e8f-b505-a5df1cbc2254` [depends on #1]: add web observation types and an opt-in
   Session cache, guarded worker command and delta limits. Verify caching, reset, disabled cost
   and guard rejection through the actual browser Engine in Vitest.

Shared M0 exit check: Rust tests, built WASM, focused observation tests and TypeScript.

<a id="M1-expansion"></a>

### M1 expansion

Branch `704a4335-cefe-46a3-8d43-378097f3855d`.

1. `74eaad97-7db2-42bf-9fba-f949e6e83810`: add Web dock navigation, a wider Overlay,
   ChemicalWebPanel, SVG graph and route table. Reuse identity hues and actual chemical coordinates.
   Lift only the independent map color selection to Application so Web can select input/output
   coloring. Preserve the energy defaults and canvas identity. Filtering and pagination use M0.
2. `fb3b6029-988a-497a-aa69-93a3304603d9` [depends on #1]: extend the existing application
   integration fixture with the real WASM query; cover counts, SVG routes, selection, environment
   semantics, map independence and subscription cleanup. Check TypeScript and ESLint.

M2 retains final CI, visual browser checks and bounded cost measurements.

<a id="M2-expansion"></a>

### M2 expansion

Branch `b5018239-a9dd-48be-a964-7ab4faf5d757`.

1. `7cfd1551-f65d-4ac8-9e15-94c567ca8916`: measure observation and rendering cost with
   `chemicalWebCost.ts`: 20 queries/color
   preparations at 48/2,000 cells, no ticks, 60-second cap, exact physical-state equality.
2. `d5c8edda-cfb4-4585-8ea1-9aba144d2fde`: verify browser and handoff. Extend the existing
   isolated UI runner for Web modes, filter,
   paging and colors; inspect screenshots, run full CI and document semantics and measurements.

## Measurements and limits

Ledger 4042 completed the registered zero-tick check in 779 ms. The 48-cell case uses the
ordinary startup; 2,000 cells use the existing varied-genotype capacity fixture. Twenty queries
and twenty render preparations per size rotate between the three modes below. The
[cost report](../../evidence/digital-chemistry/chemical-web-cost.json) retains every sample,
payload size, pair count and exact WASM hash; the loaded binary remains in local artifacts.

| Mean elapsed time | 48 cells | 2,000 varied cells |
| --- | ---: | ---: |
| Primary route query | 0.338 ms | 8.129 ms |
| All supported routes query | 0.298 ms | 13.379 ms |
| Environmental query | 0.192 ms | 0.324 ms |
| Usable-energy render preparation | 0.013 ms | 0.162 ms |
| Enzyme-input preparation | 0.021 ms | 0.463 ms |
| Enzyme-output preparation | 0.015 ms | 0.293 ms |

The largest page was 5,320 JSON bytes, below the unchanged 16 KiB limit. Both fixtures retain
identical physical snapshots. Rendering measurements exclude GPU execution; these read-only
costs do not establish long-run tick throughput. Closed Web performs no route query. Open Web
uses the existing status cadence, at most twice per second during ordinary running.

The isolated existing-server browser check passed 21 layout checks at 1440×1000, 390×844 and
844×390, ending at tick 18 in the final capture. It covered both color actions, supported/environment modes, paging,
node filtering, chemical map selection and subscription cleanup, plus the existing UI checks.
The [browser result](../../evidence/digital-chemistry/chemical-web-ui.json) records bounds and
canvas/worker continuity. Screenshots remain local under
`frontend/harness/artifacts/chemical-web-ui-20260918-c/`. The first attempt stopped on a test
script returning a DOM node through CDP; returning a boolean fixed that serialization error.
The first passing capture ended at tick 8; the final repeat added dense supported/environmental
graph screenshots for visual inspection. Both stayed within their registered limits.

CI passes 134 Rust and 62 Vitest tests, Rust format/Clippy, ESLint (12 existing warnings),
Prettier and TypeScript. The documentation gate initially rejected the new heading's missing
stable anchor and index entry; both are corrected. No server was started, and no work was
committed, pushed or deployed.

The supplied startup has 48 primary cells on 0→138, 48 supported pairs and 480 possible
environmental edges. These are installed-capability/topology observations at startup, not
evidence of evolved roles, active reaction rates or cross-feeding. UI text retains that distinction.
