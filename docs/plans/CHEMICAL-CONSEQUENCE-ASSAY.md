# Qualitative chemical consequences assay

Status: completed locally, October 2, 2026; registration preceded ecological execution.
Sulion: `4d81a342-683a-482f-b1c3-889e2cde65cc`.

## Question and decision

Does the implemented complementarity candidate make the **same chemical a funded substrate
for one inherited configuration and damaging exposure for another**? Does a single declared
key mutation open substrate use or remove protection? This directly tests the intent in
[rugged interaction](../design/rugged-interaction.md), rather than using reciprocal growth
ranking as a proxy for chemical roles.

The earlier [square result](../rugged-binding-results.md) changed only import preference,
with identical metabolism and membrane protection. It established one epistatic example but
did not establish qualitative chemical consequences. This follow-up changes enzyme and
membrane recognition, and measures the resulting physical conversions and injury costs.
No runtime changes, production activation, evolutionary campaign or live-world access are
authorized by this assay. A failed fixture is evidence, not permission to search for a winner.

The decision is whether the current candidate has a working qualitative physiological
opportunity worth carrying forward. Neither a positive nor a negative constructed result
decides that the entire direction is delivered or proves that evolution discovers the roles.

## Fixed causal fixture

Use physical v51, world seed27, chemical seed101, a24x24 periodic mesh2 diagnostic world
and the unchanged property table. Chemical136 has stress0.996352, potential3.738630 and
diffusion0.050725. The installed exact action136->8 raises reference potential to7.901700;
any positive usable return must come from explicitly accounted transformation work, not a
new energy value. Shared-kernel zero-tick budgets and actual retained-context routes are
archived before stepping. A negative usable route stops execution rather than triggering
an ecological search.

The supplied condition is one finite uniform pulse of576 material of136, concentration1.
No sources, priming, further pulses or feedback interventions occur. Blank conditions have
no external material. Geography and all physical coefficients retain the diagnostic preset.

Four variants form a causal factorial, not an assigned role taxonomy:

| Variant | Enzyme0 key target | Membrane key target |
| ------- | -----------------: | ------------------: |
| E0M0    |                128 |                 128 |
| E1M0    |                136 |                 128 |
| E0M1    |                128 |                 136 |
| E1M1    |                136 |                 136 |

Keys are eight target spins, bias-7. Changing only weight4 from-1 to+1 moves the enzyme or
membrane lock from128 to136. These are explicit single-locus substitutions, not samples from
the mutation distribution and not claims about their prevalence. At lambda6, matched
affinity is0.997527, one-mismatch affinity0.002473. Predicted susceptibility to136 is0.052349
for M1 and0.997651 for M0. Identical initial external136 concentration therefore gives about
19 times the exposure before internal uptake and repair. At lambda0.25, corresponding
susceptibilities0.465932/0.584068 differ much less.

All four variants have exactly the same physical genes, body capacities, enzyme action,
transporters, sensors and diagnostic reflex. Importer0 and enzyme0 physical genes are3;
only enzyme0 is active. Its exact action has center(4,8), angle0, unchanged by the key
mutation. The importer and receptors lock136. Transporter1 holds; transporters2/3 export
with generalist keys. The membrane and enzyme keys are the only inherited differences.

All founders start at mass1.66 with the ordinary role-zero bound mixture, **zero free
inventory**, energy0.5, damage0 and reset private memory. Removal of founder free inventory
is an explicitly accounted initial-condition intervention. It prevents initial fuel chemistry
from substituting for the offered chemical. The same matched packet is installed in shared
worlds, including founders that originally had other role packets.

Fixed ordinary RNN outputs request swimming0, turning0, repair1, importer0=1, transporter1=0.5,
exporters2/3=0, enzyme0 activity1, all other paid efforts0. The enzyme-off control requests
activity0 but retains the same enzyme stock and all recognition/action genes. Static learning,
both mutation rates0, clonal transmission and inherited-learning retention0 apply throughout.
No programmed controller or observer label enters stepping.

## Predictions and controls

The intended causal chain is recognized imported136, accepted136->8 conversion, accounted
usable work, operating/repair costs repaid, and funded assembly. For membrane protection,
the chain is the same offered chemical, changed susceptibility, changed exposure/injury,
then changed repair expenses or unrepaired damage. Product inhibition, passive leakage,
energy-limited transport, public chemical conversions, startup-energy growth and short-lived
unprotected cells are competing explanations. Record them rather than hiding them in a score.

Primary funded-work measurement per original founder group:

```text
W = final living usable energy + cumulative paid assembly work - initial usable energy
```

Positive W means chemistry has repaid initial usable reserves, operating expenses and paid
assembly while retaining that credited work. Division, repair, motors, transport and other
expenses remain deducted through final usable energy; they are not rewards. Dead cells
contribute no living energy. Report overflow, negative-reaction expenditures through the
world's full accounts, bound growth, identity-specific reactions and all expense channels.
W is a physical work balance, not a reproduction score.

