# Environment and nest morphogenesis

This document owns terrain, resources, fields, local action resolution, configuration gates,
liabilities, authored nest geometry, and the later return of evolved construction. The world may
create pressures and emit physical facts; it may not select an ant's answer.

<a id="environment-world"></a>

## World substrate

The simulation uses one finite 3D voxel world shared by all colonies. An ant occupies an air voxel
and moves across adjacent air that touches solid material; falling handles loss of contact. This
lattice model permits tunnels, ceilings, ramps, and overhangs without continuous rigid-body
physics.

Materials include air, food, loose fill, cheap topsoil, harder clay, and undiggable rock, with
water and further soils reserved for later ecology. Digging converts matter rather than deleting
it: excavated material becomes carried spoil and is deposited as loose fill. Soil layers, slope,
depth, and hardness make location part of the energy economy.

Scent fields diffuse through connected air, decay, wash out, and may carry colony ownership.
Tunnel topology therefore shapes communication. The two pheromone channels remain unlabeled; the
controller supplies their meaning.

<a id="environment-authored-nest"></a>

## Authored-nest control world

The current control arm is an authored organic 3D nest below varied terrain. It has no uninterrupted
central vertical shaft. Its connected network includes horizontal, vertical, and sloped passages,
branches, joins, cycles, chambers of varied dimensions, and one intended surface entrance. Colony
placement does not carve additional terrain.

The supplied [nest illustration](../sources/paste-2026-09-03_17-00-44-361Z.png) is a qualitative
reference for organic organization, not a template. The authored geometry exists to remove
construction as a confounder and later provide a ledger control against structures ants dig.

<a id="environment-carriers"></a>

## Navigation and material carriers

The authored nest contains a deep-source nest field whose values propagate through the passage
network. Local gradient following is potential-field navigation computed by world physics rather
than graph search installed in an ant. Nest fabric also absorbs and re-emits colony odor; abandoned
material can fade. Handling transfers colony odor to food, allowing cached and wild food to differ
chemically without a storage label.

These carriers replaced controller-side entrance timers, roominess tests, deposit latches, and
cached-versus-wild bookkeeping. Their fallibility is load-bearing: fields can saturate, decay,
wash out, lead through an unintended breach, or mark an abandoned nest.

Pathfinding algorithms have three instrumentation uses only: verify field connectivity, establish
an omniscient viability ceiling, and measure realized route efficiency against a shortest path.
They do not steer a sensor-limited oracle or controller.

<a id="environment-config"></a>

## Configuration and action physics

Every world owns an independent configuration copy, and checkpoints preserve it. A gate enables or
disables a mechanism; it never disguises a numeric magnitude. Terrain digging, mortality, worker
reproduction, brood transport, microclimate, egg exposure, larval rearing, genetic variation,
colony founding, weather, seasons, decay, spoil hauling, and automatic continuation remain
independently isolatable. Cargo-capacity overrides use `null` for genome-derived production values
and explicit per-world values only for logged experiments.

The current action resolver uses discrete vertical bands. The sensory interface exposes all bands
in parallel rather than coupling perception to the selected action band. Yaw selects horizontal
direction. The shared mandible intent digs solid, picks up contacted cargo, or deposits a carried
item into air according to local preconditions. The world never chooses the best dig face, cache,
brood destination, or path for the ant.

<a id="environment-liabilities"></a>

## Resources and liabilities

The food governor sets carrying capacity. Its high-population side limits abundance; its required
low-population side lets unconsumed food accumulate as capped, rotting standing crop. Food density,
food value, tank size, metabolic costs, speed, and scent reach are calibrated together through
trip-profitability, satiation, scent-horizon, foraging-radius, trail-persistence, dig-economics,
and ecosystem-closure ratios.

Existing liabilities include depth-dependent microclimate, climate-keyed brood exposure, storms
that wash exposed food and pheromone, seasonal food variation, and traffic-keyed nest decay. They
are delivered world mechanisms but stay disabled in the current fixed-genome control until their
individual admission step.

Liabilities charge for the absence of behavior. Surface life must remain survivable but inferior;
otherwise founding cannot occur. Shelter benefit must begin with the first useful excavation and
saturate with depth while material cost rises. Storage earns value by retaining food through
scarcity or weather. Brood placement earns value by increasing survival. Future threat attraction
must follow visible activity—traffic, foraging flux, trails, and spoil—not colony existence, so a
collapsed quiet colony receives ecological relief without a distress flag.

<a id="environment-morphogenesis"></a>

## Morphogenesis model

Construction is local behavior coupled to world feedback. The available biological carriers are
recruitment marks at work sites, crowding-dependent lateral work, conserved spoil placement,
transported brood and food, and local thermal templates. Founding may pre-mark its dig site because
founding already authors the initial chamber. Humidity and carbon-dioxide gradients are plausible
future carriers, but neither is authorized without a structural finding from the simpler system.

The delivered construction seed demonstrates marked-site descent, load-dependent ascent and
off-trail dumping, reinforcement and taxis, crowding-driven lateral work, casting after signal
loss, and local cargo transport. The morphology emerges from interaction: no blueprint, named
chamber action, or world-selected face exists.

The shared descriptive classifier partitions air into corridor voxels and connected wider voids.
A chamber is an interior void containing a 2×2×2 air block with at most two corridor doorways; a
nonmatching void is a bulge; a branch point has at least three six-neighbor air connections. These
terms support distributions of volume, depth, doors, branches, and network efficiency. They never
gate evolution.

