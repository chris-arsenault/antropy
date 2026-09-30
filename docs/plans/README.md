# Plans

Plans record execution. Current behavior belongs to the [design work order](../design/README.md),
[composed laws](../design/chemistry/composed-runtime.md) and
[decision/evidence record](../design/decisions-and-evidence.md). Archived plans preserve
execution, registrations and failures; their future-tense instructions are historical, not work
to replay.

## Delivery policy

Plans contain implementation and deployment phases only. Agents run appropriate automated
tests and bounded checks as part of the work, including substantial checks where needed. Test
results belong in results documents; they are not separate verification or acceptance stages.
Close delivered roots and children without waiting for human approval, visual review, more
measurements or long-running ecology. Continuing observation informs later refinement while
development proceeds. Report actual defects and delivery failures, not recurring approval requests.

This policy supersedes review-gate instructions in every older plan and design. Historical
measurements, missing experiments and user feedback retain their meaning; retiring a gate does
not mark it passed. Optional unselected features belong in the backlog. Genuine code or deployment
work stays explicit in an implementation phase.

## Active plans

| Plan | Sulion | Scope |
| --- | --- | --- |
| [Full fractal terrain and local resource seasons](TERRAIN-AND-SEASONS-PLAN.md) | `0ac08ebd-3a5c-4b83-912b-f4303d4267be` | Static v46 terrain pushed as `569f1a0`; integration corrections implemented, with publication/deployment recorded in the delivery phase. [Dynamic terrain](../design/dynamic-terrain.md) is a separate open direction |

## Archived plans

All bodies remain available in [archive/](archive/). Archiving changes links and adds a status
line; it does not turn failed experiments, deferred performance targets or missing
original-version acceptance into passes.

