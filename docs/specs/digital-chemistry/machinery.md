# Engagement and finite transformations

## Current design contract

Revised September 15, 2026. [Computable chemistry](../../design/chemistry/computational-foundation.md)
and [ADR 0022](../../adr/0022-computable-chemistry.md) govern formula selection and acceptance.

Use fixed heritable weighting kernels and bounded transformations on chemical space. Receptors
reduce local mixtures into signals; transporters select finite local exchange; unary enzymes map
substrates to conservative weighted discrete products. Shared finite engagement, substrate/product
feedback, funded stock, damage and available work determine feasible requests. Nearby mutations
must have meaningful nearby effects. Precompute definition/installed-only weights, not live
activities or spendable energy. Preserve simultaneous shared-donor allocation and paid installed
expression. M1's canonical compiler now supplies these maps to the actual composed kernels.
Its earlier reciprocal-edge and charge representation is retired. Logarithmic activities, logistic rates, exponential
barriers and detailed-balance ratios below are reference choices, not the target of fidelity tests.

## Selected computable contract — revision 4

Reuse radius-three compact manifold recognition and reflected bilinear product maps. Each
enzyme's originating substrate maps to one weighted product mixture, not independently funded
reciprocal edges. Compile recognition a_s, product weights w_sp, product reference energy,
and attenuation 1/(1+distance²/9), where distance² is the squared authored offset,
including reflected products. This is rational geometric cost, not an activation exponential.

For a slot, occupancy O=sum_s a_s*(c_s+sum_p w_sp*c_p). A forward request for substrate s is
dt*funded_capacity*effort*(1-damage)*a_s*c_s /
((K+O)*(1+distance²/9)). Product occupancy competes with substrate. Opposing flux is expressed
by other inherited maps (including maps back toward the substrate), rather than forcing every
enzyme into a thermodynamic reverse edge. No signed coupling/charge field is required.
Total requested turnover is bounded by dt*funded_capacity*effort; zero stock gives zero function.
Transformation accounts use the weighted product energy and accounting's conversion/payment law.

Compile the occupancy composition itself: engagement_t=a_t+sum_s a_s*w_st. Runtime O is
engagement dot c. Product-side support remains present, including reflected/idle maps, without
re-enumerating product neighbors to measure occupancy. Only actual installed map changes rebuild
this row; a membrane change retains all enzyme maps and engagement rows.

Transporters use the same finite occupancy principle on internal and local external mixtures.
Signed bounded effort selects import or export, with both sides competing in the denominator.
The numerical executor decodes the existing [0,1] action carrier as effort=2a-1: 0 exports,
0.5 holds and 1 imports. This is the replacement executor's contract; ordinary World still
uses the earlier action semantics until M3/M4 integrate and version the replacement together.
Opposed requests for the same species net before donor/work allocation. Imports first share
storage headroom, exports share frozen internal donors, and both share pre-stage work.
Let C be geographic amounts, A the node area and W the normalized cell-footprint matrix.
Sample concentrations L=W*C/A. After shared stock/storage/work bounds, let K=positive(R)/L
and E=negative(R), where E denotes export magnitudes. Zero L gives zero K. Compute the donor
fraction D=W-transpose*K/A, available concentrations T=C/(A*max(1,D)), imports K*(W*T), and
the field commitment C*(1-min(1,D))+W-transpose*E. All products/divisions here are elementwise
except explicit matrix products. One CSR geometry owner supports W and its transpose; compute
one 256-channel donor row at a time instead of retaining a full demand grid. Each field row is
committed once with explicit aggregate roundoff. Same-stage exports cannot fund imports.
Receptors report funded_capacity*(1-damage)*O/(K+O), using only recognized local concentration.
All slot requests share donor/work/storage allocation; no slot consumes another's prospective
product in the same stage. Compile static weights, products, net work/heat, membrane profile and stress coefficients;
actual amounts and budgets
are evaluated every stage. Broader coverage has no specialist/generalist score multiplier.

