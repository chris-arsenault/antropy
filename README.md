# antropy

Antropy builds a world where diverse ecosystems and evolutionary adaptation are likely to arise.
The intended use is to run a population for days or weeks and watch its history unfold. Development
uses hypotheses and small physical proof points to prepare that world, without prescribing species,
precomputing a winning community or requiring an agent coexistence campaign before handoff.

The browser runs [cells with local heritable RNNs](docs/design/bacteria.md) in a
[digital chemical world](docs/design/chemistry/README.md). A smooth 16 × 16 chemical space supplies
potential energy, diffusion, impedance and stress. Each cell has four receptors, four transporters,
four unary enzymes and inherited membrane compatibility. Actual installed material, internal
chemical inventory and usable energy fund movement, reactions, repair, learning, growth and division.
No external fitness scorer or named food/toxin/matrix pathway selects ecological roles.
Shared material attraction and repulsion, reversible retention and public chemical transformations
support changing local habitats. Resource reservoirs move and evolve their replenishment mixtures
with the local medium. Composed illumination funds chemical transformations; cells can invest in
local photoreceptors. External replenishment remains active; the world is an open system.

[Short constructed probes](docs/material-habitats.md) test physical opportunities and costs.
They do not prove evolved cooperation, persistent diversity or successful colonization.
One Rust/WASM kernel serves the browser and experiments. Rendering borrows WASM buffers in the
same worker through OffscreenCanvas/WebGL2; full chemistry does not cross to React. Integrated
headless fixtures reach63.78/32.00 ticks/s at48/2,000 cells; the mature3,774-cell checkpoint
runs at17.79 ticks/s on this host. See [operating evidence](docs/session-runtime-review.md).
The user reports promising dense colonies; the [checkpoint review](docs/material-habitats-review.md)
records differentiation and continuing feedstock dependence.
[Days/weeks browser operation](docs/continuing-observation.md) remains unverified.
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

Press **Run** to begin at tick zero: 48 bacteria in two separated starting colonies in a 320 × 240 world,
48 mobile renewing reservoirs with local chemical mixtures and mutation enabled. Four mutable founder types seed a chemical circuit in each colony. The UI requests
30 ticks/s, with a maximum-speed option; actual throughput depends on workload. Layers show material, chemical potential,
stress, impedance, chemical weathering or one selected chemical. Drag to pan, wheel to zoom and select a cell to inspect
its machinery, mixtures, sensors, recurrent state and private byte. The full-screen viewport has a dock for observation/control windows.
The display shows one framed world, with bounded panning and zoom anchored under the pointer.
Soft regions summarize nearby cells at world scale; isolated cells remain visible. Zoom reveals
their actual bodies. Defaults show usable-energy cell colors and energy per material in the field, with daylight,
hazard patterns and source markers independently controlled. Family, enzyme input/output and
other trait colors remain selectable. Select a population to inspect it or browse retained
spatial samples. Body brightness reflects energy and damage; white tips show heading.
Finite deposit markers, newborn rims, death crosses and the visible population chart explain activity.
See the [display guide](docs/design/bacterial-display.md).
Founder shares now retain their observed history. Stats distinguish exact inherited sequences,
genetic construction targets and grown bodies, with targets relative to the original founder genotype.
Stats also show physical capacity ranges and acquired learning. Environment, inheritance and
persistence controls are available through the dock. The default is haploid clonal fission with
paid plasticity and full learned-weight retention. Diploidy, selfing, crossover, mutation operators,
budding and learning retention are configurable. Material and usable energy have separate ledgers.
See the [evolutionary contract](docs/design/funded-bodies.md). Physical checkpoint v32 rejects
older versions; the browser observation package remains v11.
Recovery saves every 30 seconds while running and on pause; restores start paused. Export a file
for a separate copy. Browser suspension can interrupt execution; storage failures pause it visibly.

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
| Chemical proof points and limits | [Habitat results](docs/material-habitats.md), [session costs](docs/session-runtime-review.md) |
| Mobile reservoirs and short calibration | [Source results](docs/design/chemistry/mobile-source-results.md) |
| Architecture             | [docs/architecture.md](docs/architecture.md)               |
| Development              | [docs/development.md](docs/development.md)                 |
| Calibration              | [docs/calibration.md](docs/calibration.md)                 |
| Certification            | [docs/certifications.md](docs/certifications.md)           |
| Preserved sources        | [docs/sources/README.md](docs/sources/README.md)           |

## License

MIT — see [LICENSE](LICENSE).

The ant substrate is recoverable from its tag; it is not a second selectable runtime.
