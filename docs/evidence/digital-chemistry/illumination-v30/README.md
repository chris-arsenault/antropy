# Composed illumination v30

September 19, 2026. [Law and registration](../../../plans/archive/ENVIRONMENTAL-ECOLOGY-PLAN.md#local-illumination).
This replaces v29's additive forcing and its rapidly sweeping displayed mean.

## Change and mathematical checks

With a=u−phaseFast, b=v−phaseSlow and m=phaseModulation:
`l0=1+c*cos(a)*cos(b−m)` and `l1=1+c*cos(b)*cos(a−m)`.
The cross axis gates sweep amplitude and sign. The displayed mean retains the third phase.
At m=0 a quadrature of b suppresses the sweep and a half-turn reverses it; its mixed
spatial difference is nonzero, unlike an additive X+Y field. Rust checks these properties,
pointwise bounds, geographic mean, phase/frame behavior and ordinary work accounts.

Contrast remains.8, with responses in[.2,1.8] and geographic mean1. Work coupling,
chemical transformations, abiotic rates, source rules and observation ownership are unchanged.
Defaults become6,000/18,000/62,000model seconds:30k/90k/310kticks. The shortest product
harmonic is about20,977ticks. The external field remains periodic; these initial timescales
are not a claim of chaotic climate or an evolutionary optimum.

The [assay report](assays.json) includes six directly evaluated forcing grids at ticks
0/7,500/15,000/30,000/90,000/155,000. These sample the prescribed function without advancing
an ecosystem. The local plot is
`frontend/harness/artifacts/illumination-composed/forcing-phases.png`.

## Paid short responses

Ledger4174–4181: eight registered300-tick assays,2,400ticks total. Initial budgets were
read before execution. The same finite supplied single-cell roles, diagnostic controllers,
uniform controls and swapped placements as v29 remain; mutation, learning, movement,
source release and weathering are disabled in these fixtures.

| Role | Uniform captured work | Region0 captured work | Region1 captured work |
| --- | --- | --- | --- |
| 128→136 | 3.852 | 4.744 | 3.733 |
| 136→8 | 3.837 | 1.711 | 6.798 |

All eight survive300ticks. The preferred reaction reverses between regions, but construction
is unchanged from the corresponding uniform control (.51835/.51736 material). Extra capture
therefore does not establish a growth advantage. V29's starvation/survival reversal does not
carry over to these samples. Material/work accounts pass. No tuning or horizon extension.

Ledger4188: one ordinary seed27 startup reaches3,000ticks with150cells and generation14,
204divisions and102deaths. Material/energy residuals are8.86e-9/3.04e-8. Runtime11.31seconds.
This is one tenth of the primary period, not validation of full-cycle survival or evolution.
Exact configuration, source/binary provenance, checkpoints and samples remain in
`frontend/harness/artifacts/illumination-composed/startup`.

## Cost

The [first v29 baseline](capacity-v29-initial.json), ledger4171–4173, measured
45.53/27.94/15.30ticks/s, inconsistent with both prior evidence and the new measurement.
Its cause is unverified. One registered [repeat](capacity-v29-repeat.json), ledger4185–4187,
followed [v30](capacity-v30.json), ledger4182–4184, sequentially with identical fixtures.

| Workload | Repeated v29 ticks/s | v30 ticks/s | Change in time per operation |
| --- | --- | --- | --- |
| 48 fixed cells | 84.22 | 82.62 | +1.95% |
| 2,000 fixed cells | 33.80 | 35.82 | −5.64% |
| 2,000 growing cells | 22.81 | 22.53 | +1.25% |

Each workload uses10warmup and100measured ticks with ordinary observation/render preparation.
The measurements show no material regression; faster samples are not an optimization claim.
The existing below30ticks/s growing-load limit remains. Saved states restore and continue;
memory is about192/595/968MB. The evaluator-only native screen costs.085ms for19,200nodes
and1.35ms for307,200nodes, with no per-node trigonometry or additional chemical pass.

Physical v30 rejects older checkpoints. Existing user tabs are not altered; a new world
uses the new law and defaults. Long-run behavior remains for observation.
