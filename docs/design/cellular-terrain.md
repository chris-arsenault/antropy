# Cellular terrain and frozen-controller map transfer

The subsequent [modular runtime refactor](modular-runtime.md) makes these mechanisms independently
configurable and advances checkpoints to version 8. This document preserves the original bundled
terrain implementation and its confounded transfer panel.

The later [colony-knowledge implementation](colony-knowledge.md) changes browser startup to
programmed ants on compact terrain, with checkpoint v10. RNN and tiered-map startup statements
below describe the earlier review. The [scale milestone](colony-scale.md) owns upcoming support,
storage and capacity work; the existing terrain mechanisms remain selectable.

The September 7 user decision replaces runtime height-map authority before adding digging.
The browser opens the frozen task-register RNN on a compact, tiered world at tick zero. Terrain
selection changes the environment; it does not train or modify the ants.

## Spatial contract

One X/Y lattice stores a foreground material and an exposed backing material per cell. Backing
is the cut face an ant can grip inside a chamber, not another traversable plane or a Z coordinate.
Foreground solids obstruct bodies, light, antenna reach and airborne transport. Exposed air is
walkable if it has a backing face or a solid surface within two cells in a body direction. This
supports connected ledges, undersides, trunks and branches without hidden lanes or tier switches.

The generator may use a height profile to fill its initial ground. The profile is discarded.
Runtime movement, light, resource access, transport and checkpoints never query a ground-height
array. `surfaceBase` remains only a generation datum in configuration.

Materials include air, soil, rock, clay, loose soil and wood, plus the existing diagnostic cache
and food markers. Material metadata records provisional relative excavation work; no digging
action, excavation charge, spoil, collapse or gravity resolver is active. Foreground and backing
can change independently through the grid mutation boundary. Excavating a foreground soil cell
can leave the exposed soil face behind. Every material edit advances a revision and invalidates
derived support and lighting queries.

Food remains a finite quantity in a cell, separate from its material. Food inside solid ground
stays in the energy ledger and checkpoint but cannot be sensed, harvested, eaten or emit odor
until exposed. Buried renewable cells do not grow. The comparison generates no additional buried
food: adding it now would change the energy supply. This representation supports later pockets
without making a soil material double as a food quantity.

## Transport and initialization

Food odor, queen odor and the entrance air carrier diffuse through adjacent air cells, including
air unsupported for walking. Pheromone A and B remain surface-bound marks and diffuse only among
supported cells. Foreground material blocks both. A newly filled cell loses its obsolete field
sample on the next transport step. Light is evaluated by vertical foreground occlusion.

The authored nest still starts with impregnated surfaces. Initialization relaxes the queen and
entrance carriers across locally supported cells, then ordinary air transport can spread volatile
carriers away from those surfaces. This is finite iterative fixture preparation, not a distance
transform. The initial entrance-air field copies the prepared entrance mark as before. Source
strengths and relaxation counts remain fixed. Cached preparation now includes actual foreground
and backing geometry and source coordinates, with at most four cached layouts.

These transport and support changes can affect even the reference geometry. The historical RNN
six-world result used the former transport boundary and does not certify this substrate.

## Layouts

| Layout | Dimensions | Nest | Exterior |
| --- | --- | --- | --- |
| Reference | 2,048 × 128 | Eight original rooms and 31 passages | Original rolling profile |
| Compact | 2,048 × 512 | Six rooms and 13 passages | Original rolling profile translated upward |
| Tiered woodland | 2,048 × 512 | Same compact graph | Seeded hills, connected wood ramps and branches |

The compact chamber envelope is approximately 83 × 43 cells, with its entrance about 53 cells
above the bottom of the queen chamber. Most rooms are 11–13 cells wide and five high; the queen
room is seven high. Three-cell carved passages preserve passing space. Two descending branches,
cross-connections and two queen approaches retain route choices.

Deep maps have clay and loose-soil pockets beneath the surface. Elevated wood routes connect
back to ground and have upper branches. There is substantial unused soil for eventual digging.
Terrain generation uses a separate deterministic random stream, leaving food-column sampling and
individual controller randomness unchanged. The same 96 sources, quantities, capacities, regrowth
and energy costs apply. Some sources occupy elevated supported cells instead of the ground.

The primary route remains an initialization aid for founder placement and initial heading. It
never enters an RNN observation or controls an action. No runtime planner or programmed fallback
was added to the frozen actor.

## Camera and persistence

The canvas fills available space using an independent two-axis camera. Dragging pans, the wheel
zooms around the pointer, horizontal trackpad gestures pan, and arrow keys scroll a focused map.
Home includes the colony and nearby surface; Fit colony and Fit world provide narrower and wider
views. The minimap recenters the camera. Resizing and camera movement redraw while paused without
advancing the simulation. A collapsible dock retains inspection, measurements and field controls
in separate tabs. Static terrain rasterization is cached by grid revision.

Checkpoint version 7 stores actual foreground cells, backing cells, terrain revision, nest and
cache geometry, food quantities, fields and all private ant memory. Restoration explicitly clears
derived terrain queries. Old world checkpoints are rejected; model artifact version 5 remains
unchanged. A modified world restores its saved geometry rather than depending on the current
generator to reconstruct that geometry.

## Measurement protocol

Keep the exact bundled `review-colony.json` weights and sampling temperature fixed. Compare seed
101 for reference, compact and tiered layouts, with matched programmed controls, for 48,000 ticks.
Use the existing queen feeding, larval feeding, founder turnover, funded replacement and energy
conservation gate. Record failures without tuning the controller or changing food productivity.
One seed per condition is a diagnostic sample, not a general reliability estimate.

Results are stored in `frontend/harness/artifacts/terrain-2026-09-07/` and the harness ledger.
Human review remains the gate for trajectory quality, congestion and the new presentation.

## Results and handoff

All six seed-101 conditions completed 48,000 ticks with identical frozen model weights and one
captured physics digest. No task overrides or programmed preparation were used for the RNN.

| Layout | Frozen RNN | Programmed control | Ledger: RNN / programmed |
| --- | --- | --- | --- |
| Reference | Extinct; no adult births | Queen alive, 3 workers, 34 births; full gate fails | 2639 / 2638 |
| Compact | Extinct; no adult births | Full gate passes; 20 workers, 48 births | 2642 / 2643 |
| Tiered woodland | Extinct; no adult births | Extinct after 11 adult births | 2640 / 2641 |

The programmed reference has no new births between ticks 32,000 and 40,000 and recovers later;
that gap remains a failure under the unchanged gate. Peak absolute energy residual across all
samples is 1.21e-8, below the 1e-6 tolerance.

The frozen RNN transfers poorly to the new physical boundary even with the original geometry.
These runs do not isolate local support from airborne transport as the cause. The compact map
does support a sustained physical colony with the programmed policy. The tiered map adds a
challenge neither controller survives on this seed. No controller, food budget or gate was tuned
to remove those failures.

The browser stays on the frozen RNN and tiered map, paused at tick zero, for the requested review.
Use the Terrain selector to compare layouts, and Creature to select the programmed control.
The implementation passes `make ci` with 82 bounded tests, plus the production build. One existing
optional-property lint warning and the bundled-model chunk-size advisory remain. A generated cell
map crop was inspected; full browser interaction and trajectory quality still need human review.
