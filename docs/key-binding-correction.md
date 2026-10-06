# Chemical-key binding correction — October 6, 2026

Status: Implemented locally, with bounded physical comparisons and repository checks.
Sulion plan `2e20a7a4-9e4e-4c2b-a3e9-529b94a6f230`.

## Recovered goals and defect

The September30 user discussion requests occasional drastic positive or negative mutation
effects on chemical access and sharply different relationships between cells exposed to the
same slowly varying mixture. Spatial chemistry remains smooth; roles and favored chemicals
must not be assigned. Retrieval provenance is session
`3c77ec4b-f149-456c-8ecd-e6f99930b48a`, turn2772167; the full prompt and response were read
with `sulion-retrieve turn`, alongside the [installed direction](design/rugged-interaction.md).
The current correction follows the October6 instruction to fix the law.

Independent sigmoid coefficients permitted one positive bias to make every chemical bind at
nearly full strength. Shared pump/enzyme occupancy did not repair the same defect in membrane
protection and retention, and did not limit total compiled recognition. The saved evolved
population confirms this collapse in funded machinery. The four-group ablation changed
multiple mechanisms and population history, so its census difference cannot identify a
causal effect of keys on body size. That uncertainty does not invalidate the coefficient defect.

## Selected correction and derivation

One recognition site has one unbound state of weight one and a bound state for each chemical
identity. Its existing inherited score is `E(s)=b+sum_j k_j*beta_j(s)`. Competing states yield
`Z=1+sum_t exp(lambda*E(t))` and `A(s)=exp(lambda*E(s))/Z`.
Thus `sum_s A(s)<=1`; no bias can grant256 units of recognition to one site.
The complete eight-bit domain permits the exact factorization
`sum_t exp(lambda*E(t))=exp(lambda*b)*product_j(2*cosh(lambda*k_j))`.
The implementation evaluates its logarithm once per compiled key. Runtime consumers still
borrow sparse immutable coefficients and perform their existing funded operations.

Bias controls total occupancy against the unbound state. The affinity ratio for identities
s,t is `exp(lambda*sum_j k_j*(beta_j(s)-beta_j(t)))`, independent of bias. Strong binding
therefore retains chemical preference even when bias rises. Vanishing weights permit a
generalist, but its budget is divided among identities: a saturated uniform key has affinity
1/256 per chemical. Sparse pruning never rescales survivors. The same operator applies to
receptors, transporters, enzyme substrates and membranes; there is no breadth tax, new
control, category-specific rule or change to the mutation distribution.

This is a correction to the selected model, not a claim that the old independent sigmoid
implementation differed from its written equation. That equation failed the intended
finite specialization tradeoff. The derived one-site partition replaces it explicitly.
Exact chemical actions, reference potentials, costs, spatial laws and material ownership
remain governed by the [composed runtime](design/chemistry/composed-runtime.md).
The key representation and physical checkpoint layout remain unchanged; the existing
restore path recompiles derived operators from inherited keys using the corrected law.
The explicit radial startup ablation remains available.

## Bounded physical check registration

Question: does one site's finite recognition remove universal binding while preserving
qualitative inherited access and paid physiological consequences in a common mixture?
Competing explanations are reduced coefficients without a usable physical route, unrelated
startup inventory effects, and benefits explained only by experimental label or founder count.

Before stepping, use `bindingBudget` on every fixture and retain the complete initial state,
compiled profiles, action-aware resource estimates, exact binary/source identity and accounts.
The existing budget's import-proportional processing closure is an upper-bound diagnostic;
it omits passive diffusion, injury and later retained composition. A negative predicted
surplus remains negative even if the dynamic circuit behaves differently.

Reuse the existing four-genotype two-bit fixture and its diagnostic RNN, conservative founder
packets, finite mixed0/136 supply and four exact circuit enzymes. The two changed importer
weights select0,128,8,136. Labels are diagnostics only. Mutation, private learning and
assimilation are frozen. Use seed27, chemistry101,24x24, mesh2; lambda6 is the ordinary
control and0.25 is the smooth comparison. Eight single-founder probes each stop at300 ticks
or30 wall seconds, extinction or an execution failure. Total ceiling2,400 ticks and240
wall seconds, with generated data capped at256MiB. No seed sweep or horizon extension.

Prediction: the high-steepness endpoints obtain different paid access to the offered mixture
and exceed the intermediate returns; the low-steepness profiles blur identity differences.
The result can reject this particular reciprocal-return fixture. It cannot prove evolved
co-located roles or persistent complementary exchange. Report uptake, transformations,
captured work, assembly, repair, survival and divisions; do not select a law from cell count.
An unsuccessful comparison remains evidence rather than triggering a parameter sweep.

