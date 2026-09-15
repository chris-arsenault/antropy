# Parameters, units and retirement owners

## Current design contract

Revised September 15, 2026. [Computable chemistry](../../design/chemistry/computational-foundation.md)
and [ADR 0022](../../adr/0022-computable-chemistry.md) govern formula selection and acceptance.

The current design distinguishes user-set identity/ownership requirements, implementer-selected
rules and numerical choices, and measured operating limits. The inventory below remains a useful
map of original consumers, not an active list of mandatory formulas or retirement decisions.
Every retained coefficient needs a mechanism, units/convention, live/static ownership and cost.
Favor coefficients derived through the shared chemical-space basis and compatible reductions;
keep independent properties where their mechanisms differ. Reconcile all consumers when selecting
new rules rather than preserving auxiliary implementations or adding compatibility patches.

256 discrete IDs, the 16×16 chemical manifold, fixed heritable machinery, local genome/RNN cells,
finite sources/common washout, actual funded bodies, 48 founders/two colonies and immutable sharing
remain constraints. Rank two, G, T, capacitor stiffness, cubic crowding, kernel, precise geometry,
rate formulas, f32/f64 division and physical refresh frequency below are prior selections to
reassess. M1's current v4/v12 state is an implementation fact, not a prohibition on a coherently
versioned replacement. Reopened M0 records selected laws and measured core cost; completed M1
supplies the canonical parameter/operator representation for M2 integration.

## Selected computable contract — revision 4

M0 selects two signed interaction features from the existing smooth profile basis. Preserve
the independently generated potential u, diffusion D, resistance I and stress S surfaces:
energetic value, mobility and injury remain distinct mechanisms. Chemical coordinates reflect
on [0,15]²; geographic coordinates wrap. The two-profile rank is now a deliberate inexpensive
selection, not a requirement inherited from the previous solver. P=Q is the profile matrix.

Use material M, geographic length L, model time t and work E. Concentrations use M/L²;
u has E/M. Profile values are dimensionless and bounded by one. Normalize resistance by the
existing maximum 12 and profile concentrations by c0=1 M/L². Select drift speed v0=0.25 L/t,
chemical efficiency eta=0.8, engagement scale K=1 M/L², recognition radius 3 chemical units,
turnover 1 M/(funded M t), and event work price e0=0.05 E/M. These are provisional engineering
values whose role is explicit, not ecological calibration. The transport/processing effort is
bounded by one. Membrane susceptibility floor 0.05 reuses the installed-interface semantics.
Numerical scalars use reference units M0=L0=t0=E0=1. In the cell law, actual material means
M/M0 and sampled gradient means L0*gradient(H); mobility is mu0/((M/M0)R), with
mu0=L0²/(E0*t0). The passive speed coefficient is v0 multiplied by that dimensionless mobility
factor. Thus adding one to a gradient norm uses its normalized value, not unlike dimensions.
The implementation evaluates these normalized numbers directly. This convention does not assert
physical SI units, physical gravity, a conserved field energy or real chemical equilibrium.

Reuse actual Cell stocks and Config storage/energy capacities and material densities. Reuse
maintenance and injury rates with their documented replacement units. M4 selects live repair,
growth, motor and learning requests from existing actions and funded capacities. Do not introduce
another unrelated copy of these coefficients. Body material has u_body=u_decomposition;
all other species remain eligible for assembly by paying any deficit. Work storage is linear,
0<=E<=funded energy capacity, not a capacitor. M1 must version any changed persisted meanings.

Static basis/product/recognition coefficients compile on definition or installed-coordinate
changes. Amounts, work, damage, extent, donor/storage headroom and requests remain live.
M1 parameter v2 contains 34 coordinates with no charge coupling; operator v2 replaces reciprocal
edges with the selected forward maps. The same compiler serves actual numerical kernels and atlas.
Chemistry v4 and physical checkpoint v12 remain unchanged. See [representation](representation.md)
for separate target/installed ownership, validation, exact identity and measured storage.

## Historical M0 selection — reference only

Everything below records the previous formula selection and its original verification scope.
Imperatives and milestone instructions in this section are superseded as work orders. The
record remains available for independent comparison and reuse; passing its tests does not
approve these equations or their computational cost for the replacement system.

