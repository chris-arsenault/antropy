# Bacterial genes, lifetime learning and inheritance

This records the first September 9 evolutionary extension to [the bacterial substrate](bacteria.md).
Its allocation tuple and private-only learning interpretation are superseded by
[funded bodies and inheritable learning](funded-bodies.md), checkpoint v4. The user intended
acquired learning to enter inherited genetic memory; the initial interpretation below was wrong.
The v3 equations, tables and measurements below preserve what was implemented, not the current
physical or learning contract. Configurable ploidy, transmission, mutation and reproduction policies
remain in use; physical transfers now split actual stocks, and learned weights enter transmission.
Plan `238ae2b3-9217-456b-ad90-1f4b73f95a11` tracked this first extension.
Selection remains resource-funded survival and reproduction, with no scoring, screening or training.

## Inherited information and acquired state

[Appendix A, A.6–A.9](../sources/ant-sim-appendix-a.md#a-6) distinguishes recurrent memory,
lifetime synaptic plasticity, environmental chemicals and inherited genes. In particular A.8
proposes innate weights plus bounded private synaptic traces, controlled by inherited learning rules.
That is the meaning of lifetime-static versus lifetime-dynamic used here: genes stay fixed within
an organism; their expression and the organism's memory need not stay fixed.

| Owner | Inherited at birth | Changes during life |
| --- | --- | --- |
| Behavioral chromosome block | Innate RNN weights; plasticity strength, rate, Hebbian coefficients and modulation weights | Nothing |
| Physical chromosome block | Allocation logits for motor, uptake machinery and storage | Nothing |
| Private controller state | Nothing | Recurrent activity, task byte, receptor adaptation and plastic synaptic traces |
| Body | Resource-funded biomass and reserve | Growth, spending, uptake and contact |

These are two gene blocks in one genotype, not independently selected organisms. One or two
homologous chromosomes encode the same loci. Haploid expression is direct; diploid expression is
the arithmetic mean at corresponding loci. Dominance is explicitly additive in this version.
Physical reaction norms, maturational remodeling, evolvable mutation rates and inheritance of
acquired traces remain extensions. No acquired state is silently written back into chromosomes.

The first plastic network has 18 inputs, 16 recurrent units and five outputs. It adds three own-body
allocation readings to the existing 15 inputs. The task byte retains its existing read/write semantics.
Only the 256 recurrent connections are plastic initially; input/output connections and biases remain
innate. Nine additional loci encode alpha, eta, A, B, C, D and three modulation weights.

For old hidden activity x, newly inferred activity y and private trace H:

```
W_effective = W_inherited + abs(alpha) * H
m = tanh(gN * nutrient_phasic + gC * chemical_phasic + gE * change_in_reserve_fraction)
dH/dt = abs(eta) * (m * (A*x*y + B*x + C*y + D) - y*y*H)
H_next = clamp(H + dt*dH/dt, -1, 1)
```

Inference reads old traces, then updates them. The first reserve delta is zero. All neural state
uses float32. Plasticity is bounded and charges `plasticityCost * abs(alpha) * dt` before updating;
an unaffordable update is skipped, while previously acquired traces remain usable. Static mode
disables both trace influence and updating, giving a matched innate-only control. New daughters
start with zero hidden state, task and traces. A surviving budding parent retains its own memory.
The founder has weak nonzero plasticity, not a claim that its learning rule is beneficial.
The architecture follows the innate/plastic separation explored by
[Miconi et al.](https://arxiv.org/abs/1804.02464); their gradient-training method is not used here.

## Physical tradeoffs

At bacterial scales, viscosity dominates inertia; meaningful coasting is the wrong default
([Purcell, 1977](https://www.physics.brocku.ca/Courses/1P92_Kaur/SolidsFluids/Life-at-low-R/)).
This remains a dimensionless 2D model, not calibrated bacterial hydrodynamics. Structural biomass B
sets disk radius proportional to sqrt(B). Motion is overdamped; propulsion power is dissipated.

Three bounded logits become positive allocation fractions by softmax. They sum to one. Each
capacity multiplier is `0.5 + 1.5*fraction`, giving the equal-allocation founder multiplier one.
Increasing motor allocation therefore reduces uptake or storage even if the controller throttles
down. This opportunity cost prevents a larger unused engine from being a free improvement.

Let b = B/Bbirth, motor multiplier M, uptake U and storage S:

```
drag ratio = sqrt(b)
maximum motor power ratio = M*b
maximum speed = speed * sqrt(M*b / sqrt(b))
maximum turn rate = turnRate * sqrt(M*b / b^1.5)
motor energy = Bbirth * dt * M*b * (swimCost*swim^2 + turnCost*turn^2)
uptake ceiling = uptakeRate * Bbirth * sqrt(b) * U
reserve capacity = reservePerMass * B * S
```

The turn formula uses rotational drag proportional to radius cubed. Motor cost coefficients set
the dimensionless drag calibration. Effort affordability solves the quadratic motor plus linear
secretion budget, after reserving basal metabolism. Body growth still requires nutrient conversion;
there is no gene that creates mass or energy. Birth mass is fixed for this version. If a newborn's
storage mutation cannot hold its share of reserve, the excess returns to the local nutrient field.
This transfer is conserved and is not a fitness-based embryo rejection.

Predictions: more motor investment raises maximum speed but lowers at least one other capacity;
doubling effort quadruples propulsion dissipation; larger bodies collect nutrient more slowly per
unit biomass. These are mechanical tradeoffs, not a promise of stable diversity or useful evolution.

## Configurable policies and lifecycle boundary

Typed, statically composed policy tables own separate operations. Physics never reads RNN layout;
genetics delegates behavioral mutation, combination and expression to the controller plugin.
Unsupported IDs and incompatible ploidy/lifecycle combinations fail configuration validation.

| Axis | Initial executable policies | Responsibility |
| --- | --- | --- |
| Ploidy | Haploid, diploid | Chromosome count and additive expression |
| Transmission | Clonal, selfing | Copy homologs, or form two recombined gametes from one diploid parent |
| Crossover | Uniform, one-point | Choose parental loci within each gene block during gamete formation |
| Mutation | Uniform perturbation, Gaussian perturbation | Independent bounded perturbations; separate physical and behavioral rates/scales |
| Reproduction | Fission, budding | Resource/space eligibility, physical offspring placement and parent lifetime |
| Lifetime learning | Static, plastic | Use and update private traces with explicit energy cost |

Clonal transmission ignores crossover; selfing requires diploidy. Selfing is an abstract genetic
comparison mode, not a claim that bacteria perform sexual meiosis. Fission ends the parent and
creates two daughters. Budding transfers one birth mass and half the post-cost reserve to one
daughter; the parent retains identity, genotype and private memory. Both require two birth masses,
two minimum reserves and local placement space. A reproduction plugin returns local placements
and specifies whether the parent survives; the kernel owns transfers and ancestry transactions.

Seed/fertilize is a designed extension, not a selectable placeholder. It must introduce funded
physical propagules with their own location, reserve, maintenance, viability duration and parent
reference. Fertilization requires local contact with a funded gamete or donor; combination receives
the actual parent genotypes and records both genetic parents separately from the body producer.
It must never find a mate by scanning the population or materialize a child from a remote ID.
That lifecycle deserves its own implementation phase when selected; it does not belong inside a
mutation operator. Local conjugation, haplodiploidy and dominance are additional explicit policies,
not flags whose unsupported semantics are inferred by the runtime.

## Evidence and observability

Defaults enable haploid clonal fission, small independent physical/behavioral mutation and weak
paid plasticity. The stats panel exposes policy, physical variation and learned-weight magnitude;
the inspector separates expressed capacities, inherited loci and private learned state. Config
changes apply to a new population. Checkpoint v3 stores complete chromosomes, private traces,
random streams, ancestry and resolved configuration; earlier schemas are rejected explicitly.

Tests cover paid bounded updates, innate-only control, daughter reset versus parent retention,
physical opportunity costs, quadratic affordability, ploidy expression and transmission, conserved
birth transfers and exact checkpoint continuation. A bounded harness comparison checks that the
default still reproduces and compares static/plastic controls. It cannot establish adaptive learning.
No long training campaign or browser simulation is part of this change.

## Initial implementation measurements

Ledger runs 2826–2828 use seed 101, the same 48 founders, persistent sources and 3,000 ticks
(600 model seconds). Source digests before/after each run agree. These are viability checks of
the new v3 model, not comparisons against the older v1 rates or proof of adaptive learning.

| Run | Learning | Mutation | Living at end | Divisions | Starved | Learning energy |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| 2826 | Static | Both blocks off | 104 | 145 | 89 | 0 |
| 2827 | Plastic | Both blocks off | 108 | 146 | 86 | 18.658 |
| 2828 | Plastic | Both blocks on, browser default | 112 | 153 | 89 | 18.865 |

The default reaches generation three with 298 mutant births. Its living motor multipliers range
from 0.899 to 1.074, uptake from 0.919 to 1.108 and storage from 0.922 to 1.085. Thus physical
variation is expressed in working bodies, not merely stored in unused loci. The mean acquired
recurrent weight RMS is only `3.75e-5`; learning is active but weak. The four-cell difference
between static and plastic controls is not evidence that acquired learning improves fitness.
It includes the learning cost and trajectory divergence, and measures one world seed.

Maximum sampled resource residual magnitude is below `1.45e-9` in all three runs. The new
mechanics and deterministic continuation pass 45 tests in nine files, plus `make ci` and the
production build. Budding, diploid selfing, both crossover operators, inheritance/reset and storage
overflow have bounded mechanics coverage; their long-term ecological effects are unmeasured.
Local complete checkpoints and traces are under
`frontend/harness/artifacts/evolution-depth-2026-09-09/`; the committed ledger is the durable result
index. Changed movement and interpretation remain for human review.

## Source disposition

The supplied September 9 physical/behavioral-genome notes, local file
`.sulion-paste/paste-2026-09-09_18-33-33-995Z.txt`, motivate the block split and coupling.
Their ant caste pathways, embryo screening, mutation-lethality prescription and rapid-improvement
predictions are not adopted. Physical reaction norms and mutation-temperature genes are retained
as future hypotheses, not implemented claims.
