# Session slowdown and recovery — September 20, 2026

## Question and bounded investigation

The user reports approximately 8 ticks/second before reloading and 40 ticks/second after
reloading the same saved world. The checkpoint alone cannot recover the old JavaScript heap,
graphics driver state, open panels or runtime-only observer state. This observation therefore
does not by itself identify garbage collection as the cause.

Compare three explanations: retained JavaScript/browser allocations, optional observation work
discarded on reload, and physical work that accumulates in runtime-derived buffers. Inspect
ownership/lifetimes before changing simulation mathematics. The existing v32 seed27 checkpoint
at tick83,980 supplies a mature 3,774-cell workload; no new ecological campaign is needed.

Registration: run the existing `integratedCost.ts` closed/active observation comparison on that
checkpoint, ten warmup and100 measured ticks per arm,30-second measurement cap. Then use an
isolated Chromium profile on the existing localhost:26000 server for at most180 seconds of
measurement and1,500 additional ticks. Compare ordinary execution, forced JavaScript collection,
optional measured-flow observation, repeated saves and checkpoint restoration. Record JavaScript
heap, WASM high-water memory, worker stage times and actual ticks advanced. Stop on runtime error
or budget. Preserve negative findings; no parameter sweep or longer ecology run follows.

The user's tab and storage are not accessed. Forced collection is diagnostic only; it must not
become a production timer or conceal an unresolved leak. Short software-rendered measurements
cannot certify the user's GPU, a many-hour session or the exact reported fivefold difference.

## Findings

The registered headless comparison completed: ledger4233, observer closed,17.79 ticks/s;
ledger4234, measured observation active,15.95 ticks/s. Both advanced the same100 measured
ticks after ten warmups. Closed stage totals were4,926.64ms stepping,616.46ms census,
32.62ms render preparation and17.01ms inspection. Active totals were5,652.27/545.78/31.93/14.22ms.
That roughly10% throughput penalty does not explain a fivefold reload difference. Local full
results are in `frontend/harness/artifacts/session-runtime-cost/report.json`.

The isolated browser completed538 ticks across six sequential windows, ending at84,518.
[Scalar evidence](evidence/digital-chemistry/session-runtime/browser-summary.json) records actual
worker stage times, JS heaps and WASM high-water allocation. These short windows include normal
autosaving and software-rendered presentation. They are diagnostic sequences, not matched
hardware capacity comparisons or a many-hour reproduction.

| Window | Ticks / wall seconds | Simulation ms/tick | WASM MiB |
| --- | ---: | ---: | ---: |
| Fresh profile, restored checkpoint, measured observer closed | 102 / 10.03 | 62.83 | 657.8 |
| Measured chemical web enabled | 91 / 10.29 | 68.86 | 817.9 |
| Observer closed again | 99 / 10.21 | 64.80 | 817.9 |
| After four manual saves | 83 / 10.46 | 69.41 | 817.9 |
| After forced main/worker JavaScript collection | 80 / 10.17 | 70.04 | 817.9 |
| Saved and restored inside the same worker | 83 / 10.49 | 69.99 | 1,035.9 |

Forced collection did not improve throughput. Main JS used heap ranged4.8–20.8MiB and
collected naturally; worker JS stayed roughly2.0–2.6MiB. React timing counts were zero in
every sample, so the previously repaired development timing leak did not recur here.
ArrayBuffer backing storage is separate: worker samples ranged about114–272MiB around saves.
The latter three explicit manual saves took2.44–2.57 seconds; the first took4.66 seconds
and could queue behind the ordinary pause save. Compression/storage and synchronous encoding
are not separated by that total.

WASM memory grew and did not shrink after collection or same-worker restore. Code inspection
shows that restore constructs/validates a replacement while retaining the current world for
failure safety; temporary input, decoded world and prior world can overlap. Freed allocations
remain reusable inside the instance, but JavaScript collection does not shrink its linear
memory. A page reload discards that instance. This is a plausible contributor to resident-memory
pressure, not proof that high-water allocation caused the user's fivefold slowdown. The measured
observer/save window also overlaps automatic saves, so its allocation increase is not attributed
to the observer alone.

## Ownership audit and disposition

Frame requests, GPU completion, observation delivery and cold-operation queues are bounded.
Chart, recent and spatial histories have caps. Field activity work lists reuse cleared scratch;
flux collection uses fixed recent windows and drops dead-cohort membership. The inspected paths
showed no unbounded collection explaining the reported symptom. IndexedDB enumeration still
reads records containing Blob handles; this was not shown to load all blob bytes or leak them.

No simulation formula, history cap or speculative production GC timer was changed for this
investigation. The save-retention repair is independently demonstrated and remains included.
The fivefold report remains unresolved because its pre-reload heap, stage timings and graphics
state were not captured. A useful next comparison is the same slow live session's scalar runtime
report and browser allocation/profile data immediately before and after reload; opening panels,
pausing/saving and replacing only the world must be distinguished from replacing the process.

Two preliminary harness attempts failed before importing or advancing the checkpoint: the
injected status accessor assumed initialization, then navigation lacked `Page.enable`. Both
were corrected in the diagnostic runner. They are harness failures, not simulation failures.
The completed check used the existing server and isolated storage; it did not touch the user's run.
