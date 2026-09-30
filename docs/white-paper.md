# Biotropy: an accounted artificial chemistry for open-ended evolution

**Status:** Current reference — the project's question, design philosophy, governing mathematics and the reasons behind them. Observed outcomes and research directions are in the [companion appendix](outcomes-and-directions.md); exact laws and parameters are owned by the [composed runtime](design/chemistry/composed-runtime.md).

The repository is named `antropy`; the simulation is published as Biotropy.

## In brief

Biotropy is a two-dimensional world of single cells living in a chemical soup. Each cell has a
small inherited body and a small inherited neural network. The network reads only what the
cell can sense where it is: local chemicals, light, crowding and its own condition. It decides
how hard to swim, which way to turn, what to pump across the membrane, which internal reactions
to run and how much to repair. Everything a cell does costs usable energy, and energy comes
only from chemistry: converting one chemical into another, sometimes helped by light.

Nothing scores the cells. There is no fitness function, no task reward, no generation boundary
and no list of intended species. Cells that obtain more than they spend grow and divide; their
daughters inherit a slightly mutated body and network. Cells that cannot pay their upkeep are
injured and die, and their material returns to the world. Over days or weeks the population's
history is whatever that local economy produces.

The project's work is to build a world in which that history is likely to be interesting:
where different inherited choices can repay their costs in different places and times, and
where organisms change the environment that later organisms experience. The observable run is
the product. A particular community, a number of strategies or a successful coexistence test
is not.

## 1. The question

Can a small, computable, fully accounted artificial world generate a continuing evolutionary
history, with no selection criterion other than local physical survival and reproduction?

Artificial-life systems have approached this from several directions. Tierra and its successors
let self-replicating programs compete for memory and processor time. Avida rewards digital
organisms for computing designated logic functions. Polyworld places neural-network agents in
an energy economy on a plane. Continuous cellular automata such as Lenia produce lifelike
patterns without individual genomes. Biotropy is closest to the Polyworld tradition, with three
differences in emphasis:

- **A real chemistry rather than a food scalar.** 256 discrete chemicals have positions on a
  smooth chemical manifold, with properties that vary across it. Cells sense, transport and
  transform specific identities. What counts as food, waste, poison or signal is not declared;
  it follows from a cell's enzymes, membrane and circumstances.
- **Complete accounts.** Material and work are conserved except at declared boundaries. A closed
  cycle cannot manufacture work; an open cycle can harvest only its accounted external supply.
  Every capability a cell has is paid for through biomass, maintenance and action costs.
- **No rewarded task.** Selection is only differential local survival and division. Diagnostic
  summaries never select parents, filter mutants or promote founders.

The question is empirical and remains open. Neither indefinite novelty nor persistent diversity
can be guaranteed by construction. The design aims to make them plausible and observable.

## 2. Design philosophy

Each principle below records a decision, why it was taken, and the alternative it excludes.
The operating rules derived from them live in [principles](principles.md) and the
[decision record](design/decisions-and-evidence.md).

### 2.1 Author pressures and opportunities, not outcomes

The designer specifies physical rules, boundary inputs and initial conditions. Behavior,
specialization and community structure must follow from those rules. A homeostatic colony,
a migrating population and extinction are all valid outcomes of a correct world.

*Why:* an authored outcome would be observed because it was authored. The interesting question
is what the rules make likely. *Excluded:* species lists, prescribed strategy counts, rewards
for cooperation or dispersal, and long agent campaigns tuned until a desired community appears.

### 2.2 Selection only through local survival and reproduction

Inherited differences matter only through their consequences for a cell's own material and
work. Division requires funded biomass; death follows injury or exhausted work.

*Why:* any external score becomes the true objective and hides the ecology. *Excluded:* fitness
functions, parent selection by summary statistics, lineage or kin rules in physics.

### 2.3 Every consequence is funded

Movement, transport, reactions, growth, repair, learning, emission and division pay usable work.
Material has owners, and transfers reserve against frozen donors so that no product funds the
event that produced it. External inputs, namely reservoir renewal, sunlight and paid emission,
are booked separately from internally recycled work.

*Why:* free capabilities erase tradeoffs, and tradeoffs are what make different strategies
viable in different circumstances. *Excluded:* crediting light directly to cells, waste-disposal
rewards, free protective states, and capabilities that do not cost the body anything.

