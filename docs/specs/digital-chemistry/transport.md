# Transport, delivery and movement

## Current design contract

Revised September 15, 2026. [Computable chemistry](../../design/chemistry/computational-foundation.md)
and [ADR 0022](../../adr/0022-computable-chemistry.md) govern formula selection and acceptance.

Use diffusion plus drift, with drift composed from shared geographic vector fields and short
chemical-response reductions over the 16×16 manifold. Zero drift recovers the selected conservative
diffusion rule. Resistance and directional influence have explicit roles; local donors, storage
and funded machinery limit membrane exchange. Cells contribute to and respond to the same medium,
with funded motor effort distinguished from passive motion. Choose conservative allocation,
positivity/stability bounds, self/contact treatment and work accounting together with affordable
operators. Exponentially fitted face flux, sphere/slab drag formulas and full-F acceptance below
are prior reference choices, not compulsory implementations. M2 must derive and measure the
replacement before integrating motion and local delivery.

## Selected computable contract — revision 4

For neighboring nodes i,j use m_ij=2/(R_i+R_j). Form one shared face vector
b_ij=(H_j-H_i)/(1+|H_j0-H_i0|+|H_j1-H_i1|).
For species s set v_ij,s=(v0/h) dot(P_s,b_ij), then the directed rate
a_ij,s=m_ij*(D_s/h²+max(v_ij,s,0)).
Exchange dt*(a_ij,s*n_i,s-a_ji,s*n_j,s) once per face. All coefficients are nonnegative,
|dot(P_s,b)|<=1 and m<=1. Choose a substep with
4*dt*(D_max/h²+v0/h)<=0.5. Each donor retains at least half its initial material, and the
paired update conserves every chemical in exact arithmetic. Zero v0 gives conservative diffusion.
No face exponential, logarithm, derivative of global F or iterative rejection solve is used.

Cell transfer requests sample the finite cloud and use installed recognition weights, actual
capacity, effort, damage and current internal/external concentrations. Imports allocate the
specific local field donors jointly across cells; exports are delayed until donor allocation
finishes. Import headroom and all transport work are bounded before commitment. The former
4*pi*r*D*c capture ceiling retires at live integration: geographic delivery and allocated local
donors already provide the supply limit.

Cell passive displacement uses interactions' bounded vector. For motor force f, mobility
mu=1/(actual material * sampled resistance), requested velocity=mu*f and work=dt*mu*|f|².
Scale force by sqrt(available/requested work) when necessary, then debit actual work.
Cap total displacement by a declared geometric step bound and scale paid force consistently;
numerical motion limiting is reported, never hidden model-time loss. Passive response earns no
work. Translation alone leaves stored chemical/body energy unchanged.

Washout multiplies every extracellular channel by exp(-lambda*dt), a single shared scalar per
update, with explicit material/u-energy sinks. Source release is a finite-inventory transfer;
renewal is the external boundary. Empty/tiny channels are ordinary amounts without an abundance
deletion threshold. Precision and actual source ordering follow numerics.

## Historical M0 selection — reference only

Everything below records the previous formula selection and its original verification scope.
Imperatives and milestone instructions in this section are superseded as work orders. The
record remains available for independent comparison and reuse; passing its tests does not
approve these equations or their computational cost for the replacement system.

The current `Field::advance` conserves Fickian exchanges; `diffusive_supply` then imposes a
separate spherical capture ceiling. Movement squares a different resistance correction and
projects overlaps without field work. This contract replaces those physical laws together in M2.

### Shared mobility and face flux

Normalize intrinsic resistance to `i_s=impedance_s/12 in [0,1]` and define
`R=1+sum_s i_s c_s/c*`. No separate movement/diffusion impedance gains remain.
Chemical mobility is `M_s=D_s/(T R)>0`, giving
`J_s=-D_s c_s/(T R) grad mu_s`. At zero interactions and constant R, this is Fick's law
with effective D_s/R. Resistance dissipates motion; it is not directional potential energy.

For one face of length a and center distance d, write `mu=T log(c/c*)+psi` and
`v=(psi_right-psi_left)/T`. Use flux of amount
`j=(a/d) D_face [B(v)c_left-B(-v)c_right]`,
`B(v)=v/expm1(v)`, `B(0)=1`, with harmonic D_s/R on the face.
This exponentially fitted flux integrates a linear frozen excess potential across that face.
It is finite with an empty compartment and has the same sign as mu_left−mu_right.
The identities `B(-v)=exp(v)B(v)` and B>0 give zero flux at equal chemical potentials.
At v=0 it is exactly the finite-volume Fick flux. Near zero evaluate B by its series;
for large positive v use the negative exponential form to avoid overflow.

