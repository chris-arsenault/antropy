# Development

## Prerequisites and checks

Use Node from `.node-version`, pnpm from `frontend/package.json`, and Terraform 1.12 or newer
for infrastructure checks. Install frontend dependencies with `pnpm install` from `frontend/`.

Run `make ci` from the repository root for lint, format check, TypeScript, bounded Vitest tests,
documentation checks and Terraform formatting. `make build` produces the static SPA.
Agents edit authored files through native patch operations, including formatting changes.

`cd frontend && pnpm run dev` starts the LAN-reachable server on port 26000. Agents start it only
on explicit request. The default UI starts a new bacterial population paused at tick zero.

## Ecological measurements

The current default is [strategic ecology](design/strategic-ecology.md): finite deposits,
two foods, local interference and [50k-tick food epochs](food-epochs-study.md). New deposits
alternate between 80% A and 20% A without changing total supply. `--regime patchy` selects
the default lifetime distribution explicitly; persistent/transient
now select longer/shorter finite deposit lifetimes. Neither is an infinite spout.
Composition scheduling is independent of that lifetime setting. Disable Food epochs in the
environment settings, or omit `foodEpochs` from a resolved simulation configuration, to use
heterogeneous random compositions. Existing unscheduled saves retain that behavior.
`pnpm harness ecology-causal --seeds 201,202 --ticks 1200` runs declared small diagnostic
comparisons with mutation and learning disabled. Full initial checkpoints, source digests and
outcome series preserve their conditions; no diagnostic genotype is promoted into the browser.

`pnpm harness rps --case list` describes the producer/resistant/sensitive toxin contests;
`--case pairwise` runs three 3,000-tick pairs in both placements and `--case three-way` or
`--case invade-<strategy>` runs a registered multigeneration pilot. Settings such as
`--toxin-effort`, `--contact-damage`, `--defense-strength`, `--matrix off` and `--size` are
recorded in each manifest. `python3 harness/rps_report.py <root>` plots strategy counts over time.
See the [contest record](rps-study.md). Pilots over 3,000 ticks trace every 100 ticks.

`pnpm harness zones --case list` describes the A-specialist / B-specialist / generalist diet
contests; `--world zones|mixed`, `--shares 1,0`, `--preference off` and `--initial-nutrient`
select the world and the constructed brains. Pairwise, `three-way` and `invade-<diet>` cases
mirror the toxin contest. See the [zone record](zones-study.md).

`pnpm harness evolve --world zones|mixed --seed N --ticks T --source-rate R` runs de novo
evolution from the founder with per-cell trait samples every 1,000 ticks and checkpoints every
100,000; `python3 harness/evolve_report.py <root> [k]` clusters the final populations.
`pnpm harness invasion --checkpoint <file> --k 2 --ticks 12000` clusters a checkpoint's living
cells and runs rare-invasion contests between the cluster medoid genotypes in a fresh zoned world.
See the [evolution record](evolve-study.md).

`pnpm harness ecology-default --seeds 101,102 --ticks 3000` measures the actual Run default,
then removes injury and matrix toxin binding separately. Secretion costs and the initial founder
remain unchanged in those controls. Summaries count cells with at least 20% damage or matrix
slowing, and spatial samples preserve positions, damage, deposits and interference fields.
The default uses porous matrix (`matrixMode: "porous"`) and disables neutral signaling
(`secretionRate: 0`). Optional solid barriers require `matrixMode: "solid"`; optional signaling
requires a positive secretion rate. Both are experimental, not advertised default behaviors.

From `frontend/`:

```bash
pnpm harness bacteria --seeds 101,102 --ticks 6000 --regime persistent --output harness/artifacts/bacteria-study
pnpm harness bacteria --seeds 101,102 --ticks 6000 --regime transient --output harness/artifacts/bacteria-study
pnpm harness bacteria --seeds 101,102 --ticks 6000 --regime persistent --mutation false --learning-retention 0 --output harness/artifacts/bacteria-control
pnpm harness recent --n 5
pnpm harness sql "SELECT id, experiment, summary FROM runs ORDER BY id DESC LIMIT 5"
```

