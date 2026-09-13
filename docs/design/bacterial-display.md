# Display and observation

Run and stats are the user's observation path for the intended days/weeks population. The browser
starts the current ecology paused at tick zero; it does not automatically import a checkpoint.
Default mechanisms need an ecological purpose and opportunity proof point, not a pre-evolved
outcome. Experimental mechanisms remain disabled until the observation configuration is reviewed.

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
| Soft population region | Nearby actual cells, each contributing its own color; a viewing aggregate with no biological authority |
| Small isolated mark | An actual ungrouped cell, kept visible at world scale |
| Colored body rim / population color | Fixed inherited A-processing allocation by default: blue 0%, orange 100%; selectable family, founder, relatedness, genetic-distance or other trait view |
| Inner filled area | Usable-energy fraction; low energy is amber |
| Red interior | Functional damage above 20% |
| White tip | Heading |
| Pale expanding ring | Recently observed newborn |
| Brief cross | Observed death at last rendered position |

Regions fade as screen scale rises from three to eight pixels per world unit. Below a three-pixel
body radius, cells use a minimum visible mark; closer views resolve actual body geometry. Selected
cells retain detail. Population selection and zoom-to-population are independent of color and
physical field controls. Groups use physical distance, independent of camera zoom.

Lifecycle markers at close zoom last fifteen model seconds and may miss events between rendered frames.
They are view-local hints, not a complete replay. Solid walls are disabled in the default; ochre
does not claim impermeable geometry.

<a id="display-stats-and-history"></a>

## Stats and history

Living population, divisions, deaths and affected-cell percentages lead observation. Matrix coverage
uses world area; damage/slowing use living population. Lifetime secretion and construction ratios use
absorbed material, and energy costs use dissipated energy. Accounting errors use total input and should
remain near zero. Raw ledgers remain in the accounting details. Stats distinguish
matrix slowing, damage, repair expenditure, field material, acquisition and conservation.
The default food layout has uneven finite local A/B mixtures. If zones are selected, stats show
their compositions; existing food retains its composition. A-processing allocation is the initial trait
trend when zones or epochs are enabled; otherwise the independent trend starts with motor investment.
The environment settings offer local mixtures, the
alternating epoch calendar or zones for a new population; saves keep whichever layout they hold.
Genetic construction targets are separate from actual grown bodies. Exact sequence diversity is
separate from genotype record count. Founder shares and histories describe ancestry abundance,
not fitness or behavioral classes.

Recent families and inherited trait distributions lead the default stats. Family roots are stable
organism IDs at generations 0, 4, 8 and onward. Older branches can continue through younger ones;
the chart retains recently dominant groups and distinguishes continuation from no living descendants.
Clicking a family root selects it for comparison even after division/death. Physical genetic distance,
controller distance and genealogical links are independent quantities. Founder reporting remains in
details. See the [observation contract](population-observation.md) for exact grouping and denominators.

Population history retains up to 240 samples spanning observed history, with actual tick
spacing and bounded thinning. It cannot reconstruct earlier unseen history and is checkpointed.
Capture occurs every 100 simulation ticks, independent of wall-clock speed.
Spatial history samples each 25 ticks, retains up to 240 frames and the latest 2,048 events, and
survives browser checkpoint restore. Browse a past sample to inspect recorded population counts,
trait means and locations; the map continues to show the current world. A separate unthinned
2,000-tick window supplies recent family history and effort distributions. Effort bars use shares of
sampled organism decisions, not energy costs. Trait trends show inherited population medians.
Task byte, hidden state, genes, actual stocks and sensor/action values remain inspectable. Manual
task overrides persist as diagnostic interventions. All existing controls remain available.

The default pacing target is 30 ticks/s. Display refresh and simulation rate are separate; measured
throughput can fall below the request. Maximum means CPU-limited execution, not model-time seconds.
The timer-driven simulation redraws the map as it advances; the stats panel and inspector refresh at most every 250 ms
while running, and immediately on pause, stop or a manual intervention.
The [evidence](bacteria-results.md) lists sampled onset times without promising browser throughput.

<a id="display-implementation-boundary"></a>

## Implementation boundary

The view owns one resize observer, reusable field raster, transient lifecycle snapshots and camera
state. Field ticks, layer changes and replaced worlds invalidate the raster; camera-only redraws
reuse it. Rendering does not score evolution, mutate genomes or prescribe actions.

The optional trait partitions explicitly describe their requested grouping count and changing
membership. They do not prescribe occupation of bands or certify species diversity.
Bounded tests cover transforms, picking, raster reuse, toxin intensity and Run defaults.
Inspect configuration and headless evidence for what is running; no browser assay or development
server is needed for a documentation or display review.
