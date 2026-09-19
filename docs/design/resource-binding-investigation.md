# Resource binding investigation

September 19, 2026. Investigation only; no production mechanics changes.
Plan: `c5f6eb03-70f2-4e06-bf31-b9cbb91838a2`.

The [selected implementation proposal](resource-binding-proposal.md) continues this record
with a concrete length, evaluator, update schedule, dynamic checks and B1–B3 work sequence.

## Question and scope

Can the existing shared attraction and nonlinear pressure bind resource neighborhoods,
while allowing cellular changes to local chemistry to change that balance?
The user rejects prescribed environmental wells. Cluster migration, chaos and perpetual
turnover are not objectives. A productive colony maintaining a homeostatic cluster is valid.

Competing explanations are insufficient attraction relative to pressure, insufficient
interaction reach, loss of attraction as reservoirs empty, and stronger forces from the
dissolved medium or bodies. An overlapping pair's resting separation does not establish
collective binding. The earlier pressure-v26 results corrected collapse but did not
establish sustained productive neighborhoods. The 754,372-tick user checkpoint shows
that neighborhoods disperse under the current system.

## Registered diagnostic

No simulation ticks, controller changes, mutation experiments or ecological campaign.
Use `engine/examples/source_binding.rs` with production source footprints, projections,
gradients, material profiles, nonlinear pressure, mobility and bounded velocity.

- Restore retained initial, 50k and user 754,372-tick checkpoints. Rebuild body projections
  exactly where ordinary stepping does, immediately before source response. Decompose
  each instantaneous force into reservoir, dissolved-material and body contributions.
  Keep the full common pressure multiplier when splitting gradients, retaining its cross terms.
- Construct radius-3 pairs at 11 separations from 1 to 32 units, four inventory/interface
  ratios, three compositions (60% chemical 0 and 40% chemical 136, 8 or 128), a full or
  empty second reservoir, and three pressure strengths. These are 792 static configurations.
- Repeat the ordinary-mixture pair at eight separations in uniform backgrounds of the
  four starting-circuit chemicals, at concentrations 0.01 and 0.1: 64 configurations.
  Uniform backgrounds isolate pressure and mobility from directional chemical gradients.
- Assert that decomposed vectors reconstruct the production force and velocity.
  Negative separation rate means attraction; positive means repulsion. Rates are immediate
  responses, not trajectories or predictions of a long-lived colony.

Budget: three checkpoint reads, 856 static pair configurations, no steps, 120 seconds
for the diagnostic executable excluding compilation. No automatic expansion into runs.
The result selects whether to retune the existing coefficient or change the shared
spatial interaction operator. Production all-pairs forces, source-specific tethers,
artificial stirring, and fixed geographic attractors are outside the recommendation.

## Results

Completed three checkpoint reads and 1,060 static configurations, advancing zero ticks.
The [force curves](../evidence/digital-chemistry/source-binding-v27/binding.png) and
[reduced diagnostic output](../evidence/digital-chemistry/source-binding-v27/forces.json)
retain the results. Full decompositions are also local in
`frontend/harness/artifacts/source-binding/final.json`. The reader uses the current source
operator on restored states; the user's historical executing binary has a different digest.
These are current-law force evaluations, not a replay of the historical trajectory.

### Current binding is weak, short-ranged and interrupted by depletion

For the default 60/40 mixture of 0 and 136, the signed profile is approximately
`a = -0.512116, b = 0.487932`. Between identical mixtures the attractive coefficient is
`a² = 0.262263`, opposed by `b² = 0.238078`. Their common spatial shape therefore cancels
90.8% of attraction before nonlinear pressure is applied. The remaining coefficient is
only 0.024185. Both terms use the same radius-dependent footprint and its local gradient.