Status: source inventory and formula selections completed through M0 steps 1–8. The linked
resolution paragraphs below supersede the inventory's forward step references. “Retain” means
an independent physical or experimental assumption, not a
promise to retain its current numerical default. M1 installs definitions, M2 spatial physics,
M3 machinery, M4 life cycles, M5 economy, M6 observation/recovery and M7 performance validation.

Base symbols: material `M`, geographic length `L`, model time `t`, energy `E`. Chemical-space
coordinates and controller signals are dimensionless. Current extracellular measure is `L²`;
current intracellular measure is `L³`. [Step 2](accounting.md) selects one effective slab measure
L², disk radius, `c*=1`, `T=1`, and a capacitor with stiffness 8 E/M and actual structural-stock
capacity. This resolves body densities, concentration references, reference energy and energy
capacity: the old independent `energy_capacity` is derived as kappa/2.
[Step 3](interactions.md) selects rank 2, profile bounds ±1, symmetric signs (−,+), coupling
g=1, range l=4 and cubic crowding gamma=0.4. These are independent constitutive hypotheses;
derivatives, activity and self subtraction are derived. M1 validates profiles and M2 validates
spatial quadrature; M5 calibrates strengths without changing conservation or reciprocity.
[Step 4](transport.md) selects normalized R=1+sum i_s c_s/c*, zeta0=0.1, contact stiffness
10, immersed local membrane exchange and deterministic coarse-grained body motion. It retires
the separate impedance gains, spherical delivery cap, sphere drag constants and angular-only
thermal noise. Motor power 0.2 and efficiency 0.5 remain initial hypotheses; the actual work
limit and radius dependence are derived. M2 owns integration and M5 movement calibration.
[Step 5](machinery.md) retains four slots and R=3, turnover=2.5 and receptor tau=2 as initial
kinetic assumptions. Product offsets and charge coupling nu become continuous installed loci;
nu is dimensionless in [-1,1]. Symmetric barrier b=distance²/R² uses the existing recognition
scale rather than another length constant. Occupancy, forward/reverse ratio and exact work
capture are derived; receptor_k, constant transport_energy and conversion_efficiency retire.
[Step 6](lifecycle.md) selects assembly/remodel overhead a=0.5, remodeling time 1, dissolution
rate 1, full-event work and inherited actual-state partition. Injury/repair/upkeep, stock ratios,
packing densities (4 M/L² each), storage capacity 20, reserve 0.2 and division overhead 0.08
remain initial independent assumptions. Repair_energy and atomic refit cost retire. Membrane
coupling uses actual installed coordinates. M4 validates finite lifecycle events and remnant
dissolution; M5 calibrates budgets. Founder endowments and minimum daughter stocks remain the
existing stated inputs pending M5, with their units changed only as specified in accounting.
[Step 7](numerics.md) pins mesh 2 and nominal dt=0.2 for comparison, with controller interval
0.8, full physical refresh on accepted substeps, donor safety fraction 0.5, 64 accepted-substep
and 20-halving operating limits. Precision remains f32 bulk/f64 accounting with explicit rounding.
The old diffusion-only CFL, nonlinear washout commutation and physical stale-field clock retire.
M2/M7 own refinement and performance; numerical settings may change only with model-time and
fidelity evidence. No physical rule is left dependent on an unspecified epsilon.

### Environmental and intrinsic inputs

All keys in this table are owned by `engine/src/config.rs`; consumer paths are relative to
`engine/src/`. Rows group parameters only when their disposition and physical owner agree.

