# Browser and headless server execution modes

September 21, 2026. **Implementation and private TrueNAS/Komodo deployment authorized.**
Public VPN routing and the public site's server default remain disabled until requested.
Sulion root: `14e9bf4a-fc5f-4c8c-ba92-6dd961848f57`.

## Scope correction

The first proposal overemphasized saves, recovery and moving runs. The user rejected that
complexity. This revision removes cross-context transfer, live executor replacement, server
save infrastructure and storage/recovery acceptance gates. Existing browser saves can stay
as they are. Persistence is not a prerequisite for this feature.

The goal is straightforward: choose browser computation at one or four threads, or connect
the same UI to a native simulation running on TrueNAS at 32 threads.

The public destination is a shared, long-running world: visitors to `biotropy.ahara.io`
should immediately observe the current server simulation instead of starting a new ecosystem
and waiting through its early evolution. Multiple simultaneous spectators are required.
This replaces the earlier single-attachment assumption; it does not restore migration or saves
as prerequisites. Browser 1/4 remain explicit alternatives for running a separate local world.

## Execution modes

| Mode | Simulation | Display |
| --- | --- | --- |
| Browser · 1 thread | Existing serial WASM in the browser worker | Existing borrowed-memory WebGL |
| Browser · 4 threads | Existing shared WASM with four compute workers | Same borrowed-memory WebGL |
| Server · 32 threads | Existing Rust kernel in a native process with a 32-thread pool | Same browser WebGL, supplied with network display data |

Choose the browser thread count before starting a run. Changing it applies to a new run;
preserving the current world across that change is not required. Connecting to the server
attaches to its current world. Nothing moves between browser and server execution contexts.

The server runs independently of the connection. Closing the tab leaves the process running;
reopening the UI reconnects to its current state. Surviving a server process restart is not
part of this feature. Thread counts describe simulation compute workers, not total OS threads.
Check the actual TrueNAS CPU allocation before claiming 32-core performance.

The same chemical laws, physical clock, controller, mutation, funding and sparse work limits
apply everywhere. Rendering and networking must not alter those laws. Native/WASM trajectories
and different thread counts need not be byte-identical.

## What changes in the architecture

Keep one authoritative Rust World. The browser renderer gets display data from either
local borrowed views or a remote connection. React receives the same reduced observations
in both cases.

Reuse:

- `engine/src/world.rs` and `parallel.rs`: native/WASM execution already exists.
- `engine/src/render.rs`: existing cell, marker and chemical/light display projections.
- `frontend/src/engine/renderer.ts`, `spriteBatch.ts`, `shaders.ts`: same drawing.
- `frontend/src/engine/bridge.ts` and `protocol.ts`: existing controls and observations.
- `frontend/src/engine/threadedLoader.ts`: add explicit one/four selection.
- Existing Rust census, chemistry, phenotype and inspection queries.

Separate obtaining display buffers from drawing them. In local mode the renderer continues
to borrow WASM views directly; do not make it serialize frames to fit the remote interface.
In remote mode its worker receives owned display buffers and uploads them to the same shaders.
The native host uses typed Rust slices, not the u32 pointer descriptors intended for WASM.

Remote display data includes cell geometry/colors, source markers, selected chemical and
environmental display layers. It excludes the complete 256-chemical field, genomes and
private neural state. Selected-cell inspection stays a separate bounded query.

This is the necessary proposed extension to the
[ownership contract](../design/chemistry/data-ownership.md): network display copies are allowed
for remote execution, while local borrowing and bounded UI messages remain required. Update
that contract during implementation. There is no client-side physical simulation in remote mode.

## Headless host and connection

Use a native Rust process with one World, a configured Rayon pool and a small WebSocket
endpoint. Reuse the current kernel directly. No server browser or GPU is needed.

Run simulation work independently of network I/O. Apply controls between completed ticks;
publish bounded display/observation results and release the World before sending them.
With no attached viewer, stop preparing display frames and keep stepping.

Support multiple read-only spectators of the same World. Each has independent camera,
layer choices and cell inspection; joining or reconnecting never replaces another viewer.
Public connections cannot start, pause, step, restart, intervene in or reconfigure the World.
Keep those operations owner-only and enforce that distinction on the server, not just in UI.
An authenticated operator can use the existing control panel without a collaborative editing
or control-lease system. Public view commands use an allowlist separate from physical controls.

The current measured phenotype cohort is run-level. Spectators may view its report, filter
read-only results and inspect cells; they cannot overwrite the active cohort or pin for everyone.
Keep this distinction visible in the same panel. Independent per-viewer measured cohorts are
not necessary to deliver public observation.