For a radius-3 pair with inventory equal to its interface area, the current force pushes
apart at separation 2 and pulls together at separation 8. It already has a nonlinear
binding balance. However, the relative approach speed falls from 0.00305 at separation 8
to 0.0000756 at 16 and 0.00000102 at 20, and is zero at 24. All rates are world units per
model second, evaluated at the stated configuration. Reducing pressure tenfold or even
removing it does not restore reach: the separation-20 response stays approximately
0.00000102. Multiplying drift would accelerate the other forces too.

The same contraction intentionally lets composition affect binding. Replacing the 40%
component with chemical 8 gives much stronger attraction; replacing it with 128 gives
repulsion in the existing pair fixture. That chemical sensitivity should be retained.
The deficiency is the shared spatial shape and weak residual attraction for the ordinary
incoming mixture, not an absence of chemical feedback or nonlinear pressure.

Sources emit a projected field proportional to `Q / (1 + Q / interface)`. At zero stock
they emit nothing, but still respond using the incoming mixture's profile and later refill
where they have moved. There are 34 empty sources at 50k and 35 at 754,372. Empty sources
can still be attracted to full neighbors; they provide no reciprocal binding while empty.
Do not fix this by inventing permanent material or an invisible anchor for each source.

The restored 754,372 state has direct reservoir-force magnitude below `1e-9` at 32 of 48
source positions. Dissolved contributions exceed reservoir contributions at 47 positions;
body contributions exceed them at all 48. At tick zero those counts were two and two.
This decomposition retains the full common pressure multiplier: its channels are additive
gradient contributions, not independent counterfactual worlds. It shows why changing local
biology can move sources whose mutual binding has become ineffective. It does not imply
that cellular influence itself should be removed.

### A shared interaction-length change supplies the missing restoring response

The candidate keeps the current force and changes only the spatial reach of its attractive
feature. With an even normalized kernel K of length ell:

```
A_ell = K_ell * A
F_i = a_i grad(A_ell) - b_i grad(B) - chi i_i L_other grad(L)
```

The same attractive field combines dissolved material, reservoir inventory and funded bodies.
Repulsive feature B and nonlinear pressure remain local. Chemical profiles, pressure strength,
source stock, mobility, velocity bound and delivery footprints are unchanged. The candidate
filters a mechanical signal; it does not diffuse or move material. In particular, increasing
interaction reach must not widen resource release and make food more diffuse.
Production chemistry must continue to read the unfiltered local features; the filtered
attractive row is a derived mechanical view, not a replacement for chemical exposure.

An even normalized filter preserves constant fields and has no preferred location or direction;
the ordinary identity filter recovers the current law. Use the same kernel for deposition
contributors and shared gradient consumers. The diagnostic confirms zero isolated-source
force. Translation covariance, grid rotations/reflections, chemical relabeling and ordinary
field/body consumers need explicit integration checks before production use.

At diagnostic length 6, the default pair repels at separation 8 and attracts at 12–32.
Its attraction at separation 16 is about 72 times the current response; at 20 it is about
2,125 times. It remains finite and smoothly weakens with distance. The three tested mixtures
retain close-range repulsion but have different balance intervals: approximately 6–8 for
0/8, 10–12 for 0/136, and 12–16 for 0/128. These are brackets from static samples, not
selected production equilibrium distances. Length 3 fails to retain a repulsive core for
the 0/8 fixture, so merely broadening attraction by an arbitrary amount is insufficient.

The seven-source probe also has the required collective radial response: with length 6 and
the ordinary mixture, the outer ring expands at radius 8 and contracts at 12, 16 and 20.
Changing only the central source's chemistry alters that contraction; emptying it weakens
the group's binding while the remaining sources still interact. The source locations are
initial probe geometry, not force targets. Nothing in the candidate knows a cluster center.

Uniform surrounding material changes the existing nonlinear balance too. At concentration
0.1, chemicals 8 and 136 turn the ordinary pair's separation-6 attraction into repulsion;
the same amount of 128 does not. Thus local accumulation and consumption already have a
mechanism to change binding, alongside inventory transformation. No new ecology-specific
force is needed to provide that feedback.

