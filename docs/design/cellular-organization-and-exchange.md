# Cellular organization and exchange

September 20, 2026. **Implemented feature design, physical checkpoint v33.**
This is the joint design for intracellular organization and interactions between cells.
It develops the [strategic hypothesis](intracellular-organization.md) and supersedes the
implementation recommendations in the earlier [interaction research](cell-interaction-research.md).
Their observations and unresolved evidence remain valid. The [backlog](../backlog.md#backlog-cell-interactions)
records the research context. The [implementation plan](../CELLULAR-ORGANIZATION-PLAN.md)
tracks the user's authorization to execute all phases. Internal compartments were considered
and withdrawn before implementation: each cell retains one well-mixed inventory, while
exchange between cells provides opportunities for larger organizations to evolve.

## 1. Intended outcomes and the selected feature

The intended outcome is evolution of different ways of obtaining, retaining, processing and
exchanging material, with advantages that depend on circumstances. A cell's internal organization
should affect which neighbors help or harm it; neighbors should change which internal organization
pays. Repeatedly refining one profitable reaction remains possible, but should not be the only
meaningfully expressible response to changing conditions.

The proposal combines five connected changes:

1. Retained chemical composition changes the relative throughput of enzyme transformations.
2. Funded receptors can sample inside or outside; neural control regulates processing and
   construction allocation using those local observations. Reproduction requires a funded core
   and actual daughter reserves, rather than mandatory expression of every optional target.
3. Enzyme programs can duplicate, diverge and disappear, with paid installation and actual-stock
   inheritance. More copies of one enzyme and more kinds of enzyme have different meanings.
4. Crowded interfaces divide access between the field and neighbors. Injured neighbors expose
   free material to ordinary paid uptake through the same finite donor allocation.
5. Existing chemical injury, repair, export, death and geographic chemistry connect these choices
   to their public consequences. No attack reward or prescribed cooperation is introduced.

These form a complete feature. Delivery phases must preserve their connections rather than call
an isolated rate modifier, extra enzyme slot or contact drain the completed outcome.

Neither particular roles nor ever-increasing complexity are required. A low-cost processor,
self-sufficient recycler, flexible generalist, dependent specialist or opportunistic consumer can
be useful under different conditions. Stable homeostasis is valid. The design provides reasons
for alternatives; it does not ensure their discovery or indefinite coexistence.

## 2. Preserved mathematical objects

Retain the bounded chemical space S with 256 identities, existing recognition kernel K,
potential U_s, stress S_s, and two signed interaction profiles p_s. Retain the existing
J=diag(1,-1), affinity concentration scale K_0, exact finite chemical actions and their bounded
kinetic mixtures. No extra chemical landscape or species-specific coefficient is introduced.

For a cell i, I_i is free inventory, B_i is chemically identified bound body material, V_i is
occupied area, E_ik is actual machinery stock, W_i is usable work and d_i is injury. Genetic
targets are separate from actual installed machinery. A_i denotes total free inventory only
when used in headroom constraints; bound material never becomes an importable donor implicitly.

An enzyme program k contains recognition, the existing parameterized action mixture T_k,
construction target and associated neural control ports. For a compiled row s:

```
T_k(t | s) >= 0;       sum_t T_k(t | s) = 1
Delta p_ks = sum_t T_k(t | s) p_t - p_s
Delta U_ks = U_s - sum_t T_k(t | s) U_t
changed_ks = sum_(t != s) T_k(t | s)
```

The material map remains unary. Its exact components are elements of the existing finite action
group; their mixtures are irreversible kinetic operations, not new group elements. Reactions
remain coupled through shared mixtures, substrate competition, work, products and regulated
machinery. A new two-substrate reaction algebra is not needed for these dependencies and is not
silently introduced by the word interaction.

## 3. One intracellular mixture changes relative reaction rates

### 3.1 Retained material as the cell's chemical environment

Define a two-component reduction of all retained material:

```
R_i = I_i + B_i
m_i = sum_s R_is p_s / (K_0 V_i + sum_s R_is)
```

Both free and bound identities contribute. Bound material contributes a chemical environment;
it does not become enzyme substrate. This gives construction history a functional consequence
without requiring a named building chemical. A product incorporated into the body can continue
to favor one set of transformations and impede another. All chemicals can still fund assembly.

Moving material from free to bound does not change the reduction numerator or retained amount.
Only an accompanying change of occupied area can change concentration normalization. Repair's
equal exchange of free and bound mixtures leaves their sum unchanged. Birth partitions actual
mixtures; it does not reset this environment to the daughter's preferred chemistry.

### 3.2 Transformation response

Use the same profile difference and signed pairing already employed by transformation work:

```
z_iks = (Delta p_ks)^T J m_i
phi(z) = z / (1 + abs(z))
mu_iks = 1 + phi(z_iks)
```

This is a rate modifier, not energy, affinity, a fitness score or a chosen preferred product.
With the current profile components in [-1,1], abs(z)<=4 and 1/5<=mu<=9/5; actual finite
concentrations narrow these extremes. Zero mixture or zero profile difference gives mu=1.
There is no independent coupling-strength knob in the proposed law. Its sign and direction
come from existing profiles; its normalization gives bounded gain with bounded reciprocal loss.
This rational response is a selected artificial law: monotone, odd about the unchanged baseline,
smooth through zero to first derivative, and cheap to evaluate. It is not uniquely implied by
physics, nor is its ecological strength already calibrated.

For an exact edge and its inverse under the same retained mixture:

```
z_(t->s) = -z_(s->t)
mu_(s->t) + mu_(t->s) = 2
```

Thus the same internal environment cannot maximize both directions. This statement concerns
the modifier, not equality of complete rates or yields. Recognition, substrate supply, installed
stock and the existing kinetic distance attenuation can differ. A mixed product row generally
has no exact inverse; the equality must not be claimed for reversing an arbitrary mixture.

Processing also changes the environment that regulates later processing. At fixed V and retained
mass, one row accepting amount q changes z with slope:

```
dz/dq = (Delta p)^T J (Delta p) / (K_0 V + retained mass)
```

The sign can be positive or negative because J has both signs. A transformation can reinforce
or oppose its own rate modifier; other installed rows respond through their corresponding
cross-contraction with Delta p. This is a shared interaction law among pathways, not a table of
which enzyme helps which other enzyme. Substrate depletion and product inhibition still affect
the complete rate and can overwhelm that modifier.

At fixed m, any closed material cycle also satisfies `sum_e q_e*z_e = 0`, since
`sum_e q_e*Delta p_e = 0`. Replacing one inverse pair with a longer cycle cannot make every
nonzero modifier favorable in the same fixed internal environment. Changing that environment
over time remains possible and has the physical costs described below. The shared interaction
matrix is at most rank two: this proposal does not claim arbitrary independently programmable
enzyme-to-enzyme regulation. That deliberate consequence of the existing compact basis is an
ecological limitation to assess, not conceal behind the word vectorization.

The selected constitutive rate becomes:

```
O_ik = sum_s engagement_ks I_is
q_requested_iks = dt * enzymeTurnover * E_ik * a_ik * (1-d_i)
                  * catalytic_ks * I_is * mu_iks / (K_0 V_i + O_ik)
```

Here a_ik in [0,1] is the neural activity request. Existing substrate and product occupancy,
distance attenuation, donor contention and work funding remain. A helpful mixture cannot remove
the need for substrate, machinery or work, nor can it defeat product inhibition automatically.

The rationale is catalytic response to the material surrounding installed machinery. Fields
and reservoirs do not own this funded enzyme body and receive no new catalytic multiplier.
Their existing transformations and work law remain. Sharing mathematics does not require giving
every material owner biological machinery.

### 3.3 Energy accounting stays separate

Keep the existing external signal B_ext, including local illumination, and the current work law:

```
w_ks = epsilon * max(0, (Delta p_ks)^T J B_ext / 4)
d_ks = Delta U_ks + w_ks
y_ks = (efficiency*d_ks if d_ks>=0 else d_ks/efficiency)
       - catalyticCharge * changed_ks
heat_ks = d_ks - y_ks >= 0
```

m_i never enters w_ks or the usable-work bank. A favorable internal mixture changes accepted
throughput, not work per identical accepted conversion at identical external conditions. Faster
capture receives the corresponding external-work debit under the existing rate-bounded source
model. No new global power reservoir is implied.

Reserve frozen work across work-consuming requests, then allocate frozen chemical donors as
today. Commit products and work together. Neither a new product nor newly captured work funds
another reaction in the same event. With external input removed, changing mu cannot make a
closed material cycle produce net usable work. With external input, every gain remains accounted.

## 4. Whole-cell sensing and allocation

Each existing chemical receptor gains a heritable inward allocation lambda_a in [0,1]. Its
funded stock is divided into E_a*lambda_a for internal sensing and E_a*(1-lambda_a) for the
existing external sampling. Both use the existing stock-dependent gain and concentration
saturation. Internal sensing supplies tonic and temporal recognition of free inventory / V_i;
external sensing retains tonic, temporal, forward and left readings. There is no intracellular
compass or direct property-table/profile-vector input. Absent funded inward stock gives no inward
signal. The controller may infer persistent bound composition through its effects rather than
receive an oracle describing which transformation would be profitable.

The local recurrent controller retains its private state and 24-unit recurrent core. Its local
machinery ports grow with the enzyme repertoire: an activity request for each enzyme, a
construction request for each body component, and one shared retirement-effort request.
Body stock readings remain local facts. The
controller owns all readout weights and their mutation; physiology consumes bounded requests
and does not inspect neural internals. Import/export, movement and repair retain their meanings.

No automatic selector turns on a profitable enzyme, balances a pathway or imports a desired
mixture. Constitutive biases are evolvable controller alleles. Sensing and allocation can be
unhelpful, unexpressed or too costly; fixed allocations remain legitimate alternatives.

Let g_ik be the inherited reference stock and b_ik in [0,1] the neural allocation request.
For optional machinery, 2*g is an expression ceiling, not a mandatory birth recipe. Core keeps
its positive inherited floor. Define the requested installed amounts and affordable growth:

```
T_ik = 2*g_ik*b_ik                  for optional machinery
T_i,core = g_i,core*(1+b_i,core)     for core
v_ik = max(T_ik - E_ik, 0)
Q_i = min(existing core-supported construction limit,
          sum_k v_ik, free material above reserve,
          usable work above interval reserve / assembly price)
Delta E_ik = Q_i v_ik / sum_k v_ik
```

Use zero construction when the denominator is zero. Q_i<=sum v ensures no stock exceeds its
remaining deficit. Construction consumes actual proportional free mixtures into B_i, pays the
existing assembly work and reserves upkeep for the proposed body. This is the construction-only
upper bound; construction and retirement share handling and work as specified below.
Activity gates do not erase maintenance, volume or sunk construction cost. Allocation requests
change desired amounts; physical growth and retirement must still pay to reach them.

The existing requirement to build twice every genetic stock target before division would defeat
conditional allocation. Replace that optional-stock requirement with funded core readiness:
`E_core >= 2*g_core`, plus the existing actual-capacity-scaled material/work reserves, actual
daughter upkeep reserve and division work charge. Each daughter receives half of every actual
stock and mixture, including zero or inadequate optional machinery. It receives no grant to
match an unexpressed target. Skipping a motor or enzyme can reduce reproductive expense, but
also removes its function from the offspring. Whether that succeeds is a physical consequence,
not a minimum-capability recipe. Other reproduction and ancestry rules remain.

Sensing allocation is itself subject to the existing paid installed-target refitting principle.
The neural controller can switch activity quickly, but changing its material environment requires
real transport/conversion and changing its machinery requires real construction/refitting. These
different timescales are the basis for a possible efficiency-versus-flexibility tradeoff.

## 5. Evolvable enzyme repertoires and inherited organization

Replace four mandatory enzyme indices with a finite sequence of enzyme programs and their actual
installed stocks. Retain the existing four transporters and four chemical receptors in this
proposal; they already offer independent import/export and inward/outward access. The selected
representation change concerns the transformation repertoire, not an unrelated redesign of all
sensing, motion or neural topology.

Use the existing shared heavy-tail mutation law for program parameters and a count coordinate
measured in program units. Stochastically round the signed count increment to adjacent integers,
preserving its expectation before applying the existing reflected-boundary rule. This lets small
increments occasionally change the count and retains rare multi-program changes without a
separate mutation distribution. Map the resulting change to neutral duplication or unbiased deletion, bounded by
one retained gene template and a declared computational maximum N_max. A template can have zero
investment: the minimum gene count is not a requirement for funded enzyme activity. N_max is an
execution bound selected from complete cost measurements, not a desired number of strategies.
It bounds the union of genetic templates and carried installed/retired programs. Retirement
does not hide unbounded old programs outside that limit. Count mutations respect the remaining
record capacity; ordinary retargeting still uses existing records and paid refitting.

Duplicating a program divides its construction target and inherited actual stock among identical
copies. Copy its activity and growth readouts; split incoming neural contributions so their sum
is unchanged. Recognition, action, body mass and initial chemical flux are unchanged before
ordinary subsequent mutation. This prevents a duplication from granting double machinery,
doubling sensory input or changing behavior solely because a list became longer. The copies can
then diverge through the same ordinary parameter mutation and paid installation laws.

Deleting a program removes its genetic target, not its actual material. Its remaining stock is
retired, ceases receiving activity/construction requests, and continues to occupy volume and incur
upkeep until decommissioned. Decommission transfers the matching mass from B_i to I_i without
changing identity, pays assembly-price work per mass, shares the existing core-supported material
handling rate with construction, and respects storage headroom. No same-event reuse of released
material or newly freed capacity. Existing paid refitting handles changed surviving programs.
Deleting a gene therefore cannot instantly erase a body cost or finance another enzyme.

Only stock above the requested amount T is eligible for decommission, including all
stock of a deleted program whose target is zero. Core retains the floor above. The shared retirement effort
requests a fraction of these surpluses, distributed proportionally; deleted programs need no
orphaned neural decoder. Cap aggregate retirement at frozen free-storage headroom and available
bound mass. Retiring storage must also reserve its lost capacity: require
`free material + sum(retired mass) <= capacity(body - retired stocks)`, without crediting
simultaneous construction or import/export. Cap construction separately at frozen free material
above reserve. Then apply one common funding fraction to both sets of requests so their sum fits
the core material-handling
limit and shared surplus-work budget. Preserve the conservative upkeep reserve for the proposed
grown body without spending a same-stage retirement saving. With retirement zero, this reduces
to the construction equation above. Repeated assembly/decommission cycles return no usable work
and dissipate both work payments. Any usable work above the resulting core-supported energy
capacity dissipates through the existing
overflow account; changing capacity never refunds work.

The associated neural ports are part of the evolving module representation. Reordering programs
and their ports must preserve controller behavior and chemistry. Birth still partitions actual
stocks, mixtures and work before mutation effects; inherited instructions never create replacements.
Private learning and birth-local assimilation retain their explicit controller-owned boundary.

## 6. Cells share finite interfaces and finite donors

### 6.1 Crowding changes access

Retain current material forces and geometric overlap resolution. For overlapping neighbors use
the symmetric compact contact weight already proposed in the interaction research:

```
C_ij = max(0, 1 - distance(i,j)/(radius_i+radius_j));    C_ii=0
Z_i = 1 + sum_j C_ij
beta_i = 1/Z_i
W_ij = C_ij/Z_i
beta_i + sum_j W_ij = 1
```

beta is the field-facing share of the interface; W distributes its contact-facing share.
Intact neighbors occupy interface too. This deliberately makes crowding reduce access to the
public field; contact access must not be a second full uptake budget. Non-overlapping cells have
beta=1. The definition is a soft-contact model tied to current bodies, not an arbitrary attack
radius. Its usefulness depends on actual maintained overlap under the existing movement law;
perfectly separated bodies have no contact transfer. Numerical timestep dependence of overlap is
an implementation risk to resolve without quietly inflating encounter distance.

Use these same contacts for the four existing body-relative contact cues, accumulating directional
weights with the shared Z_i rather than taking only the largest neighbor contribution. Motors
still pay when crowding prevents displacement. No compression-injury constant is added.

### 6.2 One paid transport request across donors

Injury exposes a neighbor's free material by the existing injury fraction d_j. Define recognized
import availability from actual donors, not copied inventories:

```
L_is = beta_i * fieldConcentration_is
       + sum_j W_ij d_j * I_js/V_j
```

The current transporter recognition, saturation and finite stock-supported throughput operate
on L. Field and contact terms divide that one request in proportion to their contribution.
All slots share actual recipient headroom and usable work. The receiver pays the ordinary
transport charge for accepted transfer regardless of donor type. An intact cell exposes none
of its private material; reservoirs remain behind their existing release boundary. Injury scales
access concentration, not a permanently protected inventory fraction: sufficiently many funded
receivers can still contest the whole frozen donor stock.

Outward receptors sample this same accessible boundary mixture, with the existing body-relative
sampling for directional cues and contacts assigned by their local direction. They cannot read
an intact neighbor's private inventory. Shared access affects sensing, uptake and external stress
consistently rather than making a contact food source invisible to the controller.

Export remains release to the extracellular field, with its throughput multiplied by beta_i.
There is no automatic injection into a neighbor's intact body. A crowded cell may have difficulty
discarding inhibitory or injurious products; movement, altered processing and tolerating that
mixture become alternative responses. Imports from an exposed neighbor and exports share the
existing transporter efforts and total work budget, not independent free channels.

For each donor and chemical, sum all withdrawals, including the donor's own export if it is a
cell. Scale demands proportionally against frozen availability and commit accepted transfers
together. Include field uptake in the usual W/W-transpose allocator. Demand depends only on
local sensed/available concentrations and physical requests; it contains no phenotype label.

Recipient headroom uses frozen inventory, so exports cannot finance same-stage imports. Donor
funding uses frozen stocks, so incoming material cannot finance outgoing transfer. A recipient
dying later releases accepted holdings exactly once. Contact can remove a useful intermediate
or a harmful waste; transfer is not classified as attack or help in advance.

### 6.3 Injury and ecological consequences

Use the same membrane susceptibility and chemical stress contraction on L for external exposure,
plus the existing internal exposure from free inventory. Injury therefore depends on which
chemicals reach which membrane, not genome similarity. Repair still consumes work and exchanges
actual mixtures. Death releases free and bound material; living bound structure is not edible
through this transport extension.

A producer can benefit from removing a competitor or obtaining exposed material, but pays for
production, export, self-exposure and uptake. A bystander may capture the benefit. A neighbor may
instead help by removing an inhibitory product or changing public reaction conditions. There
is no neural attack button, kill credit, sharing reward, kin flag or automatic predator policy.

## 7. Why organization and exchange can both pay

### 7.1 A worked capacity comparison

Consider two exact inverse reactions with equal base catalytic capacity nu. Fix total enzyme
stock and compare two cells that each maintain both reactions with two cells that each specialize
in one. Hold total core/body costs equal for this algebraic comparison. Assume matched substrate
saturation and injury; their real costs return below.

In one cell, write the response modifiers as 1+theta and 1-theta. If it has enzyme stock M and
allocates it optimally between the two steps, the achievable cycle flux is:

```
F_internal = nu*M / (1/(1+theta) + 1/(1-theta))
           = nu*M*(1-theta^2)/2
```

Its maximum over retained mixtures is nu*M/2 at theta=0. Two such cells have maximum nu*M.
Two specialists with M stock each and opposite retained environments can each operate at
nu*M*(1+theta), giving the same upper cycle flux across their exchanged intermediate.

Let rho be the fraction effectively delivered through the actual local field/transport path,
including loss and competing uptake. The capacity comparison favors specialization only if:

```
rho*(1+theta) > 1
```

For the illustrative theta=1/2, delivery must exceed 2/3 even before exchange expense. This is
a derived conditional advantage, not a chosen calibration or a prediction for current cells.
It uses equal total enzyme stock and no specialist bonus. Distance, missing neighbors or
competitors can reduce rho enough to reverse the comparison; reliable nearby exchange can help.

The bound is not sufficient for viability. Each specialist must independently satisfy:

```
accepted flux * its actual reaction yield
  > its upkeep + transport + repair + movement + amortized machinery/adjustment expense
```

Community-wide positive work cannot rescue an individually unaffordable edge. One inverse can
be downhill while external work funds the other, but both must actually pay at the sampled local
conditions. Maintaining different m values also requires attainable free/bound mixtures and
pays for any extra storage, injury, substrate dilution and replacement work. Product inhibition
and actual recognition can erase the idealized capacity gain. These terms must be in the same
comparison; omitting them would turn an upper bound into a false opportunity claim.

### 7.2 Other conditional organizations

- A self-sufficient recycler avoids exchange losses and partner dependence, but shares one
  internal environment and carries the whole pathway. Regulation can alternate steps; changing
  the mixture takes material, work and time rather than an instantaneous free mode switch.
- A broad repertoire handles variable supplies but uses finite stock, construction and maintenance.
  Duplication alone adds no catalytic capacity. Several distinct programs may compete for one
  internal environment, substrate pool and neural attention rather than all being useful together.
- A narrow processor benefits from reliable supply and product removal. Its own changing output
  can alter its internal rates and neighbors' opportunities, changing which investment pays later.
- A reserve holder separates acquisition from processing across time or space. Its retained
  composition changes rate balance as well as bulk, injury and available headroom.
- Crowded residency can improve delivery and expose neighboring material, but can obstruct
  import/export and raise local injury. Motility, repair and membrane compatibility offer
  different paid responses; none is assigned by phenotype labels.

Thus community organization is a consequence of private budgets coupled by public and contact
flows. No formula optimizes the community or requires it to become mutually dependent.

## 8. Symmetry, limiting cases and computational form

Under a chemical relabeling represented by permutation P, transform inventories, property rows,
recognition and maps together: I'=PI, B'=PB, properties'=P*properties, T'=PTP^-1. The mixture
reduction, scalar response, yields and donor fractions then agree, and accepted amounts relabel
correspondingly. Exact D4 chemical frame changes also transform recognition coordinates and the
existing action parameters. Arbitrary profile-basis rotations are not claimed as symmetries;
J is retained structural data and would have to transform with such a basis change.

Kinetic normalization, funded allocation and mutation are not group actions. Identity and
composition claims belong to the existing exact material maps. An identity row has Delta p=0,
mu=1, no changed material and no catalytic work. With m=0, a=1, unchanged repertoire, outward
receptors and no contacts, the proposal recovers the previous kinetic/transport laws.

Contact geometry is symmetric under swapping endpoints, but directed uptake need not be: donors,
injury and neural efforts differ. Relabeling cell indices or reordering enzyme programs cannot
change simultaneous allocation. Periodic spatial translations and the existing geometric
frame guarantees remain. No contact displacement or passive chemical motion credits usable work.

Computationally, m is two shared reductions over actual material and each row's J*Delta p is
compiled with its immutable action. Live work is a short dot product and bounded scalar response
per active row, not a chemical-pair matrix. Reusing projections across unchanged material is an
optimization opportunity. The delivered kernel computes one projection per reaction update and
shares it across rows; it has no persistent projection cache. Recognition and product support
remain sparse and compiled.

Let N be cells, R the total installed active reaction rows, C the active contact edges, q the
recognized contact chemical support and H the recurrent width. The added work is linear in
changed material, R, C*q and the extra local neural ports times H when contact mixtures are
restricted to recognized support. The current contact mixture accumulator instead uses C*256
bounded work; sparse accumulation remains an optimization opportunity. There is no all-cell-pairs
scan or 256-by-256 operator per cell. Zero stock, zero activity and absent substrates skip chemical
work; dormant programs still pay any actual body upkeep and controller requests needed to wake.
Dense contacts can still make C quadratic. That limit must remain visible and cannot be solved
by silently ignoring competitors or granting incomplete donor reservations.

Choose N_max and observation bounds from complete release-WASM workloads, including controller
ports, births, changed programs and dense contact, before implementation is accepted. No measured
speedup or 30-tick/s compliance is claimed by these operation counts. Keep single-threaded
execution, existing resolution, immutable sharing, Rust ownership and borrowed worker rendering.

## 9. Decisions, calibration and evidence boundary

The selected mathematical changes are the intracellular response above, funded inward sensing,
neural activity/construction allocation, core-funded division with optional machinery expression,
a duplicable enzyme repertoire, paid retirement, and one finite field/contact interface.
Generic assembly, unary material actions, work per conversion, geographic force laws, external
forcing and actual-stock inheritance are retained. Direct eating
of living structure, adhesion, sexual reproduction, terrain and an inherited efficiency gene are
separate decisions, not hidden requirements of this feature.

No new independent rate constant is selected: the response uses existing profiles and scales,
decommission shares core material handling and assembly price, contact uses existing geometry
and injury, and structural mutation uses the shared distribution. Inward allocation, program
count and neural requests are new heritable/control degrees of freedom with defined roles.
Representing them still has cost; absence of a new tuning constant is not evidence of usefulness.

The delivered arena uses N_max=8: enough to duplicate the four starting programs without an
unbounded genome or retired-stock list. Complete release costs are in the
[delivery record](../cellular-organization-results.md), including the below-30-tick/s eight-program
stress case. This is a measured computational limit, not an optimal ecological repertoire size.
The controller has 56 inputs, 24 recurrent units and 38 outputs covering the bounded arena.
Unused records have no catalytic function or free stock; four transporters and receptors remain.

Founders retain four active programs, outward sensing (lambda=0), activity/construction request
biases of3 (saturating at1), and retirement bias0. These are ordinary mutable alleles. Core-funded
birth is enabled. No authored neighbor role or cross-feeding controller replaces them.

Soft overlap now relaxes with `min(overlap*(1-exp(-dt))/2, dt/2)` per endpoint. The exponential
uses one model-second as its relaxation unit, replacing the former fixed per-tick fraction;
the existing correction-speed bound remains. An isolated-pair duration check passes. This is a
selected numerical contact law, not a new environmental force or proof of visible colony motion.

The proof obligations are conservation and paid inheritance, response bounds/inverse complement,
neutral duplication, order-independent contested transfer, and attainable private benefits after
all expenses. The capacity comparison above is a limiting-case derivation. It is not evidence
that particular current genotypes, supplies or controllers realize it. In particular, a finding
that every attainable internal environment loses its advantage after occupancy/storage costs
would reject this proposed coupling rather than justify endless tuning or a claim of success.

Current positive differentiation and the negative public-food probe remain in the
[habitat evidence](../material-habitats.md) and [user checkpoint review](../material-habitats-review.md).
Use bounded physical comparisons when a decision needs evidence, then let the user observe
evolution over time. Verification accompanies delivery; it is not a substitute next feature or
a requirement to pre-evolve a prescribed ecosystem. The original paper ran no simulations;
the subsequent [delivery record](../cellular-organization-results.md) separates bounded physical
opportunities, ordinary startup and operating costs from unresolved evolved behavior.

## Sources and authority

[Principles](../principles.md), [computational foundation](chemistry/computational-foundation.md),
[transformation algebra](chemistry/transformation-algebra.md),
[current runtime](chemistry/composed-runtime.md), [machinery](chemistry/machinery.md),
[funded bodies](funded-bodies.md), [regenerative work design](chemistry/regenerative-ecosystem.md),
and [data ownership](chemistry/data-ownership.md) supply the preserved constraints. The new laws
are an artificial-system proposal derived here, not a claim of biological or thermodynamic realism.
