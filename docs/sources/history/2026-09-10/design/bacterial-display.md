# Bacterial display

Plan `2e635021-b24d-4730-9a6b-257e26f15c9d` improves presentation after the funded-body milestone.
This changes browser observation only. Physics, controller inputs, startup population, inheritance
and checkpoint v4 are unchanged.

## World and camera

The old renderer drew a 3 × 3 grid of complete worlds and wrapped the camera while dragging.
The new view draws one field raster inside one clipped rectangular world. The surrounding margin
is empty. Panning is bounded; zoom cannot go below Fit world and reaches 12×. Wheel zoom anchors
the world point under the cursor, except where reaching a world boundary requires clamping.
Camera transforms use CSS pixels consistently for rendering and picking, including high-DPI displays.
Resizing constrains the effective camera without rewriting simulation state.

Periodic physics remains: a cell crossing an edge appears at the opposite edge. Only fragments
of bodies and source markers crossing a boundary are drawn at the corresponding opposite edge,
clipped inside the same world. Clicking the outside margin never selects a wrapped cell. Selection
uses the actual visible body radius plus four CSS pixels of tolerance. Existing layer controls,
Fit world, pan and zoom remain available; dedicated zoom buttons supplement the wheel.

## Reading the population

- Colored membranes identify founder lineages. Body footprint follows actual simulated radius.
- Inner filled area indicates usable-energy fraction; below 20% it becomes amber. A white tip
  shows heading. Selection adds a white ring and, when zoomed in, the cell ID.
- Green intensity shows nutrient and magenta shows released chemical, with fixed saturating scales.
  Dashed circles and crosses mark active supply locations, not individual food objects.
- Pale expanding rings mark newborns for fifteen model seconds. Brief orange crosses mark observed
  starvation at the cell's last rendered location. These are view-local hints, not a complete event
  recorder: births/deaths between rendered frames can be missed at high speed. Numeric ledgers
  remain authoritative. Pausing also pauses marker age.
- A world-unit scale bar and faint ten-unit grid make zoom legible without suggesting physical walls.
- Population, division and starvation totals lead the stats panel. An always-visible chart uses
  actual tick spacing, includes the current census and retains up to 240 samples spanning the view's
  lifetime. Older samples are thinned while retaining the first observation and recent detail.
  History starts from the opened world, is not persisted and is not an adaptation score.

Rendering caches the field raster by world identity, tick and layers. Camera-only redraws reuse
the field buffer. Transient lifecycle snapshots are bounded and owned by the renderer; no view
operation consumes simulation randomness or adds events to a living population.

## Verification boundary

Bounded checks cover single-raster rendering, buffer reuse, fit/pan limits, pointer-anchored zoom,
periodic body-fragment selection, outside-margin rejection and the Run-only defaults with a visible
chart. No browser simulation, development server or ecological rerun is needed for this UI change.
Visual judgment remains with the user.

The subsequent [attribution work](evolution-attribution.md) adds founder-share histories, exact
genotype-sequence counts, construction-target distributions and founder-relative differences.
These distinguish hereditary change from physical growth and do not score reproductive fitness.