| Current key | Meaning and current units | Consumers | Disposition and resolving owner |
| --- | --- | --- | --- |
| `chemistry_seed` | Deterministic property definition; integer | chemistry, world | Retain independent definition seed; M1 validates physical coverage without organisms. |
| `width`, `height` | Periodic XY extents, L | field, movement, sources, world | Retain independent geometry; step 2 defines measure. |
| `source_count`, `landscape_regions` | Counts of sites and richness regions | sources | Retain environment inputs, M5. |
| `landscape_spread`, `source_radius` | Region dispersion and release support, L | sources | Retain environment geometry, M5; not force range. |
| `source_priming` | Fraction of finite source stock released at initialization | sources, world | Retain; include initial state after priming, M5. |
| `source_rate` | Baseline release, M/t | sources | Retain source limit, M5; full insertion energy in step 2. |
| `source_lifetime`, `source_gap` | Emission and renewal durations, t | sources | Retain finite inventories and renewal boundary; M5. |
| `source_species`, `source_epochs`, `source_zones` | IDs and normalized mixtures; epoch `phase_ticks` in ticks | chemistry, sources, world | Retain experimental controls; convert ticks to t explicitly; property-only default selection reviewed in M5. |
| `disturbance` | `mean_interval` t, `radius` L, `mortality` and `mixing` fractions | lifecycle | Retain explicit intervention; displacement, death and mixing work must be externally booked, steps 2/6. |
| `washout` | Uniform first-order loss, 1/t | field, world | Retain one slow rate; replace linear energy debit by full removal event, step 2/M2. |
| `movement_impedance`, `diffusion_impedance` | Separate resistance gains (currently applied to load squared versus load) | movement, field, transport, economy | Retire both independent corrections; one resistance constitutive law, step 4/M2. |
| `viscosity` | Baseline drag scale, currently E t/L³ | movement | Retain one baseline mobility scale with revised slab units, step 4. |
| `thermal_energy` | Angular noise scale, E | movement | Retire independent angular-only bath; step 4 selects consistent thermal convention. |

### Funded physiology and installed properties

| Current key | Meaning and current units | Consumers | Disposition and resolving owner |
| --- | --- | --- | --- |
| `affinity_radius` | Fixed recognition width, chemical-coordinate units | chemistry, genetics | Retain fixed width; common occupancy in step 5/M3. |
| `susceptibility_floor`, `internal_exposure` | Residual susceptibility and internal/external exposure weighting, dimensionless | sensing | Retain independent injury assumptions, step 6; actual installed membrane determines compatibility. |
| `stress_k` | Half-response exposure, currently mixed concentration units | sensing | Retain injury saturation scale with common concentration convention, step 6. |
| `damage_rate`, `repair_rate` | Maximum injury/repair fraction per t | sensing, metabolism | Retain kinetic rates; damage is loss of functioning fraction, step 6. |
| `repair_material` | Replacement M per damaged fraction per body M | metabolism | Retain turnover proportion, step 6. |
| `repair_energy` | Additional E per repaired fraction | metabolism | Retire size-independent debit; derive from replacement amount and assembly work, step 6/M4. |
| `receptor_k` | Receptor half-response concentration | sensing | Retire duplicate saturation; common dimensionless activity reference supplies this scale, step 5. |
| `receptor_tau` | Receptor memory relaxation time, t | sensing | Retain temporal filter, step 5; independent of physical field clocks. |
| `birth_mass` | Genetic baseline structural target, M | genetics, sensing | Retain construction scale; instructions grant no stock, step 6. |
| `motor_ratio`, `storage_ratio`, `receptor_ratio`, `transporter_ratio`, `enzyme_ratio` | Baseline genetic target fractions | genetics, sensing | Retain allocation inputs; installed stock sets capacity, steps 5/6. |
| `body_density`, `inventory_density` | M/L³ currently | organism, sensing, movement | Retain packing assumptions with explicit effective slab measure, step 2; derive extent. |
| `storage_capacity` | Internal M per storage-stock M | organism, transport, metabolism | Retain funded capacity; overflow is accounted export, step 6. |
| `energy_capacity` | E per structural M | organism, metabolism | Retain bounded usable work store, steps 2/6. |
| `founder_inventory`, `founder_energy` | Initial M and E per founder | organism, world | Retain explicit initial endowment; M5 calibrates, no descendant subsidy. |
| `maintenance`, `motor_maintenance`, `storage_maintenance`, `machinery_maintenance` | E/(M t) for structural, motor, storage, machinery stock | organism, metabolism, economy | Retain constitutive upkeep by stock, step 6. |
| `controller_cost` | E/t per active cell | organism | Retain controller upkeep, step 6. |
| `transporter_turnover`, `enzyme_turnover` | Processed M/(installed M t) | transport, metabolism, economy | Retain maximum catalytic rate; common finite engagement and reversible tendency, step 5. |
| `transport_energy` | Constant E/M charged for either direction | transport, economy | Retire blanket debit; powered stoichiometry and actual potential differences, steps 4/5. |
| `conversion_efficiency` | Fraction applied to constant reference-energy differences | chemistry, genetics, metabolism, economy | Retire asymmetric conversion rule; reversible work-coupled channels, step 5. |
| `growth_rate` | Assembled M/(body M t) | metabolism | Retain rate ceiling, step 6. |
| `construction_energy` | Extra E/M assembly and atomic refit debit | chemistry, metabolism, refitting | Retain assembly irreversibility coefficient; derive total work including state/field changes; remodeling has continuous cost, step 6. |
| `protected_reserve` | Work/storage fraction withheld from discretionary actions | metabolism, refitting | Retain local allocation rule, never energy creation, step 6. |
| `division_cost` | E per division | lifecycle | Retain positive remodeling overhead; add field/placement work, step 6. |
| `daughter_inventory`, `daughter_energy` | Minimum M/E per offspring | lifecycle | Retain eligibility conditions; divide actual stock only, step 6. |
| `motor_power_density`, `motor_efficiency` | E/(motor M t), mechanical efficiency | movement | Retain installed power and loss fraction; shared drag, field work and contact, step 4. |
| `plasticity_cost` | E/t per unit learned strength | sensing | Retain paid private-learning rate, step 6. |

