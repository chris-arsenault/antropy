# Immutable data ownership and sharing contract

The simulation's data-sharing constraints are architecture requirements. A display feature,
performance shortcut or later implementation plan cannot weaken them. Changing these boundaries
requires an explicit user decision. This document makes [ADR 0020](../../adr/0020-complete-rust-kernel.md)
enforceable; it does not authorize another physical state owner.

## Ownership and lifetimes

Rust/WASM permanently owns cells, inherited genomes, private recurrent state, chemical fields and
physical parentage. One worker owns both that WASM instance and OffscreenCanvas/WebGL2. The renderer
borrows typed-array views over Rust's packed display projections, uploads them synchronously, then
releases its borrow before another engine call. It must reacquire views after memory growth.
No grid, render frame or population-sized private-state array may be serialized, copied into a
JavaScript mirror, or sent through `postMessage` to draw the world. Camera and layer changes are
small commands; they never request a replacement world frame.
Presentation requests also carry no physical data: the main thread schedules at most one
unanswered request from its animation loop. The same worker performs the draw. A GPU completion
fence allows at most one unfinished frame; later requests coalesce until it completes. Camera
changes that leave the view identical do not trigger another upload. Active simulation work yields
through one queued task, independently of animation timing. Neither queue may grow with elapsed time.

Cell and marker projections contain three RGBA texels per record. The renderer uploads borrowed
subarray views into a reusable GPU texture, with 256 records per row and no padded CPU staging
array. A batched triangle draw addresses records by vertex ID. This replaces tiny instanced meshes,
whose software-rendering cost caused the integrated throughput failure. Periodic images, cell
detail, selection and population halos retain the same shader geometry and appearance.

Simulation ticks use scalar WASM exports without request/reply allocation or JSON. GPU uploads
still transfer CPU bytes to device memory. This contract removes intermediate CPU copies; it does
not claim that WebGL uses CPU memory as GPU memory. Keeping rendering beside WASM avoids the need
to pass a nonshared WASM pointer between workers or introduce another simulation worker.

## Observation boundary

React owns display observations, never continuation state. The permitted data is global scalar
accounting, population distributions, retained chart samples, reduced spatial summaries, and one
explicitly selected organism's inspection. A selected-cell snapshot is a bounded observation copy,
not a permission to export every cell's genome or recurrent state. These observations remain outside
the render path. JSON is allowed for bounded reduced queries and explicit controls; it is forbidden
for stepping and rendering. The complete physical arrays remain behind Rust's boundary.

The dissolved-chemistry window receives `chemicalOverview`: Rust reduces the field into at most
twelve `{id, amount, peak}` rows, total and other amount, present count and tick. Properties come
from the existing initialization definition. This command uses the ordinary 16 KiB reply budget;
publication explicitly rejects more than twelve rows. The worker caches by observed tick,
clears that cache on world replacement, and omits unchanged observations from subsequent packets.
The reduction runs on status publication, never per render or simulation tick. Chemistry selection
only changes a small view command. Hazard response scalars occupy spare channels in the existing
worker-local texture; neither texture dimensions nor CPU staging ownership changes.

The Web window opts into `chemicalWeb`: Rust reduces installed enzyme conversions into one
64-row page of chemical pairs, full-population primary/supporting counts, totals and at most
256 reservoir species IDs. Chemical and mode filters plus paging retain access to every pair.
The worker caches by world identity, observed tick and query; closing the window disables and
clears this observation. It uses the ordinary 16 KiB reply budget, existing delta/backpressure
and explicit row/source limits. No genomes, per-cell route arrays or field grids cross this
boundary. Enzyme map colors use immutable compiled route metadata and funded stocks directly
inside the existing Rust packed-render preparation. This adds no physical state or history.

The worker-local census includes region membership needed to associate successive observed groups.
Those IDs describe an observer's grouping, not a second physical cell array. They never enter React
or a controller. Current census sampling remains every 25 ticks; display publication is at most twice
per second during ordinary running, with immediate explicit control/selection updates.

The transport has these enforced properties:

- The browser engine allows only named reduced queries and controls. It rejects bulk `frame`,
  `field`, full `inspect`, environment and harness commands before executing them.
- Command replies are consumed directly from borrowed WASM bytes before freeing request storage.
  The generic reply path cannot return an asynchronously retained borrowed byte array.
- A single observation envelope updates status and inspection. Only one envelope can be
  unacknowledged. Further publications retain a request to read the newest observations, without
  constructing or queuing more diagnostic snapshots.
- Existing chart samples are referenced by index. Appends and thinning transmit new samples and
  retained indices, not the entire history again. Initialization and explicit restore send the
  bounded retained history once. A reset starts a new observation baseline.
- The recent behavior window uses the same retention-delta protocol, with at most 81 samples.
  Founder comparisons, actual body ranges and acquired-learning statistics are Rust reductions;
  they do not transfer genomes or private arrays for population analysis.
- A selected genome is sent when its identity or availability changes. Genealogy/relationship
  queries refresh after parentage, death or contact-transfer changes. Paused unchanged inspections
  reuse their prior result. Selection, restart, restore and manual task changes invalidate the
  relevant cache. No diagnostic cache is a physical input or part of the checkpoint.
  Installed machinery has its own identity revision while paid refitting is pending.