Use one WebSocket for controls, reduced panel observations and binary display updates.
Reuse request IDs, replies and acknowledgement behavior. Keep a small protocol version,
run generation, view revision and sample tick so reconnects or restarts cannot leave stale
cells or apply delayed commands to a new world. Do not automatically replay uncertain
mutation commands after reconnect.

Publish common display data and statistics once per update, then share immutable encoded
results across interested viewers. Reuse results for matching chemical/color/view requests;
prepare distinct projections only for distinct demand, with a process-wide work/cache budget.
Camera transforms stay local when they use the same projected data. No per-viewer World,
full-state copy or repeated common census. Selected-cell queries remain bounded separate work.

Bound each connection's send queue independently. Send an update only when its previous one
has been consumed, retaining a latest-result reference instead of every missed frame. One slow
viewer cannot hold the publisher's acknowledgement or another viewer's queue. Reconnecting
requests a fresh display and current observations. Start with independently usable updates
rather than a custom delta-recovery protocol. Bound total connections and outstanding query
work as well as per-client queues; do not let public demand consume the simulation budget.

The UI keeps its normal live charts and panels. Continue to use the existing sampling and
bounded history code where practical; disconnected history backfill is not a delivery gate.
Label observation gaps instead of inventing samples. Do not require moving the entire browser
Session implementation into Rust to make the headless loop run.

## Keep display cost sensible

Reuse the present packed display format first. Send at an independently limited rate,
not every simulation tick. Camera movement and drawing remain local and responsive.

The present display field is about 0.614 MB at default dimensions, and 12.288 MB at 20× area.
These are layout calculations, not measured network rates. Bound projection size and
send frequency together. For larger worlds use viewport-limited field projections and
visible-cell records; preserve periodic seams and the existing interpolation appearance.
Do not send a complete physical grid to support a chemical dropdown.

Measure the actual network and projection cost before adding tile caches, quantization,
multiple sockets, interpolation machinery or elaborate level-of-detail hierarchies.
Those were overcommitted in the first proposal. They are possible responses to a measured
bottleneck, not prerequisites. No arbitrary cell truncation or changed physical resolution.

The important acceptance check is that an attached or slow client leaves server stepping
useful and memory bounded. Measure headless versus attached throughput on the same workload,
including projection and UI observation costs.

Separate costs explicitly: stepping is once per world, common projection/encoding once per
published result, distinct view/inspection work follows demand, and socket work plus transmitted
bytes grow with viewers. A normal reverse proxy still carries a separate stream across the
VPN/home uplink per viewer. Shared Rust buffers do not remove that bandwidth cost. Measure
fan-out with 1, 4 and 16 viewers, including identical and differing selections and one stalled
consumer. If measured uplink capacity limits the intended audience, a later AWS fan-out relay
could consume one upstream publication stream. That relay is not an initial dependency.

## UI and deployment

For the public site, open the shared server world by default with an immediate current view.
Offer Run locally with Browser 1/4 as a deliberate alternative. Show execution location,
actual compute count, tick/rate and connection status. Browser 4 capability failure must be
visible; Browser 1 remains usable. Keep the existing map controls, chemical/phenotype panels,
lineage view and cell inspection in the remote UI. Do not show local-save actions as though
they save the server world.

Keep the same static UI at `biotropy.ahara.io` through the existing website module. Configure
its default remote stream at a public API hostname routed through the shared ALB/WAF, reverse
proxy and WireGuard tunnel to TrueNAS. This uses the existing split frontend/API pattern;
visitors need neither VPN software nor access to a private address. The VPN is the upstream
connection between platform ingress and the simulation host. A same-hostname API route is not
required for this user experience and should not force a new CDN routing system.

Repository evidence: `ahara/INTEGRATION.md` under TrueNAS-hosted HTTP services and
`ahara/TRUENAS-DEPLOY.md` under Networking describe the path. The existing
`ahara-tf-patterns/modules/alb-api-truenas` supports public and authenticated routes, and
Airwave's `infrastructure/terraform/api.tf` and `frontend.tf` demonstrate the separate origin.
These are inspected configuration/design sources, not proof of a live Biotropy route.

Expose a read-only spectator stream and read-only queries publicly; retain authenticated
owner controls using existing platform mechanisms. An anonymous WebSocket must not become
an administrative channel merely because its HTTP upgrade succeeded. Configure allowed
origins, WebSocket forwarding, bounded requests and appropriate idle keepalives along the
route. The public UI must preserve COOP/COEP for its Browser 4 option.

Package the native process in a container. Platform ingress changes belong to `ahara-infra`;
project listener/certificate/DNS configuration uses the shared module. Publish the upstream
route before activating the public UI's server default. The platform's generic owner-only
TrueNAS placement guidance is superseded for this design by the user's explicit choice of
public spectators on the home-hosted simulation. No new database, identity platform or
checkpoint dataset is required. This proposal does not itself deploy or expose the service.

