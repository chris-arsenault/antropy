# Cellular organization: delivery and limits

September 20, 2026. Physical checkpoint v33. Implementation of the
[joint design](design/cellular-organization-and-exchange.md), tracked by the
[execution plan](CELLULAR-ORGANIZATION-PLAN.md). These are mechanics and bounded operating
measurements, not evidence that a meta-organism has evolved.

## Delivered behavior

Cells retain one well-mixed free inventory covering all 256 chemicals and their chemically
identified bound body material. No compartments or chemical-slot limit were introduced.
Retained composition now changes reaction rates through the existing two interaction profiles;
it does not change work per identical conversion. Inward receptor allocation, enzyme activity,
construction allocation and paid retirement connect sensing to this material environment.

An enzyme repertoire has one to eight genetic programs. Eight bounds the union of active
templates and carried retired records. Duplication splits existing investment and inherited
stock, with controller ports adjusted to preserve the original response. Deletion leaves
material, volume and upkeep until paid retirement. Core and actual daughter reserves fund
division; unexpressed optional targets no longer prevent it. No replacement machinery is granted.

One normalized contact graph partitions access between field and neighbors. Injury exposes free
inventory to paid transport; intact bodies remain private. All receivers and a donor's own export
reserve the same frozen stock. Receptors, contact cues and stress use the same accessible boundary.
Export remains public. Existing production, injury, repair and death can consequently help or harm
neighbors without an attack reward, assigned role or kin rule. Living bound structure is not edible.

The selected-cell inspector shows active/retired programs, activity and construction requests,
inward receptor allocation, retirement work, field-facing interface and contact material received
or lost. The chemical atlas and role counts include all active programs. Rust owns these quantities;
the worker still renders borrowed WASM views and sends bounded observations.

## Bounded physical evidence

`make ci` passes: 168 Rust unit tests, 17 Rust integration tests and 71 frontend tests, plus
Clippy, formatting, TypeScript, documentation and Terraform checks. Seventeen existing frontend
warnings remain; there are no lint errors. Ownership tests preserve borrowed worker rendering.

Rust comparisons use ordinary operators, frozen mutation and explicit funded fixtures:

- Equal bodies and free substrate with different bound identities produce different throughput
  but equal work per accepted conversion. Exact inverse response modifiers sum to two. Chemical
  relabeling moves free and bound material, profiles, recognition and actions together.
- Inward readings require both actual receptor stock and inward allocation; a diagnostic RNN
  responds to the reading. Unfunded stock gives no signal.
- Neutral duplication and record permutation preserve controller responses and chemical flux.
  Deletion preserves actual matter/work; retirement consumes work and respects reduced storage.
- Core-funded division succeeds with an absent optional enzyme and grants neither daughter one.
- Intact neighbors expose no private food. Injured donors support simultaneous competing uptake
  and their own export without double spending; reversing cell order preserves accepted amounts.
- An isolated overlapping pair relaxes equally over one model-second at dt=1 and dt=0.1.
  This does not certify many-body trajectories visually.

The constructed three-cell return comparison uses one donor at injury 0.5, two funded receivers,
ordinary transporter turnover 2.5, one model-second of import and conversion, and local external
work signal [1,1]. One receiver imports 0.0154927 material, pays 0.0007746 transport work, captures
0.2775082 work and owes 0.0127 upkeep: private net **0.2640336**. Initial body, food and work are
fixture grants; this is not a lifetime return including building that body or causing the injury.
The distinct contention test exaggerates turnover to force donor saturation. Its result must not
be substituted for the ordinary-turnover return measurement.

Thus exposed material can pay a receiver under the stated conditions. Profitable deliberate
injury, mutual dependence, an advantage for a whole specialist community and evolved cooperation
remain unestablished. The design's idealized delivery bound is still a derivation, not a measured
community. No long evolutionary campaign was run.

## Ordinary startup

