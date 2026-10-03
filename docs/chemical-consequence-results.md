# Chemical consequence assay: October 2, 2026

**The membrane protection prediction passes; the new-fuel prediction fails.** An inherited
enzyme-key substitution increases accepted136->8 conversion but does not turn136 into
a funded substrate in this fixture. Every supplied cell exhausts its usable energy, including
the protected consumer. The assay therefore does not demonstrate opposite chemical roles or
co-located roles. The two conditional shared-bath worlds were not run.

The October3 [causal iteration](rugged-community-results.md) retains this failure and establishes
a funded shared-world opportunity using a potential-decreasing action chain. It does not change
the result or conditions of this assay.

The [registration](plans/CHEMICAL-CONSEQUENCE-ASSAY.md) fixed conditions, controls, work
criteria and stopping rules before stepping. Unlike the earlier [importer square](rugged-binding-results.md),
this assay directly measures conversion, injury, repair and funded work. It tests a physiological
opportunity in the local v51 candidate, not discovery by evolution or the entire
[rugged interaction direction](design/rugged-interaction.md).

## Test and controls

Four matched single cells differ only in two inherited scalar key loci: enzyme0 recognition
of128 or136 (E0/E1), and membrane protection against128 or136 (M0/M1). Switching either
key changes weight4 from-1 to+1. Bodies, enzyme actions, pumps, RNN weights and initial
packets match. Each starts with bound mass1.66, zero free inventory and usable energy0.5.
The fixed paid controller imports136, requests repair and enables the existing136->8 action.
Mutation and learning remain frozen.

The supplied environment contains a finite uniform136 pulse at concentration1. Blanks contain
no offered material. Enzyme-off controls retain enzyme stock and recognition but request no
enzyme activity. Lower-steepness controls compare both endpoints at lambda0.25 instead of6.
No runtime coefficients, source supply or fixture were changed after registration.

All16 cases reached either the200-tick horizon or the registered extinction stop. They used
1802 world ticks and0.225 seconds of measured stepping/observation wall time; setup, archive
writes and automated checks are excluded. No ecological reruns, tuning or horizon extensions
occurred. Every blank cell survived200 ticks; all supplied cells died at ticks20–28.

## Physical consequences

Funded work W is final living usable energy plus cumulative paid assembly work minus initial
usable energy. Growth purchased from founder reserves alone cannot pass. Death leaves zero
living energy. Lifetime injury and repair rates use actual organism-seconds, including early
extinction; these are not equal-horizon fitness comparisons.

| Supplied condition, lambda6 | 136->8 material | W, usable work | Injury per model second | Repair work per model second | Extinction tick |
| --------------------------- | --------------: | -------------: | ----------------------: | ---------------------------: | --------------: |
| E0M0                        |        0.006301 |      -0.277182 |                0.008590 |                     0.010272 |              28 |
| E1M0                        |        0.167151 |      -0.328968 |                0.008537 |                     0.009135 |              20 |
| E0M1                        |        0.005825 |      -0.230372 |                0.002334 |                     0.002994 |              28 |
| E1M1                        |        0.213591 |      -0.328795 |                0.002285 |                     0.003363 |              22 |
| E1M1 enzyme off             |               0 |      -0.230372 |                0.002335 |                     0.002987 |              28 |

Changing only the protected cell's enzyme key increases136->8 conversion about36.7-fold.
Disabling the enzyme eliminates conversion. This establishes substrate engagement and its
accepted physical transformation, but **not beneficial fuel use**: the active consumer pays
only0.171205 assembly work versus0.269628 with its enzyme off, and dies six ticks earlier.
Its gross captured usable work is0.000035, while transport costs0.102954 and maintenance
costs0.051899. Accounted external transformation work0.770391 is not usable energy credited
to the cell; product136->8 raises reference chemical potential. Accepted conversion volume,
external work and increased bound mass cannot stand in for net funded return.