### 2.4 Shared mathematics and few controls

One algebra acts on every owner of material: dissolved chemistry, reservoirs and cells use the
same chemical projections, the same transformation language and the same work argument. Behavior
is built from a small set of fundamental parameters and shared vector operations. A new
independent control needs a reason the shared rule cannot express the required behavior.

*Why:* feature-specific rules multiply tuning knobs, hide preferences for particular chemicals
or outcomes, and interact unpredictably. A shared rule makes consequences traceable.
*Excluded:* reservoir-specific motion rules, per-chemical tuning, special mutation paths for
favored functions, and separately tuned mixtures presented as a model.

### 2.5 Local information only

A controller receives fifty-nine local readings through the cell's own funded sensors and body
state. It never receives coordinates, a compass bearing, a destination, a route, time of day,
a lineage label or a reproductive score. Receptor gain comes from the capacity the cell
actually has; a cell without photoreceptors sees no light.

*Why:* global information would let evolution exploit the observer rather than the world.
Sensing costs are part of the ecology. *Excluded:* oracle inputs, programmed fallback policies
and any controller logic outside the inherited network.

### 2.6 Tradeoffs come from physical relationships, not bookkeeping

A cell's genes set the proportions of its body. Capacities are those proportions expressed at
current biomass. Drag, capacity, geometry, maintenance and conversion equations create the
tradeoffs: a larger motor costs upkeep and displaces enzyme capacity at fixed mass.

*Why:* an earlier implementation required cells to construct each capability through separate
neural requests and charged ownership per component. That construction step created
developmental coordination failures that were artifacts of bookkeeping, not ecology. It was
removed in v43 (see section 4).

### 2.7 Rules designed for computation

Physics supplies a language for material, transport, resistance, work and dissipation. It is
not a fidelity target. There is no temperature, entropy, detailed balance or thermodynamic
solver. Equations, data shapes and accounts are chosen together so that the world runs at
interactive speed at meaningful scale.

*Why:* a faithful physical solver would consume the budget needed for large populations,
long runs and fine chemistry. *Excluded:* reproducing a continuum model for its own sake.

### 2.8 Evidence discipline

Four claims are kept distinct: a mechanism is implemented; a constructed probe shows an
opportunity can repay its cost; a long run shows inherited variation in use; evolution is
shown to exploit the opportunity. Negative results are preserved. A failed prediction stays
failed even when unrelated variation appears.

*Why:* long runs produce colorful populations that invite over-interpretation.

### 2.9 World creation is exempt

Terrain generation runs once when a world is created and may use expensive, special-purpose
algorithms. The canonical maps are persisted and sampled at runtime by ordinary operators. The
runtime framework and all material and work accounts are unchanged by this exemption.

## 3. The world as mathematics

This section summarizes the governing laws in the order a reader needs them. Constants are
defaults. The [composed runtime](design/chemistry/composed-runtime.md) owns exact formulas,
update order and numerical safeguards; the [computational foundation](design/chemistry/computational-foundation.md)
and [transformation algebra](design/chemistry/transformation-algebra.md) own the design reasoning.

### 3.1 Two spaces

**Geography** is a periodic plane, 720 × 540 units by default, discretized at mesh spacing
h = 2. It locates material, cells and reservoirs. Persistent 8 × 8-node regions own occupied
chemistry; empty space costs nothing.

**Chemical space** is a bounded 16 × 16 manifold whose 256 grid points are the discrete chemical
identities. Nearby identities have related properties, are recognized by the same receptors and
are interconverted by similar enzymes. A chemical axis is not a spatial direction.

Time advances in base steps of dt = 0.2 model seconds. Movement and maintenance run every step.
Physiology, including neural evaluation, reactions and transport, runs every 0.8 model seconds.

### 3.2 Chemical properties

Each chemical s carries properties generated once from seeded smooth surfaces over the manifold:

| Property | Role |
| --- | --- |
| U(s) | Reference potential: prices conversions |
| D(s) | Diffusivity: sets spread |
| I(s) | Impedance: resists motion and transport |
| S(s) | Stress: produces compatible or incompatible exposure |
| p0(s), p1(s) | Two signed interaction profiles: attraction and repulsion signals |

The potential surface U is a sum of seeded cosine modes with squared wavenumbers 4–8, weighted
toward low frequency and treating both axes alike. Valid definitions must have many rising and
falling edges on both axes and several interior extrema, so no single downhill direction runs
across chemical space. No organism outcome selects the landscape.