Each run starts from the same founder RNN and resolved default parameters. Mutation changes innate
behavioral and physical loci only at birth; there is no offline training or score-based parent selection.
`--mutation false` disables both random mutation blocks; acquired learning can still change offspring
genomes. `--learning-retention 0` disables that transfer; the default is one (full retention).
Use both flags with clonal transmission for a fixed-genome control. `--learning static` disables
new acquired synaptic effects and their cost, but preserves learning already encoded in inherited
weights. `--ploidy diploid --transmission selfing --crossover one-point` selects
recombined gametes from the same parent; `--reproduction budding` keeps the parent alive.
`--mutation-kind uniform` selects uniform instead of Gaussian perturbations. Unknown policy IDs
or haploid selfing are rejected. These flags select implemented mechanisms, not external trainers.
The default
step is 0.2 model seconds. Source schedules use an independent random stream, making equal-seed
mutation controls comparable. Transient patches relocate the supply locations; existing nutrient
continues to diffuse, decay and be eaten.

Runs save `run-ID.json` with summary series and spatial samples, and `checkpoint-ID.json` with
complete state. The SQLite ledger stores experiment identity, resolved configuration, source digest,
seed, outcome and elapsed time. Before/after source digests expose source changes during a run;
a run whose source changed still writes its result, checkpoint and ledger row (the process keeps
the code it loaded) and prints a warning, so editing during long runs loses nothing.
Generated dumps remain local; preserve named results deliberately
when publishing rather than adding the entire historical artifact directory.

## Descendant comparison

Use a saved bacterial checkpoint and an explicitly identified genotype:

```bash
pnpm harness bacteria-compare --checkpoint harness/artifacts/bacteria-study/checkpoint-ID.json --candidate 47 --seeds 201,202 --ticks 3000 --output harness/artifacts/bacteria-competition
```

Replace the path and candidate with values from that run. The assay compares the original ancestor
with the selected observed whole-organism genotype, both mutation blocks and learned-weight transfer
disabled and clonal transmission fixed, in both nutrient regimes. Each seed runs
both assignments of genotypes to the same founder positions. Candidate selection is a diagnostic
choice; the assay never installs a winner in the browser. Record selection method and held-out seeds.
A surviving mutant or increased genome count alone does not establish adaptation. Artifacts embed
both whole-organism genome encodings/hashes, source-checkpoint hash and manual interventions,
so the compared chromosomes remain identifiable after the input file is moved. Source history is
preserved even though the competition itself starts new bodies. Both genotypes receive the same
reference founder material stocks; differing construction targets develop through paid growth.
The assay does not copy a candidate's acquired traces or mature body from the source checkpoint.

`--candidate representative` uses the declared attribution rule: largest founder lineage, then its
middle living descendant sorted by birth tick and organism ID. The artifact embeds the selected
organism and rule. The ancestor follows that genotype's parent chain to its founder. Competition
series also store sampled resolved motor/chemical efforts, energy, stored food and nutrient readings;
these are census snapshots, not individual lifetime energy balances. See the
[historical attribution panel](sources/history/2026-09-10/design/evolution-attribution.md) before interpreting founder dominance.

## Queryable adaptation studies

The [registered study](overnight-study.md) uses the actual exported browser population. Its CLI
runs the same `stepWorld` kernel with an optional observer; it does not run a browser or train brains.
From `frontend/`:

```bash
pnpm exec tsx harness/lib/studyCli.ts --checkpoint ../.sulion-paste/bacteria-101-48661.json --run full-101 --seed 101 --ticks 50000
python harness/study_sql.py load harness/artifacts/adaptation-2026-09-10/full-101 harness/artifacts/adaptation-2026-09-10/study.duckdb
python harness/study_sql.py query harness/artifacts/adaptation-2026-09-10/study.duckdb "SELECT run, channel, sum(amount) FROM flows GROUP BY run, channel"
python harness/study_report.py harness/artifacts/adaptation-2026-09-10/study.duckdb harness/artifacts/adaptation-2026-09-10/report.json
```

Use a new `--run` name for each measurement; existing evidence directories are rejected.
`--frozen true` disables both mutation blocks and acquired-weight inheritance while retaining private
plasticity. `--mode contest --candidate 895 --seed 201 --swap true --ticks 6000` starts common founder
bodies in the exported patchy environment and assigns ancestor/candidate to alternating positions.
`--part behavior` or `physical` retains that candidate component and replaces the other with founder
genes. `--mode resume` preserves the exported community, resets all private brain state in both arms
and freezes further inheritance changes. `--replace founder` replaces the living lineage-18 genomes;
`behavior` and `physical` retain only that inherited component. Bodies and fields stay funded and intact.
`--knockout damage` or `binding` removes that physical effect while retaining costs. These are diagnostic
interventions recorded in run flags, not browser defaults or population-selected policies.

