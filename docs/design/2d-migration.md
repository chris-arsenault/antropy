# Canonical 2D migration

This document records the September 6 migration and its original forager gate. On September 7 the
user advanced the work to the [programmed physical colony](programmed-colony.md), explicitly
permitting mortality, local feeding and brood while pausing RNN work for visual review. Its original
RNN prerequisite no longer dictates the implementation order. No 3D runtime has returned.

This migration replaces the former three-dimensional ant simulation with one deterministic
two-dimensional vertical cross-section. The tagged commit
`3d-simulation-checkpoint-2026-09-06` is the historical recovery point. There is no runtime mode,
configuration switch, checkpoint adapter, or controller migration between the two substrates.

<a id="migration-purpose"></a>

## Experimental purpose

Antropy exists to explore genetic algorithms in embodied creatures with physically motivated
constraints. It does not need to reproduce real ant anatomy or nest geometry. The useful substrate
retains local sensing, occupied space, collision, support, finite work cost, transported matter,
environmental fields, deterministic inheritance boundaries, the established authored nest,
controller parity, and observation surfaces. Removing one spatial axis does not authorize shrinking
or simplifying unrelated systems.

<a id="migration-world"></a>

## Canonical world contract

- The world is a 2,048 × 128 X/Y cell lattice. Y is height; there is no Z coordinate. Its 262,144
  cells keep the substrate within one order of the retired 2,359,296-cell volume while converting
  eliminated horizontal area into a long 2D foraging range.
- Materials, creatures, food, cache, and scent fields occupy explicit cells. Food and cache
  materials are distinguishable only by immediate physical contact.
- The authored nest ports the prior eight chambers, thirteen junctions, thirty-one branching,
  joining, horizontal, vertical, and sloped passages, and room roles into an explicit 2D layout.
- A creature receives only current local samples relative to its embodied heading.
- Turning, translation, pickup, release, and two pheromone deposits resolve through one shared
  physical action path.
- The programmed policy has no private state, coordinates, route, target identity, or map access.
- A map-aware policy may exist only as a named diagnostic outside the future evolving population.
- Seeded pseudorandomness determines food placement and individual variation; authored geometry is
  deterministic so matched controller arms receive the same world.
- Food odor, nest odor, and pheromones use finite-rate local emission, diffusion, and evaporation.
  No field may be a distance transform or shortest-path potential. The authored nest may begin
  with an impregnated field produced by repeated local relaxation, as it may begin already carved.
- The original 33-value navigation interface remains available to the diagnostic policies. The
  current colony adds local contact and feeding; the 32+32 recurrent artifact remains paused.
- Checkpoints declare `dimension: "2d"`; every earlier checkpoint is rejected.

<a id="migration-milestone"></a>

## Restored milestone

The migration ends after three versions of one immortal worker operate in matched worlds:

1. A map-aware diagnostic reaches randomly distributed external food and returns it using ordinary
   body actions.
2. A stateless programmed worker performs the same loop from local physical sensors.
3. A recurrent controller performs the loop through the identical sensor and action
   contract, with no oracle adapter or programmed-policy fallback.

Every counted return must begin with a distinct external pickup and end with a visible physical
deposit. The harness records completion tick, movement, turns, immediate reversals, route cost,
and failures. The programmed arm retains the existing target of no more than ten percent median
completion-time overhead against the diagnostic arm across a predeclared seeded panel. Human
trajectory review remains required because ledger success can coexist with visibly broken motion.

Run 2492 certifies items 1 and 2 across eight worlds. Item 3 remains failed at 0/8; the migration
therefore remains open even though the RNN implementation and UI arm have been restored.

<a id="migration-verification"></a>

## Verification boundary

Vitest covers bounded mechanics, deterministic chemistry, topology, serialization rejection,
selector wiring, RNN motor arbitration, and policy information boundaries. Multi-trip comparisons
run only through the harness ledger. The panel uses matched seeded-random food layouts; it does not
use a fixed food patch near the nest.

<a id="migration-deleted"></a>

## Deleted surface

The migration deletes all active three-dimensional state and code: Z coordinates, volumetric
grids, spatial chunks, meshes and cameras, Three.js, three-dimensional terrain and adjacency, and
old checkpoint compatibility. It ports rather than deletes the dimension-independent simulation
assets: authored topology, local chemical physics, pheromone outputs, the recurrent-controller
boundary, the right-hand observation surface, measurements, and relevant configuration. Historical
appendix and design sources remain verbatim under `docs/sources/`; they are evidence, not executable
requirements.

The original migration excluded mortality and reproduction. The September 7 user decision
superseded that scope with a complete programmed physical colony. Digging, controller training and
genetic evolution remain deferred. Human review now applies to the full programmed colony.
