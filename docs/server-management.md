# Native server HTTP management

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
| `GET /api/status` | Current generation, tick, seed, effective config, population, running state, speed, thread count and stop reason |
| `POST /api/control` | Apply a control and return `{status, value}` from the same tick boundary |
| `GET /api/checkpoint?generation=N` | Download an uncompressed physical checkpoint as `application/octet-stream` |
| `GET /api/checkpoints` | List stored checkpoints, newest first, with `compatible`, byte use, budget, limits and autosave period |
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

## Checkpoint cost and format

Export captures the ordinary versioned Rust physical checkpoint, including cells, genomes,
chemistry, parentage, seed and configuration. It can be read by `World::restore` and physical
checkpoint analysis tooling. It is not a browser recovery envelope and contains no UI chart
history or transient observer caches. There is no HTTP upload endpoint; restore uses checkpoints
already in the server's store.

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

Only one export can be queued, encoded or held by HTTP I/O at once. Its serialization buffer is
capped at 256 MiB; an oversized export fails explicitly. Response bytes share that allocation;
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
and cancellation. Store tests cover retention, the manual quota, id validation, partial-write
cleanup, launch restore past incompatible and corrupt checkpoints, autosave skipping unchanged
worlds, and operator save/list/load/delete through HTTP. These tests do not claim that the
updated API has been deployed.