The actual TrueNAS topology, CPU/RAM allocation and ingress remain to be inspected before
deployment. This design pass makes no runtime, network or deployment changes.

## Implementation phases

The existing Sulion plan remains canonical. The original M1 durability and M3 run-transfer
phases are marked skipped and replaced with the narrower M1/M3 scopes below. Their earlier
descriptions must not be executed.

### M0 — Browser mode selection and renderer input

Add explicit one/four selection for new runs. Factor display acquisition from drawing.
Verify exact requested pool size, clear capability failures and unchanged local borrowing.
No hot switching or state migration.

### M1 — Native headless runtime

Wrap the existing World in a native 32-thread process with start, run, pause, step and restart.
Expose existing reduced queries and render projections. Verify that it steps without a
browser and that closing the client does not stop it. No new server persistence system.

### M2 — Remote display and controls [depends on M1]

Connect the renderer worker through the bounded WebSocket path. Implement fresh-view updates,
sample identities, shared publication, independent viewer queues, owner-only control replies
and spectator reconnect. Verify bounded memory under slow and multiple consumers, no duplicate
common projection work, rejected spectator mutations, correct periodic display, cell removal
and authoritative inspection. Preserve the local
ownership path from M0.

### M3 — Same UI in both locations [depends on M0, M2]

Wire the existing map, panels and controls to local/remote adapters. Make attachment and
disconnection clear; public visitors open directly onto the server's continuing world, while
local mode is an explicit choice. Keep operator controls separate from spectator view settings,
and prevent viewer selection from reconfiguring shared measurements. Keep local save behavior
local. No copy, move, import/export interoperability or checkpoint handoff work.

### M4 — TrueNAS setup and performance [depends on M3]

Prepare the native container and public read-only route through the existing VPN after
inspecting the host and platform routing. Deploy when authorized. Measure actual 32-thread
stepping with no viewers and 1/4/16 viewers, shared versus distinct views, uplink traffic,
slow-client isolation and reconnect. Check browser one/four modes on the same build and perform visual
review. Use bounded workload checks before any separately registered long run.
No save-rotation, crash-recovery or cross-context transfer gates.

