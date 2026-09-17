# Physical coupling audit

Historical v18 audit. The subsequent [v19 correction](physical-coupling-correction.md) implements
the user's requested fixes; results below describe the pre-correction laws.

September 17, 2026. Audit plan `b5c173f9-b621-467c-bd3b-71b6020b4593`.
Scope: current v18 production equations and their evolutionary tradeoffs. No simulation
laws, coefficients, founders, mutation settings or browser behavior will change in this audit.

## Conclusion

The model already has shared mathematical couplings, but their scaling is uneven. Repair gives
large bodies an unpriced relative advantage; fixed reproduction reserves create sterile small-body
targets; refitting lets an unfunded slot delay funded machinery. These deserve correction before
adjusting a broad collection of constants. Movement, transport and chemical processing already
have costs and conditional returns. Their existence does not establish that the current world
offers enough situations where each investment repays itself.

The diagnostic completed within its 60-second budget, including a 38.57-second release build,
and advanced zero World ticks. [Raw results](evidence/digital-chemistry/physical-coupling-audit/report.json)
contain the resolved configuration and all cases. No evolving population was run.

## Question and method

Do investments have conditional returns under the composed mathematical model, or do scaling
choices make some physical directions systematically preferable? Separate a missing coupling,
an unintended scaling relationship, an uncalibrated coefficient and an opportunity that the
current environment rarely rewards. The recent low-motor trajectory does not distinguish these.

Read production owners, current funded-body/composed-runtime contracts, the computational
foundation and existing negative findings first. The old resource-economy document explicitly
describes a retired runtime; its spherical capture ceiling is not a current law. The current
Rust economy helper supplies conditional budget calculations and must be read on its own terms.

The bounded diagnostic `engine/examples/coupling_audit.rs` calls existing production operators
directly. It creates one empty 24×24 world, chemistry 101, seed 27, default physical constants,
one founder, no sources, static learning and zero mutation. It advances **zero World ticks**;
cloned bodies receive a single movement interval or one-second repair/reaction evaluation.
No population run, seed sweep, parameter tuning, controller inference or founder selection occurs.

- Scale body stocks and inventory together by 0.25, 0.5, 1, 2 and 4. Predict speed scales as
  mass^0.25 and turn rate as mass^-0.25; compare repair per body mass and fixed birth thresholds.
- Compare ordinary and fourfold motor stock at identical actual speed, holding other stocks
  and inventory fixed. Predict greater installed motor incurs extra operating work at that speed.
- Use one installed enzyme for ID 0 to products 64, 80, 128, 178, 186 and 240. Compare work yield,
  throughput and internal stress with 0.4 substrate plus 0.4 unrelated material or product.
  Predict higher per-unit yield need not maximize work per time and product occupancy reduces flux.
- Reuse current economy budgets for extra input-0/input-80 transporters and enzymes under either
  raw input. Distinguish import-only ceilings from finite-enzyme work and unused machinery costs.
- Compare compatible/incompatible ID 120 exposure at equal concentration across sizes. Predict
  compatibility changes damage while proportional size alone does not change the damage fraction.

The diagnostic should finish within 60 seconds; total generated output budget is 10 MiB.
No failed prediction authorizes a larger campaign. The result can recommend changes to shared
scale rules or conditional opportunity checks, but cannot establish an evolved fitness advantage.

## Findings ranked for follow-up

### 1. Repair has a size subsidy

Damage is a fraction that reduces motor, transporter, enzyme and growth capacity. Repair removes
up to 0.008 damage per model second at full effort. Its material conversion and work charges depend
on the repaired fraction, with **no multiplier for the amount of body being repaired**.

With equal composition, 20% starting damage, sufficient work and decomposition-only inventory:

| Body scale | Body mass | Fraction repaired / second | Repair work / second | Repair work / body mass |
| ---: | ---: | ---: | ---: | ---: |
| 0.25 | 0.38 | 0.008 | 0.0064 | 0.016842 |
| 1 | 1.52 | 0.008 | 0.0064 | 0.004211 |
| 4 | 6.08 | 0.008 | 0.0064 | 0.001053 |