### Recommendation and remaining work

Implement a distinct attraction length in the shared geographic response, retaining existing
local repulsion and pressure. This is one additional mechanical length, not separate settings
for reservoirs, cells and chemicals. It replaces the rejected fixed-basin recommendation.
Neither cluster migration nor perpetual instability is an acceptance condition.

The Gaussian filter was a diagnostic reference. Select its production evaluation together
with cost: combine the attractive contributions into one scalar grid, reuse bounded spatial
work and cache coefficients. It must not become 256 convolutions, an all-owner pair scan,
or a wider chemical-delivery stencil. On the current 160 by 120 grid a direct separable
length-6 reference uses 19 taps per axis, about 730,000 weighted terms per refresh. A sparse
or multiscale evaluation and justified refresh cadence need actual whole-tick measurements;
the static force result establishes no production speed improvement.

Next, integrate the same response into source, cell and dissolved-material motion, then use
a short source-neighborhood probe with finite depletion/renewal and localized material
changes. Check that a binding interval survives collective loading and that local chemistry
can change it without dispensing with repulsion. Cover asymmetric perturbations as well as
the radial response measured here. Pair balance and ring contraction do not prove stability
of every mode, ecological homeostasis, or persistence over 200k ticks. Start with that bounded
mechanism check before another population campaign. Keep all current chemistry, biology,
renewal accounts, data ownership and single-threaded constraints.

No production law or default changed in this investigation. The authored Rust change is a
standalone diagnostic example; the other edits record findings and correct rejected guidance.
`make ci` passed: 153 Rust tests, 62 Vitest tests, formatting, lint, type checking, documentation
and Terraform formatting. The existing 12 lint warnings remain. Diagnostic assertions also
passed for production-force reconstruction and isolated-source response.

## Bounded follow-up: separate attraction reach

The first diagnostic found near-cancellation of signed attraction and repulsion for the
ordinary source mixture, a rapidly fading restoring response beyond the delivery footprint,
and body/dissolved forces dominating reservoir forces in the mature save. Lower pressure
does not change the interaction's reach or its cancellation. Test one structural change
before proposing it: apply a normalized even spatial filter only to the attractive feature
row. Keep chemical profiles, local repulsive feature, nonlinear pressure, delivery footprint,
mobility and speed bound unchanged. Use the same filter on all three material contributors.

This is a diagnostic modification of scratch fields, not a production change. Evaluate
filter lengths equal to one and two radius-3 source radii, the original 11 separations,
the three compositions, and full/empty second source at inventory/interface ratio 1:
132 additional zero-tick configurations. The two lengths ask whether separating scales
creates a useful attraction interval; neither is a selected runtime constant. Use the
same 120-second executable budget. No simulation horizon is added.

Prediction: preserve repulsion at close separation and obtain stronger restoring attraction
beyond the current footprint scale, with composition still able to change the balance.
Failure to retain a short-range repulsive region rejects this candidate. A positive result
justifies a collective binding probe; it does not certify a maintained neighborhood.

The corrected pair readout retains a repulsive core for all three mixtures at filter length
6, and gives a substantially stronger restoring response at 16–24 units. Follow with 72
zero-tick seven-source configurations: one central source and six around it, six radii
(4, 8, 12, 16, 20, 24), ordinary/filter-length-6 interaction, three central compositions,
and full/empty center. Outer sources retain the default mixture. Read each outer source's
radial velocity to test collective expansion when crowded and contraction when spread.
The positions specify diagnostic initial conditions, not production attractors. Compare
changes caused by the central source's chemistry and depletion. No ticks or new parameters.

An initial scratch-filter implementation left filtered values outside the ordinary sparse
projection cache between cases. Its local `forces-with-candidate.json` is invalid. Clear that diagnostic
field between independent cases and assert zero self-force for the lone nonempty source.
Only the corrected output is evidence; this defect never entered production.
