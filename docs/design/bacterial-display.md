# Display and observation

Run and stats are the user's observation path for the intended days/weeks population. The browser
starts the current ecology paused at tick zero; it does not automatically import a checkpoint.
Digital chemistry supplies ordinary local sensing, transport, reactions and stress. Constructed
opportunity evidence does not certify an evolved community. Human motion review of this chemical
replacement remains separate from acceptance of the previous spatial world.

<a id="display-world-and-camera"></a>

## World and camera

The viewport fills the screen. A compact dock opens observation and control windows rather than
reserving a permanent sidebar. Cell colors default to usable energy and the map to energy per
material. Illumination, impedance bands, stress dots, sources and regions have independent controls.
[Phenotypes and measured chemical flow](../phenotype-observation.md) distinguish recent activity
from possible enzyme routes; their windows do not change camera or background selections.

Worker WebGL2 renders one clipped periodic world, not a tiled grid of complete copies. Body/deposit
fragments at seams appear at the corresponding opposite edge. Panning stays bounded; Fit world
is minimum zoom and maximum zoom is 12×. Wheel zoom anchors the pointer subject to boundary clamping.
CSS-pixel transforms keep rendering/picking consistent on high-DPI screens. Outside margins do not
select wrapped bodies. Camera actions never alter simulation state or randomness.

<a id="display-visual-meanings"></a>

## Visual meanings

| Cue | Meaning |
| --- | --- |
| Dissolved amount | Total extracellular material concentration; fixed exponential brightness with explicit sensitivity |
| Energy per material | Concentration-weighted mean chemical potential, blue to amber on the fixed 0.5–8 energy/material scale; brightness masks empty or trace-only regions |
| Movement resistance | Amber diagonal bands for mobility lost to chemical impedance, `1 - 1/(1 + movementImpedance × load)`; viscosity remains separate |
| Stress exposure | Rose dots for abiotic reference saturation, `stress/(stressK + stress)`; actual injury also depends on membrane compatibility and paid repair |
| Selected chemical layer | Concentration of one explicit chemical ID |
| Chemical weathering | Blue-to-amber local interaction activity, attenuated by impedance; actual conversion also depends on the chemical present |
| Source marks | Persistent source-size marks: bright ring and center cross while releasing, dim dashed ring while dormant; one Gaussian width, not a resource boundary |
| Soft population region | Nearby actual cells, each contributing its own color; a viewing aggregate with no biological authority |
| Small isolated mark | An actual ungrouped cell, kept visible at world scale |
| Colored body rim / population color | Usable-energy fraction by default; selectable enzyme input/output, membrane, ancestry, distance or other trait view |
| Day/night context | Cool darkness composited over chemistry, cells and sources, with warm daylight; a physical illumination reading, not an extra food or energy layer |
| Body brightness | Usable-energy fraction; damage also darkens the body |
| Darkened interior | Increasing functional damage |
| White tip | Heading |
| White body rim | Selected cell or newborn within 50 ticks |
| Brief cross | Observed death at last rendered position |

Regions fade as screen scale approaches six pixels per world unit. Cells retain a minimum
1.2-pixel radius; closer views resolve actual body geometry. Population selection and zoom-to-population are independent of color and
physical field controls. Groups use physical distance, independent of camera zoom.

Death markers at close zoom last 50 ticks (ten model seconds) and depend on retained events.
They are view-local hints, not a complete replay. Impedance is a continuous physical load and does
not represent a solid wall.
Source release is a normalized Gaussian truncated at three source radii; its ring marks one
radius. Diffusion then carries dissolved chemicals beyond that release stencil.

Choose one background field: dissolved amount, energy per material, selected chemical,
chemical weathering, or none.
Movement resistance and stress remain independently selectable. Different pattern shapes
keep simultaneous hazards identifiable without adding every field into one color wash.
Sensitivity changes concentration brightness, not potential hue, weathering or hazard scales.
At sensitivity `e`, brightness is `1 - exp(-e × concentration)`; the legend gives the
half-brightness concentration `ln(2)/e`. The default is 4, with 1/16/64 alternatives for
dense/faint/trace chemistry. Scales do not normalize to each frame's maximum, so depletion stays visible.
Hazard response is computed at mesh nodes and interpolated for display; cell physics samples
the actual local loads. The stress layer is a reference exposure, not a predicted death map.

The dissolved-chemistry panel ranks the twelve greatest extracellular amounts, with ID,
share of **all** dissolved matter, amount, and maximum mesh concentration. Remaining IDs
are counted in an explicit other amount. Ties sort by ID. Selecting a row activates that
chemical's concentration map while preserving hazard, cell-color, region and camera settings.
Physical properties are available for each listed ID; a numeric selector and the full
chemical-space atlas retain access to rare or absent IDs. Stored potential does not imply
that any living cell can harvest it. Intracellular inventories and unreleased source reserves
are excluded from this ranking.

<a id="display-chemistry-map-audit"></a>

### Map audit, September 14

| Existing display | Decision and current meaning |
| --- | --- |
| Five additive concentration overlays | Replace the color mixture with one background field and two independent hazard patterns; potential becomes energy per material |
| Selected ID guesswork | Add ranked, directly selectable dissolved chemicals and property tables; retain explicit ID access |
| Sources appearing/disappearing | Keep the site footprint visible and distinguish releasing/dormant state |
| “Inherited chemical strategy” color | Relabel “Transporter / membrane coordinates”: it projects transporter slot 0 X/Y and membrane Y, not a demonstrated strategy |
| Other thirteen cell colors | Retain: ancestry, genotype, energy, task, recent family, membrane coordinates, machinery investment and selected-cell comparisons read current Rust state |
| Soft regions and individual cells | Retain the zoom hierarchy and physical-cell contributions; groups do not become organisms or species |
| Camera, scale, clipping and seam copies | Retain the single periodic XY world and world-unit scale |
| Heading, damage, selection, birth and death marks | Retain and explain their meanings beside the map |
| Spatial history and genealogy | Retain both, including selected-cell inspection and population focus |
| Full chemical atlas | Move the population-level atlas into the chemical panel; retain the selected-cell machinery atlas in the inspector |

