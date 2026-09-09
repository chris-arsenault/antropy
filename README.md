# antropy

Antropy is a browser-based two-dimensional artificial-life simulation. The default world runs a
frozen recurrent controller whose workers gather food, sustain a queen, raise brood, and die. Population
changes through locally funded eggs, larvae and pupae; it is not held at a target count.

Every worker runs the same local algorithm. Food, crops, reserves and development obey an explicit
energy ledger. Earlier learned controllers failed their survival gates; the
[task-memory study](docs/design/task-memory.md) produced a frozen model passing six reserved worlds
under the previous terrain physics. The current [cellular terrain study](docs/design/cellular-terrain.md)
changes the map and support/transport model while keeping those weights fixed. The browser opens
a compact nest in a deeper, tiered world at tick zero. Programmed and map-aware controls remain
selectable. Genetics, digging actions and retraining remain off.

See [the physical colony design](docs/design/programmed-colony.md) and
[measured results](docs/certifications.md).

The retired spatial simulation is preserved at the annotated tag
`3d-simulation-checkpoint-2026-09-06`; it is not a runtime mode.

## Quickstart

```bash
cd frontend
pnpm install
pnpm run dev
pnpm run build
```

Run `make ci` from the repository root before committing.

Press **Run** to begin. Drag the map to pan, use the wheel to zoom, or choose **Fit colony** and
**Fit world**. The **Terrain** selector restarts the same seed on a reference, compact or tiered map.

## Measurement

The bounded test suite checks mechanics and deterministic invariants. The multi-trip comparison
belongs in the harness ledger:

```bash
cd frontend
pnpm harness colony-survival --seeds 1,2,3 --ticks 40000
pnpm harness recent --n 5
```

## Documentation

| Topic                    | Link                                                       |
| ------------------------ | ---------------------------------------------------------- |
| Documentation index      | [docs/README.md](docs/README.md)                           |
| Governing principles     | [docs/principles.md](docs/principles.md)                   |
| Current design and order | [docs/design/README.md](docs/design/README.md)             |
| Canonical 2D contract    | [docs/design/2d-migration.md](docs/design/2d-migration.md) |
| Architecture             | [docs/architecture.md](docs/architecture.md)               |
| Development              | [docs/development.md](docs/development.md)                 |
| Calibration              | [docs/calibration.md](docs/calibration.md)                 |
| Certification            | [docs/certifications.md](docs/certifications.md)           |
| Preserved sources        | [docs/sources/README.md](docs/sources/README.md)           |

## License

MIT — see [LICENSE](LICENSE).

Use **Environment** to toggle nest shape, terrain features, support and chemical behavior independently, then **Apply and restart**. The original physical rules are a selectable preset; the default retains the tiered terrain. See the [architecture review](docs/design/modular-runtime.md).