The [Scharfetter–Gummel aggregation-diffusion study](https://arxiv.org/abs/2004.13981) supplies
the numerical precedent for a finite-volume flux with a free-energy structure. Antropy's explicit
nonlinear update and cellular operators need the separate bounds in the numerics contract;
the paper's dissipation result is not a blanket proof for this implementation.

For the continuous closed passive model,
`dF/dt=-sum_s integral (D_s c_s/(T R)) |grad mu_s|² - sum_b M_b |F_b|² <=0`.
The bath receives Q=−delta E, not automatically −delta F.

### One membrane boundary

Use an immersed finite membrane coupled **only** to the cell's local touching finite-volume
weights. External delivery is the resolved face flux above. There is no additional far-field
`4 pi r D c` limit, no remote resource query and no hidden well-mixed capture volume. The cell
does not exclude solvent from grid volumes; its interface is an immersed exchange boundary.
Body contacts act between cells. The resulting coarse membrane approximation must pass M2 mesh
refinement; it cannot be certified by the old spherical steady-state formula.

Each installed transporter defines reversible outside/inside channels, competitive activity on
both sides, finite stock and action-limited turnover. Step 5 defines their common occupancy and
directional rates. Use total affinity `A=mu_out-mu_in-nu mu_w` for inward progress `dz=nu dn`.
Nu<0 spends stored charge to pump inward; reverse progress exports and reverses that charge
exchange. Passive nu=0 has zero current at equal potentials. Action zero closes the channel.
An empty donor contributes no directional mass flux. Zero work or full charge removes infeasible
net progress; remaining passive channels still operate. Shared demand allocation is simultaneous
and order-independent; capacity/storage limits scale progress, never flip its thermodynamic sign.

Resolved diffusion and membrane resistance are in series, each used once. In the dilute linear
limit `j=g_d(c_bulk-c_surface)=g_m(c_surface-c_internal)`, hence
`j=(c_bulk-c_internal)/(1/g_d+1/g_m)`. This is a diagnostic reduction, not a second cap on the
live solver. Strong membrane capacity cannot bypass weak field delivery; strong local attraction
can change actual delivery through psi and must not be silently clipped by an unrelated cap.

### Cell drag, motors and contact

For effective disk radius r, choose translational drag `zeta=zeta0 R_b r/r*`, rotational drag
`zeta_rot=zeta r²`; `r*=1 L`, initial `zeta0=0.1 E t/L²`. R_b is the normalized exposed-disk
average of R. Both material extent and local chemistry affect mobility. The old 6pi/8pi spherical
prefactors and squared impedance correction retire. These drag magnitudes are constitutive
hypotheses to calibrate against useful movement in M5, not consequences of thermodynamics.

Let F=−grad_X F_p and tau=−partial_heading F_p. Motion is overdamped:
`v=(F+f_motor)/zeta`, `omega=(tau+tau_motor)/zeta_rot`.
Installed motor stock sets `Pmax=p_motor B_motor(1-damage)`, initially p_motor=0.2 E/(M t).
RNN efforts select direction and a force/torque ellipse satisfying
`|f_motor|²/zeta+tau_motor²/zeta_rot<=Pmax`. Limit their scale further so the actual electrical
work `max(0,f_motor·v+tau_motor omega) dt/eta` fits available W, with eta=0.5 initially.
Negative motor work is dissipated, not credited as regenerative power. Also limit displacement
and verify the full finite-step energy inequality. A constant free-space speed formula alone
would miss the extra payment when a field assists motion.

Contact is a finite stored repulsion, `E_contact=k_contact/2 sum_pairs max(0,r_a+r_b-d_ab)²`,
initial `k_contact=10 E/L²`. Differentiate it for forces and for radius changes. There is no
unpaid overlap projection. At coincident centers the radial direction is undefined; use a
deterministic symmetric pair direction with opposite forces and accept only energy-decreasing
separation. Radius/position step bounds resolve soft contact. Birth placement remains a bounded
search for a nonoverlapping local configuration with its full energy payment.

Select deterministic coarse-grained cell motion for this first model: no independent angular
noise. The fixed T bath controls mixture entropy; macroscopic cell fluctuations are neglected.
This is an explicit approximation, not an unaccounted random source of interaction work. The
angular-only `thermal_energy` parameter retires. Genetic/environmental random streams remain.

When any amount, installed interface, body extent or position changes, refresh the affected
profile contributions and chemical potentials before a dependent physical operation. Source
insertion and washout are also invalidations. Controllers may hold actions between observations;
physical forces cannot use that slower observation clock as a stale-field allowance.

### Verification

Three `transport::` tests check flux sign and equilibrium, exact Fick behavior, conserved exchange,
empty/high-resistance limits, independently solved serial delivery, downhill motion and a scalar
uphill work bound. Algebraic tolerance 1e−14 covers these unit-scale operations. Finite nonlinear
payment is subsequently checked through full event differences, not this linear budget alone.
These are small compartment equations; actual organism motion/contact/reach remain M2/M4 gates.