Nearby coordinate changes produce nearby effective maps and responses, including product-boundary
crossings. Empty support entries do not establish a discontinuity when their weight tends to zero.
Product feedback, conditional energetic returns and exhaustion are bounded mechanism checks;
a supplied metabolism or evolved strategy is a later integration claim.

## Historical M0 selection — reference only

Everything below records the previous formula selection and its original verification scope.
Imperatives and milestone instructions in this section are superseded as work orders. The
record remains available for independent comparison and reuse; passing its tests does not
approve these equations or their computational cost for the replacement system.

Four installed slots per machinery class remain fixed. Current `Enzyme` integer offsets and
compiled `Edge.energy/heat` retire: those cannot express continuous product variation or
product/charge feedback. Current saturation scales affinity-weighted inventory by a hard cap;
the selected common engagement law applies to consistent activities instead.

### Common finite engagement

For receptor slot e, `k_es=max(0,1-distance(target_e,s)²/R²)²`, R=3 chemical-coordinate units.
Given activities a_s from the full potential, `theta_es=k_es a_s/(1+sum_j k_ej a_j)`.
The vacancy term 1 fixes the activity reference. Total occupancy is less than one. Binding is a
rapid, zero-storage approximation: occupancy represents a catalytic duty fraction, not a hidden
stock of bound chemicals. Rates use only the current substrate owners. No binding energy is
added or harvested independently of F.

Receptor tonic signal is `gain_e sum_s theta_es`, with
`gain_e=B_e/(B_e+B_ref)` and B_ref the retained baseline receptor investment. Temporal change
uses exponential relaxation with tau=2 t; body-relative differences compare these same bounded
signals at the current local sampling locations. A vanished stock has gain zero. This replaces
the additional `receptor_k` saturation while preserving local/private RNN control.

### Discrete channels with continuous parameters

An enzyme has continuous reflected substrate center, offset d in [-15,15]², installed stock and
one bounded continuous charge-coupling coordinate `nu in [-1,1]`. A transporter uses the same
coupling coordinate in place of the discontinuous export bit: negative nu biases inward pumping,
positive nu outward pumping, zero is passive. An enzyme's positive nu captures charge on forward
conversion. These are small fixed-slot scalar parameters, not variable-length genomes.

For each recognized substrate s, reflect `coord_s+d` at 0 and 15, then bilinearly distribute
unit product weight among at most four adjacent discrete IDs. Duplicate reflected IDs combine.
Weights sum to one and vary continuously even where derivatives have a grid/reflection kink.
Each positive weight defines a reversible channel (s,p), with shared binding coefficient
`h_e,sp=k_es weight_sp` at **both** ends. Channels remain labeled by their originating family;
duplicate pairs add capacity, not new stoichiometry. A self-product branch is idle, with nu=0;
retain its binding occupancy and do not renormalize away that idle weight.

For an enzyme's complete channel list define
`D_e=1+sum_(s,p) h_e,sp (a_s+a_p)` and
`Theta_e,sp=h_e,sp (a_s+a_p)/D_e`.
Equivalently this is the common occupancy law after summing incident binding coefficients for
each chemical. A transporter uses outside and inside copies of each recognized species with
the same denominator construction. Thus substrates and products compete for finite engagement;
there is no free reverse enzyme capacity. Receptor binding is the single-sided version.

### Rates, barriers and usable work

For channel progress xi (M), `dn_s=-dxi`, `dn_p=dxi`, `dz=nu dxi`. Total forward affinity
is `A=mu_s-mu_p-nu mu_w` in E/M, with all derivatives from the same F. Choose
`b_sp=distance(coord_s,coord_p)²/R²`, symmetric and dimensionless. The physical activation
scale is T b; the rate multiplier is exp(−b). It changes both directions identically.
Reflected distance uses the actual endpoint coordinates, not a fictitious path across an edge.

