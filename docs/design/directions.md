# Design directions

**Status:** Current reference — registry of every design direction with its status and owning document.

Each direction appears once, under its present status. Versions are physical checkpoint formats;
dates are 2026. The owning document holds the design or execution record; the decision column
links the reasoning, rejections and evidence. Current equations belong to the
[composed laws](chemistry/composed-runtime.md); priorities belong to the [work order](README.md);
unselected work belongs to the [backlog](../backlog.md); plans are listed in the
[plan index](../plans/README.md).

## Implemented and current

| Direction | Status | Owning document | Decision/evidence |
| --- | --- | --- | --- |
| Integrated default terrain display | Implemented September 30, `fc016c7`; presentation only, no format change | [Display](bacterial-display.md), [work order](README.md#design-terrain-display) | [Plan](../plans/archive/INTEGRATED-TERRAIN-DISPLAY-PLAN.md) |
| Fractal terrain and local resource seasons | Implemented v46, September 30, `569f1a0`; motion, configuration and refill-timing corrections implemented locally, publication pending | [Persistent geography](persistent-geography.md), [local resource seasons](local-resource-seasons.md), [terrain plan](../plans/TERRAIN-AND-SEASONS-PLAN.md) | [Decision](decisions-and-evidence.md#fractal-terrain-and-local-resource-seasons) |
| Birth orientation and core-linked aging | Implemented v45, September 29, `79ea580` | [Composed laws](chemistry/composed-runtime.md), [plan](../plans/archive/BIRTH-AND-AGING-PLAN.md) | [Decision](decisions-and-evidence.md#birth-orientation-and-physiological-aging) |
| Neural row budget and outlying reservoirs | Implemented v44, September 28, `f6f2a2a` | [Bodies](funded-bodies.md), [plan](../plans/archive/DISPERSAL-OPPORTUNITIES-PLAN.md) | [Decision](decisions-and-evidence.md#dispersal-geography-and-bounded-neural-drive) |
| Genetic physiology | Implemented v43, September 28, `dc41e40`; replaces machinery construction/retirement | [Bodies and inheritance](funded-bodies.md), [plan](../plans/archive/GENETIC-PHYSIOLOGY-PLAN.md) | [Decision](decisions-and-evidence.md#genetic-physiology-replaces-machinery-development) |
| Bounded history and continuous worlds | Implemented September 27, `f754772` | [Continuing observation](../continuing-observation.md), [plan](../plans/archive/CONTINUOUS-WORLD-PLAN.md) | [Plan index](../plans/README.md) |
| Ecological incentives: compression separation, product costs, passive exchange, private light metabolism | Implemented September 26 on v42, `3ee29b3`/`a3a97ee` | [Composed laws](chemistry/composed-runtime.md), [plan](../plans/archive/ECOLOGICAL-INCENTIVES-PLAN.md) | [Decision](decisions-and-evidence.md#ecological-incentives) |
| Light ecology: geographic shade, overhead material film, paid emission | Implemented v42, September 25, `ffee2d8` | [Light ecology](light-ecology.md), [results](../light-ecology-results.md) | [Decision](decisions-and-evidence.md#light-ecology-selection) |
| Class-specific material coupling, including cell contact adhesion | Implemented v41, September 23, `c7220a6`; structural reservoir exposure `9a5fc51` | [Plan](../plans/archive/MATERIAL-COUPLING-PLAN.md), [composed laws](chemistry/composed-runtime.md) | [Decision](decisions-and-evidence.md#class-specific-material-coupling) |
| Execution modes: browser 1/4 threads, native server World, public spectator route | Implemented September 21–23; private deploy `d74f1ae`, volume checkpoints and `server.biotropy.ahara.io` (`/stream`, `/health` only) at `fe0499c` | [Execution modes](../execution-modes.md), [plan](../plans/archive/EXECUTION-MODES-PLAN.md) | [Decision](decisions-and-evidence.md#browser-and-native-server-execution) |
| Model simplification: birth-fixed capabilities, single-composition reservoirs, one-range binding | Implemented September 22, `1cc05e2`/`b224525`; binding change is v39 | [Plan](../plans/archive/MODEL-SIMPLIFICATION-PLAN.md) | [Decision](decisions-and-evidence.md#model-simplification) |
| Regional structural execution and multicore runtime | Implemented September 21–22; persistent 8×8 regions, Rayon pool on shared WASM memory, serial fallback | [Regional execution](spatial-execution.md), [scaling record](../plans/archive/SCALING-PLAN.md) | [Decision](decisions-and-evidence.md#regional-execution-and-multicore-resumption) |
| Material-supported habitats | Implemented v32, September 20; broad opposing field removed v39, coupling changed v41 | [Material habitats](../material-habitats.md), [plan](../plans/archive/MATERIAL-HABITATS-PLAN.md) | [Decision](decisions-and-evidence.md#environmental-operators-and-habitat-formation) |
| Resource binding through shared attraction | Implemented v28, September 19; modified v32, v39 and v41 | [Proposal](resource-binding-proposal.md), [investigation](resource-binding-investigation.md) | [Decision](decisions-and-evidence.md#environmental-operators-and-habitat-formation) |
| Cellular organization and exchange | Partly current: v33 (September 20, `fad7fa9`) retained mixture, activity regulation, variable enzyme programs and shared interfaces remain; its construction/retirement sections were superseded by v43 | [Joint design](cellular-organization-and-exchange.md), [results](../cellular-organization-results.md) | [Decision](decisions-and-evidence.md#cellular-organization-and-shared-interfaces) |
| Paid photoreception | Implemented v31; expressed as a genetic capacity since v43 | [Photoreception](../photoreception.md) | [Decision](decisions-and-evidence.md#illumination-and-observation) |
| Scalar illumination field | Implemented v34, replacing per-component illumination; v30 composed periods retained | [Light ecology](light-ecology.md) | [Decision](decisions-and-evidence.md#illumination-and-observation) |
| Exact finite chemical actions and regenerative external work | Implemented v23–v27 | [Transformation algebra](chemistry/transformation-algebra.md), [regenerative ecosystem](chemistry/regenerative-ecosystem.md) | [Decision](decisions-and-evidence.md#computable-chemistry-and-mathematical-structure) |
| General-purpose digital chemistry runtime | Implemented September 15 (numerical restart), replacing the pre-chemistry economy | [Digital chemistry](chemistry/README.md) | [Chemistry decisions](chemistry/decisions.md) |
| September 30 delivery policy | Current September 30: plans contain implementation and deployment only; verification and human-acceptance gates are retired, not passed | [Plan index](../plans/README.md#delivery-policy) | [Decision](decisions-and-evidence.md#delivery-gates-retired) |

## Implemented then superseded

| Direction | Status | Owning document | Decision/evidence |
| --- | --- | --- | --- |
| Machinery construction, retirement and refitting | Implemented v33; refitting removed September 22 (M0), construction/retirement removed v43 | [Joint design](cellular-organization-and-exchange.md) (historical sections) | [Decision](decisions-and-evidence.md#genetic-physiology-replaces-machinery-development) |
| Living-cell gene transfer | Implemented in the pre-chemistry world and chemistry runtime; removed September 22 by M0 (`1cc05e2`); the engine rejects a nonzero setting | [Model simplification](../plans/archive/MODEL-SIMPLIFICATION-PLAN.md), [transfer study](../transfer-study.md) | [Decision](decisions-and-evidence.md#living-cell-gene-transfer-removed) |
| Dual-mixture reservoirs with lifetime expiry | Superseded September 22 by M1 single-composition reservoirs | [Model simplification](../plans/archive/MODEL-SIMPLIFICATION-PLAN.md) | [Decision](decisions-and-evidence.md#model-simplification) |
| Broad opposing attraction field, gain and cohesion washout discount | Implemented v32; removed v39 | [Material habitats](../material-habitats.md) | [Decision](decisions-and-evidence.md#environmental-operators-and-habitat-formation) |
| Single-threaded mature-world execution at 120 ticks/s | Abandoned September 21 with the target unmet | [Archived plan](../plans/archive/MATURE-PERFORMANCE-PLAN.md) | [Evidence](decisions-and-evidence.md#mature-world-performance-investigation) |
| Mobile-source rules | First implementation superseded September 17 by shared environmental operators | [Archived plan](../plans/archive/MOBILE-SOURCES-PLAN.md) | [Decision](decisions-and-evidence.md#environmental-operators-and-habitat-formation) |
| Additive fast illumination sweep | v29 superseded by v30 composed periods | [v30 evidence](../evidence/digital-chemistry/illumination-v30/README.md) | [Decision](decisions-and-evidence.md#illumination-and-observation) |
| Cell interaction research | Historical September 19; recommendations superseded by the v33 joint design | [Research](cell-interaction-research.md) | [Joint design](cellular-organization-and-exchange.md) |
| Intracellular organization rationale | Historical September 20 rationale, developed into v33 | [Rationale](intracellular-organization.md) | [Decision](decisions-and-evidence.md#cellular-organization-and-shared-interfaces) |
| Sparse spatial ecology | Pre-chemistry A/B world, September 13; superseded by digital chemistry September 15 | [Spatial ecology](spatial-ecology.md) | [Plan closeout](plan-closeout.md) |
| Ant colony simulation | Superseded September 9–13; recoverable at tag `ant-colony-checkpoint-2026-09-09` | [Certifications](../certifications.md) | [Plan closeout](plan-closeout.md) |

## Deferred or unselected proposals

| Direction | Status | Owning document | Decision/evidence |
| --- | --- | --- | --- |
| Directional cell utterances | Deferred proposal, September 24 | [Specification](cell-utterances.md) | [Backlog](../backlog.md#backlog-cell-utterances) |
| Strategic controller | Deferred proposal, September 30; expected after utterances | [Specification](strategic-controller.md) | [Backlog](../backlog.md#backlog-strategic-controller) |
| Rugged chemical interaction | Deferred proposal, September 30; complementarity binding is the leading candidate | [Specification](rugged-interaction.md), [research paper](kauffman-landscapes-research.md) | [Backlog](../backlog.md#backlog-rugged-interaction) |
| Dynamic terrain: gradual change, tectonics and local events | Open design direction, September 30; separately specified, not implemented | [Dynamic terrain](dynamic-terrain.md) | [Backlog](../backlog.md#backlog-dynamic-terrain) |
| Live physical terrain switches | Unselected; distinct from automatic terrain evolution | [Configuration boundary](dynamic-terrain.md#live-physical-switches) | [Backlog](../backlog.md#backlog-dynamic-terrain) |
| Rotational or directional climate | Unselected; the September 18 directional-exposure stage was never selected | [Spatial isolation review](spatial-isolation-review.md) | [Backlog](../backlog.md#backlog-conditional-extensions) |
| Bonded cell attachment beyond v41 contact adhesion | Unselected | [Backlog](../backlog.md#backlog-conditional-extensions) | [Decision](decisions-and-evidence.md#contact-adhesion-and-bonded-attachment) |
| Multiple-substrate reactions and unrestricted genome/neural topology | Unselected | [Backlog](../backlog.md#backlog-conditional-extensions) | — |
| Dormancy and additional life stages | Unselected | [Backlog](../backlog.md#backlog-conditional-extensions) | — |
| Outcrossing, seed/fertilize and multi-parent ancestry | Unselected | [Backlog](../backlog.md#backlog-conditional-extensions) | [Plan closeout](plan-closeout.md) |
| Environmental developmental reaction norms | Unselected | [Backlog](../backlog.md#backlog-conditional-extensions) | — |
| Future performance work | Unselected; follows the structural-first rule | [Backlog](../backlog.md#backlog-multicore-scaling) | [Scaling record](../plans/archive/SCALING-PLAN.md) |

## Rejected

| Direction | Status | Owning document | Decision/evidence |
| --- | --- | --- | --- |
| Finite, depleting sun and lateral-sun screening | Rejected September 25 by the overhead, non-depleting sun decision | [Light ecology](light-ecology.md) (sections 3–6) | [Decision](decisions-and-evidence.md#light-ecology-selection) |
| Three-cosine terrain generator | Rejected in v42 visual review; replaced by warped value noise, then v46 fractal terrain | [Light ecology](light-ecology.md#selected-extension-physical-owners-and-shared-optical-funding) | [Decision](decisions-and-evidence.md#light-ecology-selection) |
| Sampled contact lattice and angular contact moments | Rejected September 22; replaced by circle overlap | [Scaling record](../plans/archive/SCALING-PLAN.md#september-22-correction-simple-circular-contacts) | [Decision](decisions-and-evidence.md#regional-execution-and-multicore-resumption) |
| Internal cell compartments | Rejected September 20 before implementation | [Joint design](cellular-organization-and-exchange.md) | [Decision](decisions-and-evidence.md#cellular-organization-and-shared-interfaces) |
| Capability construction and ownership charges as physical tradeoffs | Rejected September 28 | [Genetic physiology plan](../plans/archive/GENETIC-PHYSIOLOGY-PLAN.md) | [Decision](decisions-and-evidence.md#genetic-physiology-replaces-machinery-development) |
| Parental capability buffers for mutants | Rejected September 22 | [Model simplification](../plans/archive/MODEL-SIMPLIFICATION-PLAN.md#evidence-and-reuse) | [Decision](decisions-and-evidence.md#model-simplification) |
| Fixed geographic basins and reservoir anchoring | Rejected September 19 | [Spatial isolation review](spatial-isolation-review.md) | [Resource binding](resource-binding-investigation.md) |
| Prescribed environmental wells (E1) | Rejected September 19 | [Environmental plan](../plans/archive/ENVIRONMENTAL-ECOLOGY-PLAN.md) | [Decision](decisions-and-evidence.md#environmental-operators-and-habitat-formation) |
| Bespoke reservoir motion/conversion rules | Rejected September 17 | [Mobile sources plan](../plans/archive/MOBILE-SOURCES-PLAN.md) | [Decision](decisions-and-evidence.md#environmental-operators-and-habitat-formation) |
| Retuning χ alone, reservoir anchors, orbital/inertial motion | Rejected September 23 | [Material coupling plan](../plans/archive/MATERIAL-COUPLING-PLAN.md) | [Decision](decisions-and-evidence.md#class-specific-material-coupling) |
| Receiver certificates, affine inventory trajectories, per-cell reaction catalogs | Rejected September 21 | [Mature performance plan](../plans/archive/MATURE-PERFORMANCE-PLAN.md) | [Evidence](decisions-and-evidence.md#mature-world-performance-investigation) |
| Cross-context run transfer and live executor replacement | Rejected September 21; server save infrastructure was also rejected then, and volume checkpoints were requested separately September 23 | [Execution modes plan](../plans/archive/EXECUTION-MODES-PLAN.md#scope-correction) | [Decision](decisions-and-evidence.md#browser-and-native-server-execution) |
| Sparse-controller optimization | Rejected September 20 after worsening cost | [Cellular results](../cellular-organization-results.md) | [Decision](decisions-and-evidence.md#cellular-organization-and-shared-interfaces) |
