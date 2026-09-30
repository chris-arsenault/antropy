# antropy

Antropy builds a world where diverse ecosystems and evolutionary adaptation are likely to arise.
The intended use is to run a population for days or weeks and watch its history unfold. Development
uses hypotheses and small physical proof points to prepare that world, without prescribing species,
precomputing a winning community or requiring an agent coexistence campaign before handoff.

The browser runs [cells with local heritable RNNs](docs/design/bacteria.md) in a
[digital chemical world](docs/design/chemistry/README.md). A smooth 16 × 16 chemical space supplies
potential energy, diffusion, impedance and stress. Each cell has four receptors, four transporters,
one to eight enzyme programs and inherited membrane compatibility. Genes express these
[capacities directly at current biomass](docs/design/funded-bodies.md); internal chemical
inventory and usable energy fund movement, reactions, repair, learning, growth and division.
Maintenance rises with age, more slowly for cells with a larger core fraction.
No external fitness scorer or named food/toxin/matrix pathway selects ecological roles.
Shared material attraction and repulsion, reversible retention and public chemical transformations
support changing local habitats. Finite reservoirs move, evolve their replenishment mixtures and
release on local seasonal clocks. Persistent fractal terrain sets elevation, conductance and
overhead shade ([geography](docs/design/persistent-geography.md),
[seasons](docs/design/local-resource-seasons.md)). Composed illumination funds chemical
transformations; cells can invest in photoreceptors, overhead film and local emission
([light ecology](docs/design/light-ecology.md)). External replenishment remains active; the
world is an open system.

[Short constructed probes](docs/material-habitats.md) test physical opportunities and costs.
They do not prove evolved cooperation, persistent diversity or successful colonization.
One Rust kernel serves the browser, experiments and a native server. The browser runs it as WASM
serially or on a four-thread Rayon pool over shared memory; rendering borrows WASM buffers
in the same worker through OffscreenCanvas/WebGL2, and full chemistry does not cross to React.
The public site attaches spectators to one continuing native server world
([execution modes](docs/execution-modes.md)). Throughput figures are in
[calibration](docs/calibration.md#calibration-throughput).
The user reports promising dense colonies; the [checkpoint review](docs/material-habitats-review.md)
records differentiation and continuing feedstock dependence.
See the [current work order](docs/design/README.md); historical coexistence claims retain their
[corrections](docs/analysis-correction.md).
The prior ant implementation is preserved at commit `780fa4e`, annotated tag
`ant-colony-checkpoint-2026-09-09`.

The retired 3D simulation is preserved at `3d-simulation-checkpoint-2026-09-06`.
See the [historical records](docs/sources/history/README.md).

## Quickstart

```bash
rustup show
cd frontend
pnpm install
pnpm run dev
pnpm run build
```

Run `make ci` from the repository root before committing.

Press **Run** to begin at tick zero: 48 bacteria in two separated starting colonies in a 720 × 540 world,
240 mobile renewing reservoirs across 35 regions, with local chemical mixtures and mutation enabled. Four mutable founder types seed a chemical circuit in each colony. The UI requests
30 ticks/s, with a maximum-speed option; actual throughput depends on workload. The HUD's
Execution menu selects Browser 1, Browser 4 or a server world.

The default landscape combines terrain ground, elevation contours, received-light shade,
translucent energy-per-material chemistry, usable-energy cell colors and seasonal reservoir
bands, with a permanent legend; diagnostic maps and trait colors remain selectable. Drag to pan,
wheel to zoom and select a cell to inspect its genetic capacities at current biomass, mixtures,
sensors, recurrent state and private byte. The dock holds observation, phenotype, environment,
inheritance and persistence windows. See the [display guide](docs/design/bacterial-display.md).

The default is haploid clonal fission with paid plasticity and full learned-weight retention;
diploidy, selfing, crossover, mutation operators, budding and learning retention are
configurable. Physical checkpoint v46 rejects older versions; the browser observation package
remains v11. Recovery saves every 30 seconds while running and on pause; restores start paused.
Export a file for a separate copy. A failed recovery save warns while the simulation continues.

## Measurement

The bounded test suite checks mechanics and deterministic invariants. Choose a hypothesis and a
small probe before launching an ecological measurement. Saved measurements belong in the harness
ledger; they support a configuration decision rather than completing the user's long observation:

```bash
cd frontend
pnpm harness chemical-opportunities --case list
pnpm harness recent --n 5
```

## Documentation

| Topic                    | Link                                                       |
| ------------------------ | ---------------------------------------------------------- |
| Documentation index      | [docs/README.md](docs/README.md)                           |
| Governing principles     | [docs/principles.md](docs/principles.md)                   |
| Current design and order | [docs/design/README.md](docs/design/README.md)             |
| Current runtime contract | [docs/design/bacteria.md](docs/design/bacteria.md) |
| Browser and server execution | [docs/execution-modes.md](docs/execution-modes.md), [server management](docs/server-management.md) |
| Architecture             | [docs/architecture.md](docs/architecture.md)               |
| Development              | [docs/development.md](docs/development.md)                 |
| Default scales and throughput | [docs/calibration.md](docs/calibration.md)            |
| Backlog                  | [docs/backlog.md](docs/backlog.md)                         |
| Changelog                | [CHANGELOG.md](CHANGELOG.md)                               |
| Architecture decisions   | [docs/adr/README.md](docs/adr/README.md)                   |
| Historical proof points  | [Habitat results](docs/material-habitats.md), [session costs](docs/session-runtime-review.md), [source results](docs/design/chemistry/mobile-source-results.md) |
| Historical certification (September 10–13) | [docs/certifications.md](docs/certifications.md) |
| Preserved sources        | [docs/sources/README.md](docs/sources/README.md)           |

## License

MIT — see [LICENSE](LICENSE).

The ant substrate is recoverable from its tag; it is not a second selectable runtime.
