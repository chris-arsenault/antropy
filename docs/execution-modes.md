# Browser and native server execution

**Status:** Current reference — browser 1/4-thread execution, the native server World, its volume persistence and the public spectator route. Incremental protocol v3 publication through CI/CD was authorized October 7, 2026.

The same Biotropy UI can run a local world using one or four compute threads, or observe a
native World running independently on a server. Execution selection starts a new local world
or attaches to the server's current world; it does not transfer a simulation or its saves.
Both modes use the same physical kernel and the existing renderer. The
[structural scaling record](plans/archive/SCALING-PLAN.md) separates stepping, observation and display costs.

## Browser

The HUD's Execution menu selects Browser 1, Browser 4 or a server address. Explicit Browser 4
requires cross-origin isolation and shared WASM memory; failure is shown rather than silently
changing the requested pool size. Browser 1 uses the serial module. Local rendering still
borrows typed-array views directly from WASM in the owning worker.

Query parameters are `execution=browser1`, `execution=browser4` or
`execution=server&server=<WebSocket endpoint>`. They contain no credential. The optional
same-origin `/execution.json` supplies a default mode and endpoint. The public static site
supplies the public server stream ([public route](#public-route)). The native host supplies
`server` and `/stream`, so its private UI opens directly onto the continuing world.

## Native host

`engine/server/` implements `biotropy-server` in the existing Rust crate. One owner thread
coordinates World and a persistent Rayon pool. Two Tokio I/O workers handle HTTP and sockets.
Requests apply between complete physical ticks. Closing a client does not pause World. With
`BIOTROPY_STATE_DIR` set, the server keeps its world across restarts; without it, a restart
creates a fresh seed.

| Setting | Default | Meaning |
| --- | --- | --- |
| `BIOTROPY_THREADS` | `32` | Compute pool size, from 1 through 32 |
| `BIOTROPY_BIND` | `0.0.0.0:8095` | HTTP and WebSocket listener |
| `BIOTROPY_SEED` | `27` | Initial world seed |
| `BIOTROPY_CONFIG` | `{}` | Existing engine configuration overrides as JSON |
| `BIOTROPY_STATIC_DIR` | `/app/public` | Built version of the same frontend |
| `BIOTROPY_ORIGINS` | empty | Comma-separated additional browser origins; same-origin is accepted |
| `BIOTROPY_OPERATOR_TOKEN` | unset | Operator credential; unset disables owner authentication |
| `BIOTROPY_STATE_DIR` | unset | Checkpoint directory; unset disables server persistence |
| `BIOTROPY_STATE_BYTES` | `4294967296` | Compressed byte budget for automatic checkpoints |
| `BIOTROPY_AUTOSAVE_SECONDS` | `1800` | Automatic save period; `0` keeps only shutdown and operator saves |

New-world JSON uses the same parser as browser and harness requests. `{}`, `{ }` and omitted
configuration select the ecology preset; partial fields override it without disabling terrain.
For example, `{"terrain":{"seasons":false}}` disables only seasons. Diagnostic fixtures can
request `{"preset":"diagnostic"}` and override that neutral baseline deliberately. Complete
effective configurations retain all their explicit values. Restoring a checkpoint uses its
saved configuration rather than reapplying startup overrides.

## Server persistence

The server stores ordinary physical checkpoints in the running format, gzip-compressed, with a JSON sidecar
recording reason, format version, seed, tick, generation, population, creation time and sizes.
This mirrors browser recovery. It keeps the newest checkpoint, the newest checkpoint with living
cells, every manual checkpoint (at most eight), and the six newest automatic checkpoints within
the byte budget. An extinct world keeps advancing environmental time and saving, so the last
living state never ages out behind empty saves. Older automatic ones expire. Manual checkpoints leave only by operator deletion; a ninth manual save is refused.

Automatic saves run every `BIOTROPY_AUTOSAVE_SECONDS` while the world changes, and once more on
SIGTERM or Ctrl-C. The shutdown save waits up to 90 seconds behind an in-progress save, then the
process exits without draining spectator sockets. The owner thread only serializes the world;
compression and disk writes run on another thread while ticks continue. One save writes at a
time. Before encoding, the owner drops genotypes no live cell, founder or catalog entry
references. This is the existing retention rule, applied at save time instead of waiting for
the backlog to double. The last save attempt is reported in `/api/status`. Restart diagnostics
live on the same volume ([server management](server-management.md#restart-diagnostics)). A write goes to a temporary file, is synced and renamed, then its sidecar is written the
same way. Launch removes temporary files and data without a sidecar file. Data whose sidecar
exists but no longer parses stays on the volume for the operator.

At launch the server restores the newest checkpoint whose recorded format equals the running
binary's physical version and that decodes and validates. It logs and skips failures and falls
back to older checkpoints of that format. It starts the configured seed only when no checkpoint
of the running format exists; if such checkpoints exist and none restores, launch fails with the
reasons instead of replacing them with a new world. Checkpoints from another format are never
migrated or deleted at launch; they remain listed as incompatible until expired or deleted.
The phenotype observer is not part of a checkpoint and is reconfigured as for a new world.
[Server management](server-management.md) documents the operator save/list/load/delete API.

`/health` returns the current generation, publication sequence, tick/population, throughput,
viewer count and projection count. It contains no private cellular state. `/stream` accepts
JSON commands and sends gzip-compressed version-3 incremental scene publications. A publication
carries changes against its acknowledged base sequence, with terrain and definition on initial
synchronization. Protocol generations, base sequences and view revisions reject stale state;
uncertain commands are never automatically replayed after reconnect.

The independent [HTTP management API](server-management.md) exposes authenticated status/config,
controls and physical checkpoint download under `/api`. It needs no WebSocket connection. Both
transports use the same bounded command queue and sole World owner. Existing UI controls remain
compatible with the WebSocket protocol.

## Observation cost and access

World stepping happens once. Matching scene selections share read-only preparation, and matching
baseline/view revisions share encoded packets. Publication retains the half-second clock. Each viewer has an independent
acknowledgement, a bounded request queue and local camera controls. A stalled viewer receives
no accumulating stream of old frames. Network bytes still scale with the number of viewers.

The native transport sends changed organism/marker attributes, removals and changed environmental
samples rather than the renderer's packed float buffers. Sparse bitwise differences preserve
sample values. Sunlight uses a static separable spatial basis, three changing phase rotations
and local optical inputs; the browser composes light and weathering from those shared equations.
No physical 256-chemical grid or population-wide genomes leave the server. Large-world views use
snapped, padded windows with the existing sampling density and periodic membership.
Physical mesh resolution is unaffected. The browser worker assembles the renderer's arrays locally; React
receives bounded reduced observations through the existing ownership guards.

Status sends changed sections. Charts retain samples by tick and append new/replaced points;
thinning removes omitted samples. Reconnect or world replacement sends the bounded initial
state once. View changes reset the selected scene while retaining the observation baseline.
The server retains one unacknowledged publication per viewer and coalesces missed publications
against the last acknowledged base. There is no aggregate output quota or refresh slowdown.

Hidden tabs disconnect their spectator socket, cancel reconnect timers and reject uncertain
pending commands. Visible tabs establish a fresh connection and baseline without replaying
controls. This only suspends observation; the native world keeps stepping. Local browser
execution retains its existing visibility/save behavior.

[Bounded transport results](incremental-spectator-results.md) record the measured reduction
and the unresolved 1 GB/day target. Server and browser must deploy together for protocol v3.

The default landscape combines conductance ground, elevation contours, received-light shade,
translucent chemistry and seasonal reservoir bands. Static terrain is a separate projection
of at most 256 × 256 RGBA samples, shared across viewers and transmitted once per connection/world.
It stays in the rendering worker and uploads once per revision. Stock markings remain separate
from seasonal supply timing. Diagnostic maps remain available but normal viewing needs no toggles.

Chemical web filters and cell inspection are viewer-local. Phenotype selection, highlighting
and pinning operate on the existing run-level observer and require operator access. Spectators
can read these reports without changing the shared cohort. Charts preserve bounded sampled
history while attached; unattended gaps are not backfilled. Browser recovery controls do not
save a server world.

Operator authentication uses an explicit WebSocket message or an HTTP Bearer header. The key is never in a URL,
localStorage or a public config response. The deployment creates it as a SecureString in
`/ahara/antropy/operator-token`; `secret-paths.yml` lets the shared Komodo action inject it.
Use the environment's approved credential broker for secret-backed commands; other installations
provide credentials through their normal environment. Do not paste keys into command history.

## Private deployment and public cutover

`platform.yml` declares the native binary and enables the standard Komodo deployment. The
shared workflow compiles the binary and frontend, then the root Dockerfile packages those
artifacts into one GHCR image. `compose.yaml` pins the container to the 18 physical cores of
the private host's first socket (CPUs 0–17, NUMA node 0, hyperthread siblings excluded), runs
16 compute threads, and sets a 16 GiB memory ceiling, bounded logs and a health check. The
earlier 8 GiB ceiling killed a 65k-cell world during a save (8.2 GB peak): a save holds a full
raw checkpoint beside the live world. Pinned
threads keep world memory on one node. Measured scaling flattens well before 16 workers; see
the [scaling plan](plans/archive/SCALING-PLAN.md).
The same container serves the UI and WebSocket at the private host's port 8095. The
`biotropy-state` named volume at `/data` holds server checkpoints across redeploys; the image
creates `/data` for the unprivileged user so a new volume inherits writable ownership. A
120-second stop grace period covers the shutdown save.

Deployment runs exclusively through GitHub Actions on pushes to `main`. The project's workflow
inherits the managed `OIDC_ROLE` and `STATE_BUCKET` secrets and grants package publishing to
the workflow token. CI applies Terraform before building/pushing the image and invoking Komodo.
The shared action selects the registered Komodo server; its logs identify the selected host.

The `ahara-infra` registration supplies `komodo-deploy` and `ssm-write`, with the operator
parameter's exact `ahara/antropy/operator-token` path added to the project write scope. Publish
and verify that infrastructure pipeline before pushing the dependent application change.
These are CI permissions; terminal AWS access is neither needed nor an approved deployment path.
There is no local deployment command or manual workflow trigger. Inspect the pipeline result
and the private service before claiming successful deployment or live 32-core performance.

## Public route

Public spectators reach the server at `server.biotropy.ahara.io` through the shared ALB, the
`ahara-infra` nginx reverse proxy and the WireGuard tunnel to TrueNAS port 8095. Visitors need
no VPN client. Each layer is scoped:

| Layer | Owner | Scope |
| --- | --- | --- |
| ALB listener rules 250–251 | this repo, `alb-api-truenas` | Host `server.biotropy.ahara.io`; only `GET /stream` and `GET`/`HEAD /health` forward. Every other path, including `/api`, the bundled UI and `/execution.json`, gets the listener's default 404 |
| nginx upstream | `ahara-infra` `reverse_proxy_routes` (`auth = "internal"`) | That hostname only, to `192.168.66.3:8095`, with WebSocket upgrade and unbuffered streaming |
| Tunnel ingress | `ahara-vpn` `tunnel_service_ports` | TCP 8095 from AWS private subnets; no other new port |
| Home gateway | `ahara-vpn` `aws-proxy-to-truenas-http` flow | TCP 8095 from the AWS proxy subnets to TrueNAS only, Suricata-inspected like the other proxied services |
| Application | `biotropy-server` | WebSocket `Origin` must be same-origin or `https://biotropy.ahara.io`; spectators are read-only; operator controls need the token message; 32 concurrent viewers |

The operator HTTP API stays LAN-only because no public rule forwards `/api`. The public static
site publishes `execution.json` with `mode: server` and `wss://server.biotropy.ahara.io/stream`, so
visitors attach to the shared world by default; `?execution=browser1` or `browser4` still starts a
local world. The certificate, DNS records and listener rules are created by this repo's
Terraform. The route entry, the `alb-api-truenas` bundle and the tunnel port must deploy through
`ahara-infra` and `ahara-vpn` first.

Platform rule 8 in `ahara/INTEGRATION.md` reserves TrueNAS for owner-only workloads. The user
authorized this public spectator route on 2026-09-23 while intending to revisit the routing
pattern separately.

The [ownership contract](design/chemistry/data-ownership.md) defines both
local borrowing and the authorized network projection boundary.

## Delivery record

The archived [execution plan](plans/archive/EXECUTION-MODES-PLAN.md) records the delivery
history. Before deployment, a local publication capacity probe on one seed27 fixture with 2,000
cells (100 ticks per case, kernel stepping plus projection preparation, no network fan-out)
measured 106.2 ticks/s at four threads without publication, 98.9/99.4/99.0 ticks/s with
1/4/16 matching views and 80.0 ticks/s with 16 distinct chemical selections. Matching clients
shared four projections across four samples; distinct selections produced 64. One thread
measured 72.0 headless, 65.4 with one view and 58.3 with sixteen distinct views. These short
fixture figures do not establish the TrueNAS operating envelope or mature-world speed. The
private Komodo deployment succeeded through CI run `35637790565` at commit `d74f1ae`; volume
persistence and the public route followed at `fe0499c`.