With `C_e=turnover B_e (1-damage)` (times RNN action for transport), define
`r_plus=C_e Theta_e,sp exp(-b_sp) sigmoid(A/T)` and
`r_minus=C_e Theta_e,sp exp(-b_sp) sigmoid(-A/T)`.
Then `r_plus/r_minus=exp(A/T)`, `r_plus+r_minus<=C_e Theta_e,sp`, and
`(r_plus-r_minus) A>=0`. Increasing a barrier changes throughput, not equilibrium or an
energy debit. Membrane channels use b=0 and spatial outside/inside potentials. Reference energy
differences remain in A; affinities in binding do not overwrite thermodynamics.

Compute the two sigmoids independently with sign-stable exponentials; do not form one as 1 minus
the other for extreme A. Activities and denominators use log-sum-exp where direct exponentials
would overflow. If both endpoint activities vanish, the channel is empty and both rates are zero.
If exactly one vanishes, the logistic limit forbids consumption from it. There is no log floor.

Integrate **net** progress, not two independently clipped gross currents. Bound all simultaneous
requests by actual substrates, shared external donors, intracellular capacity and charge limits.
For each channel compute its feasible extent from donor and charge headroom, then scale all its
signed stoichiometric changes together. Compute shared per-owner demand fractions before applying
any request. No same-stage export/product relaying. Charge/space constraints can stall a channel;
they cannot turn unfavorable forward processing into favorable forward processing. Re-evaluate
the full finite change in F after concurrent allocation and reduce timestep as specified in
numerics. Continuous A>=0 alone is insufficient for a large finite event.

Exact captured work is `delta W=kappa[(z+nu xi)²-z²]/(2B)` at fixed B. Product buildup shifts
mu_p; increasing charge shifts mu_w; either can stall or reverse a channel before capacity is
exhausted. There is no independent `conversion_efficiency` or constant transport energy charge.
Thermodynamic dissipation is `D=-delta F`; signed heat uses delta E. Kinetic barriers cost capacity,
while actual machinery upkeep costs work through the lifecycle law.

Cache topology, endpoint IDs, binding coefficients, product weights and symmetric barriers by
installed revision. Recompute activity, affinities A, charge response and feasible requests from
live state. Mutating a target does not immediately rebuild installed capabilities; step 6 applies
paid continuous expression first.

### Conditional pathway calculation

At equal saturated engagement and strong equal forward bias, capacity per unit net flux is
proportional to exp(distance²/9). A two-stage path needs the sum of both catalyst stocks.
For total distance 1: direct 1.117519 versus two halves 2.056334. For total distance 6:
direct 54.598150 versus two length-3 stages 5.436564. Equal throughput requires about ten times
more direct machinery in the latter constructed condition. If intermediate engagement is 0.01,
that staged requirement becomes 543.656366 and the predicted advantage fails.

These calculations isolate capacity, not a viable organism. Equal strong affinity may require
sufficient substrate gradients and charge coupling in every stage; the supply, intermediate
storage and upkeep costs are additional. Four slots and finite recognition already constrain
allocation. Saturation by itself proves no universal breadth/specialization tradeoff. M3/M5 must
test contextual value with actual mixtures and funded stocks, including this negative context.

### Verification

Five `machinery::` tests cover occupancy interference, forward/reverse ratios and charge/product
feedback, reflected continuous product weights, closed chemical/interaction work cycles and
the three capacity comparisons. Algebra tolerance is 2e−14 at O(1) rates/energies; continuity
uses the bilinear weight L1 bound 4 epsilon plus 1e−13 arithmetic slack. The attraction-cycle
fixture distinguishes a 1.2 E bound-conversion drop from the misleading 4 E reference-only drop.
The closed four-event cycle consumes 0.4 E with declared 0.1 E dissipation per event. Capacitor
charge/reversal returns exactly the captured energy before any dissipative loss.