[SCALING-PLAN.md](../../SCALING-PLAN.md#multicore-design) retains shared performance targets
and prior measurements. This plan adds the execution choices and remote UI; it does not
inherit all of P3's browser persistence work or P4's terrain scope.

### M0 execution

Expansion `de8e25f7-4c6e-4de8-873a-eae63c65c25c` under root phase 2.
1. Add explicit serial/four-worker startup in the loader, worker and UI; factor a structural
   render source that retains synchronous local borrowing. Existing shader and ownership
   tests plus loader capability tests protect the boundary.
2. Typecheck and run focused tests before moving to native hosting. Runtime checks are shared
   with final integration; no local development server is started.

Deployment scope correction: build and deploy the private service using Komodo; do not add
or activate reverse-proxy/VPN routes, public API DNS/listeners, or the hosted server default.

### M1 execution

Expansion `58fc2564-06a8-4af1-bc7c-9f4d9c9d8e7b` under root phase 3.
The native binary uses the existing engine crate, commands and typed render buffers. A dedicated
thread owns World and its Rayon pool; bounded commands run between ticks. Tokio owns sockets,
immutable publications and independent connection acknowledgements. Common census, charts and
projection results are prepared once, with a bounded distinct-view budget. Verify independent
stepping, commands, publisher sharing and consumer isolation with bounded native tests.

### M2 execution

Expansion `cb084c52-6d62-4272-90ff-1497fcac7b75` under root phase 4.
The remote worker owns binary display packets and feeds the existing renderer. Only bounded
observations reach React. Native publications share encoded common data and identical views;
each socket retains at most one unacknowledged display. Large maps use padded, snapped display
windows and a bounded display sampling density; the physical mesh remains unchanged.
Validate real sockets with an active and stalled viewer, rejected mutations, headless continuation,
window seam neighbors and the same browser panel/ownership tests. Selected queries remain separate.

### M3 execution

Expansion `ee9e067b-ec6e-489d-a446-fab3ff574992` under root phase 5.
The same Application selects a local worker or remote worker. The private host serves the built
UI with `/execution.json` selecting its current server; public static hosting has no such default.
Execution controls allow explicit browser 1/4 or server attachment. Spectator settings, cell task
edits and cohort controls are disabled; operator authentication grants controls for this connection.
No operator credential persists in a URL or browser storage. Local recovery actions remain local.
Verify with existing Application/observation tests and a remote-worker publication test using real
kernel-generated status, plus socket tests from M2. Human visual review is not claimed by fixtures.

Local operating-envelope registration: one seed27 capacity fixture with 2,000 cells, 100 ticks
per case, one/four compute threads, and zero/one/four/sixteen matching views plus sixteen distinct
chemicals. Four publication samples per attached case, ten cases total, a 60-second per-case
wall ceiling and no ecological interpretation. This measures kernel plus projection preparation;
socket fan-out and actual 32-core host throughput remain separate live-deployment checks. Command:
`cargo test --release --manifest-path engine/Cargo.toml --bin biotropy-server publication_cost_envelope -- --ignored --nocapture`.

Completed local capacity probe: four threads measured 106.2 ticks/s without publication,
98.9/99.4/99.0 with 1/4/16 matching views, and 80.0 with 16 distinct chemical selections.
Matching clients produced four shared projections across four samples; distinct selections
produced 64. One thread measured 72.0 headless, 65.4 with one view and 58.3 with sixteen distinct
views. These short fixture measurements exclude network fan-out and do not establish the actual
TrueNAS operating envelope, long-run behavior or a representative mature-world speed.

### M4 execution

Expansion `1bc9b70c-35c8-4ce4-b807-5625236bff25` under root phase 6.
The root Dockerfile packages prebuilt binary/UI artifacts. Compose assigns bounded CPU, RAM,
processes and logs; `platform.yml` uses the existing Komodo workflow. Terraform supplies only
an operator SecureString, with no public networking. Compose validation passes locally.

Deployment correction: terminal AWS access is intentionally blocked. The earlier attempt to
read `/ahara/komodo/function-name` returned broker exit 66 and no deployment occurred. Asking
to enable AWS was the wrong deployment path. Use only the existing GitHub Actions pipelines.

The managed-project registration in `ahara-infra` needs `komodo-deploy`, `ssm-write` and the
exact additional operator parameter path. These requirements follow from the current policy
bodies: the website bundle does not grant SSM writes. Publish and verify that infrastructure
pipeline before the app commit. The app's main-triggered workflow builds native/frontend
artifacts, applies Terraform, publishes the image and deploys through the shared Komodo action.
The local deploy target and script are removed, along with the manual workflow trigger.
Deployment starts only from a push to `main`; PRs retain the existing validation path.

The user enabled the intended `gh` credential after the initial broker denial. CI monitoring
uses `with-cred -- gh`; the connected GitHub app is prohibited. Public routing remains outside
authorization.

Local validation: `make ci` passed 275 kernel tests, five native service tests and 78 frontend
tests, plus formatting, lint, typechecking, documentation and Terraform formatting. The registered
publication benchmark is opt-in and ran separately. Production frontend/native builds and Compose
validation pass. A packaged-container smoke initially failed because local build artifacts were
770/660 and unreadable by the image's unprivileged user; explicit image COPY permissions fixed it.
The rebuilt container served the same UI, returned isolation headers and its server default,
and advanced without any viewer. It was stopped after the bounded startup check. No visual
browser review, TrueNAS deployment, private-host resource inspection or live 32-core acceptance
is claimed. Hosted deployment success remains to be verified through CI/CD.

CI configuration: `ahara-infra` commit `58c858c` adds the two policy modules and exact operator
parameter path. Run `35627605602` successfully applied Terraform; the separate engineering-report
ingestion failed with HTTP 502. Infrastructure and application `make ci` both passed, as did
Compose validation. App commits through `f611d3a` were then pushed to `main`.

App run `35632695332` passed its checks and release builds but failed Terraform's website MIME
lookup on `engine-threads/engine.d.ts`. The browser loader uses generated JavaScript/WASM and
its own TypeScript interface; declarations are not runtime assets. The build now asks wasm-bindgen
not to emit declarations and clears its generated output directory before regenerating, including
incremental builds. No Terraform MIME exception is needed.

Run `35633901855` then uploaded the corrected assets but was denied
`cloudfront:CreateResponseHeadersPolicy` for the browser isolation headers. The user approved
the shared managed-role correction: `ahara-infra` commit `28fcf3d` grants create/update/delete
for account-scoped response-header-policy ARNs. Infrastructure run `35636094435` passed,
including Terraform, so that prerequisite is deployed. This documentation push resumes ordinary
application CI/CD. The VPN route and public server default remain disabled.

## Technical references

[WebSocket behavior](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API),
[browser isolation](https://developer.mozilla.org/en-US/docs/Web/API/Window/crossOriginIsolated)
and [Rayon configuration](https://docs.rs/rayon/latest/rayon/struct.ThreadPoolBuilder.html)
support the selected transport and execution mechanisms. They do not mandate the removed
persistence or migration architecture.
