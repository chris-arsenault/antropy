# Funded material life cycle and installed state

## Current design contract

Revised September 15, 2026. [Computable chemistry](../../design/chemistry/computational-foundation.md)
and [ADR 0022](../../adr/0022-computable-chemistry.md) govern formula selection and acceptance.

Preserve actual inventory and built stocks, paid generic assembly from any internal species,
repair with material turnover, work-funded learning, gradual paid installed expression, inherited
damage and funded local reproduction. Death returns material locally with explicit accounting.
Compose injury and interface response from manifold kernels and shared reductions; targets do
not grant immediate function. Select work, geometry and release rules together with M2/M3 so
birth/remodeling/death cannot hide subsidies. M0's capacitor, full-F event payment and potentially
stalled remnant process below are consequences of its superseded mathematical model. A remnant
record or that exact dissolution behavior is not independently required; its need and cost must
be decided from the replacement rules before persistence and reliability work.

## Selected computable contract — revision 4

Actual stocks retain fifteen funded entries; the inherited construction target grants nothing.
All internal species can become generic built material by accounting's paid assembly identity.
Maintenance and private learning debit linear work and dissipate it. Work/storage limits use
actual funded stocks. Injury uses both local extracellular and intracellular stress, weighted by
installed membrane susceptibility (0.05+0.95*(1-affinity)), normalized by exposure volume.
Bound damage to [0,1]; disabled/damaged stock cannot request healthy capacity.
The selected injury increment is min(1-damage, dt*k_damage*exposure), where exposure is
sum_s susceptibility_s*stress_s*(c_external,s+c_internal,s). This replaces the earlier saturating
injury equation; k_damage has inverse concentration/time units. Requested repair is material M,
bounded by damaged body M, internal donor and work. Repair reduces damage by repaired M/body M.
M4 owns action/rate selection and private-learning updates; M0's debit helper grants neither.

Repair replaces a requested fraction of damaged built material: release that amount as the
ordinary decomposition species, draw the same amount from internal chemical feedstock and
pay generic assembly plus the repair work price. Scale the entire event by donor/work limits;
damage falls only for material actually repaired. This supplies material turnover, rather than
resetting damage with a numerical clamp or only spending energy.

Remodel installed coordinates toward inherited targets continuously, at a bounded rate.
Pay e0*funded_slot_mass*chemical_path_length for each actual coordinate displacement.
The cost is proportional to path length (not its square), so subdividing a refit cannot evade
payment. This repurposes existing machinery material without granting new stock; new stock
still requires assembly. Repair/recycling and installed movement use the same work account.
Fields store no energy, so changing their constitutive response has no hidden energy refund.

Birth divides actual inventory, body, work and installed functioning material; preserve damage
and installed coordinates, independently of mutated targets. Paid split overhead dissipates.
No new functioning material, energy or membrane identity is granted at birth. Death releases
all internal IDs plus body as decomposition material locally and dissipates remaining usable
energy. Release is unconditional local return, not a persistent remnant waiting for a global
thermodynamic test. The ordinary decomposition ID remains part of the 256-element vocabulary.
Repair/death deposit at the periodic bilinear center stencil. Living exchange uses the larger
five-point cloud; neither release operation accesses remote donors. Split overhead is e0*body M.
The split helper partitions material only; M4 must assign distinct genealogical identities,
local placement and installed copies before adding the child to World.

M0 verifies event arithmetic and contracts on actual Cell owners. M4 integrates developmental
scheduling, chromosome changes, recurrent inheritance and offspring orchestration. No new
genome/RNN implementation or save migration is implied by M0's arithmetic.

## Historical M0 selection — reference only

Everything below records the previous formula selection and its original verification scope.
Imperatives and milestone instructions in this section are superseded as work orders. The
record remains available for independent comparison and reuse; passing its tests does not
approve these equations or their computational cost for the replacement system.