Focused native checks additionally compare actual paid import after one changed bit, differential
stress of selective membranes in an identical mixed inventory, and the diverse-inventory
generalist protection failure. Domain-extreme, mutation, bit-relabeling, inherited sharing
and restoration checks protect the common implementation. Ordinary startup checks belong
inside delivery and remain bounded; they do not require long-term ecological success.

The ordinary-startup check uses one seed27 ecology world with all default features,48 mutable
founders,240 sources,720x540 and mesh2. Private learning and assimilation retain their ordinary
configuration. Derive four founder budgets before execution, then stop at400 ticks,30 wall
seconds, extinction or a runtime failure, with256MiB generated-data cap. This checks active
production integration and funded chemistry, not renewal, sustained survival or evolved roles.

Generated artifacts remain ignored under `frontend/harness/artifacts/key-binding-correction-*`.
The reusable entry point is `pnpm exec tsx harness/numerical/keyBindingCorrection.ts OUTPUT`
from `frontend`, after `make engine-build`; append `startup` for the separately bounded ordinary
check. No live-world restart or change to the selected all-off configuration is part of this correction.

## Findings and delivery

The nine new native checks pass, including equality with an explicit256-state partition,
finite capacity under common mutation and extreme domains, identity-bit relabeling, preserved
relative preference under positive bias, one-bit gains/losses, paid uptake and differential
membrane protection. Existing checks exercise all four consumer classes, immutable operator
sharing, conservative inheritance and checkpoint continuation. Uniform saturated affinity is
1/256 per identity; the resulting diverse-inventory susceptibility remains above0.996 rather
than collapsing toward the0.05 protection floor.

All eight registered single-founder probes reached300 ticks with closed accounts. The
ordinary steepness gives reciprocal sign epistasis in funded net biomass return: both
endpoints outperform both single-mutant intermediates. The smooth control fails that
ordering, preserving its negative result. Returns are net living bound-material gain divided
by each case's initial bound material; they are not population scores.

| Key | Lambda6 return | Lambda0.25 return | Lambda6 accepted import0 /136 | Lambda6 captured work | Lambda6 assembly work |
| --- | ---: | ---: | ---: | ---: | ---: |
| G00 | 9.496 | 1.027 | 34.789 /2.568 | 29.626 | 7.881 |
| G10 | 2.874 | 0.961 | 3.833 /1.692 | 13.465 | 2.385 |
| G01 | 2.982 | 0.959 | 3.826 /1.737 | 13.196 | 2.475 |
| G11 | 6.122 | 0.918 | 5.582 /10.515 | 22.537 | 5.081 |

The endpoint keys give different relationships to the identical offered mixture: G00 gains
mostly0, while G11 gains more136 than0. Both capture work, pay transport, maintenance and
repair, and transfer free material into funded biomass. Intermediates still obtain some
material through unchanged pumps and passive diffusion, so a lost focal importer does not
mean zero total uptake. Cumulative imports may include recycled exports. All eight cases
survive; endpoint population differences are consequences, not the criterion for selecting
the law. The zero-tick closure predicted negative processing surplus for G10/G01/G11 at6;
their actual retained circuit gains contradict treating that closure as a survival predictor.
The negative estimates remain in the raw budget and are not replaced by measured returns.

The ordinary production check reaches400 ticks with all48 cells alive, keys enabled and
ordinary mutation/learning. Actual uptake, conversions and captured work are positive;
the material/work accounts close. This is active startup integration, not evidence of
long-term replacement or sustained co-located roles. The corrected law removes the proven
universal-binding defect while leaving generalism, selection and ecological outcomes open.

The eight physical probes advance2,400 ticks in0.739 seconds of measured stepping/observation;
the separate startup advances400 ticks in7.57 seconds. Those figures exclude engine setup
and artifact writing. Generated probes occupy about31MB and retain exact initial states,
native budgets, archived WASM, traces, complete expense channels and summaries. Local paths
are `frontend/harness/artifacts/key-binding-correction-20261006/` and
`frontend/harness/artifacts/key-binding-correction-startup-20261006/`; ledger entries4535–4543.
Only this authored interpretation and reproduction instructions are tracked.

Repository CI passes:421 Rust kernel tests,18 native server tests plus one existing ignored
publication benchmark,17 chemical-definition integration tests,94 Vitest tests, the Python
producer check, lint/format/type checks, documentation/storage checks and Terraform formatting.
Historical findings retain their original independent-sigmoid law and are not retroactively
evidence for the corrected partition. The user subsequently authorized committing and pushing
the correction through the ordinary CI/CD pipeline. The selected all-off configuration remains
unchanged; publication does not enable keys in the running ablation.