The largest body restores sixteen times as much functional stock for the same absolute expense
as the smallest. Each converts 0.0024 internal material per second. Equal chemical concentration
causes the same fractional injury across these sizes, so this is not offset by more injury in
the larger body. This is a demonstrable scaling advantage, not proof that large bodies win overall.

Recommendation: relate repair material/work to the funded body quantity represented by damage.
Keep a shared rate for recovery of a fraction; derive its extensive expense from actual stock.
This needs no new repair organ, chemistry-specific penalty or detailed physical solver.

There is also a hard repair ceiling. Injury rate is `0.01 × load / (0.3 + load)`; maximum repair
is 0.008. At sustained load above **1.2**, even full effort and unlimited resources cannot balance
injury. This can be a useful pressure to escape, export, detoxify or change compatibility, but it
is a deliberate bound to calibrate. Lower repair effort lowers the tolerable load further.

### 2. Fixed birth reserves create reproductive cliffs

Fission needs twice every inherited newborn stock target, plus **0.6 internal material** and
**0.28 usable work**, regardless of body size. Storage capacity is 20 times actual storage;
energy capacity is 0.8 times actual core. Ordinary growth stops at twice each target.

For a body grown to those targets, without inherited excess stock, this requires newborn storage
target at least **0.015** and core target at least **0.175** merely to fit the reserves. Expenses
before fission make the energy bound necessary rather than sufficient. With proportional founder
scaling, storage imposes a scale floor of **0.1875**. The fixed 0.2 protected material reserve and
0.08 division work charge introduce additional size dependence.

This has already occurred in the [50k trajectory](local-weathering-50k-study.md): cell 4260 had
0.4335 inventory capacity against the 0.6 requirement, and installed storage already exceeded
twice its inherited target. It lived from tick 22,020 to 48,707 without dividing. The analogous
capacity check flagged 9/71 living cells at tick 25,000 and 1/76 at tick 50,000.

Nonviable mutations are legitimate outcomes. The concern is that an absolute starter-body
allowance determines the boundary, rather than the requirements of the actual daughters.
Recommendation: derive daughter reserves and division expense from the same funded-body budget
used for survival and growth. Do not filter mutants or add a special minimum-storage exception.

### 3. Refitting has an unrelated-slot bottleneck

In `refitting::advance`, all installed coordinates advance by one common fraction. Its rate limit
uses the largest coordinate distance among **all** slots, including slots with zero funded stock.
Their work contribution is correctly zero, but their distance still slows the other slots.

For example, a funded slot one coordinate unit from its target can finish in four model seconds
when work is ample. An unrelated zero-stock slot ten units from its target stretches that shared
schedule to forty seconds. This follows directly from the common fraction `dt × 0.25 / reach`;
it was inspected algebraically, not exercised by this diagnostic.

Recommendation: base the refit schedule on installed work that actually exists. Keep shared
vector arithmetic and paid identity changes; empty instructions should not impose a physical
delay on funded machinery. This is separate from choosing the numerical refit speed.

### 4. Movement has tradeoffs, but investment and throttle are coupled unexpectedly

The production laws are:

```text
area = body mass / body density + internal material / inventory density
radius = sqrt(area / pi)
motor power = motor stock × power density × (1 - damage)
maximum speed = sqrt(power × efficiency × mobility / (8 × viscosity × radius))
actual speed = maximum speed × swim effort × paid fraction
work rate = power × (swim effort + 0.25 × absolute turn effort)
```

Adding nonmotor mass at fixed motor stock slows the cell. Scaling the whole funded body and
inventory by `s` instead makes straight swimming scale as `s^0.25` and turning as `s^-0.25`.
A fourfold proportional body is **41% faster** and turns **29% slower**, with fourfold motor
expense at full effort. Larger cells also store more work/material and spend more on upkeep.
There is no universal larger-body speed penalty, nor is one required by the design direction.

The motor-stock/effort distinction matters. At the reference speed of 0.79974 units/second:

| Motor stock multiplier | Maximum speed | Required swim effort | Motor work / second | Total healthy maintenance / second |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 0.79974 | 1 | 0.01600 | 0.01260 |
| 4 | 1.55306 | 0.51494 | 0.03296 | 0.01740 |

