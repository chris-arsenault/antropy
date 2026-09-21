# Local experimental evidence

Experimental data stays in Git-ignored files. The local SQLite run ledger now lives at
`frontend/harness/artifacts/ledger.db`, alongside ignored run output. New checkpoints,
genome samples, traces, raw reports and generated plots belong under that artifact root.

Existing raw files in this directory remain in place locally, but are no longer tracked.
Only authored `README.md` notes under `docs/evidence/` remain version controlled. Written
analyses, negative findings, registrations and reproduction instructions elsewhere in
`docs/` remain tracked. Earlier instructions to copy raw evidence here for publication
are superseded by this policy.

A fresh checkout contains the written record without experimental payloads. Links to raw
evidence are useful when those local files are available and are optional for documentation
checks. CI still checks authored document links and rejects raw experiment files in the
Git index. Missing local data is not evidence that an experiment was rerun or reproduced.

The cleanup preserves local files and removes their current index entries. Historical Git
commits still contain previously published data; no history rewrite is part of this change.