A mixture on a geographic node is a 256-vector of amounts. Most physical effects need only a
few reductions of it: C·P for a small property basis P. These shared features drive transport,
resistance and exposure without per-species solvers.

### 3.3 Recognition

Receptors, transporters, enzymes and membranes recognize chemicals through one compact kernel
centered at an inherited chemical coordinate a:

```text
k_a(s) = max(0, 1 - |s - a|² / R²)²        R = 3
```

A receptor reads level `C/(C+K)` with K = 0.1, where C is its kernel-weighted local
concentration, plus its temporal change and forward/left contrasts across the cell. These are
local contrasts, not bearings to a source.

### 3.4 Transformations: exact actions, irreversible kinetics

Enzymes transform identities. The transformation language is the finite group
`(S16 × S16) ⋊ C2`: a permutation of the 16 values on each chemical axis, plus an optional axis
exchange. Bounded interval reflections and axis exchange generate it. Composition and inverses
act exactly on stored identities, including at the boundary of chemical space.

An enzyme's continuous genes (recognition center a, reflection center c, orientation θ) compile
a kinetic mixture of at most eight exact actions: θ interpolates adjacent quarter turns, and the
reflection center interpolates neighboring integer reflections. The mixture is a rate law, not
a group element. It is irreversible because it consumes work and loses information, but every
component obeys the same exact algebra. Recognition is independent of the action, so an enzyme
can recognize one region and send products elsewhere.

*Why this structure:* earlier maps applied continuous rigid motions and then reflected and
interpolated results back onto the grid. Composition failed: two translations by +3 did not
equal one by +6 at the boundary. The exact finite action preserves discrete identity, lets
mutations change function smoothly through the continuous parameters, and makes every reaction
an instance of one law.

### 3.5 Work

Converting substrate s to products t releases or consumes reference potential
`Δu = U(s) − Σ_t P(t) U(t)`. The local medium can add external work. For each reaction row
compile a signed profile difference

```text
a = ( Σ_t P(t) p0(t) − p0(s),  −(Σ_t P(t) p1(t) − p1(s)) ) / 4
```

and let B be the bounded local medium signal `H / (1 + |H0| + |H1|)`, where H is the local
projection of material onto the two interaction profiles. Under local illumination L:

```text
w = ε · max(0, a · (L·B))        external work per accepted unit,  ε ≈ 119.3
d = Δu + w                       total drive
yield = 0.8 d  (d > 0),   d / 0.8  (d < 0),   minus 0.05 per unit that changes identity
```

Cells capture yield as usable work. The accepted amount q books `q·w` as external input and the
remainder as heat. Uphill conversions are possible only when paid: all uphill requests of a
cell reserve work jointly, scaled by `λ = min(1, E/C)` where E is available work and C the
total uphill demand.

*Why external work:* a closed downhill chemical loop cannot fund every specialist after
processing costs, and renewing material alone does not repair that restriction. External work
through the medium lets some uphill conversions pay, so recycling niches can exist. It is
rate-bounded, open and accounted; it is never credited to a cell directly.

Cells include their own internal mixture in B, so a cell with suitable enzymes can capture light
in its own chemical environment even in dilute surroundings.

### 3.6 Environmental chemistry

Dissolved material and reservoir contents also transform, without enzymes. Eight fixed
generators each flip one coordinate bit of a chemical identity (distances 1, 2, 4 and 8 on each
axis), all elements of the same action group. A branch engages when the local medium favors its
product, `max(0, a · B)`, and only if `Δu + w ≥ 0`. Hazards share each donor:
`r / (1 + Σ r)`. Public conversion rates scale with incident light. Neutral or absent media
convert nothing.

There is no named feedstock, waste product or privileged destination; the same algebra and work
argument apply to cells, water and reservoirs.

### 3.7 Transport in the medium

Dissolved material diffuses and drifts. For each neighboring node pair, three bounded feature
differences drive species-specific drift: attraction `ΔA`, repulsion `ΔB` and crowding pressure

```text
P(L) = χ L² / 2,   ΔP = χ (L_left + L_right) ΔL / 2,   χ = 0.003
```

