# Incremental spectator transport

**Status:** Implementation delivered — incremental protocol and hidden-tab lifecycle pass repository checks; October 7, 2026 publication is authorized through the existing CI/CD pipeline.

## Contract

Replace repeated complete render/status packets with acknowledged incremental scene updates.
Hidden browser tabs disconnect and reconnect when visible. Preserve ordinary update timing,
all view selections, inspection, charts, server authority and the continuing physical world.
There are no aggregate bandwidth limits, quotas or artificial refresh delays.

The native World remains the sole physical owner. Network scene data contains reduced visible
organism/marker attributes and sampled environmental values, never genomes, private state or
the physical chemical grid. The browser worker reconstructs the existing renderer's texture
buffers locally. The transport format must not depend on the renderer's float-array layout.
Local browser rendering continues borrowing WASM views.

Reuse `engine/server/runtime.rs`, `socket.rs`, existing projection operators and the sole
WebGL renderer. New scene and status codecs own transport baselines. History uses retained
sample identities and appends. Definition arrives on initial synchronization/world replacement.
Delta bases identify the last accepted sequence; stalled viewers coalesce to current state.
Shared sunlight is reconstructed from static spatial axes and three phase rotations, rather
than retransmitting every changing light sample. Local shade, cover and emission inputs retain
their native precision; the worker applies the same composed light/weathering operations.
Reconnect and view/world replacement establish a new baseline. Compress packets with the
existing native gzip dependency and browser decompression support.

The prior six-frame public probe found roughly 2.5 MB per update, including about 0.9 MB of
repeated chart history. That explains an extrapolated 180 GB/day per continuously connected
viewer at its observed cadence. It is not a billing measurement. Changing cells and fields
still require updates; the daily target must be assessed from the delivered codec's bytes,
without imposing rate limits or assuming all scene values remain constant.

## M0 — Incremental spectator delivery

Acceptance: the ordinary server/browser transport uses incremental observations and semantic
scene changes, safely handles slow clients, resets and view changes, and disconnects hidden
tabs without pausing the shared world. Run protocol reconstruction/sequence tests, socket
integration, hidden-tab lifecycle tests and `make ci`; measure a bounded real-kernel fixture.

Sulion root: `3767c107-7a6d-4e21-88d5-dcfb01e8312f`; milestone position 1.
Execution branch: `5b15e28a-d617-4cfe-adf2-3433c93b5914`; step positions 1 and 2.

### Execution steps

1. Implement acknowledged native scene/status deltas and matching browser reconstruction.
   Files: native server transport/runtime and frontend remote scene/worker modules.
   Cover initial synchronization, removal, append/thinning, skipped publications, viewport
   changes, world replacement, malformed updates and unchanged scenes. Use actual native
   encoded packets in cross-language decoding checks.
2. Disconnect hidden tabs and integrate documentation and checks.
   Files: bridge, remote connection lifecycle and protocol; current execution/ownership docs.
   Verify initial hidden startup, canceled reconnect timers, foreground resynchronization,
   uncertain command rejection, local execution isolation and full repository checks.

## Current state

Both execution steps are complete. `make ci` and `make build` pass, including native-generated
packet reconstruction, slow-viewer socket integration and browser visibility lifecycle.
The [authored results](../incremental-spectator-results.md) retain measured reduction, the
dense-emission finding and the unestablished 1 GB/day target. No aggregate rate policy or
physical world change was introduced. Existing untracked chemical-key result
documents/examples belong to other work and remain untouched. The user subsequently authorized
commit and push on October 7. Publication and pipeline inspection are tracked separately;
the local measurements above do not establish deployed egress or the daily target.
