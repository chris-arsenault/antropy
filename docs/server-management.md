# Native server HTTP management

**Status:** Current reference — authenticated LAN-only `/api` for status, controls, diagnostics and stored checkpoints on the native server.

The native server exposes management independently of `/stream`. Requests share the existing
32-command queue and execute on the World owner between complete ticks. No viewer needs to be
connected. WebSocket controls used by the UI remain available.

## Access

Every `/api` request requires `Authorization: Bearer <operator-token>`, using the existing
`BIOTROPY_OPERATOR_TOKEN`. An unset token disables management. Credentials never belong in URLs.
Responses use `Cache-Control: no-store`; no cross-origin HTTP access is enabled.

The listener is the private service at `http://192.168.66.3:8095`. The public route
`server.biotropy.ahara.io` forwards only `GET /stream` and `GET`/`HEAD /health`, so `/api` is
reachable only on the LAN ([public route](execution-modes.md#public-route)). The application
does not infer trust from source IPs. Operator controls on `/stream` still require the token.

Use `with-cred --` for secret-backed commands in the managed environment. The broker exposes
the operator token to client commands as `BIOTROPY_TOKEN`; `BIOTROPY_OPERATOR_TOKEN` is the
server's own setting. Other installations provide the client token through their normal
environment. This reads status without placing the key in argv:

```bash
with-cred -- python3 -c 'import os, urllib.request; r = urllib.request.Request("http://192.168.66.3:8095/api/status", headers={"Authorization": "Bearer " + os.environ["BIOTROPY_TOKEN"]}); print(urllib.request.urlopen(r).read().decode())'
```

## Endpoints

| Method and path | Result |
| --- | --- |
| `GET /api/status` | Current generation, tick, seed, effective config, population, running state, speed, thread count, stop reason and, with storage, `persistence.lastSave` (the most recent save attempt: reason, tick, `ok`, record or error) |
| `GET /api/diagnostics` | Restart evidence from the state volume: this boot with the previous process's last heartbeat and any panic record, live memory, current heartbeat and recent boots |
| `GET /api/ecology` | Current physical accounts and bounded durable supply, paid-flow, reproduction, death and recovery history, including coverage and persistence status |
| `POST /api/control` | Apply a control and return `{status, value}` from the same tick boundary |
| `GET /api/checkpoint?generation=N` | Download an uncompressed physical checkpoint as `application/octet-stream` |
| `GET /api/checkpoints` | List stored checkpoints, newest first, with `compatible`, byte use, budget, limits and autosave period |
| `GET /api/checkpoints/{id}` | Download stored physical bytes without loading or changing the live world; headers identify the stored checkpoint, generation, tick and format |
| `POST /api/checkpoints` | Body `{"generation":N}`; store a manual checkpoint and return its record (201) |
| `POST /api/checkpoints/{id}/load` | Body `{"generation":N}`; replace the world with a stored checkpoint and return `{status, checkpoint}` |
| `DELETE /api/checkpoints/{id}` | Remove a stored checkpoint (204) |

`/health` remains an unauthenticated, cheap publication summary. `/api/status` obtains current
owner state rather than the half-second display sample. `speed: null` means maximum throughput.

Controls require JSON with `generation`, `op` and `payload`. Read the generation from status;
restart increments it. A stale generation returns HTTP 409 without applying the request.

| `op` | `payload` | Effect |
| --- | --- | --- |
| `running` | `{"value":false}` or `{"value":true}` | Pause or resume |
| `step` | `{}` | Pause and advance one complete tick |
| `speed` | `{"value":"max"}` or a value of 1, 10, 30, 60, 120 | Set the target tick rate |
| `restart` | `{"seed":28,"config":{}}` | Replace the world with the selected seed/config and start running |
| `task` | Existing task command payload | Apply the existing operator task control |
| `phenotype` | Existing phenotype action payload | Apply run-level selection, highlighting or cohort controls |

For example, a pause body is:

```json
{"generation":1,"op":"running","payload":{"value":false}}
```

Config uses the engine's existing camelCase fields. Omitted fields take engine defaults, not
values from the running world. To change selected settings, read `status.config`, edit that
object and send it with `restart`. Configuration changes start a new world; this API does not
mutate physical parameters mid-run. Invalid restart configuration leaves the old world intact.
Restart resets speed to maximum and returns its new generation and tick zero before stepping.

For an explicit request to tune or stabilize the world, selecting configurations and restarting
unsuitable or empty runs are already authorized. The user does not require old-world preservation
for that work. Keep bounded operating evidence, apply the selected configuration and leave the
populated world running; do not ask for separate restart permission within that scope.

## Checkpoint cost and format

Export captures the ordinary versioned Rust physical checkpoint, including cells, genomes,
chemistry, parentage, seed and configuration. It can be read by `World::restore` and physical
checkpoint analysis tooling. It is not a browser recovery envelope and contains no UI chart
history or transient observer caches. There is no HTTP upload endpoint; restore uses checkpoints
already in the server's store.

## Restart diagnostics

With storage configured, the server keeps `diagnostics/` on the state volume. The World owner
writes `heartbeat.json` every minute with generation, tick, population, running state, the last
save outcome, and memory: process resident and peak bytes, plus container usage, limit and
out-of-memory kill count from cgroup v2 when present. A panic hook writes `panic.json` with the
message, thread, memory and backtrace before the release build aborts. Each boot appends a record
to `boots.jsonl` (the last 50 are kept) carrying the previous process's final heartbeat and panic
record, then clears the panic record.

Read a restart from `/api/diagnostics` without container logs:
- A panic record means a crash.
- Memory near the container limit, or a raised out-of-memory kill count, points to a kill.
- A recent heartbeat with neither indicates an external stop or restart.

A clean stop also saves first, so its newest checkpoint appears in the store.

## Ecology diagnostics and investigation capture

Ordinary native startup enables private ecology collection independently of spectators.
`GET /api/ecology` reports the current tick and cumulative physical ledger, population,
biomass, cell energy, reservoir stock and mortality recovery state. Every250 ticks (50 model
seconds at the default dt0.2), it retains source neighborhoods with resident population and
paid-flow windows, local division/death counts, stock, nominal refill allowance, wait, rate,
release, recovery and the eight largest mixture shares. Source neighborhoods group cells by
their nearest reservoir at sampling time; they do not establish colonies or migration.
At most256 neighborhoods appear in one point; larger sets rotate through source order and
report total and omitted counts. Global accounts still cover the whole world.
Resident windows include current and previous250-tick windows and can contain activity from
elsewhere. Global cumulative ledger differences give exact interval totals; resident windows
overlap between points and must not be summed as independent intervals.
`rate` is material per local supply second; `wait`, `emptyElapsed` and accrued supply time
use that reservoir's seasonal clock, not wall time or necessarily model time. The local
`supplyMultiplier` shows its current speed relative to model time. `allowance` is a nominal
release clock measured in material units, separate from owned `stock`. `recentRecovery` and
`recentOutput` are exponentially decayed material totals on the configured mortality memory,
not cumulative counters or interval quantities. `totalReleased` is cumulative material.

Sampled division/death records capture the cell's full private state and genotype, birth
energy/body/inventory, recent and previous paid-flow accounts, pre-spill local chemistry and
up to eight overlapping reservoirs with full compositions. Division records include the
existing material, energy and work requirements before payment. Death records show actual
recovered bound body material separately from free inventory. Existing cells at observer
startup have unknown birth context. Above64 observed cells, only the first ending per250
ticks is detailed; at64 or fewer, all endings are detailed subject to retention limits.
All endings are counted. Sampling, expiration and byte-limit drops are explicit.

Each process startup and world replacement starts a new coverage segment, retaining at most
three. Each keeps up to512 recent points within8 MiB, up to256 progressively coarsened points
within4 MiB, and up to64 detailed endings within4 MiB. Actual point counts can be lower at the
byte limit. Extinction forces a terminal point; later empty ticks do not replace populated
evidence. New diagnostics cannot reconstruct previously unobserved time. They remain outside
physical checkpoint v53 and spectator/display packets.

With state storage, snapshots go to `diagnostics/ecology.json.gz` every30 wall seconds when
changed, on world replacement/extinction, and at clean shutdown. Compression and synced atomic
replacement run outside the World owner. Raw history is capped at64 MiB. Save failures preserve
the last good file and appear in `persistence.lastSave`; restore failures appear in
`history.loadError`. Abrupt termination can lose observations since the last completed save.
Without state storage, collection and the API work in memory for the current process.

Capture all operator evidence using the maintained harness command, from `frontend/`:

```bash
with-cred -- pnpm harness server-review --checkpoint latest-living
```

It reads status, restart diagnostics, ecology history and the stored checkpoint index, optionally
downloads the newest compatible living checkpoint, then reads status again. Every request is
GET; the world keeps its running state, speed and generation. `--checkpoint none` (the default)
omits physical bytes; a stored ID selects that checkpoint, including an older format for offline
inspection. Stored download headers identify the saved generation/tick/version, which can differ
from the current world. No checkpoint load is needed, and incompatible bytes are never migrated.

`--server` accepts an HTTP(S) origin, defaulting to the private listener. Output defaults to a
new timestamped directory under `harness/artifacts/`; `--output` must stay within that ignored
local tree. The capture has a120-wall-second deadline and512 MiB total streamed-byte budget;
use `--wall-seconds` and `--max-mib` to set explicit limits. Each JSON response has a64 MiB cap;
physical bytes have the server's2 GiB cap. `capture.json` records completion, routes, byte counts,
SHA256 hashes and checkpoint headers. Requests occur at separate ticks: compare before/after
status and use each record's own tick and coverage segment. Failures leave a clearly incomplete
capture and any partial local files, stop without retry, and never seek another credential.
HTTP404 for the ecology or stored-download endpoint means this API has not yet been deployed
on that server. The command never uploads generated data.

## Stored checkpoints

With `BIOTROPY_STATE_DIR` configured, the server keeps compressed checkpoints on its volume,
saves automatically and resumes at launch ([server persistence](execution-modes.md#server-persistence)).
Without it, the `/api/checkpoints` endpoints return 501.

A manual save captures on the owner thread between ticks, then compresses and writes while the
world keeps running; the request returns after the file is durable. It shares one save slot
with automatic and shutdown saves, and a busy slot returns 503. Eight manual checkpoints are
kept until deleted; a ninth manual save returns 507. Automatic checkpoints expire by count and
byte budget.

Load reads and decompresses on a blocking thread, then restores between ticks. Like `restart`,
it increments the generation, sets maximum speed and runs; stale generations return 409. Only a
checkpoint whose recorded physical format matches the server can load; others return 400 and
remain listed with `compatible: false` until deleted. Unknown ids return 404. Stored ids contain
only lowercase letters, digits and hyphens.

```bash
with-cred -- python3 -c 'import os, json, urllib.request; r = urllib.request.Request("http://192.168.66.3:8095/api/checkpoints", headers={"Authorization": "Bearer " + os.environ["BIOTROPY_TOKEN"]}); print(json.dumps(json.load(urllib.request.urlopen(r)), indent=1))'
```

Serialization occupies the owner thread, so ticks wait while encoding. Once encoding finishes,
network transfer proceeds independently and the world continues according to its running state.
Pause first if an exact stopped tick is needed. Response headers `X-Biotropy-Generation` and
`X-Biotropy-Tick`, and the download filename, identify the captured state.

Only one checkpoint or ecology export can be queued, encoded or held by HTTP I/O at once. A checkpoint serialization buffer is
capped at 2 GiB; an oversized export fails explicitly. The same raw cap bounds stored saves and
loads. A 12.8k-cell world measured 588 MB raw, about 45 KB per cell, mostly genotypes and cells.
The earlier 256 MiB cap made every save of that world fail. Response bytes share that allocation;
there is no World clone, JSON/base64 conversion, server disk write or retained snapshot history.
The export slot is released when its last buffer reference is dropped, including disconnects.

## Failure handling

Requests have a 16 KiB body limit. Missing/invalid credentials return 401; unsupported operations
or invalid controls return 400; malformed JSON can return 400/422; stale generations return 409.
A full command queue or occupied export slot returns 503. Export budget failure returns 507.
Commands time out after 30 seconds with 504 and an **unknown outcome**: inspect status before
retrying. A request canceled before execution is skipped; cancellation after execution begins
cannot undo a control. Neither transport automatically replays uncertain commands.

Native HTTP tests cover authentication, operation without viewers, restart validation and stale
generations, checkpoint restoration, byte limits, and export ownership through slow consumption
and cancellation. Store tests cover retention (including the newest living checkpoint), the manual quota, id
validation, partial-write cleanup, preservation of data with unreadable sidecars, launch restore
past incompatible and corrupt checkpoints, launch failure when none restores, autosave skipping unchanged
worlds, and operator save/list/load/delete through HTTP. Deployment is checked separately
through the shared CI/CD run and the live management endpoints.