`schema.json` specifies versioned SQL column types and dimensional flow channels. `flows.jsonl`
aggregates exact resolver transactions by organism/channel in 100-tick windows. `life.jsonl` records
birth/division/death identities; `census.jsonl` records sampled living state; `genomes.jsonl` preserves
encoded inherited records. `exposure.jsonl` integrates pre-step exposure over acting organism-seconds.
Its action/sensor integrals describe the previous resolved decision at each step, including zero
newborn action. `environment.jsonl` samples coverage and conservation residuals. No movement trace
or field raster stream is needed for these hypotheses. Organism and genome IDs are local to each run.

The importer requires Python DuckDB (tested 1.5.2), accepts only completed manifests and uses a
transaction plus unique run IDs. Empty tables retain their declared types. Local generated JSONL
is bounded in memory, not duration; the CLI caps each run at 50,000 ticks. The existing SQLite ledger
remains the run registry. Query reports embed the SQL and analysis-source hash. Raw amounts remain
available for balances; ecological claims use world-area, organism-time and resource-budget shares.

The [registered motor/toxin panel](strategy-study.md) uses `python harness/strategy_batch.py toxin`
and `python harness/strategy_batch.py motor` from `frontend/`. These fixed panel names are
append-only, with two concurrent processes and 6,000/20,000-tick horizons. Individual new assays
can use `studyCli.ts --mode motor --environment scheduled --lifetime 100 --spacing 24 --ticks 20000`
with a fresh `--run` and `--output`. The calendar supplies equal A/B material independently of
organisms; its complete finite-deposit schedule is retained in the manifest. Only motor construction
targets differ between variants. `bodies.jsonl` records actual motor/core stocks and speed ceilings.
`python harness/strategy_report.py harness/artifacts/strategies-2026-09-10` loads completed runs
into local DuckDB and writes the query-bearing report. None of these diagnostics replaces browser
founders or changes reproduction into a scored selection process.

## Capacity

```bash
pnpm harness bacteria-capacity --population 2000 --ticks 100 --output harness/artifacts/bacteria-capacity
```

This initializes the requested bodies on the standard field. It measures load, not the environment's
ability to sustain that census. It does not resize supply or grant continuing free resources.
The [initial measurements](design/bacteria-results.md) report the resulting throughput limit.

## Persistence and diagnostic inspection

The UI supports explicit local save/restore and file import/export. Checkpoints preserve both
ancestry graphs, fields, separate environment/body/genetic random streams, receptor state, private
recurrent/task/plastic state, actual machinery, nutrient material, usable energy and durable manual
interventions. The current schema is version 5. Versions 1–4
bacterial files and ant files are rejected explicitly; they lack the corrected state contract.
New sessions do not auto-load a checkpoint. Initial v1 experiment files remain historical evidence.

Select a cell to inspect all thirty-five input channels, actual stocks versus construction targets, inherited loci,
acquired traces, hidden values, resolved physical efforts and
task history. Manual register changes remain logged even after the recent-event buffer rolls over,
and stats label the population a diagnostic run. Field layers, inspection
and performance measurements do not enter the RNN.

## Verification boundary

ESLint limits cyclomatic and cognitive complexity to 10, files to 400 lines and functions to 75.
Vitest covers bounded conservation, sensor causality, contact, inheritance, UI defaults and exact
checkpoint continuation. Multi-generation results belong in the harness ledger. Human review
judges trajectories; agents inspect browser startup configuration without running browser assays.

The current ant-free runtime replaces the tagged implementation. Historical ant documents and
ledger rows remain evidence, but their retired training commands are not available in this checkout.
Recover those tools from `ant-colony-checkpoint-2026-09-09` when explicitly needed.

## Deployment

`scripts/deploy.sh` is parameterless. It builds the frontend and applies the static-site Terraform
root. The shared workflow performs deployment from `main`; local development needs no cloud resources.
