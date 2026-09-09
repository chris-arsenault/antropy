# antropy

Antropy explores evolution in embodied, resource-limited populations. The browser runs
[top-down bacteria with heritable RNN controllers](docs/design/bacteria.md). Local nutrient uptake
funds movement, chemical release, growth and division. Daughters inherit mutated network weights;
starvation removes cells. There is no external fitness scorer or training loop.

Initial measurements establish reproduction and inherited variation, with mixed evidence of
adaptation. See [results and limits](docs/design/bacteria-results.md). Motion awaits human review.
The prior ant implementation is preserved at commit `780fa4e`, annotated tag
`ant-colony-checkpoint-2026-09-09`.

The retired 3D simulation is preserved at `3d-simulation-checkpoint-2026-09-06`.
See the [current design and work order](docs/design/README.md) and
[measured ant results](docs/certifications.md).

## Quickstart

```bash
cd frontend
pnpm install
pnpm run dev
pnpm run build
```

Run `make ci` from the repository root before committing.

Press **Run** to begin at tick zero: 48 bacteria, persistent nutrient patches, mutation enabled,
30 ticks per second. Green shows nutrient, magenta shows released chemical. Drag to pan, wheel to
zoom, and click a cell to inspect its sensors, recurrent state and task byte. Stats remain visible.
Environment and persistence controls are available below the map.

## Measurement

The bounded test suite checks mechanics and deterministic invariants. Ecological measurements
belong in the harness ledger:

```bash
cd frontend
pnpm harness bacteria --seeds 101,102 --ticks 6000 --regime persistent
pnpm harness recent --n 5
```

## Documentation

| Topic                    | Link                                                       |
| ------------------------ | ---------------------------------------------------------- |
| Documentation index      | [docs/README.md](docs/README.md)                           |
| Governing principles     | [docs/principles.md](docs/principles.md)                   |
| Current design and order | [docs/design/README.md](docs/design/README.md)             |
| Current runtime contract | [docs/design/bacteria.md](docs/design/bacteria.md) |
| Bacterial measurements | [docs/design/bacteria-results.md](docs/design/bacteria-results.md) |
| Architecture             | [docs/architecture.md](docs/architecture.md)               |
| Development              | [docs/development.md](docs/development.md)                 |
| Calibration              | [docs/calibration.md](docs/calibration.md)                 |
| Certification            | [docs/certifications.md](docs/certifications.md)           |
| Preserved sources        | [docs/sources/README.md](docs/sources/README.md)           |

## License

MIT — see [LICENSE](LICENSE).

The ant substrate is recoverable from its tag; it is not a second selectable runtime.