Ledger **4255**, unchanged seed27 founders, ordinary mutation/plasticity, 600 ticks (120 model
seconds), 120-second wall cap. Completed at the horizon in 2.56 seconds with 60 living cells,
17 divisions, five deaths and maximum generation two. Material residual was 8.88e-9 and work
residual 8.39e-8. Contact import and retirement were both zero: this startup did not express those
new opportunities. No seed search or horizon extension followed.

The initial alleles retain four programs, outward chemical sensing, full enzyme/activity and
construction requests, and zero retirement. These are mutable controller/physical alleles.
No founder was replaced with a cooperative specialist or a diagnostic controller.

## Release-WASM costs

Same 320×240 world, mesh2, dt0.2, physiology interval0.8. Each standard fixture has 10 warmup
and 100 measured ticks, including controller/physics, census, selected inspection and borrowed
render preparation. GPU painting is excluded. Distinct genomes and plastic learning are active.
The fixtures grant initial stock/material deliberately; they are not ecological populations.

| Constructed load | Before feature, ticks/s | Delivered feature, ticks/s |
| --- | ---: | ---: |
| 48 cells, four programs | 63.95 | 63.55 |
| 2,000 cells, four programs | 31.69 | 30.07 |
| 2,000 cells, growth enabled | 21.08 | 19.14 |
| 2,000 cells, eight programs | Not measured | 27.45 |
| 96 coincident injured cells, eight programs | Not measured | 59.61 |

Baseline ledger **4235–4237**, final standard **4250–4252**, bounds **4253–4254**. The dense
case measures 50 ticks after 10 warmup ticks. All completed within their 60-second caps and passed
restore/continuation checks. These are single matched runs, not confidence intervals.

The 2,000-cell standard mean reaches 30 ticks/s narrowly; its slowest measured window is 29.68.
Its mean is 5.1% below baseline. Growth is 9.2% below its already sub-target baseline. Eight active
programs at 2,000 cells also miss 30. Eight is a finite supported repertoire with a measured cost,
not a claim that every population at that bound meets the target. Increasing it requires a new
whole-workload budget. Dense contact can still approach quadratic edge counts.

Standard final checkpoint sizes are 21.7/77.1/118.6 MB. Corresponding retained WASM memory capacities
are 193/646/1,158 MB, including checkpoint capture/restore and the sequential fixture arena. These
are not measurements of one live world's resident memory or an unattended browser session.
Fresh v33 physical saves are required; v32 is rejected. Observation bundle version11 is unchanged.

### Rejected optimization and retained repairs

Initial feature timings were 62.62/28.75/18.40 ticks/s (ledger4238–4240). Skipping unused enzyme
operators and empty contact arrays reduced memory but left the 2,000-cell mean at 28.72
(4241–4243). A 20-tick matched stage profile per binary found added control, physiology and
lifecycle work, while field cost stayed about16.8 ms/tick.

A compiled sparse controller matrix then made the measured mean worse, 27.79 (4244–4246), so it
was removed. Dense SIMD remains. Skipping field-only donor splits, no-effect remodeling and
unchanged count mutations improved the mean to29.10 (4247–4249). Retaining survivors in place
through lifecycle passes removed two population-vector rebuilds per tick and produced the final
30.07 result. No chemistry, resolution or contact competitors were removed to recover speed.

The retained-mixture projection is computed once per reaction update and shared across enzyme
rows. There is no persistent projection cache yet: ordinary transport/reaction changes invalidate
it frequently, and the completed cost work found more immediate lifecycle waste. Likewise contact
mixtures use bounded 256-component accumulation per exposed edge; receptor recognition is sparse.
Further projection reuse and sparse contact accumulation remain optimization opportunities, not
claims made by the delivered implementation.

Durable generated reports: [baseline](evidence/cellular-organization/baseline.json),
[delivery](evidence/cellular-organization/delivery.json), [bounds](evidence/cellular-organization/bounds.json)
and [startup](evidence/cellular-organization/startup.json). Raw checkpoints and binaries remain
local under `frontend/harness/artifacts/cellular-v33-*`; the SQLite ledger retains named measurements.
No browser session, server, live save modification, commit, push or deployment was performed.
