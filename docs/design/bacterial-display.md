# Display and observation

Run and stats are the primary review path. The browser starts the current ecology paused at tick
zero; it does not automatically import an older checkpoint. Intended visible mechanisms must be
default, or explicitly disabled with a reason.

<a id="display-world-and-camera"></a>

## World and camera

Canvas renders one clipped periodic world, not a tiled grid of complete copies. Body/deposit
fragments at seams appear at the corresponding opposite edge. Panning stays bounded; Fit world
is minimum zoom and maximum zoom is 12×. Wheel zoom anchors the pointer subject to boundary clamping.
CSS-pixel transforms keep rendering/picking consistent on high-DPI screens. Outside margins do not
select wrapped bodies. Camera actions never alter simulation state or randomness.

<a id="display-visual-meanings"></a>

## Visual meanings

| Cue | Meaning |
| --- | --- |
| Green / blue fields | Dissolved food A / B |
| Deposit circles | Active finite inventories, with actual radius and dominant food color |
| Red field | Toxin injury relative to maximum reference-body repair, not receptor sensitivity |
| Ochre deposits | Porous matrix that slows movement/transport and binds toxin |
| Magenta, optional and initially off | Neutral signal; secretion disabled by default |
| Colored body rim | Recent four-generation ancestry family by default; selectable founder, relatedness, genetic-distance or inherited-trait view |
| Inner filled area | Usable-energy fraction; low energy is amber |
| Red interior | Functional damage above 20% |
| White tip | Heading |
| Pale expanding ring | Recently observed newborn |
| Brief cross | Observed death at last rendered position |

Lifecycle markers last fifteen model seconds and may miss events between rendered frames.
They are view-local hints, not a complete replay. Solid walls are disabled in the default; ochre
does not claim impermeable geometry.

<a id="display-stats-and-history"></a>

## Stats and history

Living population, divisions, deaths and affected-cell percentages lead observation. Matrix coverage
uses world area; damage/slowing use living population. Lifetime secretion and construction ratios use
absorbed material, and energy costs use dissipated energy. Accounting errors use total input and should
remain near zero. Raw ledgers remain in the accounting details. Stats distinguish
matrix slowing, damage, repair expenditure, field material, acquisition and conservation.
The default food schedule starts A-rich and alternates every 50,000 ticks. Stats show the current
new-deposit mixture and next change; existing food retains its composition. A-processing allocation
is the initial trait trend when epochs are enabled. At 30 ticks/s, a phase takes about 28 minutes.
The environment settings retain a Food epochs checkbox; unscheduled saves remain unscheduled.
Genetic construction targets are separate from actual grown bodies. Exact sequence diversity is
separate from genotype record count. Founder shares and histories describe ancestry abundance,
not fitness or behavioral classes.

Recent families and inherited trait distributions lead the default stats. Family roots are stable
organism IDs at generations 0, 4, 8 and onward. Older branches can continue through younger ones;
the chart retains recently dominant groups and distinguishes continuation from no living descendants.
Clicking a family root selects it for comparison even after division/death. Physical genetic distance,
controller distance and genealogical links are independent quantities. Founder reporting remains in
details. See the [observation contract](population-observation.md) for exact grouping and denominators.

Population history retains up to 240 samples spanning the opened view's lifetime, with actual tick
spacing and bounded thinning. It cannot reconstruct earlier unseen history and is not checkpointed.
Capture occurs every 100 simulation ticks, independent of wall-clock speed. A separate unthinned
2,000-tick window supplies recent family history and effort distributions. Effort bars use shares of
sampled organism decisions, not energy costs. Trait trends show inherited population medians.
Task byte, hidden state, genes, actual stocks and sensor/action values remain inspectable. Manual
task overrides persist as diagnostic interventions. All existing controls remain available.

The default pacing target is 30 ticks/s. Display refresh and simulation rate are separate; measured
throughput can fall below the request. Maximum means CPU-limited execution, not model-time seconds.
The [evidence](bacteria-results.md) lists sampled onset times without promising browser throughput.

<a id="display-implementation-boundary"></a>

## Implementation boundary

The view owns one resize observer, reusable field raster, transient lifecycle snapshots and camera
state. Field ticks, layer changes and replaced worlds invalidate the raster; camera-only redraws
reuse it. Rendering does not score evolution, mutate genomes or prescribe actions.

Bounded tests cover transforms, picking, raster reuse, toxin intensity and Run defaults.
Inspect configuration and headless evidence for what is running; no browser assay or development
server is needed for a documentation or display review.
