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

[Short constructed probes](docs/design/chemistry/numerical-results.md) test physical opportunities and costs.
They do not prove evolved cooperation, persistent diversity or successful colonization.
One Rust/WASM kernel serves the browser and experiments. Rendering borrows WASM buffers in the
same worker through OffscreenCanvas/WebGL2; full chemistry does not cross to React. Integrated
headless capacity exceeds 30 ticks/s through the 2,000-cell growth fixture. Actual software-browser
testing passes that minimum at 48 cells but exposes a presentation limit at 2,000. See the
[reliability record](docs/design/chemistry/reliability-results.md). Default transit, human motion
review and [days/weeks operation](docs/continuing-observation.md) remain unverified.
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
48 finite renewal sites with local chemical mixtures and mutation enabled. The UI requests
30 ticks/s; the bounded reproducing-world computation exceeds that rate. Layers show material, chemical potential,
stress, impedance or one selected chemical. Drag to pan, wheel to zoom and select a cell to inspect
its machinery, mixtures, sensors, recurrent state and private byte. Stats remain visible.
The display shows one framed world, with bounded panning and zoom anchored under the pointer.
Soft regions summarize nearby cells at world scale; isolated cells remain visible. Zoom reveals
their actual bodies. Default colors show inherited membrane X coordinate on a fixed scale, with family,
founder and other trait views selectable. Select a population to inspect it or browse retained
spatial samples. Body brightness reflects energy and damage; white tips show heading.
Finite deposit markers, newborn rims, death crosses and the visible population chart explain activity.
See the [display guide](docs/design/bacterial-display.md).
Founder shares now retain their observed history. Stats distinguish exact inherited sequences,
genetic construction targets and grown bodies, with targets relative to the original founder genotype.
Stats also show physical capacity ranges and acquired learning. Environment, inheritance and
persistence controls are available below the map. The default is haploid clonal fission with
paid plasticity and full learned-weight retention. Diploidy, selfing, crossover, mutation operators,
budding and learning retention are configurable. Material and usable energy have separate ledgers.
See the [evolutionary contract](docs/design/funded-bodies.md). Checkpoint v11 rejects older versions.
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
| Chemical proof points and limits | [Numerical results](docs/design/chemistry/numerical-results.md) |
| Architecture             | [docs/architecture.md](docs/architecture.md)               |
| Development              | [docs/development.md](docs/development.md)                 |
| Calibration              | [docs/calibration.md](docs/calibration.md)                 |
| Certification            | [docs/certifications.md](docs/certifications.md)           |
| Preserved sources        | [docs/sources/README.md](docs/sources/README.md)           |

## License

MIT — see [LICENSE](LICENSE).

The ant substrate is recoverable from its tag; it is not a second selectable runtime.