where L is local impedance load. Species drift is a contraction of its two signed profiles and
impedance with `(ΔA, −ΔB, −ΔP)`, divided by `1 + |ΔA| + |ΔB| + I_max|ΔP|` so one face calculation
bounds every species. The attraction field is a normalized finite convolution of range ℓ = 6:
compatible material attracts nearby, local repulsion and nonlinear crowding oppose
concentration. Mobility is `1/(1 + scale · load)`. A uniform fractional washout
`q ← q·exp(−washout·dt)` removes material at a boundary, independent of composition.

Owners with bodies, namely cells and reservoirs, sample and deposit through the same finite
footprint W. Matched sampling and deposition with an antisymmetric gradient give
`Wᵀ D W = 0`: an isolated owner cannot propel itself with its own signal.

### 3.8 Reservoirs

Reservoirs are finite, renewing external sources. Each owns one normalized composition p, an
amount Q, a fixed release rate r and a waiting clock. It releases `min(Q, r·dτ)` in composition
p. When empty it waits an exponential interval with mean G = 600 model seconds, then refills
`Q = r·T` with fresh accounted material. The shared public operator keeps transforming p, so a
reservoir's supply evolves with its local chemistry; renewal uses that evolved composition.
The nominal batch duration T remains 600 seconds, so the mean stocked fraction is now 0.5.

Local seasons scale supply time:

```text
dτ = a(x,t) dt,   a = 1 + c(x) cos(2πt/P + θ0) − d(x) sin(2πt/P + θ0)
```

with seasonal components (c, d) drawn from a fractal map of length at most one, so a ∈ [0, 2].
Weakly seasonal regions keep steady supply; strongly seasonal regions alternate. Over a period
a stationary reservoir's mean supply is unchanged.

Reservoirs move under the shared attraction and repulsion response, plus a long-range like-charge
repulsion `γ b_i Σ_j q_j K_L(r_ij) r_ij / L²` and circle exclusion. Cohesion grows with near
neighbors and repulsion with the whole group, so reservoirs form finite clusters at finite
spacing without stored anchors.

### 3.9 Geography and light

Terrain is generated once from periodic warped octave noise, `N(p) = Σ_j w_j noise_j(p′(p))/Σ_j w_j`,
with coarse domain warping `p′ = p + (ℓ0/2)(warp_x, warp_y)`. Independent channels produce
elevation h, log-distributed conductance q, overhead transmission and the seasonal components.
Reservoir placement samples a separate fractal density map.

Movement across a face scales by `m = harmonic(q_i, q_j) / (1 + β max(0, Δh/distance))`: paid
motor translation by √m, passive translation by m. Dissolved transport and public processing
use the conductance directly. Uphill travel is slower and costs more effort; there is no
recoverable height energy.

Sunlight is a composed periodic pattern over geography,

```text
L = 1 + (c/2) (cos a · cos(b − m) + cos b · cos(a − m)),   a = 2πx/W − f,  b = 2πy/H − s
```

with contrast c = 0.8 and three phases f, s, m advancing with periods of 6,000, 18,000 and
62,000 model seconds. L lies in [0.2, 1.8]. Terrain transmission and an optional ceiling reduce
it; a sparse overhead film of ordinary chemical material, deposited by cells, shades what lies
below as `exp(−τ)` with optical depth τ proportional to film mass. Cells can also pay to emit
light locally; that finite emitted work is allocated once across nearby recipients and booked
as recycled internal work.

### 3.10 Cells: body

A cell has biomass M and a genetic reference vector b over twenty-two body capacities: core,
motor, storage, four receptors, four transporters, eight enzyme records (one to eight active
programs), a photoreceptor, a film builder and an emitter. A heritable inward fraction splits
each receptor between outside and inside sensing. Each capacity is

```text
capacity_i = M · b_i / Σ b
```

so all capacities scale together and a gene changes proportions, not totals. Enzymes, receptors
and transporters carry chemical coordinates; the membrane carries a compatibility coordinate
that sets exposure and adhesion.

Each cell keeps one internal mixture and one bound (biomass) mixture, both chemically identified.
Retained composition modulates reaction rates without changing work per conversion. There are
no internal compartments.

**Upkeep and aging.** Basal work at age a is

```text
P(a) = (1 + damage) · ( maintenance · M · (1 + a / (agingTime · f)) + controllerCost )
```

