# Incremental spectator transport

**Status:** Delivery evidence — incremental transport and hidden-tab disconnection measured locally; publication through CI/CD authorized October 7, 2026.

## Delivered behavior

The native server sends gzip-compressed scene changes against the viewer's acknowledged
publication. Organisms and markers have stable identities; changed attributes use sparse
bitwise differences. Environmental samples use the same difference codec. Static terrain,
definition and solar spatial axes arrive on synchronization. Sunlight is reconstructed in
the browser worker from phase rotations and the shared illumination equations, including
native-precision shade, cover and paid emission inputs. The worker builds GPU buffers locally.
The physical field, genomes and private state remain native.

Status replaces changed sections. History references retained ticks and appends new or
replaced points, rather than repeating the chart. View changes reset scene data, while world
replacement and reconnect establish a complete baseline. Acknowledgment commits a baseline;
stalled clients coalesce to a current publication without accumulating old frames.
Matching baseline/view selections share encoded packets.

Hidden tabs close their socket and cancel reconnect timers. Foreground tabs reconnect with
a fresh baseline. Pending commands reject without replay. The publication clock remains
500 ms; this change adds no aggregate quota, bandwidth limiter or slower refresh policy.

## Bounded measurements

The old public server sent roughly 2.5 MB per publication in a six-publication read-only
probe: about 1.5 MB of display buffers and 1 MB of JSON, including approximately 0.9 MB of
history. The observed six-publication span was 6.10 seconds. Extrapolation gave approximately
180 GB/day per continuously connected viewer. This is a transport observation, not a billing
measurement. The probe disconnected without changing world controls.

The replacement codec was measured using two local, ordinary-area native fixtures with
2,000 cells. Each fixture produced six publications with ten actual kernel ticks between
publications: 50 ticks total, without an ecology campaign. The comparison uses the prior
uncompressed full-frame/status representation against complete replacement gzip packets.

| Fixture | First synchronization | Later steady samples | Reduction across five post-initial samples |
| --- | --- | --- | --- |
| Ordinary startup, all features enabled | About 910 KB | About 170–184 KB/update | 5.33 times |
| Feature switches observed on the live world, all five disabled and mortality recovery disabled | About 910 KB | About 65–71 KB/update | 11.70 times; about 15 times after the first transient |

The first post-initial update was larger in both fixtures. Paid emission changes dense
optical inputs in the all-features fixture, so reconstructing global sunlight does not
eliminate all changing environmental data. This negative finding remains relevant.

These fixtures are not the approximately 18,000-cell public world. They measure update size,
not deployed cadence, viewer duty cycle or billed egress. Under 1 GB/day remains unestablished:
one continuously visible viewer at two publications/second would need an average below
approximately 5.8 KB/publication. Hidden viewers now send no ongoing scene stream, but active
moving cells and chemistry still require data, and aggregate bytes scale with active viewers.

## Checks and reproduction

Native-generated gzip packets are decoded by the actual browser codec and compared with
the native renderer's exact float32 scene values. Cases include unchanged state, removals,
skipped publications, optical cover/emission/clipping, sun map, cropped view, history thinning
and same-tick replacement, world replacement and reconnect. Native projection checks assert
unchanged physical checkpoints. Socket tests cover shared preparation and an unacknowledging
viewer while the world continues stepping. Browser tests cover initially hidden startup,
foreground reconnect, canceled retry timers, uncertain-command rejection, ordered compressed
messages, listener cleanup and isolation from local execution.

Run the bounded size check from the repository root:

```bash
cargo test --manifest-path engine/Cargo.toml --release --bin biotropy-server incremental_bandwidth_probe -- --ignored --nocapture
```

`make ci` and `make build` passed. The frontend suite passed 101 tests across 40 files;
native engine/server/integration tests, ownership guards, documentation and formatting
checks passed. Existing lint warnings and the threaded WASM atomics toolchain warning remain.
Generated transport fixtures stay in temporary directories and are removed by the test.
No measurement artifacts or physical checkpoints are tracked.

Implementation ownership and scope are recorded in the
[delivery plan](plans/INCREMENTAL-SPECTATOR-PLAN.md) and
[execution contract](execution-modes.md#observation-cost-and-access).
