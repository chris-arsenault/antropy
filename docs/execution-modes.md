# Browser and native server execution

The same Biotropy UI can run a local world using one or four compute threads, or observe a
native World running independently on a server. Execution selection starts a new local world
or attaches to the server's current world; it does not transfer a simulation or its saves.
The implementation preserves v35 physical laws and the existing renderer.

## Browser

The HUD's Execution menu selects Browser 1, Browser 4 or a server address. Explicit Browser 4
requires cross-origin isolation and shared WASM memory; failure is shown rather than silently
changing the requested pool size. Browser 1 uses the serial module. Local rendering still
borrows typed-array views directly from WASM in the owning worker.

Query parameters are `execution=browser1`, `execution=browser4` or
`execution=server&server=<WebSocket endpoint>`. They contain no credential. The optional
same-origin `/execution.json` supplies a default mode and endpoint. Static public hosting
currently supplies no server default. The native host supplies `server` and `/stream`, so its
private UI opens directly onto the continuing world.

## Native host

`engine/server/` implements `biotropy-server` in the existing Rust crate. One owner thread
coordinates World and a persistent Rayon pool. Two Tokio I/O workers handle HTTP and sockets.
Requests apply between complete physical ticks. Closing a client does not pause World. A native
process restart creates a fresh seed; this feature adds no server save infrastructure.

| Setting | Default | Meaning |
| --- | --- | --- |
| `BIOTROPY_THREADS` | `32` | Compute pool size, from 1 through 32 |
| `BIOTROPY_BIND` | `0.0.0.0:8095` | HTTP and WebSocket listener |
| `BIOTROPY_SEED` | `27` | Initial world seed |
| `BIOTROPY_CONFIG` | `{}` | Existing engine configuration overrides as JSON |
| `BIOTROPY_STATIC_DIR` | `/app/public` | Built version of the same frontend |
| `BIOTROPY_ORIGINS` | empty | Comma-separated additional browser origins; same-origin is accepted |
| `BIOTROPY_OPERATOR_TOKEN` | unset | Operator credential; unset disables owner authentication |

`/health` returns the current generation, publication sequence, tick/population, throughput,
viewer count and projection count. It contains no private cellular state. `/stream` is the
version-1 WebSocket endpoint. Protocol generations and view revisions reject stale state;
uncertain commands are never automatically replayed after reconnect.

## Observation cost and access

World stepping happens once. Common status and matching display selections are encoded once
per half-second publication and shared across sockets. Each viewer has an independent
acknowledgement, a bounded request queue and local camera controls. A stalled viewer receives
no accumulating stream of old frames. Network bytes still scale with the number of viewers.

Native projections contain cell/source display records and eight derived field lanes, never
the physical 256-chemical grid or population-wide genomes. Large-world views use snapped,
padded windows, with bounded display sampling density and visible periodic cell records.
Physical mesh resolution is unaffected. Client packets stay in the renderer worker; React
receives bounded reduced observations through the existing ownership guards.

Chemical web filters and cell inspection are viewer-local. Phenotype selection, highlighting
and pinning operate on the existing run-level observer and require operator access. Spectators
can read these reports without changing the shared cohort. Charts preserve bounded sampled
history while attached; unattended gaps are not backfilled. Browser recovery controls do not
save a server world.

Operator authentication uses an explicit WebSocket message. The key is never in a URL,
localStorage or a public config response. The deployment creates it as a SecureString in
`/ahara/antropy/operator-token`; `secret-paths.yml` lets the shared Komodo action inject it.
Use the environment's approved credential broker for secret-backed commands; other installations
provide credentials through their normal environment. Do not paste keys into command history.

## Private deployment and public cutover

`platform.yml` declares the native binary and enables the standard Komodo deployment. The
shared workflow compiles the binary and frontend, then the root Dockerfile packages those
artifacts into one GHCR image. `compose.yaml` assigns a 32-CPU quota, 8 GiB memory ceiling,
bounded logs and a health check. These are deployment limits, not measured host capacity.
The same container serves the UI and WebSocket at the private host's port 8095.

Deployment runs exclusively through GitHub Actions on pushes to `main`. The project's workflow
inherits the managed `OIDC_ROLE` and `STATE_BUCKET` secrets and grants package publishing to
the workflow token. CI applies Terraform before building/pushing the image and invoking Komodo.
The shared action selects the registered Komodo server; its logs identify the selected host.

The `ahara-infra` registration supplies `komodo-deploy` and `ssm-write`, with the operator
parameter's exact `ahara/antropy/operator-token` path added to the project write scope. Publish
and verify that infrastructure pipeline before pushing the dependent application change.
These are CI permissions; terminal AWS access is neither needed nor an approved deployment path.
`make deploy` only dispatches the workflow for published `main`. Inspect the pipeline result
and the private service before claiming successful deployment or live 32-core performance.

Public route activation is deliberately excluded from this delivery: no API hostname, ALB
listener, nginx upstream, VPN rule or public frontend default is enabled. A later authorized
cutover connects the existing public ingress to the private listener and supplies the public
frontend's default server endpoint. Visitors will not need VPN clients.

The [execution plan](plans/EXECUTION-MODES-PLAN.md) tracks implementation evidence and remaining
deployment work. The [ownership contract](design/chemistry/data-ownership.md) defines both
local borrowing and the authorized network projection boundary.