where f is the core fraction and agingTime = 6,000 model seconds. More core slows aging at the
cost of other capacity. There is no fixed lifespan.

**Growth** consumes any internal chemicals proportionally at 0.5 work per unit, moving them into
the bound mixture without changing their identity, bounded by `dt · growthRate · M · (1 − damage)`.

**Injury and repair.** Exposure combines external and internal concentration with each species'
stress and the membrane's susceptibility, which has a positive floor: no membrane is immune.
Damage raises maintenance, slows motion and transport, and kills at one. Paid repair exchanges
free and bound material.

**Death** releases both mixtures unchanged into the medium and dissipates remaining work.

### 3.11 Cells: exchange and contact

Transporters move recognized species at `capacity × turnover × effort`, sharing a frozen donor
and receiver headroom; the neural output chooses direction (export, hold, import). Before paid
transport, the membrane exchanges passively:

```text
q = a·Δc / (1 + a (1/V + b)),   a = dt · V · β · D_s · σ_s / r²
```

a finite-bath relaxation toward equilibrium that cannot overshoot. Crowding slows both leakage
and entry.

Cells are circles. Overlap `K = max(0, R − d)/R` produces scalar crowding, reciprocal soft
separation that integrates `dK/dt = −K(1 + 2K)` for an isolated pair, and reduced field access
`β = 1/(1 + Σ K)`. Contact adhesion blends overlapping cells' intended displacements with weights
set by membrane compatibility `clamp(a_i a_j − b_i b_j, 0, 1)`; compatible groups move together,
incompatible neighbors slide past. Adhesion credits no work and stores no bond. Injured
neighbors expose their inventory to paid uptake through contact.

### 3.12 Cells: control

Each cell runs an Elman recurrent network with 59 inputs, 24 recurrent units and 19 outputs,
evaluated once per 0.8-second physiology interval on the time-average of its inputs:

```text
h ← σ( (W_x x̄ + (W_r + |α| ⊙ H) h + b) / max(1, ‖row‖₁ / 3) )
y = V h + c
```

σ is a rational approximation of tanh that saturates at ±3. Every row divides its drive by a
shared incoming-strength budget, bounding total drive as weights evolve.

| Inputs (59) | Outputs (19) |
| --- | --- |
| Four receptors: level, change, forward and left contrast | Swim effort, turn |
| Body capacities relative to genetic newborn reference | Repair effort |
| Usable energy fill, core growth, injury, storage fill | Private byte: candidate value and commit |
| Scalar crowding | Four transporter directions |
| Private byte | Eight enzyme activities |
| Photoreceptor level, change and contrasts | Film deposit/recovery |
| Four inward receptors: level and change | Light emission |
| Previous paid motor load from terrain resistance | |

The private byte is a register the network writes and reads; physics gives it no meaning.

**Learning.** Recurrent weights carry a plastic trace H whose paid update depends on pre- and
post-synaptic activity, receptor changes and energy change:

```text
dH_ij/dL = η ( m ((p2 y_i + p3) x_j + p4 y_i + p5) − y_i² H_ij )
```

integrated over paid time L. Eleven inherited loci set the learning rule. At birth, a retained
fraction of the parent's learned change can be assimilated into the daughter's genome exactly
once. This is the only path by which private experience is inherited.

### 3.13 Reproduction and inheritance

A cell divides when it holds twice its genetic reference biomass plus inventory and work reserves
and pays a division cost proportional to core. Fission ends the parent and creates two age-zero
daughters; material and biomass split conservatively, the damage fraction carries over, and
no material is granted.
Newborns draw independent random headings. The default is haploid clonal fission; diploidy,
selfing, crossover and budding are configurable policies.

Mutation uses one heavy-tailed law for every gene:

```text
step = b · u / (1 − |u|),   u ~ Uniform(−1, 1),   b = 0.674 · scale
P(|step| > d) = b / (b + d)
```

so most changes are small and rare changes are large, without a separate large-mutation path.
Chemical coordinates move as isotropic vector steps scaled by the recognition radius R;
angles wrap and bounded parameters reflect. Enzyme program count mutates in program units:
duplication splits a program's genetic weight and neural connections between two copies, and
deletion removes it. Daughters express their mutated body at birth.

### 3.14 Initial condition