The **fuel-gain prediction** requires E1M1 in136 to have W>0, accepted136->8 conversion and
growth funded beyond its blank and enzyme-off controls. Changing only the enzyme key must
increase136->8 conversion and W over E0M1 outside the account allowance. Enzyme-off supplied
cells must fail the positive-W result, or its attribution to this enzyme is unsupported.

The **protection-loss prediction** requires supplied E0M0 to have extra exposure and injury
over its blank, and extra injury/repair burden over supplied E0M1 despite identical pumps,
enzyme stock/action and controller. Compare mean exposure and injury per organism-second
to avoid treating earlier death as less harm. Show matched early frames and actual stop ticks,
not full-horizon lifetime rates after extinction.

The **opposite-consequence prediction** additionally requires supplied E0M0 to have W<0 and
less W than its blank, while supplied E1M1 has W>0. Transport expenses alone cannot establish
toxicity: the protection-loss comparisons must also pass. A small enzyme flux or growth from
initial usable reserves is not a demonstrated new fuel capability.

Lower-lambda controls use the two endpoints with supplied/blank conditions. They compare the
same inherited substitutions under broad recognition; report the actual physical consequences
and whether endpoint differences shrink. They do not calibrate a new production parameter.

Only if fuel gain, protection loss and opposite consequences pass with closed accounts,
run two four-founder shared baths of136 at the same horizon. Put all four genotypes at
(11,11),(13,11),(11,13),(13,13), then rotate assignments by two positions. Require opposite
consequences and the measured chemical/injury pathways to remain; shared growth ranking is
not the decision. All founders receive the same initial packets. Local chemistry after
stepping may differ through their actual uptake and export; record it.

## Fixed execution budget and storage

Single-cell panel:8 high-lambda active cases (four genotypes supplied/blank),4 enzyme-off
cases (E0M1/E1M1 supplied/blank) and4 low-lambda endpoint cases supplied/blank. Conditional
shared panel:2 worlds. Maximum18 worlds,200 ticks each,3600 world ticks,10 seconds per world
and180 total simulation wall seconds. Stop at horizon, extinction, wall cap or execution
failure. No automatic sweep, replication, retuning or horizon extension. Zero-tick derivation
and automated contract checks do not constitute additional ecological cases.

Use the existing `QuickScenario`, `runQuick`, causal trace and ledger. New ignored output
directories retain exact WASM, source/binary digests, resolved conditions, founder genotypes,
checkpoints, ten-tick stock/activity/exposure frames, reactions, costs and stop reasons.
Never replace previous artifacts. Every case must match its registered initial-checkpoint
digest before stepping. Account residuals must remain below1e-7 relative to initial plus
supplied accounts. Work comparisons use observed absolute work residuals with a1e-8 work
floor per case; material/reaction/expense comparisons use a1e-8 dimensional floor.
Missing, nonfinite or incomplete data cannot pass a prediction.

## Implementation work

1. Author the fixture, zero-tick derivation and report in the existing harness, with focused
   zero-tick checks for single-locus differences, matched packets and observer fields. Review
   the budget and exact136 route before launching the fixed panel. Do not change Rust physics.
2. Execute once, condition shared worlds on measured qualitative consequences, and author
   findings with actual passes/failures and reproduction instructions. Run changed harness
   lint/format/type checks and relevant documentation/storage checks; reuse the already-passing
   kernel builds because Rust is unchanged. Close this plan when local findings are delivered.

Zero-tick derivation completed without advancing time. Every high-lambda genotype has
maintenance0.010983 and import ceiling0.339045 material136 per model second. The actual
retained-context136->8 route yields3.368475 usable work per converted material at unit
illumination. Enzyme-key substitution raises catalytic access from0.000305 to0.122983.
Initial measured stress loads are0.994012 (M0) and0.052158 (M1). The analytical
import-proportional closure instead predicts surplus-0.027935 for every supplied case;
its hypothetical pure136 retained composition makes processing unprofitable. This is a
registered competing prediction, not grounds for changing the fixture. Actual rates,
composition, accounts and net funded work decide the result.

Protection burden passes only with higher normalized exposure and injury, plus higher
repair work or mean unrepaired damage. All16 cases must complete normally or reach the
registered extinction stop and have closed accounts before any qualitative prediction
can pass. Execution completed once:16 cases,1802 ticks, registered extinction/horizon stops
and closed accounts. Protection loss passes; funded fuel and opposite consequences fail.
Shared worlds were skipped under the predeclared rule. No fixture tuning or extra runs.
See the [authored findings](../chemical-consequence-results.md) for measurements and limits.
