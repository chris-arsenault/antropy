# Shared interactions and derivatives

## Current design contract

Revised September 15, 2026. [Computable chemistry](../../design/chemistry/computational-foundation.md)
and [ADR 0022](../../adr/0022-computable-chemistry.md) govern formula selection and acceptance.

The chemical manifold organizes inexpensive property and response bases. Project local mixtures
and actual installed cell interfaces into a few shared fields, apply bounded geographic operators,
and compose chemical/cell responses from those fields. Preserve finite reach, meaningful
composition dependence, explicit self treatment and bounded accumulation. The basis rank, sign
matrix, crowding function, kernel and deposit/sample stencil are implementer-owned choices.
Symmetry or a discrete energy function may help establish consistency; exact continuum derivatives
and integrated soft-disk quadrature are not mandatory. Preserve the factored arithmetic through
the downstream response rather than adding expensive species-wise nonlinearities after projection.

## Selected computable contract — revision 4

Compute H=C P plus normalized deposited cell profiles, and R=1+C(I/12). C uses geographic
concentration; H is normalized by c0. Use these same two profile surfaces for chemistry and
installed membranes. A cell source is its body mass times installed membrane profile plus the
profile-weighted internal mixture. The response profile is that source divided by total actual
material, so each response component remains in [-1,1]. Damage reduces installed action capacity.

Define the cell's finite geographic footprint as a weighted five-point cloud: center weight 1/2,
and four axial offsets at actual radius r with weight 1/8 each. Deposit each point through the
existing bilinear stencil; sampling uses the identical combined weights (at most 20 entries).
This is the selected discrete footprint, not a quadrature approximation to a particular disk.
Actual area remains B/rho_body+N_internal/rho_inventory and r=sqrt(area/pi).

Use central periodic differences of H for cellular response. Because this linear difference
operator is antisymmetric and deposition/sampling weights are identical, a cell's own cloud
contributes exactly zero sampled gradient in exact arithmetic. Apply bounded response only
after sampling; saturating deposited H first would destroy that identity. Chemical face drift
uses bounded shared differences as specified in transport. Reach is the footprint plus the
finite difference stencil; no distant material becomes directly available.

Mixture resistance affects mobility. It does not become a separately rewarded energy gradient.
Passive velocity uses the profile-weighted sampled gradient divided by one plus its L1 norm,
scaled by v0 and inverse resistance and actual material. Motor contribution is paid separately.
Pair contact is geometric nonoverlap correction with no energy credit; equal-and-opposite
mass-weighted displacements preserve the pair center of material. A coincident pair uses a
deterministic geometric direction. Overlap correction is reported separately from motor travel.
Material bounds follow conservation and bounded external supply, not cubic crowding.

## Historical M0 selection — reference only

Everything below records the previous formula selection and its original verification scope.
Imperatives and milestone instructions in this section are superseded as work orders. The
record remains available for independent comparison and reuse; passing its tests does not
approve these equations or their computational cost for the replacement system.

Selected M0 law: a rank-two symmetric interaction plus positive cubic crowding. Rank two permits
independent interaction preferences at small projection cost. Select `G=diag(-g,+g)`, initially
`g=1 E L²/M²`, and generated profiles `q_s in [-1,1]²`. The signs allow both attraction and
repulsion without a species-by-species interaction matrix. The two profile components are smooth
functions on the same 16×16 chemical manifold; M1 owns deterministic generation and joint coverage.
Intrinsic diffusion, resistance and injury surfaces remain separate kinetic/physiological inputs.
They do not also enter energetic profiles by default.

### Functional and range

For geographic displacement x, choose
`k_l(x)=(1+cos(pi x/l))/(2l)` for `|x|<l`, zero otherwise;
`K(x,y)=k_l(x) k_l(y)`, with `l=4 L`. Each factor integrates to one, has continuous first
derivative zero at its support boundary, and is nonnegative. Use its periodic image sum on XY;
normally `2l<min(width,height)`. Small worlds must sum overlapping images, not use an invalid
minimum-image shortcut. This is a C1 separable finite-range kernel; no C2 claim is needed.
Its range is a physical choice independent of mesh. At h=2 it has compact stencil support;
refinement must keep l fixed. Select `gamma=0.4 E L⁴/M³` for crowding.

Let extracellular `rho=sum_s c_s`, `v=sum_s q_s c_s`. A cell contributes an exposed profile
density `Q_b w_b(x-X_b)`, with `integral w_b=1`. Define

```
v_total = v + sum_b Q_b w_b
E_int = 1/2 integral v_total · G (K * v_total)
        - 1/2 sum_b integral (Q_b w_b) · G (K * Q_b w_b)
E_crowd = gamma/3 [integral rho³ + sum_b A_b (N_b/A_b)³]
F_p = sum_s u_s n_s + u_b sum B + E_int + E_crowd + E_contact
      + T sum_compartments,s n_s [log(n_s/(A c*)) - 1]
```