A new world starts with 48 cells in two separated colonies: twelve each of four mutable founder
types forming a chemical circuit 0 → 128 → 136 → 8 → 0, and 240 reservoirs supplying chemicals
0 and 136, with finite priming of 8 and 128. The circuit is an opportunity, not a design target;
no founder role is recognized by physics after birth.

### 3.15 Accounts

Material closure includes reservoirs, dissolved fields, cell inventories, biomass, washout and
numerical rounding. Work closure includes reference potential, usable work, external cellular,
field and reservoir work, all dissipative expenses and boundary losses. A closed unfunded cycle
cannot create work; an environmentally driven cycle can harvest only its accounted supply.

## 4. Why these choices: approaches tried and removed

The present rules are the result of measured failures as much as design. Each removal below is
recorded with its evidence in the [decision record](design/decisions-and-evidence.md) and the
[design directions registry](design/directions.md).

| Removed or rejected | What replaced it | Reason |
| --- | --- | --- |
| Projected rigid enzyme maps (v22) | Exact finite actions with kinetic mixtures (v23) | Boundary reflection broke composition; no coherent algebra |
| Downhill-only closed chemistry | Medium-driven external work shared by all owners (v27) | Processing costs starved recycling specialists |
| Reservoir-specific motion and conversion rules | Shared chemical and geographic operators | Special cases multiplied controls and hid behavior |
| Prescribed environmental wells and fixed basins | Material-generated binding; later fractal terrain | Authored anchors fix the answer in advance |
| Independent illumination of chemical components (v30–v33) | One scalar light field (v34) | Multiple periods did not justify multiple kinds of light |
| Finite depleting sun, lateral screening | Overhead non-depleting sun, geographic shade, built film, paid emission (v42) | User selection; keeps light an open boundary input |
| Within-life refitting and parental-function buffers | Capabilities fixed at birth; daughters express mutations immediately | Duplicate installed state; protection of mutants is not ecology |
| Living-cell gene transfer | Removed | Changed capabilities after birth, contradicting birth-fixed genetics |
| Broad opposing attraction field, attraction gain, cohesion washout discount (v39) | One attraction range, local repulsion, nonlinear crowding, uniform washout | Extra terms selected deposit spacing and rewarded cohesion by fiat |
| Crowding pressure on cells and reservoirs (v40) | Per-class coupling: pressure on dissolved material only; reservoir charge repulsion; cell contact adhesion (v41) | Reservoirs and colonies dispersed toward a random layout |
| Machinery construction, retirement and ownership charges (v33) | Genetic proportions at current biomass (v43) | Bookkeeping created developmental failures unrelated to ecology |
| Internal compartments | One internal mixture with rate modulation | Complexity without a demonstrated opportunity |
| Sampled contact interfaces | Perfect circles with scalar overlap | Unnecessary complexity and cost |

Two patterns recur. First, special-purpose mechanisms tend to encode the designer's expected
outcome and are replaced by shared operators. Second, apparent success in short probes has
repeatedly failed to persist in long runs, which is why evidence levels are kept distinct.

## Glossary

| Term | Meaning |
| --- | --- |
| Chemical manifold | The 16 × 16 grid of chemical identities with smooth property surfaces |
| Identity | One of 256 discrete chemicals; conserved except by transformation |
| Recognition kernel | Compact weighting `max(0, 1 − d²/R²)²` around an inherited chemical coordinate |
| Exact action | Element of `(S16 × S16) ⋊ C2` acting on identities |
| Kinetic mixture | An enzyme's rate-weighted blend of up to eight exact actions |
| Reference potential U | Chemical property that prices conversions |
| Medium signal B | Bounded local projection of material onto the two interaction profiles |
| External work | Work supplied by the medium and light for favorably oriented conversions; accounted as a boundary input |
| Usable work | A cell's spendable energy account |
| Reservoir | Finite, renewing external source of an evolving chemical mixture |
| Supply time τ | Seasonally scaled clock for reservoir release and refill |
| Film | Sparse overhead layer of ordinary chemical material that shades light |
| Body capacity | Genetic proportion times current biomass |
| Core fraction | Share of body in core; slows aging |
| Footprint W | Normalized finite sampling/deposition kernel of a cell or reservoir |
| Contact overlap K | `max(0, R − d)/R` for two circles |
| Private byte | Network-controlled register with no physical meaning |
| Assimilation | One-time inheritance of retained learned change at birth |
| Founder | One of the 48 initial cells; no special status after birth |