- Before decoding, browser replies have explicit byte budgets: 16 KiB for ordinary commands,
  256 KiB for one selected inspection, 2 MiB for initialization metadata and 16 MiB for worker-local
  census membership. Before posting an observation, the worker rejects memory buffers, unsupported
  status fields and trees exceeding 400,000 scalar/container visits (strings consume character
  budget). These are display limits, not population controls. A breach reports an error; it must
  never reduce founder count, simulation fidelity or ancestry retention to fit a display packet.

These limits are ceilings, not permission to fill every message. Tests must establish that unchanged
history, genomes and genealogy do not repeatedly cross the boundary. A future diagnostic needing
more data must use bounded queries, revisions or paging within this contract.

## Explicit cold paths

Checkpoint export/import and IndexedDB recovery deliberately own serialized copies across
asynchronous compression/storage. Headless experiments may export detailed observations and
artifacts through their separate command surface. Neither exception may be called from rendering
or used to recreate a browser-side physical world. Cold operations and their pauses must be reported
separately from tick/render/observation cost.

Save, export and restore share one queue before allocating snapshots. At most four requests can
be pending; excess manual requests fail explicitly and overlapping automatic saves are skipped.
The queue releases after success or failure. Failed storage transactions retain previous valid
recoveries. An eight-run IndexedDB health record stores scalar breadcrumbs at five-second cadence
and on reported faults; exporting it does not require a live simulation worker. It contains no
physical continuation state and cannot guarantee a final record after process termination.

The [reliability evidence](reliability-results.md) measures these changes, including actual browser
limits. The older transport measurements below retain their original scope and executable identity.

## Audit and validation registration

The September 14 genealogy restoration preserved the borrowed render path but exposed an observation
regression: each half-second publication resent all retained history and serialized the selected
cell's full inherited/expressed genomes and parentage queries. A generic client also copied every
WASM reply before decoding and used JSON commands for ticks. Previous capacity measurements included
query preparation but excluded worker structured cloning and React work. They did not establish the
cost of the full browser boundary.

The repair changes transport and read-only observation work, not chemistry, population initialization
or the model clock. Regression tests cover borrowed GPU uploads, scalar-step continuation, rejected
bulk browser commands, history thinning, slow-consumer backpressure, reset, selection, division,
manual task updates, genealogy equivalence and unchanged physical checkpoints.

Registered transport probe: seed 101, a 24×24 world with one synthetic living descendant and 100,000
recorded ancestors; no ecological interpretation. Construct 240 chart samples with 64 family,
founder and region entries each. Compare 20 full legacy-style publications with 20 revisioned
publications after two warm-ups. Each iteration advances one ordinary tick on restored identical
worlds, reads summary/selected inspection and performs a local structured clone of the display
message. Report wall time and serialized measurement size outside the timed section; JSON byte size
is a comparative proxy, not the browser's structured-clone wire encoding. Limit each arm to 30 wall
seconds. Verify exact final physical equality and full reconstructed display equality. Archive the
loaded binary, input/output snapshots and ledger record. No browser/server or long simulation run.

Repeat the existing registered 48/2,000/2,000-growth capacity cases once after the repair. Those
figures remain separate from the transport probe. Neither test measures GPU execution, React paint
or days/weeks endurance. Do not attribute an unmeasured browser slowdown entirely to these copies.

## Measured repair

Ledger 3680 completed both 20-publication arms within their caps. The legacy-shaped arm uses the
current decoder and kernel too: this isolates repeated full observations versus revisions, rather
than attributing unrelated physical changes to transport. Both include one scalar tick per publication.

| Measurement | Full observations | Revisioned observations |
| --- | ---: | ---: |
| Mean tick plus publication and local clone | 24.682 ms | 0.418 ms |
| Last payload, measured as JSON bytes outside timing | 1,010,079 | 9,210 |
| Final physical state and reconstructed displays | Identical | Identical |

The recurring payload proxy decreased 99.1%. These figures concern the specified dense retained
history and synthetic parent chain; they are not a universal browser speedup. The
[transport report](../../evidence/digital-chemistry/observation-transport.json) records the exact
WASM digest, horizons and equality checks. Run the bounded probe with
`pnpm exec tsx harness/numerical/observationTransport.ts harness/artifacts/NEW-DIRECTORY` from
`frontend`; existing output directories are rejected.

Ledger 3681–3683 repeated the existing capacity workload: 218.5 ticks/s at 48 cells, 61.1 at 2,000
varied cells and 33.8 under funded growth. Lowest 20-tick windows were 198.6, 60.3 and 31.0.
All preserve exact checkpoint continuation. This benchmark still uses full selected inspection as
a conservative query load and includes packed render preparation; the separate transport probe
measures cloning. It does not include GPU or React work. See the
[capacity report](../../evidence/digital-chemistry/ownership-capacity.json).

`make ci` passes 40 Rust and 46 TypeScript tests, including the new ownership and transport tests,
with the existing 14 nonblocking lint warnings. No development server or browser ecological assay
was started. The final build check is recorded with the handoff.