Current bodies already distinguish actual stocks from targets; birth divides those stocks and
retains damage. Current refitting replaces a whole installed genome after a fixed debit, while
injury reads the inherited membrane immediately. This contract closes those discontinuities and
adds the physical work missing from assembly, displacement and local death release.

### Finite event rule

For a proposed body/interface event, hold charge z fixed while constructing its tentative physical
state, including changes in capacitor capacitance B. Define `delta F0` and `delta E0` including
that tentative W. Required additional work withdrawal is
`w=max(0,delta F0)+w_overhead`. Deduct w from the tentative capacitor energy, rejecting/reducing
the event if the resulting W is negative or breaches protected reserves. Recompute z from W and
the resulting structural B. No external field depends directly on z, so this withdrawal changes
F and E by exactly −w. Book `Q=w-delta E0`, `D=w-delta F0>=w_overhead`.
This handles changing capacitance without counting it twice. Capacity overflow goes to heat;
zero-stock terminal dissolution uses the separate rule below, not division by zero.

Any internal species can become built material one-for-one, with no privileged biomass species.
For assembly extent xi use overhead `a xi`, a=0.5 E/M initially, plus the state difference.
Select inventory consumption proportional to available internal amounts, as currently, and
distribute built material among actual target deficits. Rate limit is
`xi<=growth_rate B_total dt`, initially growth_rate=0.06/t. Doubled genetic construction targets
remain fission readiness targets, not extra material. The reserve fraction is 0.2 initially.
High-reference-energy material still pays assembly overhead; released chemical energy is
dissipated rather than captured a second time by an implicit assembly enzyme.

### Injury, repair and upkeep

Damage d in [0,1] is a disabled fraction, not missing mass or a stored energetic stock. Use actual
installed membrane m and `sigma_ms=1-(1-f) affinity(m,s)` with f=0.05. Exposure is
`L=sum_s stress_s sigma_ms (c_external,s + eta_internal c_internal,s)`, eta_internal=1.
Select `dot d=k_damage L/(L+K) (1-d)` with k_damage=0.01/t and K=0.3 M/L².
The exponential integration `d_new=1-(1-d) exp(-k_damage L/(L+K) dt)` respects its bounds.
Injury changes rates and upkeep; it does not instantly erase installed energy or profiles.
This is an explicit constitutive assumption. Thermodynamics does not determine stress potency.

Requested repair is at most `action_repair k_repair dt`, k_repair=0.008/t. Repairing delta d
replaces `xi=repair_material B_total delta d` of actual stock, with repair_material=0.3.
It consumes xi internal chemical, returns xi ordinary debris locally and retains total built
mass. Pay the full combined event difference and assembly overhead a xi; reduce the repaired
fraction when supply or work is insufficient. The old additional size-independent repair_energy
retires. Replacement resets only the repaired fraction of d. No new built stock is credited.

Maintenance draws `(1+d) [m_core B_core+m_motor B_motor+m_storage B_storage+
m_machine sum B_machine+controller_cost] dt`. Initial rates are 0.006, 0.02, 0.005, 0.01
E/(M t), plus controller_cost=0.001 E/t. Paid private learning draws
`plasticity_cost |strength| dt`, initially 0.002 E/t. An unfunded learning update does not occur.
Payment goes to bath heat. Basal exhaustion kills active function after the current conservative
event; it does not remove matter or physically change the interface for free.

Storage limit is actual B_storage times 20 M/M initially. Prefer reducing import before overflow.
If shrinking stock or another event violates that limit, propose local export with its full
energetic difference. If export is unaffordable, retain the overfull actual inventory, disable
further import and postpone the capacity-reducing event. Do not discard chemicals. Work beyond
the capacitor capacity is heat, independently recorded.

### Continuous installed function

