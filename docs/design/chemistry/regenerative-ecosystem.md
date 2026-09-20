# Initial conditions for a regenerative ecosystem

Mathematical design, September 18, 2026. **Implemented in physical v27; human review pending.**

[Implementation plan](../../plans/archive/MATHEMATICAL-SYMMETRY-PLAN.md#regenerative-ecosystem-implementation):
R0–R4 implementation and automated checks are complete; the plan records validation and operating limits. The conditional calculations
below remain the design derivation, not claims that every location meets those conditions.

## 1. The next step

Build on the functioning simulation to start a useful chemical community: complementary
founders, productive reservoir neighborhoods, and transformations that benefit the cells
performing them. The four-type circuit below is a worked starting arrangement, not a required
long-term community. Reservoir composition and partial material closure are design guidance,
not instructions to impose a fixed world inventory or match renewal to recorded losses.

Retain the existing chemical manifold, exact actions, property surfaces, reaction kinetics,
funded bodies, transport, inheritance and reservoirs. The proposed reaction change addresses
one obstruction: cellular work excludes the environmental drive that already restores
chemical potential abiotically. Extend that coupling to cellular transformations, with one
common work coefficient and the existing accounts. Do not add a power-allocation subsystem.

[Appendix A](#appendix-a-attraction-and-repulsion) addresses clustering through the existing
pressure response: correct finite-owner self-load and calibrate common pressure strength,
rather than replace geographic transport.

The [principles](../../principles.md), [computational foundation](computational-foundation.md),
[transformation algebra](transformation-algebra.md), [funded bodies](../funded-bodies.md) and
[data ownership](data-ownership.md) govern this proposal. The [composed runtime](composed-runtime.md)
remains the implementation record. This paper is design, not authorization to implement.

## 2. Existing work and environmental coupling

For compiled reaction row e, substrate s and unit-sum product weights T, retain

\[
\Delta u_e=u_s-\sum_t T_e(t)u_t,\qquad z_e=\sum_{t\ne s}T_e(t).
\]

The current biological yield is

\[
f_\eta(r)=\begin{cases}\eta r&r\ge0,\\r/\eta&r<0,\end{cases}
\qquad y_e^0=f_\eta(\Delta u_e)-\kappa z_e.
\]

Current efficiency is η=0.8 and catalytic expense κ=0.05. Funded enzyme stock, damage,
recognition, substrate/product occupancy and displacement attenuation determine throughput.
This already permits waste consumption when potential remains, but makes an uphill return
a private expense regardless of local environmental drive.

Environmental conversion already uses two signed chemical profiles p and the shared medium

\[
B=\frac{H}{1+|H_0|+|H_1|},\qquad J=\operatorname{diag}(1,-1).
\]

An adjacent exchange s→t has engagement `[(p_t−p_s)^T J B/4]_+`. Its existing kinetic
rate includes exposure and finite donor allocation. Uphill environmental conversion currently
receives its potential increase as accounted external work. Thus the model already admits
a rate-bounded external drive; no sun, battery or new reservoir function is needed to
acknowledge that boundary.

The issue is whether cellular return pathways can use that drive and repay their actual
costs. Material conservation by itself does not answer that question.

## 3. One common correction to transformation work

Extend the existing environmental coefficient to any compiled product row by linearity:

\[
a_e=\frac14J\left(\sum_tT_e(t)p_t-p_s\right),\quad
g_e(B)=[a_e^TB]_+,\quad w_e(B)=\varepsilon g_e(B).
\]

ε is one shared coefficient in work per material. It relates environmental drive to chemical
potential and does not depend on owner, species, founder or enzyme slot. The factor 1/4
retains the existing edge normalization. No new chemical property surface is introduced.
Finite owners use their existing sampled medium; the calculation is local physics, not
additional information supplied to their controllers.

For cellular conversion, replace only the available-work argument:

\[
y_e=f_\eta(\Delta u_e+w_e)-\kappa z_e.
\]

For accepted amount q, record external input `q w_e`, cellular work `q y_e` and dissipation

\[
Q_e=q(\Delta u_e+w_e-y_e)\ge0.
\]

Negative yield still spends frozen cellular work through existing funding. New products
and captured work cannot fund another reaction in the same event. Product maps, recognition,
occupancy and material allocation remain unchanged.

Abiotic conversion uses the same w and account. It has no cellular work-capture machinery:
it retains product potential and dissipates `q(Δu_e+w_e)`. It requires `Δu_e+w_e≥0`;
an unaffordable uphill event does not execute. This replaces automatic uphill top-up with
the common coupling, rather than retaining a second work rule. Existing abiotic direction,
exposure and kinetic-rate formulas remain.

For the current bounded profiles, `|a_e|∞≤z_e/2`. Consequently,

\[
0\le w_e\le\varepsilon z_e/2,\qquad
\dot W_{\rm external}\le\frac\varepsilon2\sum_e\nu_e z_e,
\]

where ν is actual accepted throughput across owners. Finite material, machinery and
existing rates bound that throughput. More active material or machinery can couple more
external work, as in the current rate-bounded model. This consequence must be included in
ecological comparisons; there is no independent global power cap or new reservation stage.

Identity has zero coupling. Near-identity mixtures have proportionally vanishing coupling.
Zero medium supplies no work. No substrate or funded enzyme means no cellular collection.
The underlying signed coefficient reverses for an exact inverse; its positive part selects
a driven direction. This is explicitly supplied work, not a conservative potential hidden
in H. A complete material cycle earns only supplied work less dissipation and expenses.

## 4. Four founders from two existing exact actions

Choose coordinates

\[
0=(0,0),\quad A=(a,0),\quad B=(a,b),\quad A'=(0,b).
\]

X reflects x within `[0,a]` and fixes its complement; Y does the same to y within `[0,b]`.
These existing finite actions obey `X²=Y²=I`, `XY=YX` and `YXYX=I` on all identities.

| Founder | Recognition | Action | Primary transformation |
| --- | --- | --- | --- |
| F0 | 0 | X | 0 → A |
| FA | A | Y | A → B |
| FB | B | X | B → A′ |
| FA′ | A′ | Y | A′ → 0 |

The global reflection centers are `(a/2,0)` and `(0,b/2)`, with zero orientation.
Recognition is independent. Four separate endpoint-midpoint maps are unnecessary and
generally are not those same two global actions. Component actions remain exact; kinetic
mixtures and funded reactions remain irreversible updates.

For a worked example use a=b=8: IDs 0,128,136,8. B is near the geometric middle. Existing
R=3 gives each eight-unit step the catalytic multiplier `1/(1+64/9)=9/73`. Its stock
budget must pay that attenuation; long transformations receive no throughput exemption.

Current definition-v5 chemistry seed 101 gives:

| Label / ID | Potential | Profile0 | Profile1 | Stress |
| --- | ---: | ---: | ---: | ---: |
| 0 / 0 | 5.306845 | −0.919407 | 0.896899 | 0.026037 |
| A / 128 | 0.553428 | 0.070480 | 0.866170 | 0.496251 |
| B / 136 | 3.738630 | 0.098821 | −0.125517 | 0.996352 |
| A′ / 8 | 7.901700 | −0.898362 | −0.119714 | 0.521824 |

At reference medium `H*=(p_0+p_B)/2`, B* is approximately
`(−0.2284502813,0.2147518313)`. Let y* be the smaller positive yield of the two unpowered
downhill edges: `y*=2.025883691`. One common ε making both driven edges at least that
productive per converted unit follows from

\[
\varepsilon_*=\max_{e:g_e>0}
\frac{[(y_*+\kappa)/\eta-\Delta u_e]_+}{g_e}=119.3134192.
\]

This is a worked calibration, not a universal default. Its numerical size reflects small
dimensionless engagements; actual external work per converted unit is:

| Edge | Δu | Engagement | External work/unit | Cellular yield/unit |
| --- | ---: | ---: | ---: | ---: |
| 0 → A | 4.753417 | 0 | 0 | 3.752734 |
| A → B | −3.185202 | 0.051623 | 6.159325 | 2.329299 |
| B → A′ | −4.163070 | 0.056640 | 6.757925 | 2.025884 |
| A′ → 0 | 2.594855 | 0 | 0 | 2.025884 |

A unit completing the cycle receives 12.91724974 external work, captures 10.13379979 and
dissipates 2.78344995. Its chemical identity and potential return to their starting values.
Every founder benefits from its primary conversion without a supplementary feeding enzyme.
Neither the potential surface nor the transformation maps change.

H* specifies a local reduction, not an actual reservoir arrangement. Initial field,
reservoir and body contributions must realize suitable media. High stress and impedance
at B remain real costs; positive reaction yield alone is insufficient.

## 5. Fund the cells, not just their arrows

Use reference stocks: core 1, motor 0.08, storage 0.08, four receptors of 0.01, four
transporters of 0.04 and four enzymes of 0.04, totaling body mass 1.52. Give each founder
two input and two output transporters, four copies of its primary enzyme, and a membrane
recognizing its retained input. Duplicated slots provide capacity, not a second metabolism.

For internal material 0.8 and damage 0.2, current body/inventory density 4 gives area 0.58.
With input amount x and product amount 0.8−x, the ordinary enzyme law is

\[
\nu=\frac{0.16\cdot2.5\cdot0.8\cdot(9/73)\,x}{0.1\cdot0.58+0.8}.
\]

Throughput 0.02 material/second requires x=0.4349583333 and product 0.3650416667. Set initial
bound material to the same proportions, accounting its full mass and potential. Repair
introduces no third chemical at this calculation point; later repair retains actual mixtures.

At local concentrations 0.02 of each circuit chemical, input effort 0.75 and export effort
0.144861 achieve those requests, including damage's 0.8 capacity multiplier. Shared donors,
storage and frozen usable work can still restrict actual exchange. Upkeep is 0.01512
work/second and import plus export costs 0.002.

The existing membrane susceptibility floor gives exposure

\[
L_i=0.02\left(\sum_j S_j-0.95S_i\right)
+\frac{0.05xS_i+(0.8-x)S_{i+1}}{0.58}.
\]

Use existing injury `0.01 L_i/(0.3+L_i)` and mass-proportional repair expense:

| Founder | Repair fraction/second | Repair work/second | Work left after upkeep, transport and repair |
| --- | ---: | ---: | ---: |
| F0 | 0.005410 | 0.006579 | 0.051356 |
| FA | 0.006930 | 0.008426 | 0.021040 |
| FB | 0.005637 | 0.006855 | 0.016543 |
| FA′ | 0.001822 | 0.002216 | 0.021182 |

Every required repair rate is below the existing 0.008 maximum. A growth allowance of
0.008 material/second costs 0.004 work/second. Proportional construction requires input
0.0243495833 and output 0.0163495833 to hold this inventory mixture temporarily constant.
Input effort is 0.913109, below one; transport costs 0.0020349583. The smallest remaining
margin is 0.012508 before movement, learning and reserve accumulation.

An initial motion/learning allocation below 0.006 leaves positive reserve growth. This is
a condition on ordinary mutable behavior, not a new runtime cap. Actual controllers must
express the budgeted transport and repair. Growth changes capacity and geometry; this is
a local opportunity calculation, not a prediction through repeated divisions. Geographic
delivery and the reference medium remain assumptions to check in the starting arrangement.

## 6. Reservoirs, circulation and placement

For this example retain 48 reservoirs and 48 founders, with 12 founders per genotype.
Put six of each type in each of two separated resource neighborhoods; other neighborhoods
remain available for colonization. These reuse the current scale, not a target population.

Reservoir initial supply identities are 0 and B. Mixture proportions, holdings, release
and renewal remain ordinary environment settings. Assess them against uptake, depletion,
byproduct availability, exposure and dilution. There is no loss-matched renewal, invariant
world inventory or source controller responding to population success. External material
and its reference value remain accounted inputs.

For free circuit amounts c, accepted fluxes v, reservoir delivery s, losses ℓ and net
transfers into bodies b, retain the ordinary balance

\[
\dot c=Nv+s-\ell-b,\qquad
N=\begin{pmatrix}-1&0&0&1\\1&-1&0&0\\0&1&-1&0\\0&0&1&-1\end{pmatrix},
\quad s=(s_0,0,s_B,0)^T.
\]

Column sums of N vanish. Growth stores material; death and repair return actual identities.
Steady supply/loss equality follows from stationarity; it is not imposed on sources.
Accumulation and depletion are allowed and explicit.

For a first local construction, freeze stock and approximate `v_i=k_i c_i` with positive
k derived from transport and reaction capacity. With loss `λ_i c_i`, stationary fluxes obey

\[
v_i=\frac{k_i}{k_i+\lambda_i}(v_{i-1}+s_i).
\]

A connected ring with at least one positive loss and positive input has a finite positive
circulating mixture; this linear resource system is stable. That does not establish
stability once populations, stocks and medium evolve. Substitute actual occupancy/delivery
before choosing amounts, and include abiotic side branches rather than treating them as loss.

Prime A and A′ as accounted initial material from the circulation budget. Otherwise their
consumer founders spend reserves waiting for production. Neither needs a permanent source.
Place complementary founders within overlapping delivery regions, with donor material and
export capacity sufficient for exchange. Initial stores and continuing supply fund growth.

The starting community is functional only when private returns, repairability, local
delivery and the required medium occur together. Algebraic closure or four visible colors
cannot substitute for those conditions.

## 7. Evolutionary opportunity and limits

A waste consumer gains privately when its accessible substrate and conversion repay its
machinery, transport, repair and upkeep. Direct feedstock need not be globally exhausted:
a local byproduct can already offer a better return than competing for reservoir output.
Conversely, plentiful accessible feedstock may remove that advantage. Geometry and turnover
matter without an artificial scarcity controller.

The proposed work coupling removes the categorical cost of every uphill cellular return:
its value can depend on the ordinary local medium. Existing mutation and paid refitting
already provide access to alternative recognition/actions. No waste-directed mutation,
role bonus or species-dependent efficiency is introduced.

Shorter cycles and multienzyme cells are real competitors. They can avoid transport, divide
stock differently, change product occupancy and face different internal exposure under one
membrane. Splitting machinery alone does not prove specialists win. Compare complete returns
at equal funded material in the same environment. The objective is opportunity for recycling
and differentiation, not permanent survival of four authored roles.

The calculations establish conditional local feasibility, not a complete geographic default,
controller expression, invasion resistance or long-term coexistence. A failed condition
should identify the next specific correction to the existing system.

## 8. Symmetry and computational boundaries

Transform chemical inventories, actions, recognition, metric and property tables together
under relabeling. The new scalar contraction respects that convention. D4 remains geometric;
the catalytic group does not make a fixed heterogeneous landscape invariant. Geographic
directions still come from spatial gradients.

The new reaction quantity is a two-component coefficient and its local contraction.
Chemical-only terms stay compiled/shared; live allocation retains frozen donors and ordinary
funding. There is no full energy field, iterative power solver or species-pair search.
Keep active support, local processing floors and the existing physical ownership boundary.
Changed chemical support can still affect runtime cost.

The existing 30 ticks/s minimum, full resolution and saturated-workload limitations remain
relevant. These equations establish no new performance result. Borrowed rendering is unchanged.

## Appendix A: Attraction and repulsion

### A.1 Correct self-load in the existing pressure response

The current finite-owner force is

\[
F_i=a_i\nabla A-b_i\nabla B-i_i L_i\nabla L_i.
\]

A and B here are geographic signed-profile fields, not circuit labels. Matched deposition
and sampling cancel the isolated owner's gradient, but its own positive load still multiplies
a neighbor's gradient. Large reservoirs can consequently repel at very slight mutual overlap.

Let W_i be its normalized footprint and S_i its actual projected impedance amount after the
existing interface convention. At grid area a, its sampled self-load is exactly

\[
L_i^{\rm self}=\frac{S_i}{a}\sum_n W_{in}^2.
\]

For finite owners, propose using `L_i^other=L_i−L_i^self` in the pressure multiplier.
The centered, matched gradient already cancels self-contribution. Apply the subtraction
to bodies and reservoirs using the actual deposited amount, not a species-specific estimate.

This distinguishes a finite owner with a fixed internal footprint from dissolved material
whose own concentration can spread. The dissolved field retains collective pressure.
No source-specific separation rule or target position is added.

### A.2 Balance existing attraction and pressure

Expose current implicit pressure strength as one common coefficient χ:

\[
F_i=a_i\nabla A-b_i\nabla B-\chi i_i L_i^{\rm other}\nabla L_i.
\]

For dissolved material use `P(L)=χL²/2` in the existing conservative face difference.
Retain mobility and velocity bounds. No new geographic field or convolution range is needed.
χ expresses pressure strength relative to the signed-profile response, shared across owners.

For two finite owners let `C_ij=a_i a_j−b_i b_j`. The coefficient of the neighbor's
common profile gradient is

\[
C_{ij}-\chi i_i i_j L_i^{\rm other}.
\]

For positive C_ij, attraction dominates at small other-load and repulsion above
`L*=C_ij/(χ i_i i_j)`. Decreasing overlap can therefore cross a finite resting separation:
nonlinear pressure already supplies a different overlap dependence without another kernel.
Nonpositive C_ij does not become attractive by assumption. Evaluate actual reservoir mixtures.

Background dissolved load also contributes. Self-load removal alone may not restore attraction.
Select a common χ giving attraction at the dilute approach load and repulsion at excessive
crowding:

\[
\frac{C_{ij}}{i_i i_j L_{\rm crowded}}
<\chi<
\frac{C_{ij}}{i_i i_j L_{\rm approach}}.
\]

Compute these loads from actual inventories, background and footprints. The shared interval
must suit the intended mixtures. Productive concentration bounds come from uptake and injury,
not a desired cell count. If the common interval is empty, identify that structural result
before adding another mechanism. No per-pair pressure constants are introduced.

### A.3 Scope and checks

The proposal retains the existing three property reductions, footprints, scalar pressure,
gradients and covariant vector response. Self-load requires the squared footprint weights
and projected amount, not a production pair scan. Passive motion grants no usable work.

Isolated self-force, pair response, collective concentration and material delivery require
separate checks. Pair balance does not prove that a whole patch remains productive or that
multiple clusters never merge. Changing composition and background can change the balance.
Those are consequences to assess, not reasons to introduce a cluster-count controller.

## Scope of the recommendation

The reaction change is a common local environmental-work coefficient in existing cellular
and abiotic conversions. The appendix proposes finite-owner self-load correction and one
common pressure coefficient. Initial alleles, material mixtures and placement instantiate
the ecosystem. Reservoir renewal, transformation repertoire, biological funding, mutation,
ownership and rendering remain the foundation.

The examples are analytical evaluations, not an ecological run or implementation.
They provide concrete conditional budgets and identify the remaining geographic and
ecological questions without replacing the surrounding simulation.
