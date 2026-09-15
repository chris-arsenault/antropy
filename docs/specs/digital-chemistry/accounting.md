# Material, energy and reservoir contract

## Current design contract

Revised September 15, 2026. [Computable chemistry](../../design/chemistry/computational-foundation.md)
and [ADR 0022](../../adr/0022-computable-chemistry.md) govern formula selection and acceptance.

Material conservation, explicit source/sink books, bounded usable work and paid cellular
capabilities remain requirements. Select their discrete accounting identities together with the
update. Define which interaction quantities store energy, which only influence rates, and how
closed processing/movement/construction/death cycles avoid creating spendable work. Reference
energy alone is sufficient only if the designed rules justify it; global thermodynamic evaluation
is not automatically required. The capacitor, logarithmic entropy, bath and finite-F payment
formulas below are superseded selections, not the required replacement. Reopened M0 selects
joint field/machinery/lifecycle accounts; M1 reconciles representation and M2–M4 integrate them.

## Selected computable contract — revision 4

The selected total stored energy is U=sum_s u_s n_s + u_body B + E across all owners.
Shared interaction/resistance fields are constitutive transport signals and store no recoverable
work. Neither passive drift, contact, movement, profile changes nor field relaxation credits E.
Thus a field-driven material cycle cannot be a work source. Transport changes location, not u_s.
This is an artificial constitutive rule; no thermodynamic equilibrium or global free-energy
descent is claimed.

For an event converting q from u_a to u_b, use the existing chemical conversion identity:
if d=u_a-u_b>=0, deltaE=eta*d*q and heat=(1-eta)*d*q;
otherwise debit -d*q/eta and dissipate -d*q*(1/eta-1).
An additional nonnegative operation price dissipates its paid work. Assembly always costs
q*(e0+max(u_body-u_a,0)/eta); heat=q*u_a+payment-q*u_body.
Release B as the ordinary decomposition species without changing its stored energy.

Allocate events from frozen pre-stage owners. Sum competing donor, work and positive storage
requests before applying whole-event scaling. Products and earned work become usable in the
next stage. Never let a batch fund its own uphill requests from prospective downhill products.
An individual conversion nets its own operation price against its chemical yield. Its positive
net yield can restart an empty work store, but cannot fund another event's negative net request
in that batch. Only those negative requests share the frozen work limit. Product mixtures use
their weighted reference energy before applying efficiency; conservation covers the whole map.
Storage overflow in E dissipates heat; no cell or profile installation creates capacity stock.
Material roundoff and u-weighted roundoff are separate signed numerical boundary entries.

Then U_initial+external energy+numerical input=U_final+heat+external output.
Heat is nonnegative for each accepted event. A closed sequence restoring material/body state
has deltaE<=0 absent explicit boundaries and bounded representation error. This local identity
replaces capacitor/free-energy acceptance and is checked across composed field/cell events.
Sources debit finite inventories; renewal is external input. Uniform washout is an external sink.
No logarithmic entropy, mixing heat, global F check or per-event whole-world energy evaluation
is required. Full independent audits belong in tests and bounded diagnostics.

## Historical M0 selection — reference only

Everything below records the previous formula selection and its original verification scope.
Imperatives and milestone instructions in this section are superseded as work orders. The
record remains available for independent comparison and reuse; passing its tests does not
approve these equations or their computational cost for the replacement system.

Selected in M0 step 2. Current `Ledger::heat` adds positive expenses and cached reaction heat;
`World::held` and `Field::totals` count linear reference energies. Those books omit interaction
energy, concentration entropy, and work during displacement/insertion. They stay unchanged in M0.

### Units and states

Choose base material M, length L, time t and energy E. Treat the XY medium as an effective slab
of fixed unit depth: all exposed and internal concentrations use M/L². No depth coordinate is
introduced. Mesh compartments have area `A=h²`. An organism's effective area is
`A_b=B/rho_b+N_internal/rho_i`; `r=sqrt(A_b/pi)`. Densities have units M/L². Internal mixing
uses this same `A_b`; its dependence on inventory/body is differentiated in chemical potentials
and assembly work. This replaces the incompatible sphere/area delivery convention coherently.
Use `c*=1 M/L²`, `T=1 E/M` as initial reference scales, not literal kelvin or molecular counts.
`0 log 0=0`; chemical potentials at zero have their analytic one-sided limit. There is no
concentration floor or removal threshold in the physical model.

Each species has reference energy `u_s` in E/M (initial range 0.5–8). Generic built material
has `u_b=u_decomposition`, selected from an ordinary chemical nearest 2 E/M. Built material
has no mixture entropy. It acquires volume, field coupling and constitutive work costs.
Source stock is finite, externally held feedstock with linear reference energy. A source is
not a physical mixture inside the XY medium until released. Insertion may require external work.