| Plan | Status | Sulion | Outcome |
| --- | --- | --- | --- |
| [Integrated default terrain display](archive/INTEGRATED-TERRAIN-DISPLAY-PLAN.md) | Delivered | `c6e3d1b6` | Ordinary ground, contours, received-light shade, translucent chemistry and seasonal source markers through the shared renderer, `fc016c7`; no physical-rule or v46 checkpoint change |
| [Terrain and seasons execution record](archive/TERRAIN-AND-SEASONS-PLAN.md) | Superseded | `0ac08ebd` | Original September 30 design baseline, registrations, results and negative findings; the active terrain plan owns remaining work |
| [Birth orientation and physiological aging](archive/BIRTH-AND-AGING-PLAN.md) | Delivered | `404e9450` | Random newborn orientation and core-linked age-dependent maintenance, v45, `79ea580` |
| [Genetic physiology](archive/GENETIC-PHYSIOLOGY-PLAN.md) | Delivered | `ea4b2307` | Genetic body proportions at current biomass replace machinery construction/retirement, v43, `dc41e40` |
| [Dispersal geography and neural response](archive/DISPERSAL-OPPORTUNITIES-PLAN.md) | Delivered | `a153cfca` | Heavy-tailed outlying reservoir placement and bounded aggregate neural drive, v44, `f6f2a2a` |
| [Continuous worlds](archive/CONTINUOUS-WORLD-PLAN.md) | Delivered | `84480ab8` | Bounded ancestry retention without a stopping condition, non-pausing save failures, phenotype-first observation, `f754772` |
| [Ecological incentives](archive/ECOLOGICAL-INCENTIVES-PLAN.md) | Delivered | `fce0b678` | Crowding costs, product costs, passive exchange and independent light metabolism, `3ee29b3`/`a3a97ee` |
| [Light ecology](archive/LIGHT-ECOLOGY-PLAN.md) | Delivered | `ad5eb2f9` | Geographic shade, overhead material film, paid emission and shared photochemistry, v42, `ffee2d8`; constructed probes establish mechanisms, not profitable strategies |
| [Material coupling](archive/MATERIAL-COUPLING-PLAN.md) | Delivered | `4057652e` | Per-class coupling to the shared chemical response, v41, `c7220a6`; structural reservoir exposure `9a5fc51` |
| [Browser and server execution](archive/EXECUTION-MODES-PLAN.md) | Delivered | `14e9bf4a` | Browser 1/4 and native 32-thread server with shared UI; private deploy CI run `35637790565` at `d74f1ae`; public route and volume persistence `fe0499c`. See the [runtime guide](../execution-modes.md#delivery-record) |
| [Model simplification](archive/MODEL-SIMPLIFICATION-PLAN.md) | Delivered | `10b840c9` | Birth-fixed capabilities (refitting removed), single-composition reservoirs, one-range binding with ordinary washout, `1cc05e2`/`b224525` |
| [Structural runtime scaling](archive/SCALING-PLAN.md) | Delivered | `e3517c4b` | Regional ownership, local scheduling, shared carriers, Rayon/shared-memory runtime and the September 28 performance pass; P3 measurement stage retired, P4 split to terrain and backlog. The structural-first rule in [AGENTS.md](../../AGENTS.md) still governs |
| [Mature-world execution at 120 ticks/s](archive/MATURE-PERFORMANCE-PLAN.md) | Abandoned | `46ff4c55` | Canceled September 21 with the target unmet; negative M3 findings in [decisions and evidence](../design/decisions-and-evidence.md#mature-world-performance-investigation) |
| [Cellular organization and exchange](archive/CELLULAR-ORGANIZATION-PLAN.md) | Delivered | `ec58a567` | One intracellular mixture, funded inward sensing and shared exchange, v33, `fad7fa9`; [results](../cellular-organization-results.md) retain costs and limits |
| [Material habitats](archive/MATERIAL-HABITATS-PLAN.md) | Delivered | `9c6c8f25` | v32 shared binding, retention, public regeneration and evolving renewal; negative public-food probe and cost regression retained |
| [Phenotype observation](archive/PHENOTYPE-OBSERVATION-PLAN.md) | Delivered | `b4e0c24e` | Bounded recent-flow views, pins and history; measurement limits remain in the phenotype contract |
| [Viewport](archive/UI-OBSERVATION-PLAN.md) | Delivered | `927937d1` | Viewport-first observation UI |
| [Chemical web](archive/CHEMICAL-WEB-PLAN.md) | Delivered | `fe62d8f5` | Enzyme input/output colors, chemical-pair counts and transformation web |
| [Environmental ecology](archive/ENVIRONMENTAL-ECOLOGY-PLAN.md) | Delivered | `5e88cd8a` | Shared ecology correction, binding and illumination; version 14/29 human gates superseded; optional E2 geometry/supply review moved to backlog |
| [Mobile sources](archive/MOBILE-SOURCES-PLAN.md) | Superseded | `7494a047` | First implementation and calibration retained; bespoke source rules replaced by shared environmental operators |
| [Mathematics](archive/MATHEMATICAL-SYMMETRY-PLAN.md) | Delivered | — | v21–v27 implementation, exact-action completion, geometry/extinction failures and regenerative startup; old missing human reviews are not retrospectively passed |
| [Unattended-browser repair](archive/LONG-RUN-RELIABILITY-PLAN.md) | Delivered | — | React timing retention repaired; original crash attribution and one graphics timeout remain unverified |
| [Digital-chemistry rebuild](archive/DIGITAL-CHEMISTRY-PLAN.md) | Delivered | — | Production replacement and mesh2 correction; unmet saturated/high-population costs remain operating limits |
| [Digital chemistry M0](archive/DIGITAL-CHEMISTRY-M0-PLAN.md), [M1](archive/DIGITAL-CHEMISTRY-M1-PLAN.md) | Superseded | — | Pointers to the pre-removal implementation; never resume these discarded kernels |
| [Chemistry v9 implementation](archive/CHEMISTRY-V9-IMPLEMENTATION-PLAN.md) | Superseded | `d80ddca6` | First TypeScript digital chemistry (September 13); replaced by the September 15 numerical restart |
| [Chemistry reliability](archive/CHEMISTRY-RELIABILITY-PLAN.md) | Superseded | `a3da6ddc` | v9 browser-failure repair and reliability checks (September 14); [results](../design/chemistry/reliability-results.md) retained |
| [Chemistry reliability experiments](archive/CHEMISTRY-RELIABILITY-EXPERIMENTS.md) | Superseded | `a3da6ddc` | Registration of the v9 inheritance, habitat-access and operational-duration checks |

Pre-cleanup [agent instructions](../sources/history/2026-09-20-agent-guide.md) and
[work order](../sources/history/2026-09-20-design-work-order.md) preserve the older chronology.
The former scaling sequence is preserved in
[the historical snapshot](../sources/history/2026-09-21-scaling-before-structural-correction.md).

## Recorded rejections

- Execution modes: the user rejected cross-context run transfer, live executor replacement,
  server save infrastructure and storage/recovery acceptance gates
  ([plan](archive/EXECUTION-MODES-PLAN.md#scope-correction)). Volume-backed server persistence
  was requested separately on September 23.
- Model simplification: the user rejected retaining parental capabilities to protect mutants from
  starvation ([plan](archive/MODEL-SIMPLIFICATION-PLAN.md#evidence-and-reuse)).
- Genetic physiology: the user rejected capability construction and equipment ownership costs as
  substitutes for physical tradeoffs ([plan](archive/GENETIC-PHYSIOLOGY-PLAN.md)).
- Cellular organization: the user canceled internal compartments (`60e1c9a1-5a0e-4c61-9ba9-362ed6f97a6f`)
  before any compartment edits ([plan](archive/CELLULAR-ORGANIZATION-PLAN.md)).
- Material coupling: retuning χ alone, reservoir anchors and orbital/inertial motion were rejected
  ([decision](../design/decisions-and-evidence.md#class-specific-material-coupling)).
- Mature performance: receiver certificates, affine inventory trajectories and per-cell reaction
  catalogs are not to be restarted ([evidence](../design/decisions-and-evidence.md#mature-world-performance-investigation)).
- Structural scaling: the sampled contact model was replaced by circle overlap and deleted
  ([plan](archive/SCALING-PLAN.md#september-22-correction-simple-circular-contacts)).
- Mobile sources: bespoke reservoir motion/conversion rules were rejected in favor of shared
  environmental operators ([plan](archive/MOBILE-SOURCES-PLAN.md)); environmental E1 fixed wells
  remain rejected ([plan](archive/ENVIRONMENTAL-ECOLOGY-PLAN.md)).
- Light ecology: the user's correction keeps sunlight overhead and non-depleting, superseding the
  earlier finite-sun proposal ([plan](archive/LIGHT-ECOLOGY-PLAN.md)).

## Dispositions

September 30, 2026 closed these obsolete Sulion records under the delivery policy:

| Record | Disposition |
| --- | --- |
| Terrain observation child `1d1dc941-d187-49bd-a367-a076983a4aa1` | Review stage retired; actual defects remain in the terrain root |
| Light delivery child `55cc1462-df17-47f2-b8cc-596aa46b5669` | Published implementation retained; outstanding human review retired |
| Light root `ad5eb2f9-36a9-4447-b18a-6cc910c7cb46` | Delivered implementation closed |
| Execution-mode deployment child `1bc9b70c-35c8-4ce4-b807-5625236bff25` | Deployment recorded; observation-only stage retired |
| Execution-mode root `14e9bf4a-fc5f-4c8c-ba92-6dd961848f57` | Delivered implementation closed; historical socket-close anomaly retained in continuing observation |
| Scaling root `e3517c4b-b3df-4786-bcf4-10a488a294d1` | Structural replacement delivered; measurement-only P3 retired and P4 split between implemented terrain and unselected climate backlog |

Exact 16/32-core and live-viewer comparisons remain unmeasured; that cleanup ran no simulation
campaign and made no new ecological or deployment claim.

Earlier environmental-era reconciliation:

| Plan | Disposition |
| --- | --- |
| `f5f9d7ae-dfd9-48da-a7ff-51f4f18da0c5` — L4 delivery | Automated v29 work retained; obsolete v29 human gate skipped because that additive/fast pattern was rejected and replaced by v30. |
| `13b9e037-20a3-457e-bf56-1313fb900044` — illumination | Implementation reconciled through v30 composition, map context, v31 sensing and subsequent user observation. No claim that v29 passed visual review. |
| `cc2e9b39-5a35-4abb-9c71-2566f064f08f` — ecology correction | Shared operator correction and bounded comparisons already executed; current-contract reconciliation completes remaining handoff. |
| `9380f93e-71a8-45f1-93ed-0503b73ba5e6` — environmental handoff | Old v14-only human gate skipped as superseded; original missing acceptance stays missing. |
| `5e88cd8a-1314-4622-9989-4bb02af68581` — environmental root | Completed implemented work after child reconciliation. E2 optional geometry/supply moves to backlog; rejected E1 fixed wells remain skipped. |

## Open questions with durable owners

[Backlog](../backlog.md) owns optional geometry/supply review, rotational climate, cell
interaction research and conditional biological extensions. The
[hypothesis log](../hypothesis-log.md) owns evolutionary questions. [Continuing observation](../continuing-observation.md)
and the [session investigation](../session-runtime-review.md) own operational limits and the
unexplained reload improvement. Public-food viability and long-term feedstock independence
remain open in [material habitats](../material-habitats.md).
