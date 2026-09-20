# Cell interaction: crowding, antagonism and feeding

September 19, 2026. **Historical research and pre-feature mechanism inventory.** Requested while
the user was observing the v28 world and described it as mostly healthy. This document
records the original investigation direction.
[Backlog ownership](../backlog.md#backlog-cell-interactions).

September 20: the [joint cellular organization and exchange design](cellular-organization-and-exchange.md)
supersedes this paper's recommended implementation sequence and conditional-extension status.
Its v33 implementation joins intracellular organization, crowded interface access and paid uptake
from injured neighbors. The original research below retains its dated mechanism inventory and
rationale; it is not a second active implementation plan. See the joint design for current laws.

## Direction

Make neighboring cells consequential through the same material, force and chemical rules
that organize the rest of the world. A cell could displace a competitor, tolerate a neighbor,
injure it through its products, or obtain food from it. Those relationships should depend on
actual bodies, installed machinery and local circumstances. They need not divide organisms
into permanent predator and prey classes.

**Recommended approach:** establish useful crowding and selective chemical injury using
the existing mechanics first. If injury cannot repay its costs because useful material remains
inaccessible, investigate contact access to a damaged cell's inventory through the ordinary
paid transport operator. That is a specific ownership-boundary extension, not a new combat
economy. Direct consumption of intact living structure is a later, unresolved possibility.

The ecological hypothesis is that neighbors can impose pressures that resource availability
alone cannot: crowded access, vulnerability to another phenotype's waste, and returns from
capturing a susceptible neighbor's material. Neither perpetual conflict nor a particular food
web is a requirement. Dense cooperative or homeostatic communities remain valid outcomes.

## What exists already

The September 19 source inspection found:

| Mechanism | Current behavior | Missing evidence or capability |
| --- | --- | --- |
| Shared material forces | Dissolved material, finite sources and bodies contribute attraction, local repulsion and nonlinear pressure. Cells respond through installed membrane profiles. | Whether these forces create useful cell-scale crowding and exclusion at mesh 2. |
| Physical contact | `movement::contacts` separates overlapping bodies through simultaneous accumulated displacements. | This is geometric separation, not compression damage or an established competitive advantage. |
| Contact sensing | Four body-relative inputs report forward/left/back/right contact. Each uses the maximum directional contribution. | They do not encode the number of contacts, overlap depth or crowding load. |
| Chemical injury | Actual chemical stress, membrane recognition and a susceptibility floor determine injury. Injury impairs movement/transport and raises upkeep; repair costs work and material. | Whether one cell can generate selective, affordable harm in another under current delivery. |
| Material capture | Transporters import extracellular chemicals; enzymes process those chemicals through the existing compiler and work accounts. | No direct access to another living cell's private inventory or funded body. |
| Death | Free inventory and bound material return with their actual chemical identities. Remaining usable energy dissipates. | Recovery by a nearby cell is not necessarily profitable attack or active pursuit. |

Sources: [movement](../../engine/src/movement.rs), [sensing](../../engine/src/sensing.rs),
[field response](../../engine/src/field_medium.rs), [transport](../../engine/src/transport.rs),
[lifecycle](../../engine/src/lifecycle.rs), [funded bodies](funded-bodies.md).

The [earlier predation study](../predation-study.md) belongs to retired chemistry. Its corrected
results did not establish active hunting or persistent prey roles. A former death reward fed
eligible neighbors rather than attributing an attack, and one implementation lost material
when a recipient died in the same removal pass. Preserve those lessons; do not restore the
named toxin, prey-yield bonus or old parameter values.

## One mathematical language

### Crowding and contact

Retain the current shared force:

```
F_i = a_i grad(A_ell) - b_i grad(B) - chi i_i L_other grad(L)
```

A_ell is the shared extended attraction field, B the local repulsive field, and L
the positive material load. The coefficients a_i, b_i and i_i are the cell's existing
installed attraction, repulsion and impedance responses; chi is the shared pressure strength.

Body size, installed profile, neighbor load and local chemistry already change its response.
Inspect the composition of this field-scale force and the sub-grid overlap correction before
adding another repulsor. Mesh-scale pressure and geometric non-overlap have different jobs;
do not silently count the same crowding effect twice.

For contact-dependent operations, reuse one sparse geometric relation from the existing
periodic neighbor search. A candidate dimensionless contact weight is
`C_ij = max(0, 1 - distance(i,j)/(r_i+r_j))`, with `C_ii=0`. It uses existing radii and
overlap, has compact support, and is symmetric under swapping bodies. It is a proposed
coupling weight, not a new selected force law or an additional interaction radius.

If the current contact inputs cannot distinguish consequential crowding, test weighting their
existing four directions by this shared contact load, with bounded aggregation. Do not append
an opponent identity, a target bearing or a fifth attack sensor by default. The RNN should
express approach, avoidance and persistence using local chemistry, contact and private state.

Motor work must remain paid when pressure prevents useful displacement. Passive separation
must never credit usable work. Any proposed compression injury needs a measured failure of
the existing pressure/chemical opportunities and an explicit work/accounting rationale;
overlap alone is not permission to add an arbitrary damage rate.

### Phenotype-dependent harm

Continue to use the existing susceptibility contraction. Schematically, for cell j:

```
susceptibility_j(s) = 1 - (1 - susceptibilityFloor) * affinity(membrane_j, s)
exposure_j = sum_s stress(s) * susceptibility_j(s) * localConcentration_j(s)
```

The existing intracellular exposure term, saturation, injury and repair still apply. A cell's
production/export changes its neighbors' exposure; their installed membranes change the
consequence. A chemically similar neighbor can be harmed and a different phenotype can be
unaffected. Neither phenotype labels, lineage, displayed colors nor genome distance enters
this law. Relatedness is available to observers only.

Creating a harmful product must pay the same synthesis and export costs as any other product.
The producer also handles that chemical internally and can expose itself. Membrane matching
protects a limited chemical neighborhood and retains the existing susceptibility floor.
Resistance, repair, movement and machinery investment therefore have conditional costs,
rather than an automatic weapon/immunity package.

### Conditional extension: damaged-membrane access

If ordinary injury followed by extracellular release cannot provide a useful return,
investigate admitting exposed neighbor inventory into the existing transporter demand pool.
This is an unimplemented permeability hypothesis, not a claim about real membrane physics.

Let I_js be neighbor j's actual free inventory, V_j its occupied area, and d_j its existing
injury fraction. Normalize C into contact weights W with row sums at most one. A candidate
contact-side concentration available to receiver i is:

```
contactConcentration_i(s) = sum_j W_ij * g(d_j) * I_js / V_j
g(0) = 0;  0 <= g(d) <= 1
```

Use `g(d)=d` as the first diagnostic hypothesis: existing injury directly expresses access,
with no added threshold, exponent, attack probability or phenotype-specific coefficient.
It is revisable if bounded probes show an unsuitable coupling. The initial stock and work
budget calculation must choose the normalization and interface coverage before implementation.
In particular, decide explicitly whether contact occupies some field-facing interface;
do not introduce food occlusion as an undocumented side effect.

The same installed transporter recognition acts on extracellular and contact donors. They
share one funded throughput, existing concentration saturation, recipient headroom and paid
transport work. Adding a neighbor must not provide a second full transporter budget. Neural
effort still determines import/export; enzyme conversion remains the only way to obtain the
ordinary metabolic return from captured chemicals.

For each donor and chemical, freeze availability before allocation. Sum all requested
withdrawals, proportionally limit them to the actual donor stock, then commit all accepted
transfers together. Include the donor's own export in that reservation. Newly received or
transformed material cannot fund another transfer in the same phase. A dying recipient must
release its accepted holdings exactly once through ordinary death accounting.

This extension reaches free inventory only. Bound material remains equal to funded body
stock and releases normally on death. Consuming living structure would require a coherent
deconstruction operator that removes machinery and matching bound mixtures, prices work,
and handles changing capacities. Do not simulate it by subtracting health and awarding food.
Reservoirs retain their separate release boundary; this proposal does not unlock stored source
inventory or copy another cell's machinery, genome, recurrent state or usable-energy balance.

## Symmetry, ownership and execution cost

- Preserve periodic translation and supported spatial rotations/reflections. Swap contact
  endpoints without changing geometry; use simultaneous updates independent of cell order.
  Coincident identical cells supply no preferred world axis to invent a separation direction.
- Relabel chemicals together with their properties, recognition and compiled actions: injury,
  transfer and work must give corresponding results. Irreversible injury and feeding are not
  group elements; they must respect the shared transformations and conserve their accounts.
- Reuse compact recognition rows, sparse geographic/contact support and the common donor
  allocator. Target work proportional to active contacts and recognized active species, not
  every cell pair times 256. Dense overlap can still produce quadratic contact counts; measure
  that limit, improve aggregation if needed, and do not silently discard neighbors.
- Keep Rust as physical owner, immutable genotype sharing, worker-local borrowed rendering,
  and bounded revisioned observations. Do not send a per-cell attack graph through React.
- Carry body construction, upkeep, motor, transport, reaction, repair and external-work costs
  through the existing accounts. Pressure stores no spendable energy, and harm earns none.

## Future investigation and decisions

These are conditional research stages, not an active run registration or implementation order.
When selected, set budgets from the ordinary economy before running any cells.

1. **Crowding opportunity.** Use equal funded bodies, unequal sizes/motors, swapped placement
   and crowded/sparse starts. Inspect overlap, contact readings, paid effort, achieved motion
   and access to the same finite food. Start with a few hundred ticks. Determine whether the
   existing forces already suffice or whether sensing/sub-grid contact is the missing part.
2. **Selective harm.** Use one producing cell and one recipient with matched versus mismatched
   membrane chemistry. Freeze mutation and learning. Compare real uptake, conversion, export,
   self-exposure, recipient injury/repair and costs; include the producer alone. Reject a
   proposed attack opportunity if delivery or selectivity is absent.
3. **Recoverable return.** First trace actual released material through ordinary transport and
   metabolism. Compare attack expressed versus unexpressed, receiver present versus absent,
   and food-rich versus food-poor conditions. Neighbor removal and nutritional benefit are
   separate effects; include a bystander to expose benefits captured by others. Only if this
   identifies a missing accessibility path should the permeability candidate be prototyped.
4. **Conditional strategy.** A small paired contest can test whether investment repays its
   costs against susceptible neighbors but loses value against resistance, escape or scarce
   prey. Compare whole-population shares against initial shares, not just offspring totals.
   No required evolved predator/prey split and no automatic long seed campaign.
5. **Legibility and cost.** Measure ordinary whole-tick overhead and dense-contact limits.
   Reuse selected-cell and chemical-web observations for injury received, repair expense,
   chemical production and food captured. Distinguish physical capability, controller use
   and observed adaptation; labels such as hunter require evidence of the behavior.

The opening question is whether these interactions create meaningful conditional advantages,
not whether we can make the display look combative. Adhesion, engulfment, new life stages,
dedicated attack genes and universal armor remain outside this research proposal.

## Intracellular organization

Added September 20, 2026 at the user's request. Extend the research to interactions within
a cell and the possibility of evolving different machinery counts and transformation kinds.
This is an investigation direction, not a selected redesign or a claim that the existing
couplings have produced evolved metabolic coordination.

[Intracellular organization and evolutionary strategy](intracellular-organization.md) owns
the whole-cell design hypothesis and conditional incentives. The inventory and questions below
describe mechanisms and candidate extensions; they do not establish reasons to add each feature.

### Current implementation

The ordinary runtime connects paid import, private chemical inventory, constitutive enzyme
conversion, paid export, repair and body construction. These are real shared-resource
couplings, with important limits:

| Coupling | Current behavior and limit |
| --- | --- |
| Transport and storage | Four independently controlled transporters share inventory headroom and usable energy. Recognized chemicals compete for each transporter's finite throughput. Uptake supplies material; it does not directly award energy. |
| Enzymes and intermediate products | Four enzyme programs share substrates and usable energy. Recognition-weighted substrate and product occupancy limits throughput, so accumulated products can inhibit their upstream enzyme. Another enzyme or export can remove those products. Reactions read a frozen inventory: newly produced intermediates feed later physiology updates. |
| Stored mixture and physiology | Retained chemicals supply future reactions, construction and repair. Their identity affects reaction availability and internal stress through membrane susceptibility. Inventory increases occupied volume and drag, changes concentrations, and can fill storage enough to prevent further import. |
| Construction and repair | Growth consumes a proportional mixture of available chemicals and pays assembly work. Repair exchanges free and bound mixtures and pays work. Particular machinery does not require particular chemical precursors; body material retains its identity without granting a composition-specific body function. |
| Sensing and regulation | The controller senses external chemical neighborhoods, light, contact, body stocks, energy, damage and total inventory fill. It has no direct reading of internal chemical composition. It controls transport, movement and repair, but has no enzyme activation or selective construction-allocation output. Growth follows deficits against inherited targets. |
| Repertoire and inheritance | Recognition, transformation parameters and machinery investment mutate. Investment can reach zero and recover, allowing different effective active counts within four fixed slots per class. There is no duplication, deletion or fifth enzyme. Changed identities require paid refitting of inherited stock. |
| Transformation kinds | Each enzyme recognizes multiple nearby chemicals and applies weighted shared finite chemical actions, potentially producing several products. This is unary conversion of one substrate amount into a conserved product mixture, not a reaction requiring two substrates together. No separately evolving cofactor dependency or intracellular regulatory network exists. |

For example, import A followed by enzyme A-to-B, enzyme B-to-C and export C can form an
internal processing chain across updates. B accumulation can slow the first enzyme;
downstream consumption can relieve that inhibition. Whether this chain repays its costs
depends on actual transformations, environmental work, concentrations and funded machinery.
The code permits this dependency; this inspection does not establish its evolved use.

Sources: [transport](../../engine/src/transport.rs),
[enzyme compilation](../../engine/src/chemical_operators.rs),
[product actions](../../engine/src/chemical_products.rs),
[metabolism](../../engine/src/metabolism.rs), [sensing](../../engine/src/sensing.rs),
[body geometry](../../engine/src/organism.rs), [runtime order](../../engine/src/world.rs),
and the [machinery contract](chemistry/machinery.md).

### Research questions and constraints

1. **Useful internal dependencies.** Identify when retaining, converting or exporting an
   intermediate helps the whole cell, and when one installed enzyme deprives another of
   substrate or work. Separate an available physical opportunity from controller use or
   evolved adaptation. Reuse current selected-cell and chemical-flow observations.
2. **Internal sensing and regulation.** Assess whether the shared recognition machinery can
   expose useful intracellular composition and support conditional processing or investment.
   Avoid species-specific sensors, bespoke reaction switches and an automatic optimizer.
3. **Evolvable repertoire size.** Investigate duplication/loss of funded machinery programs,
   including inheritance, paid installation, controller boundaries and execution cost.
   Distinguish adding a distinct transformation from building more copies of an existing
   enzyme. The current four-slot limit is a baseline to reconsider, not a research veto.
4. **Transformation repertoire.** Determine which useful dependencies the existing unary
   compositions can express and which require a richer operator, such as shared-substrate
   coupling. Any extension must compose with the existing chemical algebra, account for
   material and work, and avoid a catalog of privileged reactions or chemical identities.
5. **Construction specificity.** Assess whether chemically interchangeable construction
   removes a useful reason to retain or synthesize intermediates. Do not introduce named
   molecular recipes merely to resemble biology; any proposed distinction needs a shared
   mathematical rule and a concrete ecological opportunity.

Start from these implemented connections and identified limits. More slots alone do not
establish coordinated metabolism, and the lack of internal composition sensing does not
erase the existing substrate competition, product inhibition or physical storage effects.
Keep this avenue in the backlog until selected; no simulation change accompanies the review.
