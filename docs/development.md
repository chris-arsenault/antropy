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
seed, outcome and elapsed time. Before/after source digests expose source changes during a run.
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
interventions. The current schema is version 4. Versions 1–3
bacterial files and ant files are rejected explicitly; they lack the corrected state contract.
New sessions do not auto-load a checkpoint. Initial v1 experiment files remain historical evidence.

Select a cell to inspect all nineteen input channels, actual stocks versus construction targets, inherited loci,
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