Morphology must earn a colony ledger. Candidate benefits are brood protection, cache retention,
thermal shelter, and congestion relief. Decorative complexity with no correlation to survival,
brood, energy, or persistence is not pursued.

<a id="environment-order"></a>

## Linear implementation order

| ID | Status | Work and finish |
| --- | --- | --- |
| ENV-01 | Delivered | Shared 3D voxel world, layered diggable materials, lattice locomotion, conserved spoil, sparse scent fields, food, and deterministic world updates. |
| ENV-02 | Delivered | Per-world feature gates, checkpointed configuration, independent lifecycle/construction switches, and genome-derived cargo-capacity defaults. |
| ENV-03 | Delivered | Authored organic nest with one entrance, no hidden carve or uninterrupted central shaft, and a connected mix of slopes, verticals, horizontals, branches, joins, cycles, and chambers. |
| ENV-04 | Delivered | Shared threshold-band action resolution, parallel vertical sensing, failed-dig cost, load-bearing excavation drop, and common cargo deposit semantics. |
| ENV-05 | Delivered | Deep nest field, absorbed colony odor, contact-transferred food marking, parallel vertical samples, and phasic carrier readings support the current zero-state food loop. |
| ENV-06 | Backlog | Implement capped standing-crop accumulation and rot as the low-population side of the food governor; attribute its resilience contribution before ordinary survival certification. |
| ENV-07 | Backlog | Admit existing microclimate, exposure, weather, seasons, and decay one at a time only when their owning colony or construction step is ready; remeasure the ledger cost after every admission. |
| ENV-08 | Backlog | After fixed-genome colony continuity and then genetic variation/founding, re-enable excavation as optional expansion from the authored nest. Compare dug and authored worlds on colony ledgers. |
| ENV-09 | Backlog | Revalidate construction through readable local policies and controllers: founding mark, dig/haul/cast/crowd behavior, cargo placement, and matter conservation. Shapes remain observations. |
| ENV-10 | Backlog | Test the smallest morphogenesis rule sets against functional ledgers and attach morphology distributions. Add a thermal stop template only if existing carriers warrant it. |
| ENV-11 | Backlog | Admit traffic-keyed nest decay alone. First measure maintenance-as-use: occupied structure persists while an abandoned control collapses. Add repair behavior only if colony ledgers require it. |
| ENV-12 | Backlog | Add threat activity and inter-colony liabilities after multiple sustainable colonies exist. Threat pressure scales with conspicuous activity and relaxes when colonies go quiet. |
| ENV-13 | Backlog | Add water, further soil heterogeneity, rain-accelerated decay, humidity, or carbon-dioxide carriers one mechanism at a time when a measured evolutionary question requires them. |
| ENV-14 | Backlog | Profile world subsystems at target scale; adopt lazy scent decay, event-scheduled tunnel decay, structure-of-arrays ant storage, WASM, or GPU acceleration only in measured bottleneck order. |

<a id="environment-obe"></a>

## OBE and rejected directions

| Direction | Status and reason |
| --- | --- |
| Reproducing the supplied nest picture or requiring named chambers | **Rejected.** The image and classifier provide vocabulary. Functional ledgers decide. |
| Fixed-shape digging tests in ordinary Vitest | **OBE.** They were slow, fixture-specific outcome simulations. Bounded mechanics remain tests; behavioral morphology belongs in the harness. |
| The Phase 2 straight-shaft ladder as current work | **OBE.** Its mechanics and findings are preserved, but the colony organism must live before construction returns. |
| Vanishing spoil in production | **Rejected.** It removes logistics and anthill formation. A hauling-off fixture may isolate navigation but cannot certify construction. |
| World-selected dig face, cargo destination, or route | **Rejected.** An actuator applies local intent; it does not decide for the ant. |
| Strict monotone-gradient shape as a colony gate | **OBE.** The repaired entrance contains a local field maximum while functional policies still complete the loop. Field analysis remains diagnostic. |
| Single-band scan-and-remember sensing or a mandatory continuous-preference migration | **OBE.** Parallel band sensing removed the measured information bottleneck. Continuous resolution reopens only on a quantified band-geometry finding. |
| Humidity or carbon-dioxide fields added preemptively | **Deferred and unauthorized.** They are valid biological candidates, not current requirements. |
| Lethal surface life or completed-nest payoff cliffs | **Rejected.** Founders need a survivable inferior path, and every partial useful excavation must have positive marginal value. |

<a id="environment-sources"></a>

## Source provenance

Primary source sections: [design specification §§5–6 and §§9–13](../sources/design-spec.md),
[Appendix A §A.10](../sources/ant-sim-appendix-a.md),
[Appendix B §§B.3 and B.7–B.9](../sources/ant-sim-appendix-b.md),
[Appendix C §§C.2–C.4](../sources/ant-sim-appendix-c.md),
[Appendix D](../sources/ant-sim-appendix-d.md),
[Appendix E and its authored-nest inversion](../sources/ant-sim-appendix-e.md),
[Appendix E2](../sources/ant-sim-appendix-e2.md),
[Appendix F §§F.2–F.4](../sources/ant-sim-appendix-f.md), and
[Appendix G §G.2](../sources/ant-sim-appendix-g.md).