### Inheritance, numerical choices and operating limits

| Current keys | Meaning/units and consumers | Disposition |
| --- | --- | --- |
| `transfer_rate` | Contact opportunity 1/t; lifecycle | Retain optional transfer; expression pays remodeling, step 6. |
| `mutation_rate`, `physical_mutation_rate` | Per-locus birth probabilities; controller/genetics | Retain experimental controls; mutation changes instructions, not actual body. |
| `mutation_scale`, `physical_mutation_scale`, `mutation_kind` | Dimensionless perturbation amplitude/distribution | Retain controls; continuous product/installed response in steps 5/6. |
| `ploidy`, `transmission`, `crossover`, `reproduction` | Inheritance and fission/budding policies; genetics/lifecycle | Retain functions, revise stock/energy handoff consistently in step 6/M4. |
| `learning`, `learning_retention` | Private-learning mode and birth assimilation fraction; controller | Retain policy and immutable chromosome boundary. |
| `mesh` | Finite-volume width L; field/numeric/transport | Numerical choice, step 7; does not determine interaction's physical range. |
| `dt`, `physiology_interval` | Movement and chemistry scheduling intervals t; world | Numerical choices, step 7; no stale energetic fields between events. |
| `founders` | Initial count; world | Operating fixture: 48, at least two colonies. Retained explicitly, M5/M7. |
| `max_population`, `max_ancestry_records` | Hard stop limits; world/lifecycle | Operating limits, not death laws; retain explicit failure/export behavior M6/M7. |

### Hardcoded coefficients and source review

