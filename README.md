# Biotropy

Biotropy is an artificial-life simulation: a two-dimensional world of single cells living in an
accounted artificial chemistry. Each cell inherits a small body and a small recurrent neural
network, senses only its surroundings and its own condition, and pays usable energy for
everything it does. Energy comes only from converting chemicals, sometimes helped by light.
Nothing scores the cells. Those that gain more than they spend grow and divide into mutated
daughters; those that cannot pay their upkeep die and return their material to the world.

The aim is a world in which a continuing evolutionary history is likely, and then to watch it
for days or weeks. No species, strategy or community is prescribed.

Watch the continuing world at [biotropy.ahara.io](https://biotropy.ahara.io). The repository is
named `antropy`.

## Core ideas

- **No fitness function.** Selection is only local survival and division.
- **Everything is funded.** Material and work are conserved except at declared boundaries;
  every capability costs biomass, maintenance or action work.
- **A real chemistry.** 256 chemicals on a smooth 16 × 16 manifold; enzymes transform them
  through one exact finite algebra; food, waste and poison are not declared.
- **Shared mathematics, few controls.** Cells, dissolved material and reservoirs obey the same
  operators; no feature gets a private rule.
- **Local information only.** Networks never see coordinates, time, lineage or a score.

Read the [white paper](docs/white-paper.md) for the question, philosophy and mathematics, and
the [outcomes and open directions](docs/outcomes-and-directions.md) for what has emerged so far.

## What you see

A new world starts paused with 48 cells of four mutable founder types in two colonies on a
720 × 540 periodic plane, with 240 renewing reservoirs spread over fractal terrain. The default
view shows terrain, contours and received light under translucent chemistry, with cells colored
by usable energy and reservoirs marked by their seasonal supply. Drag to pan, scroll to zoom and
select a cell to inspect its body, chemistry, sensors and network state. The Execution menu runs
the world in the browser on one or four threads, or attaches to the shared server world.
See the [display guide](docs/design/bacterial-display.md).

## Quickstart

```bash
rustup show
cd frontend
pnpm install
pnpm run dev      # build the WASM engine and serve the UI
pnpm run build    # production build
```

Run `make ci` from the repository root before committing. Commands, harness experiments and
persistence are described in [development](docs/development.md).

## Documentation

| Topic | Link |
| --- | --- |
| What Biotropy is and why | [White paper](docs/white-paper.md) |
| Observed outcomes and research directions | [Outcomes and open directions](docs/outcomes-and-directions.md) |
| Documentation index | [docs/README.md](docs/README.md) |
| Current work order and design owners | [docs/design/README.md](docs/design/README.md) |
| Every design direction and its status | [Design directions](docs/design/directions.md) |
| Exact laws and parameters | [Composed runtime](docs/design/chemistry/composed-runtime.md) |
| Governing principles | [docs/principles.md](docs/principles.md) |
| Architecture and execution modes | [Architecture](docs/architecture.md), [execution modes](docs/execution-modes.md) |
| Backlog and changelog | [Backlog](docs/backlog.md), [changelog](CHANGELOG.md) |
| Decisions | [Decision record](docs/design/decisions-and-evidence.md), [ADRs](docs/adr/README.md) |

Earlier implementations are preserved at tags `ant-colony-checkpoint-2026-09-09` (ant colony)
and `3d-simulation-checkpoint-2026-09-06` (3D simulation); see the
[historical records](docs/sources/history/README.md).

## License

MIT — see [LICENSE](LICENSE).