Usable work `W` is an explicitly bounded ideal capacitor, not an additional chemical. Define
charge-equivalent `z=sqrt(2 B W/kappa)` in M, where B is actual structural stock and
`E_w=F_w=kappa z²/(2B)`, `0<=z<=B`, initially `kappa=8 E/M`. Capacity is `4B E/M`.
Charge is an internal energetic coordinate and is **not added to material totals**. The work
potential is `mu_w=kappa z/B`; channels change z and therefore W. A finite conversion books
the exact quadratic energy difference. Work-consuming nonchemical actions withdraw W directly
and derive the new z. If B changes, z and all other actual stocks are held fixed while evaluating
the tentative event; capacity overflow releases energy as heat. Birth divides z and B in the
same fraction, preserving total capacitor energy. This avoids constant-yield fuel production
when the work store is full. A cell with B=0 is decomposing; no capacitor evaluation at B=0.

### Common accounts

Let `E_p=sum n_s u_s + u_b sum B + E_interaction + E_crowding + E_contact` exclude usable
stores, but include source reference energy. Let
`S_mix=-sum n_s [log(n_s/(A c*))-1]` and `F_p=E_p-T S_mix`.
Total stored energy `E=E_p+sum W`; total free energy `F=F_p+sum W`.
Interaction/crowding definitions are selected in step 3; contact in step 4. These are stored
energies, not extra charges on top of chemical potentials.

For a closed material event, with useful work supplied to the physical subsystem
`w=-delta W`, define signed heat **to** the bath `Q=w-delta E_p`. Then
`delta(E_p+W)+Q=0` and entropy production times T is
`D=Q+T delta S_mix=w-delta F_p >= 0`.
Heat Q can be negative: reversible concentration work can draw heat from a fixed-temperature
bath. It cannot draw net usable work from a closed cycle restoring the physical state because
`sum w=sum D>=0`. A passive ideal mixing event has `delta E_p=Q=0` and `D=T delta S_mix>0`.
Record Q and D separately; do not equate free-energy decrease with heat.

With external material and work, use signed boundary input `I_E`, output `O_E` and mechanical
work `W_ext`. The first law is `E_final-E_initial=I_E-O_E+W_ext-Q-R_E`.
Material independently satisfies `M_final-M_initial=I_M-O_M-R_M`.
`R` is measured signed numerical loss. A boundary event records its initial/final state and
separates carried reference energy from the exact interaction/crowding/mixing change. For a
prescribed insertion/removal, select reversible boundary work `W_ext=delta F - carried_F`;
the bath account is then fixed by the first law. This states the reservoir obligation even
when insertion lowers field energy. External supply cannot be reported as an organism's capture.

### Event ownership

| Event | Material owners | Energetic rule and owner |
| --- | --- | --- |
| Field face transfer | Two neighboring finite volumes | Conservative flux; delta F dissipates, delta E sets Q; steps 3/4/7. |
| Membrane exchange | Touching external stencil and one internal mixture | Shared allocation and powered/passive channel; steps 4/5. Includes volume and interface changes. |
| Unary processing | Internal substrate to discrete products | Same total F including capacitor; step 5. No constant cached yield. |
| Body construction and repair | Internal mixture to built/released material | Exact state difference plus positive work overhead; step 6. |
| Remodeling, motion and division | Actual interfaces, stocks, positions | Physical state differences and dissipation; steps 4/6. |
| Source renewal/release | External reservoir to source, then source to field | Record replenishment reference input and release boundary work separately. |
| Washout | Every external species to sink | `n -> n exp(-lambda dt)`; full state difference, boundary work and heat. No selective species rate. |
| Maintenance/learning | W to bath | No material credit; Q equals payment, step 6. |
| Death/overflow | Cell to local medium | Exact redistribution, released W, decomposition and field work; step 6. |
| Disturbance/manual intervention | Declared external operator | Record material and full energetic change, never disguise it as passive physics. |

For every finite closed event, enforce nonnegative owners and `delta F<=0` including work.
Differential rate signs alone do not license an oversized event; step 7 selects the admissibility
rule. Neither heat nor signed boundary work may be clipped to zero to hide a balance error.

### Bounded verification

`accounting::units_and_internal_transfers`, `explicit_boundaries_and_work_reservoir` and
`ideal_mixing_is_entropy_change_not_heat` use independent material sums, the capacitor derivative
and a two-compartment mixing solution. Algebra tolerances are 1e−13 at O(10) scales; derivative
tolerance 1e−9 with central difference epsilon 1e−6. Mixing two units from [2,0] to [1,1]
lowers F by `2 log 2=1.38629436112` while heat is exactly zero.