Store one current continuous parameter vector per installed slot, plus one installed membrane
coordinate. The immutable genotype supplies targets. The vector includes recognition center,
product offset and charge coupling where applicable. Normalize distances by their fixed domains
(15 for centers/offsets and 1 for nu); use Euclidean norm per slot. All live operators compile
from these actual vectors, keyed by installed revision. No list of ancestral installed genomes
or deferred replacements grows with time.

For target y and current x propose `delta x=(1-exp(-dt/tau_remodel))(y-x)`,
tau_remodel=1 t initially. Reflected coordinates are already in their bounded domains; interpolation
stays inside. Work overhead is `a B_slot ||delta x||`; membrane remodeling uses B_core as the
funded affected stock. Add the full physical delta F0, including membrane effects on Q and volume.
Limit the common progress fraction by available work and the numerical event bound. Zero work
stalls any nonzero remodel; as target distance tends to zero the response and cost tend to zero.
The old function remains useful while the installed vector moves. This is a coarse-grained
uniform remodeling approximation, not a mixture of infinitely many machine subtypes.

Existing generic material is recycled in place: the remodel changes neither the amount of stock
nor its reference identity. Work accounts the change of organized function. Growing an empty slot
still requires paid construction; choosing its initial target does not grant capacity at zero stock.
Successive targets redirect from the current installed state without resetting progress or refunding
past work. Membrane changes use exactly the same payment and continuity rule as enzyme changes.

### Birth, transfer and death

Fission or budding divides every actual built stock, internal chemical and charge z in half.
Damage fraction and installed vectors pass unchanged, so total damaged stock is conserved. At fixed
concentration and equal geometry, the capacitor satisfies `2 E_w(z/2,B/2)=E_w(z,B)`.
The changed radii, mutual daughter interaction and placement/contact energies still require an
explicit full tentative-state evaluation. Division overhead is 0.08 E initially. Only a paid,
locally placeable event commits; otherwise the parent remains. Instructions and acquired-learning
assimilation follow the existing explicit birth policy. No target grants daughter material.
Optional contact transfer changes inherited targets; actual expression follows paid remodeling.

Death terminates RNN, learning, active transport and reproduction. Inventory and body are local
material. **Immediate disappearance can require positive work** when a favorable interface is
removed or dense debris inserted. Therefore decomposition is a local dissolution process, not
an unconditional atomic erasure. The dead body's existing material record retains its interface,
extent, inventory and remaining W until those stocks can be released; it is an inactive remnant,
not a new organism type or chemical ID. No private neural history is needed by the remnant.

Select total dissolution request `xi<=k_decay M_remaining dt`, initially k_decay=1/t, proportionally
releasing internal species and converting built material to the ordinary decomposition species.
Reduce the remaining installed profile with actual stocks. Evaluate the complete finite event.
Use remaining W to fund positive delta F; downhill release is passive. With no W, release proceeds
only in a non-increasing-F direction and may stall in concentrated/binding habitat. Store finite
remaining material; never turn a stalled cost into an external subsidy. At terminal release include
all remaining W in the initial energy and remove its capacitor with the structural stock; release
only when total F does not increase. Dispose of the record only at exactly zero material or through
an explicitly accounted numerical residual, governed by the rounding rule, not a physical cutoff.

This consequence of the common laws can produce persistent remains. M4 must test release and
stall/restart through actual cells; M6/M7 must count remnant storage and limits. It is not evidence
that the current browser already has this behavior. Common washout still acts only on dissolved
extracellular chemicals, not selectively on difficult biological material.

### Verification

Four `lifecycle::` tests cover low/high-u assembly, repair replacement and debris closure; actual
stock/damage/capacitor partition; zero-work and nearby-target remodeling including membrane;
and field work during growth, fission and interface removal. Unit-scale algebra tolerance is
2e−14. The deliberately attractive interface requires 0.6 E to remove in the test: zero available
work correctly prevents that event. These algebraic results motivate the dissolution rule above;
they do not claim an actual organism survives, reproduces or decomposes under the new laws yet.