The oversized motor spends **2.06 times** as much work at the same actual speed, as well as
requiring 0.24 extra construction material. Reserve speed has a running cost even at low throttle.
Within one fixed body, straight-swimming speed and expense are both linear in effort, so motor
work per distance is constant while upkeep continues accumulating with time. Faster swimming
therefore does not impose an extra per-distance penalty through throttle alone.

These are selected artificial laws, not a failure to reproduce fluid mechanics. Their consequence
is a preference for the smallest motor that meets the useful speed requirement. Whether intermittent
fast travel can repay reserve motor capacity needs a conditional access calculation and a short
cue/action/payoff check. The earlier sensing fixture demonstrated steering and increased intake,
but did not establish full net return after movement, transport and repair. The recent decline in
installed motor/core from 0.08 to 0.01789 is consistent with cheap movement being selected; it does
not isolate which part of the law or resource geography caused that trajectory.

### 5. Chemistry already supplies several competing costs

All cells obtain the same per-unit work from the same chemical transition. There is no heritable
conversion efficiency. However, per-unit yield is not the same as work per time or net growth.
Longer product offsets attenuate enzyme throughput, substrates and products occupy enzyme
capacity, internal mixtures cause compatibility-weighted injury, and low-potential material
can cost extra work to assemble into biomass.

One funded enzyme, equal substrate and total material, unchanged founder membrane:

| Product from ID 0 | Work / converted unit | Work / second, no accumulated product | Work / second, accumulated product | Internal load with product |
| ---: | ---: | ---: | ---: | ---: |
| 64 | 0.88556 | 0.02803 | 0.01491 | 0.23344 |
| 80 | 1.35294 | 0.03148 | 0.01675 | 0.30175 |
| 128 | 3.01185 | 0.03264 | 0.01737 | 0.37985 |
| 178 | 4.66386 | 0.02754 | 0.01465 | 0.28592 |
| 186 | 4.61126 | 0.01586 | 0.00844 | 0.04307 |
| 240 | 5.64606 | 0.01909 | 0.01016 | 0.05728 |

Product 240 has the highest yield among these cases, but 128 supplies more work per second.
Accumulated product reduces flux by about **47%** in these matched cases. The founder membrane
protects against 186: its high intrinsic stress does not translate to the highest experienced
load. These are gross reaction returns before maintenance, transport, repair and energy overflow,
not a ranking of evolved fitness. The constructed operators use exact product coordinates;
they do not replay the evolved 0→178 branch's complete enzyme or body.

For ID 120 at the same internal concentration, matching the membrane changes load from
0.83333 to 0.04167 and injury from 0.007353 to 0.001220 per second, independent of proportional
body size. Detoxification and membrane compatibility therefore already affect real expenses.
The earlier short detoxification assay also lowered injury and repair work, but its construction
ceiling prevented a claim of improved growth. Those earlier results precede v18 environmental
changes and are evidence of the biological mechanism, not a fresh v18 ecological comparison.

The same-food/same-transition efficiency hypothesis remains open. This audit does not justify
adding a new efficiency gene, nor establish that one transition wins across all local mixtures.

### 6. Investment budgets must include the actual processing bottleneck

With local ID 0 concentration 0.1, fixed 0.4 internal material and half swim effort, the current
economy helper reports an import-only surplus of **0.20996 work/second**, but a finite-enzyme
surplus of only **0.00912**. Increasing the matching importer by 12% raises imports from 0.05
to 0.056, yet lowers the finite-enzyme surplus to **0.00876**. Increasing its corresponding
enzyme by 12% instead raises that surplus to **0.01100**. Under ID 80, the matching-enzyme
increase raises surplus from **0.01246 to 0.01454**; the mismatched enzyme adds cost.

This is already a conditional allocation tradeoff. In these cases, extra intake does not repay
its extra transport and upkeep cost because processing is the bottleneck. These calculations omit
product accumulation, finite storage, actual controller effort, repair, learning, shared donors
and changing geography. Its `constructionCeiling` uses the optimistic import-only surplus.
It must not be used as the predicted growth rate of the live cell.

## Coupling inventory and remaining limits