| Source and expression | Meaning/current units | Disposition |
| --- | --- | --- |
| chemistry: 256, 16, reflection period 30 and edge 15 | Discrete vocabulary and chemical-coordinate topology | Retain. Product offsets become continuous reflected weights, step 5. |
| chemistry: potential range 0.5–8, D 0.005–0.5, impedance 0–12, stress 0–1 | E/M, L²/t, resistance loading, intrinsic injury | Retain range hypotheses with normalized resistance and new coupling profiles; steps 2/3, M1 coverage/M5 calibration. |
| chemistry: 4×16 cosine basis, jitter 0.0125, principal ±1 modes, stress 0.5/−0.25 coefficients | Deterministic smooth surfaces, logarithmic D interpolation | Retain smooth generation approach; M1 generates/validates additional profiles. No ecology-based seed selection. |
| chemistry: affinity `max(0,1-d²/R²)²` | Smooth finite support | Retain; step 5 defines reciprocal channel binding. |
| chemistry: coverage counts 8, 20/80% property thresholds, neighbor change 0.15, connected barrier count | Physical opportunity validation, not ecological fitness | Retain validation intent; M1 extends profiles and transformed neighborhoods. |
| chemistry: decomposition nearest U=2 | Generic body's reference identity | Derive body reference from ordinary decomposition ID, step 2; field insertion still has work, step 6. |
| chemistry: source score ΔU D/[(1+I)(1+S)], separation 5, U>4 | Property-only startup heuristic | Retire old analytical deliverability claim; M5 replaces using selected flux/kinetics and source policy. |
| field: mesh², four bilinear weights, harmonic mobility | Concentrations, local sampling and symmetric face conductance | Retain conservative geometry; replace physical kernel and flux in steps 3/4/7. |
| field: `4 D dt/mesh²/0.95`, exponential washout | Diffusion-only CFL, exact uniform loss | Retire CFL as sufficient stability test; step 7 adds drift/nonlinearity. Retain exponential sink as separate event; no nonlinear commutation claim. |
| transport: `4πrDc`, min(capacity/total,1) | Spherical infinite-reservoir delivery and hard saturation | Retire both; local membrane operator plus resolved field delivery, steps 4/5. |
| organism: `3/(4π)`, cube root, body+inventory volume | Sphere in 2D world | Replace by effective slab area and disk extent in step 2; all radius consumers migrate together M2/M4. |
| movement: `6π`, `8π`, r and r³, mobility squared | Sphere drag/rotational resistance | Replace by selected slab drag, step 4. |
| movement: angular `sqrt(6 thermal dt/drag)` | Uniform angular noise variance | Retire isolated noise rule; step 4 defines bath convention. |
| movement: four overlap passes, 0.5r/0.25 travel bound, 0.1 bucket padding, 2.399963 fallback angle | Contact projection and numerical geometry | Replace unpaid projection by energetic contact response; step 4; step 7 owns displacement accuracy bound. Bucket ordering is numerical only. |
| sensing: five local samples, gain stock/(stock+target), `2 receptor_k`, exponential temporal filter | Body-relative readings and duplicate saturation | Keep local sampling/filter; common occupancy and installed gain, step 5. No oracle channels. |
| sensing: `(1-damage)`, affinity susceptibility, saturation `load/(load+K)` | Finite function loss, chemical-specific injury | Retain meaning; step 6 selects installed compatibility and normalized exposure. |
| metabolism: doubled targets, proportional deficits, protected capacity, repair replacement | Local funded development | Retain target/actual distinction, steps 2/6. |
| refitting: sum whole changed stocks × construction work, immediate genotype swap | Atomic remodeling | Retire; bounded gradual paid installed coordinates including membrane, step 6. |
| lifecycle: halves, cube-root child radius, 1.001 separation, eight trial angles, 0.05 contact-transfer gap | Actual inheritance and geometric placement | Retain stock fractions and bounded search; derive disk radius and full placement work, step 6. |
| organism/controller: `(1+damage)` upkeep, 39/24/9 network dimensions, ±3 squash/27/9, ±16 weights, ±1 traces | Physiological loss and numerical local controller implementation | Retain upkeep assumption and local RNN function; coefficients remain controller-owned, not thermodynamic laws. M4 adapts inputs only as required. |
| controller: seed weights, plasticity vector, 127.5/255 task encoding, rate 0.25 sparse mutation crossover | Initial diagnostic behavior, byte mapping and sampling implementation | Retain opaque local-byte semantics; M4/M5 review founder against actual chemistry. No physical constant inferred from neural weights. |
| world: two alternating colony centers, 0.1 world separation, 2.5/1.5 packing and 10,000 placement attempts | Startup geometry and bounded placement | Retain two-colony semantics; M5 recalculates packing from disk sizes. |
| world: 512 recent events, 4096 interventions, genome pruning `4N+256` | Bounded observation/continuation storage | Retain operating ownership; M6/M7 recalculate installed-state retention. |
| config and source comparisons: positive denominators, 1e−300/1e−30/1e−12 floors, 1e−8 geometry and fraction tolerance | Current numerical guards | Retire floors as physical laws; exact zero/limiting rules and scale-based error accounts, steps 2/7. |

Manual red evidence: neither `docs/specs/` nor `engine/tests/` existed before this inventory.
Reviewed complete bodies of Config, chemistry, field, transport, movement, metabolism, organism,
sensing, refitting, lifecycle, world and controller. Every physical Config field above has a
consumer and disposition, including controls and limits to avoid misclassifying them as laws.
The unselected mathematical terms have explicit step owners; they must be closed by step 8.
Source layout/richness internals beyond these bodies are M5's calibration scope, not an assertion
that their implementation has already been audited here.