The initial actual retained-context route at unit illumination predicted positive usable yield,
while the analytical import-proportional closure predicted negative surplus. The measured
cell does not repay its costs. The assay does not isolate how much of this failure comes from
actual illumination versus evolving retained composition; neither the zero-tick positive route
nor the closure by itself explains the complete trajectory.

Changing only the weakly engaged cell's membrane key reduces lifetime mean exposure about20.1-fold,
injury rate3.68-fold and repair-work rate3.43-fold. Blanks have zero exposure, injury and
repair. At matched tick10, both exposed cells remain alive and their local136 concentrations
are0.969053/0.967299. Unprotected/protected stress loads are1.549870/0.078222; damage
is0.000698/0. The offered bath is initially identical, and the membrane mutation changes
susceptibility and the subsequent injury/repair burden. Passive permeability also shares this
membrane operator; the test does not claim to vary protection independently of permeability.
Reversing this single mutation removes protection. Neither variant reaches lethal damage;
the observed deaths follow exhaustion of usable energy, so this is not a demonstrated
harmless-to-lethal mutation.

All blanks have W=-0.441683 after40 model seconds, with0.058317 usable energy remaining.
Although supplied E0M0 has negative W, its cumulative W is greater than the longer-lived blank.
The registered adverse-work comparison therefore fails too. Its larger purchased assembly does
not establish a benefit because it died; comparing lifetime totals across different stopping
times cannot reverse that survival finding. The primary positive-W consumer criterion fails
regardless of this comparison.

At lambda0.25, both supplied endpoints die at tick24, both have negative W, and their136->8
conversions are0.118582/0.119904. The high-lambda enzyme/protection contrast weakens under
broad recognition, but there is still no funded fuel use. This does not calibrate production
steepness or demonstrate mutation-effect frequencies.

## Decision and checks

The candidate demonstrably changes chemical recognition and protection. This fixture rejects
the stronger claim that its enzyme mutation opens a funded fuel capability. The intended
fuel-versus-harm and co-located-role demonstration remains unestablished. The failure does not
disable the candidate or show that no chemical/action/context can work; no search for another
successful case was performed.

Worst work/material account residuals are1.308e-13%/4.014e-14% of initial-plus-supplied
accounts, below the registered limits. The work allowance floors each case at1e-8. Exact
checkpoint and kernel digests match the zero-tick registration. Four focused fixture/report
tests pass, as do changed harness lint, TypeScript, formatting and documentation/storage checks.
No Rust physics changed during this follow-up. The existing candidate builds were reused.

## Reproduction and local evidence

The completed registration is not an implicit request to rerun it. From `frontend`, these
commands reproduce it in fresh ignored directories:

```bash
pnpm exec tsx harness/numerical/chemicalConsequences.ts budget harness/artifacts/consequence-new-budget
pnpm exec tsx harness/numerical/chemicalConsequences.ts panel harness/artifacts/consequence-new-panel harness/artifacts/consequence-new-budget
```

The panel requires the same kernel and registered initial checkpoint digests before stepping.
It writes all single-cell results before evaluating predictions. Shared worlds run only if
all qualitative criteria pass. Existing directories cannot be overwritten.

Local evidence is at `frontend/harness/artifacts/chemical-consequences-v51-budget/budget.json`
and `frontend/harness/artifacts/chemical-consequences-v51-panel/{panel,report}.json`, ledger
4478–4493. Per-case archives retain the exact WASM, manifests, genotypes, initial/final
checkpoints and ten-tick traces. Raw data and the ledger remain ignored and local.
Source digest: `0a99ad823ac977e2cd3a1fba7c13b92f591ccfba61902bea0555ccce2fa598bd`.
WASM SHA256: `d16358081eff33b8be8262016bd3ac64e59bebf679dc12535961b760f98ffa7f`.

No commit, push, deployment, user-tab access or live-world replacement occurred. The local
assay plan is complete with its negative and positive findings preserved.
