# antropy

A browser-based, 3D, continuous-time artificial life simulation in which ants with heritable
genomes forage, dig, reproduce, and evolve — no fitness function, no generational boundary.

MIT licensed. Deployed on the Ahara platform at `antropy.ahara.io`.

## Quickstart

```bash
cd frontend
pnpm install
pnpm run dev        # local dev server
pnpm run build      # production build to frontend/dist
```

Run `make ci` from the repo root before committing.

## Deploy

```bash
scripts/deploy.sh
```

Builds the frontend and applies Terraform against the shared Ahara state bucket. CI deploys
automatically on push to `main`.

## Documentation

| Topic                        | Link                                                         |
| ---------------------------- | ------------------------------------------------------------ |
| Complete documentation index | [docs/README.md](docs/README.md)                             |
| Primary operating principles | [docs/ant-sim-principles.md](docs/ant-sim-principles.md)     |
| Current colony-loop ladder   | [docs/ant-sim-appendix-e.md](docs/ant-sim-appendix-e.md)     |
| Certification status         | [docs/certifications.md](docs/certifications.md)             |
| Design specification         | [docs/design-spec.md](docs/design-spec.md)                   |
| Architecture                 | [docs/architecture.md](docs/architecture.md)                 |
| Development                  | [docs/development.md](docs/development.md)                   |
| Calibration                  | [docs/calibration.md](docs/calibration.md)                   |
| Architecture decisions       | [docs/adr/README.md](docs/adr/README.md)                     |
| Backlog                      | [docs/backlog.md](docs/backlog.md)                           |
| Changelog                    | [CHANGELOG.md](CHANGELOG.md)                                 |
| Agent guide                  | [AGENTS.md](AGENTS.md)                                       |

## License

MIT — see [LICENSE](LICENSE).