Subtract each cell's whole exposed self interaction, including its extent dependence. A lone cell
cannot push itself or gain work by changing its isolated deposition pattern. Chemical self terms
are continuum mixture interactions and remain. Internal mixtures use local crowding; their
energetic coupling to surroundings is mediated by the exposed profile, not another hidden field.
Crowding measures dissolved material only. Built bodies have the contact repulsion in transport.

Select a normalized soft disk `w_b=3/(pi r²) max(0,1-|x|²/r²)²`, with r from accounting.
For coarse-grid coupling, deposit its cell-integrated weights; if unresolved, integrate the disk
against the same periodic bilinear shape functions as chemical sampling. The normalization and
its position/extent derivatives are part of the operator. Deposition and response are adjoints.
The self subtraction uses those exact discrete weights, not an analytic constant. This avoids
grid-dependent self propulsion. Grid quadrature approximates continuous translation symmetry;
M2 refinement measures the remaining grid pinning.

The installed membrane coordinate m samples a generated profile q(m), and
`a_ms=max(0,1-|m-coord_s|²/R²)²`, `chi_s=f+(1-f)a_ms`, with f=0.05 initially.
Choose `Q_b=B_total q(m)+sum_s chi_s n_bs q_s` (units M); B_total is all actual built stock.
Thus internal composition and paid membrane changes alter external interactions continuously.
Profiles are bounded per material amount; they never have an independently growing charge history.
Compatibility used for injury is `1-(1-f)a_ms`; exposure and coupling are different roles of one
installed interface coordinate. Low injury susceptibility does not imply no energetic interaction.

### Derivatives and zero amounts

For an external chemical at fixed field area:
`mu_s=u_s+T log(c_s/c*)+q_s·G(K*v_total)+gamma rho²`.
For a cell center: `F_b=-partial F_p/partial X_b`, differentiating deposited weights and self
subtraction. In the continuum this equals minus the derivative of its cross interaction and
contact energy. The isolated symmetric-body force is zero. Pair mixed derivatives are symmetric.

Internal chemical potential is the full derivative, not just the external formula at another
concentration. Its ideal part is `u_s+T log(c_bs/c*)-T N_b/(A_b rho_i)` because area depends
on internal inventory. Its crowding part is
`gamma N_b²/A_b² - 2 gamma N_b³/(3 A_b³ rho_i)`.
Its interaction part differentiates both Q (`chi_s q_s`) and w through
`dr/dn_s=1/(2 pi r rho_i)`. Body construction similarly differentiates B, area, capacitor
capacitance and Q. Finite lifecycle events evaluate full initial/final states, avoiding a
linearized derivative as their energy bill.

Define activity `a_s=exp((mu_s-u_s)/T)`. It equals c/c* for an ideal fixed-volume mixture.
For internal variable-volume state its volume derivative contributes too. At n=0 use a=0;
evaluate kinetic flux in finite concentration/excess-potential form, never `log(max(n,epsilon))`.
Binding or reaction caches cannot store these state-dependent activities.

### Density bound and admissible domain

Require finite nonnegative amounts, positive areas/densities/T, bounded profiles, g>=0 and gamma>0.
For extracellular material, `|v|²<=2 rho²`. Normalization and Young's inequality give
`E_int>=-g integral rho²` when cells are absent. The negative quadratic is dominated by
`gamma rho³/3`; the minimum of that local lower bound is `-4g³/(3gamma²)` per unit area,
attained at rho=2g/gamma. With finitely many bounded cell stocks their cross term adds a bounded
linear forcing in rho, still dominated by the cubic. Internal crowding has the same bound.
Cell contact bounds overlap energy; total finite material bounds total cellular profile strength.
This establishes coercivity, not a hard density cap, unique equilibrium or guaranteed diversity.
Attraction may produce phase separation; its consequence is to be measured, not tuned away by
unaccounted clipping. Setting g=gamma=0 is the explicit ideal reference case.

### Verification scope

`interactions::amounts_positions_and_reciprocity` checks common finite-volume pair-energy
derivatives with central differences at 1e−4, 1e−5 and 1e−6. Tolerance 2e−8 covers O(epsilon²)
truncation and O(machine epsilon/epsilon) cancellation at unit scales.
`translation_self_force_and_ideal_limit` checks periodic shifts, opposite forces, isolated
self force, and exact zero versus tiny concentrations. `normalized_kernel_and_coercive_crowding`
integrates the separable kernel and checks the analytic lower bound (−8.33333333333 at these
scales). These probes validate the functional algebra. M2 must additionally check the actual
disk deposition/adjoint/self-subtraction implementation; no grid implementation exists in M0.