This changes observation only. Source scheduling, physical chemistry, locomotion and heredity
are unchanged. Similar field footprints may remain when the actual chemistry co-occurs;
the display must not invent ecological differences to make layers look different.

<a id="display-stats-and-history"></a>

## Stats and history

Living population, divisions, deaths and affected-cell percentages lead observation. Coverage uses
world area; injury and slowing use living population. Typed material and energy transfers retain
explicit denominators and conservation residuals. Imports, exports, transformations, construction,
repair, motor expense, washout and extracellular weathering are separate flows.

The source controls offer local mixtures, alternating compositions or spatial zones for a new
population. Source shares index the world's resolved chemical IDs. Changing composition changes
potential energy supply even when total material is unchanged. The selected trait trend is independent
of field and family controls.
Genetic construction targets are separate from actual grown bodies. Living genotype counts count records; they do not establish distinct behavior or niches. Founder shares and histories describe ancestry abundance,
not fitness or behavioral classes.

Recent families and inherited trait distributions lead the default stats. Family roots are stable
organism IDs at generations 0, 4, 8 and onward. Older branches can continue through younger ones;
the chart retains recently dominant groups and distinguishes continuation from no living descendants.
Clicking a family root selects it for comparison even after division/death. Physical genetic distance,
controller distance and genealogical links are independent quantities. Founder reporting remains in
details. See the [observation contract](population-observation.md) for exact grouping and denominators.

Population history retains up to 240 samples spanning observed history, with actual tick
spacing and bounded thinning. It cannot reconstruct earlier unseen history and is checkpointed.
Capture occurs every 25 simulation ticks, independent of wall-clock speed.
Spatial history samples each 25 ticks, retains up to 240 frames and the latest 2,048 events, and
survives browser checkpoint restore. Browse a past sample to inspect recorded population counts,
trait means and locations; the map continues to show the current world. Effort bars show shares of the most recent census decisions, not energy costs. Trait trends show inherited population medians.
Task byte, hidden state, genes, actual stocks and sensor/action values remain inspectable. Manual
task overrides persist as diagnostic interventions. Background selection, hazard toggles,
cell colors, source/region overlays and inherited settings are independently controlled.

The default pacing target is 30 ticks/s. Display refresh and simulation rate are separate; measured
throughput can fall below the request. Maximum means CPU-limited execution, not model-time seconds.
Maximum-speed simulation yields through one queued worker task; animation requests allow one unanswered presentation at a time; the stats panel and inspector refresh at most every 500 ms
while running, and immediately on pause, stop or a manual intervention.
The [numerical evidence](chemistry/numerical-results.md) records measured throughput and recovery limits.
The cell inspector shows installed machinery, chemical targets, transporter effort, internal and
external mixtures, membrane/stress/impedance loads and actual recent transfers. The U/D/I/S atlas
uses chemical coordinates, independent of world geography; target overlays show the selected cell.
The inspector also shows mixture activity, attenuated activity and fractional attenuation.
These observational values do not enter the RNN directly.

<a id="display-implementation-boundary"></a>

## Implementation boundary

The main view owns one resize observer and camera state. The worker owns WebGL2 and borrows
packed WASM records. An eight-scalar-per-node GPU texture refreshes at most every 200 ms or on field/world
selection changes; layer toggles use uniforms. No full field or per-frame cell array crosses
to React. GPU uploads still transfer bytes. Rendering does not score evolution, mutate genomes or prescribe actions.

`chemicalOverview` reduces the field inside Rust and returns at most twelve rows plus total,
other amount, present count and tick. The worker caches this by observed tick and invalidates it
on world replacement. It runs on the half-second status publication path, not at simulation
or render frequency. Unchanged paused observations omit it from the revisioned packet.
The ordinary 16 KiB reply limit and observation budget apply; no raw field is admitted to
browser diagnostic commands. Hazards, weathering and local illumination reuse the existing packed
texture channels. The worker still renders borrowed WASM views; no full field crosses to React.

The bounded display check is `node harness/numerical/browserChemicals.mjs CHROMIUM EXISTING_SITE NEW_OUTPUT`
from `frontend`. It uses a fresh browser profile, twenty manual ticks, the actual application,
four field screenshots and a narrow viewport check. It checks UI/shader operation only and
does not establish survival, adaptation or long-run performance. It does not start a server.
The September 14 check passed with 48 cells, no page errors and no horizontal overflow at
390 pixels. Local screenshots are in `frontend/harness/artifacts/chemical-display-20260914/`.
Twenty-five WASM reduction calls on the default 320×240 world at tick 20 took a median
8.21 ms and p95 9.70 ms, with a 265-byte three-chemical reply. This measures reduction cost,
not integrated sustained throughput; at two publications per second the measured median
would occupy about 1.6% of one CPU second.

Explicit descriptive partitions remain in the invasion harness; the browser shows trait
distributions without a prescribed number of strategy groups.
Bounded tests cover transforms, picking, raster reuse, chemical layers and Run defaults.
Inspect configuration and headless evidence for what is running; no browser assay or development
server is needed for a documentation or display review.
