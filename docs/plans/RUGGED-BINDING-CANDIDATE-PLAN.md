# Rugged binding candidate and bounded epistasis experiment

**Status:** Completed locally October 2, 2026. All three milestones delivered; no publication or deployment.

## Outcome and scope

Build a local complementarity-binding candidate in the shared Rust simulation and obtain a
numerical answer to one question: can two declared binding-key mutations each reduce funded
return alone, while their combination restores or improves return in the same chemical mixture?
If that prediction holds, test the same four genotypes under shared access.

The October 2 follow-up authorizes execution of every local milestone. The scoped implementation is the small candidate and tests agreed
in this conversation, not selection or delivery of the complete production research direction.
Ordinary startup keeps its current recognition, and the live server world is untouched.
Commit, push, deployment, live-world replacement and long ecological campaigns are outside
this plan. Do not create a branch.

Delivery includes working native/WASM compiler integration, inherited fixture keys, reproducible
commands, accounted observations and authored findings. A negative or incomplete result must
remain visible; a favorable population or affinity image cannot replace the named prediction.
This experiment cannot establish long-term coexistence, evolutionary discovery, or multiple
optima throughout the complete genome.

## Sources and reuse

Read these bodies again when starting implementation:

- [Rugged interaction](../design/rugged-interaction.md) defines the candidate and its boundaries;
  [research companion](../design/kauffman-landscapes-research.md) distinguishes magnitude,
  sign and reciprocal sign epistasis. The completed research plan
  `9c1505b0-587c-49f2-b5ee-99e9658f8845` selected no implementation.
- [Composed laws](../design/chemistry/composed-runtime.md),
  [resource economy](../design/chemistry/resource-economy.md) and
  [ownership](../design/chemistry/data-ownership.md) govern physical returns and cost.
  The zero-tick budget excludes some live losses; do not present it as survival evidence.
- [Experiment policy](../design/experimentation.md),
  [mortality findings](../mortality-recycling-results.md) and
  [light findings](../light-ecology-results.md) preserve the relevant negative lesson:
  sensing, uptake or growth alone can coexist with an unfavorable whole-cell outcome.