| Investment or condition | Shared benefit | Shared cost or limitation | Production owner |
| --- | --- | --- | --- |
| Core and total size | Work reserve, growth rate; extent changes sensing and motion | Occupied area, maintenance, assembly; mixed scaling above | `organism.rs`, `metabolism.rs`, `movement.rs` |
| Storage | More internal material capacity | Construction, maintenance, added area; retained products occupy enzymes and may injure | `organism.rs`, `transport.rs`, `metabolism.rs` |
| Receptors | Stronger bounded local chemical responses | Funded stock and maintenance; diminishing gain with stock/core | `sensing.rs` |
| Transporters | Finite recognized import/export throughput | Work per transfer, storage, shared local donors, stock costs | `transport.rs`, `exchange_vector.rs` |
| Enzymes | Finite chemical conversion and captured work | Stock costs, offset attenuation, occupancy and uphill work | `chemical_operators.rs`, `metabolism.rs` |
| Membrane target | Local chemical protection; response to shared medium | Protection is chemical-local, retains susceptibility floor; paid refitting | `sensing.rs`, `refitting.rs`, `chemical_operators.rs` |
| Injury | No benefit itself | Reduced capacities, increased upkeep, repair expenses and death | `world.rs`, `organism.rs`, `metabolism.rs` |
| Private learning | Controller changes during life | Work proportional to core; fixed controller upkeep also remains | `world.rs`, `accounting.rs` |

At equal composition and unconstrained local supply, proportional body scaling makes transport,
enzyme capacity and most upkeep scale together. The runtime deliberately has no additional
spherical surface-to-volume uptake ceiling. Finite local donors, travel and competition can
break that proportionality. Adding a conventional physical capture law is not the recommendation.
Passive drift uses the same medium response and credits no usable work; it can change the
incremental usefulness of motor stock, but that effect was not isolated here.

The formulas still contain independent choices: per-stock upkeep rates, motor power and
efficiency, storage and work capacities, reaction turnover and efficiency, stress/repair scales,
birth allowances, plus hardcoded drag factor 8, turn price 0.25, enzyme offset scale 9, catalytic
price 0.05 and refit speed 0.25. A mathematical expression does not derive these coefficients
from one fundamental constant. Fixed controller overhead is defensible for a fixed-size RNN;
it should not automatically be made proportional just because repair should track funded body.

## Recommended next work

Reconcile **body scale, repair and reproduction accounts first**, retaining shared stock vectors
and bounded arithmetic; remove the zero-stock refit delay in the same accounting review. Explicitly
distinguish costs per organism, costs per unit of funded stock and rates of change of a fraction.
Then use the corrected budget to establish when extra motor or processing investment can repay
itself in accessible local conditions. Only unresolved payoff questions need short constructed
assays. Broad constant sweeps, another long trajectory and new trait-specific penalties are not
needed to resolve the defects identified here.

## Reproduction and verification

From the repository root, choose a new output path (existing reports are refused):

```bash
cargo run --release --manifest-path engine/Cargo.toml --example coupling_audit -- /tmp/coupling-audit-new.json
```

The example calls production operators and the existing economy helper. Empty-medium movement
uses a point stencil, which is equivalent for this uniform fixture; it does not test geographic
footprint effects. Reaction evaluations report available work before World clamps overflow.
The scaling and stress fixtures hold actual stocks/composition fixed and do not simulate a birth
mutation. No alternative runtime, renderer or observation pipeline was introduced.

Validation: `make ci` passed 92 Rust tests and 60 Vitest tests, formatting, type checks,
documentation links and Terraform formatting; 13 existing ESLint warnings remain. The new example
also passed targeted release Clippy with warnings denied. This audit changed only its diagnostic,
this report, the documentation index and the retained generated result; production rules are unchanged.

SHA256 provenance:

```text
example source: b805af68cce348754efddb4d76972a016cb535edaee58a2a5bb7ad192e21e2a2
native executable: 3b3409e0c5147b4cefc5e7965ddcddf2440632f5dfe8ce47aeef29388de79686
retained report: 508c0c779aea0b6f1f3d06bd40f333c20da61b4717048693180587a9d46511d0
```