- [Plan policy](README.md#delivery-policy) requires implementation phases, with checks inside
  the work rather than separate verification or acceptance phases.

| Existing owner                                                             | Required reuse or change                                                                                                                                                                     |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `engine/src/chemistry.rs`, `chemical_operators.rs`                         | Compile keyed affinity into existing immutable receptor, transporter, enzyme and membrane rows. Keep product actions, product occupancy and catalytic attenuation separate from recognition. |
| `engine/src/genetics.rs`, `genetics/genotype.rs`, `genetics/mutation.rs`   | Store explicit key values in chemical machinery; preserve validation, sequence identity, expression, clonal inheritance and unchanged-operator sharing.                                      |
| `engine/src/config.rs`, `configuration.rs`, `world.rs`                     | One shared steepness, explicit configuration validation and a coherent checkpoint boundary. The planning baseline is physical v50.                                                           |
| `engine/src/fixtures.rs`, `commands.rs`, `frontend/src/engine/types.ts`    | Extend the existing fixture/diagnostic contract and matching types; do not create another simulation or infer keys from observer labels.                                                     |
| `frontend/harness/lib/engineFixtures.ts`                                   | Reuse `installFixture`, explicit population assignments, finite material pulses and frozen mutation/learning settings.                                                                       |
| `frontend/harness/lib/quickScenario.ts`, `quickRun.ts`, `quickObserver.ts` | Reuse bounded stepping, ten-tick observations, checkpoints, source/binary digests, existing ledger and founder-genotype grouping. Add the exact biomass readout needed for this prediction.  |

The working tree already contains authored changes to `docs/README.md`, `docs/backlog.md`,
`docs/design/README.md`, `docs/design/directions.md` and two usefulness-direction documents.
Their ownership is not this plan's; preserve them and refresh status on resume.

## Settled candidate boundaries

Use the proposed common operation, with identity bits represented as spins:

```text
E(s) = sum_j key[j] * spin_j(s) + bias
A(s) = sigmoid(lambda * E(s))
```

An explicit optional keyed-recognition payload belongs to immutable genetic chemical machinery.
Absent keys retain the installed radial representation for ordinary startup. Keyed fixture
genotypes supply all receptor, transporter, active-enzyme and membrane keys explicitly. This
dual representation serves the authorized candidate comparison; it is not a second physical
economy or a production fallback policy. Do not overwrite compiled rows after installation.

The same keyed compiler feeds all four machinery classes. Keep global property tables,
reference potential, exact enzyme actions, geographic physics, action funding and controller
inputs unchanged. Stable sigmoid evaluation and sparse participation happen at compilation;
live consumers perform their existing contractions. Empty support must have defined finite
membrane/profile behavior, without a favored-chemical fallback.

Keys must survive clonal births and diagnostic checkpoint round trips. Any persisted schema
change advances the physical format without migration and updates required version consumers;
it does not authorize updating or restarting the deployed server. Key mutation uses the existing
heavy-tailed law through explicit domain transforms, never a new feature-specific distribution.
All registered experiments freeze mutation and learning; mutation-discovery studies are deferred.

The implementer resolves bias bounds, support cutoff, normalized mutation units and compile-cache
invalidation in M0, documenting their units and reasons before any run. These choices may not
be tuned after seeing returns. Broad membrane protection and generalist performance remain open
design questions beyond this narrow experiment; support sizes and compilation cost are still
reported, and obvious numerical or accounting defects must be fixed.

## Experiment registration

### Prediction and competing explanations

Four haploid genotypes form one mutation square:

```text
G00: neither change
G10: change at locus 1 only
G01: change at locus 2 only
G11: both changes
```

Only the two declared scalar key loci vary. All other key values, enzyme transformation genes,
body proportions, active programs and controller weights match. The intended chain is key
threshold crossing, changed recognized chemical mixture, changed accepted transport/conversion
or exposure, changed net work and injury, then changed funded biomass return.

Alternatives are smooth changes without reciprocal sign reversal, growth funded by initial
reserves, transport dilution, product inhibition, injury/leakage, and placement or shared-access
advantages. Do not add synthetic chemical rewards or alter the production property table to
manufacture the predicted square.

Before stepping, derive one exact fixture from chemistry seed101 using the shared production
budgets. Record chemical identities and concentrations, finite offered quantities, world size,
positions, all four keys/genotypes, action requests, initial packets, expected conversion routes,
maintenance and cost bounds. Select these through the derivation, not pilot-run screening.
If no physically plausible square can be derived, record the missing relationship and stop
the ecological runs; do not silently substitute a new mechanism or search campaign.

### Fixed single-founder panel

Use one recorded world seed27 and chemistry seed101. Ordinary diagnostic RNNs express identical
paid transport and enzyme efforts with swimming suppressed. Freeze both mutation blocks, private
learning and inherited learning; reset all private state. Initial biomass, free/bound chemical
inventories, usable energy, position and heading match across genotypes. Physical limits may
reduce requested actions; accepted activity is measured, not assumed.

| Cases               | Steepness and environment                                   | Ceiling        |
| ------------------- | ----------------------------------------------------------- | -------------- |
| Four genotypes      | lambda=3, the registered finite mixture                     | 300 ticks each |
| Same four genotypes | lambda=0.25, identical mixture and packets                  | 300 ticks each |
| Same four genotypes | lambda=3, no external feedstock, identical internal packets | 300 ticks each |

The steepness values are experimental contrasts, not calibrated production defaults. Lowering
lambda changes the complete affinity pattern; report the resulting support and occupancy changes
rather than describing it as a pure change to sharpness with everything else equal.

Use the same accounting for initial field material and any environmental external work in every
case. No oracle, external controller, continual field reset or unrecorded replenishment is allowed.

### Primary observation and claim

At tick 300 define, per original founder-genotype group:

```text
R = (living bound biomass at tick300 - initial bound biomass) / initial bound biomass
```

Include every living descendant and subtract death loss through the living-stock definition.
Conservative fission does not itself create growth. Report funded gross growth and death counts
separately. Extinction means zero living biomass and R=-1, with its actual stopping tick recorded;
do not treat lifetime flow totals as full-horizon rates. A wall cap before the endpoint is
incomplete evidence and cannot establish the endpoint inequalities.

The named reciprocal sign-epistasis prediction requires all four strict inequalities:

```text
R00 > R10    R00 > R01
R11 > R10    R11 > R01
```

Show each difference and a numerical error allowance established by the accounting checks.
Treat differences within that allowance as unresolved. Also report R at ticks 100 and 200 to
expose startup transients. Empty-feedstock controls delimit initial-reserve effects; the
lower-steepness cases test whether the proposed threshold mechanism weakens the separation.
If the same separation persists at low lambda, the high-lambda square may still exist, but
attribution to increased steepness is unsupported.

Alongside R, report accepted uptake/export by identity, actual reaction amounts, captured usable
work, all expense channels, injury, living biomass, free inventory, remaining usable energy,
births/deaths and maximum material/work residuals. Affinity or additional uptake alone is not
a pass. No fixture score enters living reproduction.

### Conditional shared-access panel

Only after a complete high-lambda panel establishes the named square with an accounted path
from offered chemistry to the observed returns, execute two worlds of at most 1,000 ticks each.
Each starts eight founders, two of each genotype, in the same registered chemical neighborhood
with equal initial packets. Swap assignments between fixed positions in the second world.
Keep lambda=3, the same chemistry and the same frozen inheritance/learning settings.

Report each group's initial/final biomass and population shares, funded returns, flows and
expenses at matched times. State whether competition retains, erases or reverses the return
separation. These runs do not establish mutual invasibility or persistent coexistence. A missing
single-founder prediction skips this panel with the actual reason; it does not trigger retuning.

### Resource ceiling and evidence storage

Maximum twelve 300-tick worlds plus two 1,000-tick worlds: **5,600 world ticks, fourteen runs,
thirty seconds per run, seven simulation wall minutes**. Compilation and unit tests are outside
that simulation budget and must not conceal additional ecological runs. Stop each case at its
horizon, extinction, physical execution failure or wall cap. No automatic replication, seed
expansion, horizon extension or fixture retuning. Implementation bugs require an explicit repair
record; any rerun that exceeds this ceiling requires a changed registration and user authorization.

Use new output directories under ignored `frontend/harness/artifacts/`, with the existing ledger.
Retain source/binary hashes, resolved configuration, exact genotypes, initial/final checkpoints,
traces, conservation data and stop reasons locally. Commit-ready documentation contains authored
interpretation and reproduction instructions, not copied raw reports or generated measurements.
No hosted publication is authorized.

## Implementation milestones

### M0 shared binding compiler and fixture contract

Scope: implement explicit validated key ownership, shared birth-time compilation, inherited
representation and native/WASM diagnostic consumers. Derive and register the exact square and
zero-tick budgets before any ecological run. Resolve cache invalidation and checkpoint/version
consumers together; changing lambda must never reuse rows compiled for another lambda.

Acceptance: all machinery classes consume compiled keyed rows in the ordinary World; unchanged
rows remain shared; ordinary radial startup remains valid; exact products and physical accounts
retain their meanings. Fixture constants and predicted inequalities are documented, or the
derivation failure is preserved as a substantive finding without launching a search.

Checks within this work: focused compiler bounds/empty-support checks, ordinary consumer checks,
clonal inheritance and restore checks, exact-action/accounting tests. Do not write ecological
assertions that merely mirror sigmoid arithmetic.

### M1 single-founder fixture and measured returns [depends on M0]

Scope: implement the registered scenario and command using `QuickScenario`/`runQuick`, add exact
founder-group living biomass observations, and execute the twelve fixed probes after reviewing
the zero-tick derivation. If derivation fails, deliver its explicit finding and omit ungrounded runs.

Acceptance: one command reproduces the registered panel into a fresh local directory; initial
conditions are matched; reports show all four return differences, controls, expenses, residuals,
stop reasons and the actual verdict. No missing data is treated as zero or as a pass.

Checks within this work: observation totals agree with Rust-owned bound material; fission does
not increase the primary stock; dead groups remain represented; genuine runtime/source faults
stay distinguishable from finite-food extinction or a negative ecological result.

### M2 shared-mixture fixture and local delivery [depends on M1]

Scope: implement the swapped shared-access fixture and execute it only under the registered
condition. Deliver authored findings in `docs/rugged-binding-results.md`, actual reproduction
commands and scoped design status. Explain negative and incomplete results without presenting
the candidate as a selected production law.

Acceptance: eligible shared-access cases have measured outcomes; ineligible cases have an honest
skipped disposition. Candidate code and diagnostic consumers pass relevant repository checks,
including native/WASM compilation and type/ownership/storage checks. Run repository CI/build
checks appropriate to the actual changed surfaces; branch a multi-step prerequisite if a real
unrelated failure blocks delivery. Close the root and execution children after scoped local
delivery, even if the ecological hypothesis is negative.

## Sulion mapping and current state

Root: `28a473a1-8fcd-476f-aa7f-0c3f3b6f9e0c`.

| Milestone | CLI position | Phase ID                               | State   |
| --------- | ------------ | -------------------------------------- | ------- |
| M0        | 1            | `4ee96f4a-d9f4-4dd3-811e-3bdce4df6b71` | completed |
| M1        | 2            | `40f31ffa-3eb4-48f1-9abb-1ff90d678555` | completed |
| M2        | 3            | `0b485486-30ed-4baf-8a5c-410eed1d4bed` | completed |

### M0 execution expansion

Expansion `552ca2c2-f036-49e5-b569-297c17f45aee`:

1. `d2c84910-e97a-43d4-a71a-460c04837daf` implements keyed machinery, configuration,
   compiler sharing/invalidation, inheritance and checkpoint/type consumers. Files are the M0
   owners above plus a focused binding module and contract tests. Check all four consumer rows,
   parameter invalidation, conservative inheritance, validation and restore; existing native
   chemistry tests protect exact actions and accounts.
2. `a5fce6a0-a794-48ca-a654-392120380fc5` derives the exact fixture with shared production
   budgets and records it before stepping. Implement the zero-tick reproduction entry point
   alongside existing numerical harnesses. Failure to derive a viable square is a finding,
   not permission for a pilot search.

Initial implementation decisions: eight signed weights in [-1,1], bias in [-9,9] (the full
eight-bit score range plus one match margin), one world-wide lambda default3, and a relative
support cutoff1e-4. The bias mutation scale uses the domain transform9 times the common
scalar scale. These are fixed before ecological results. Persisted changes use physical v51
without migration. Keyed and radial alleles cannot mix in one diploid genome; reject the
ambiguous representation rather than invent a decoder. Zero membrane support has profile0.

### Fixed fixture derivation, before stepping

The 24x24 mesh2 periodic world receives a single uniform pulse of172.8 material each of0
and136 (0.3 concentration each), no reservoirs and no later input. Each founder begins with
the ordinary role-zero packet: bound mass1.66 (0:0.9025385417,128:0.7574614583), free mass0.8
(0:0.4349583333,128:0.3650416667), energy0.5 and zero damage. Matching shared founders uses
explicit accounted diagnostic interventions before observation. Position is(12,12), heading0.
The exact genotype, chemical table, resolved config and initial packets are archived by the
zero-tick command, not reconstructed from these rounded numbers.

Importer0 and enzyme0..3 physical genes are3; all other physical genes match founder1.
Expressed importer0 and each active enzyme have capacity0.1175221239 at mass1.66. The fixed
enzyme actions implement0->128->136->8->0. All recognition keys are identity locks
(target spins, bias-7), except generalist exporting transporters2/3 and membrane (zero weights,
bias9). Receptors lock the four circuit identities. Changing only importer0 weight0 and
weight4 from-1 to+1 selects locks0,128,8,136 forG00,G10,G01,G11 respectively. The corresponding
two chemical bits differ in the offered0/136 mixture.

The ordinary diagnostic reflex has all weights zero: output logits are-3 except swim/turn0,
repair3, importer0=3, transporter1=0 and enzyme0..3=3. Its realized requests are swim0,
repair1, transport[1,0.5,0,0], enzyme activity[1,1,1,1,0,0,0,0]. Learning and mutation are
frozen. These are paid ordinary requests, not an alternate controller in the tick loop.

At lambda3 a matched fuel affinity is0.95257413, one mismatch0.04742587 and two
mismatches0.00012339. The shared pump equation predicts import ceilings0.21765232 for
each endpoint and0.06508388 for each intermediate, against maintenance0.01098297 work/second
and import cost0.05 work/material. The actual initial retained context gives positive net
reaction yields3.75273 for0->128 and3.86596 for136->8 at unit illumination. Thus both endpoints
have plausible funded access, and each intermediate loses most of that access. This predicts
the four registered return inequalities only if those accessible reactions continue to fund
assembly after losses and composition changes; the probes can falsify that conditional chain.

The import-proportional analytical closure predicts processing surplus0.39335505 forG00,
0.02696791 for each intermediate, but **-0.13388804 forG11**. It replaces the retained mixture
with imported proportions and omits the four-route cycle, export and actual bound composition.
This is a negative competing prediction, not discarded evidence. Actual initial-context yields
make a short physical test justified; neither calculation establishes endpoint survival.
The added diagnostic explicitly labels both contexts. At lambda0.25 every recognition row
has256 members; at lambda3 each lock has37 and each generalist256. Lambda changes recognition
breadth and occupancy as well as the sigmoid slope.

The first budget entry failed before stepping because the abbreviated display frame lacks
inventory. The harness now reads the existing full inspect packet. Both the failed directory
and successful zero-tick reports remain ignored locally. No ecological tick was used to select
or repair the fixture. No parameter changes are allowed after this derivation.

### M1 execution expansion

Expansion `65d95fb6-ce75-4672-94de-283563ed185e`.

1. Extend existing Rust causal trace and `QuickObserver` with initial/living bound mass, free
   inventory and usable energy, plus exact bound stock in ten-tick frames. The existing observer
   invariance test covers division, reaction accounts and eventual death; add stock assertions
   and a conservative fission check. No physical update reads these observations.
2. Extend the numerical entry point with the fixed twelve-case panel and a strict report/gate.
   Calculate each return from Rust bound stock, retain transient returns, residual allowance and
   all existing flow channels. Missing/incomplete records cannot establish a square. Run zero-tick
   fixture tests first, then exactly the registered panel. This command uses the existing ledger,
   checkpoints and WASM captures. No extra ecological pilot is planned.

Before execution: each case return allowance is the maximum observed absolute material-account
residual divided by initial bound mass, floored at1e-9. Each pair uses the sum of its two
allowances. Account residuals must remain within1e-7 of initial plus supplied material/work
accounts; missing residuals or stocks fail reporting. A wall-capped case is incomplete, whereas
an extinct case has known zero living stock through the endpoint. Shared eligibility additionally
requires accepted import, conversion, captured work and a return above each matched empty
control outside its allowance. This stricter control check implements the registered paid-access
condition; it does not replace the four return inequalities.

Zero-tick budgets include SHA256 of each initial checkpoint. The probe command refuses a changed
kernel or changed initial checkpoint before stepping. Native conservative fission and observer
invariance checks and eight focused TypeScript fixture/observer/report tests pass. Next action:
execute the twelve registered cases once with the final budget archive. Execution completed:
ledger4464..4475,3600 world ticks, every case reached300. High-lambda returns are4.44578313,
0.21088588,0.20627168,2.10552150; all four required differences exceed2e-9. Low-lambdaG11
is worse than both intermediates, so that square fails. Every fed case exceeds its matched empty
control with accepted uptake, conversion and captured work; all accounting residuals pass.
Shared cases are eligible. No fixture tuning or ecological rerun occurred.

### M2 execution expansion

Expansion `97e1866c-7aae-433b-8bb4-a4a42b5f6b97`.

1. Finish the shared command's founder-label and stock/share reporting, then run exactly the
   two eligible eight-founder worlds for1000 ticks or their registered stop condition. Two cells
   of each genotype occupy(9,11),(11,11),(13,11),(15,11) and the sameX positions atY13.
   The second assignment rotates each row by two labels; resources and packets match. Read
   matched-time traces and accounted net returns, not only final cell counts.
2. Author `docs/rugged-binding-results.md` with conclusions, negative evidence and reproduction
   commands. Update this direction's scoped status and the plan index without consuming unrelated
   authored changes. Run native/server tests, Clippy, both WASM builds, browser build, frontend
   checks and documentation/storage checks as delivery work. Review final changes and close all
   execution plans after local delivery. No deployment or live-world action is included.

Shared execution completed, ledger4476..4477: both worlds reached1000, retaining all four
return inequalities. G11 biomass shares22.06%/25.91% qualify the positive return result;
no invasion or coexistence conclusion follows. Total registered execution is fourteen runs,
5600 world ticks and1.761 simulation/observation wall seconds. Authored interpretation and
commands are in [results](../rugged-binding-results.md).

Final local checks pass:404 Rust library tests plus server/integration suites, release Clippy,
Rust formatting, ESLint (20 existing warnings), Prettier, TypeScript, all89 frontend tests,
documentation links/storage policy and Terraform formatting. `make build` compiles both WASM
variants and the browser bundle; the native server release build also passes. The first full
`make ci` failed one current-producer Python contract assertion still expectingv50; that
assertion now expectsv51 and its affected three-test suite passes. Already-passing components
were retained rather than rerunning unchanged suites. No simulation rerun was needed.

Final review confirms generated artifacts and ledger stay ignored, existing unrelated authored
changes remain intact, ordinary radial startup is covered, and no branch, commit, push,
deployment or user-world operation occurred. Local delivery is complete; larger research
requirements remain in the direction rather than in unfinished execution phases.
