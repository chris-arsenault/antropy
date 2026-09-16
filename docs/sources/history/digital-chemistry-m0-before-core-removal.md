# M0 — Mathematical and numerical contract steps

Historical completed expansion. [ADR 0022](docs/adr/0022-computable-chemistry.md) and the
[computational foundation](docs/design/chemistry/computational-foundation.md) supersede this plan's
formula-selection authority. Its original steps, assertions and results below remain provenance,
not instructions to reproduce those equations in the replacement runtime. The root M0 milestone
has reopened for discrete operator selection and measured core feasibility. Its new pending
execution expansion is in the root plan; this completed child record remains historical.

Execution-ready expansion of **M0 — Close the mathematical and numerical contracts** in
[DIGITAL-CHEMISTRY-PLAN.md](DIGITAL-CHEMISTRY-PLAN.md). The accepted architecture is
[ADR 0021](docs/adr/0021-integrated-digital-chemistry.md). This expansion changes neither the
parent direction nor its division of responsibilities.

Root Sulion plan: `39f64047-90fd-456f-ba09-95ca79edf549`.
M0 is root position **1**, phase `128a9a97-0d18-4b60-ade2-f94e76b58f74`.
Execution branch: `c27a3d8b-e713-4f33-aeef-b456be3e8cc7`.
Prepared September 15, 2026 with `~/.claude/skills/plan-phase/SKILL.md`.
All eight steps were executed in order on September 15, 2026. The
[selected contract and evidence](docs/specs/digital-chemistry/validation.md) records each red/green
check and the passing `make ci` gate: 50 existing Rust tests, 22 new contract probes and 53
TypeScript tests; 13 existing nonblocking lint warnings. Production physics remains unchanged.
The step definitions below preserve the executed scope. M1 was not started.

## Scope and exit contract

M0 selects and specifies the actual mathematical model, derives its constraints, verifies small
algebraic cases and registers subsequent physical/performance checks. Its deliverable is one
mutually consistent contract covering all four laws and the complete cellular material cycle.
It includes concrete functions, units, admissible parameter ranges, numerical assumptions,
limiting cases and expected observable effects. An equation-shaped placeholder or a list of
unselected alternatives does not close a step.

The executor owns numerical and formula choices within the accepted direction. Field rank,
reference scales, constitutive curves and tolerances are engineering decisions to justify with
the checks below. No new user decision is needed to select them.

The production world remains on its current laws during M0. New executable work is limited to
bounded mathematical contract probes: scalar evaluations, a few compartments, small matrices,
finite differences and explicit accounting events. The probes contain no independent world,
controller, spatial population runner or alternate browser physics. Later integration uses these
selected laws through the sole Rust kernel.

Parent exit gate: `make ci` passes; the selected contract and testable predictions cover energetic
driving forces, mobility, finite engagement, transformation kinetics and funded life cycles with
no undefined energy source. M0 establishes mathematical readiness, not browser performance,
ordinary reproductive viability, human motion acceptance or evolved diversity.

## Re-derived source context

Current file bodies were inspected when expanding this phase. `sulion-code` returned no Rust
outlines, so direct source reads supplied the facts below. Re-read the named bodies before editing.

| Source | Current behavior relevant to M0 |
| --- | --- |
| [Config](engine/src/config.rs), [Chemistry](engine/src/chemistry.rs) | Physical and numerical constants live in `Config`, property ranges and generator coefficients; current validation checks four property surfaces and joint coverage. |
| [Ledger](engine/src/accounting.rs), [World](engine/src/world.rs) | Material, linear stored-potential energy and accumulated expenses close current accounts. `Ledger::heat` adds named expenses; this does not define nonideal free-energy or reservoir accounting. |
| [Field](engine/src/field.rs) | Stores amounts; concentrations divide by mesh area. Conservative Fickian face exchange uses impedance-modified mobility, diffusion-only substeps and uniform washout. |
| [Transport](engine/src/transport.rs) | Finite stock and hard saturation determine requests; a separate `4*pi*r*D*c` ceiling limits delivery before simultaneous shared-field allocation. |
| [Genetics](engine/src/genetics.rs), [metabolism](engine/src/metabolism.rs) | Compiled edges cache product ID and constant energy/heat. Actual mixtures limit substrates/capacity, but do not determine reversible reaction driving forces. |
| [Movement](engine/src/movement.rs), [organism](engine/src/organism.rs) | Paid motor power acts through drag and resistance; inventory contributes to cell volume. Angular noise and overlap correction can move bodies. |
| [Refitting](engine/src/refitting.rs), [sensing](engine/src/sensing.rs), [lifecycle](engine/src/lifecycle.rs) | Installed machinery changes atomically after payment; membrane susceptibility follows inherited parameters. Birth divides actual stocks, and death returns material locally. |
| [Economy](engine/src/economy.rs), [report](engine/src/economy_report.rs) | Analytical budgets use the current delivery formula and a conditional terminal-path closure. `economy::report` advances zero ticks; `resource-economy-check` is a separate organism assay. |
| [Capacity](frontend/harness/numerical/capacity.ts), [performance](frontend/harness/numerical/performance.ts) | Existing fixtures use 48/2,000/2,000-growth loads, all chemical channels, ten warmup ticks and 100 measured ticks with 60-second case caps. Timing includes render preparation but excludes actual GPU execution. |
| [Cargo](engine/Cargo.toml), [Makefile](Makefile) | Existing Rust crate can host ordinary integration tests with no new dependency, library export or runtime registration. `make ci` includes Cargo tests, built-WASM tests and documentation checks. |

## Planned artifact and verification conventions

The following paths are outputs to create during execution, not files asserted to exist now:

- `docs/specs/digital-chemistry/README.md`: index of the selected mathematical contract.
- `docs/specs/digital-chemistry/parameters.md`: units, parameter inventory and dispositions.
- `docs/specs/digital-chemistry/accounting.md`: material, stored energy, free energy and reservoirs.
- `docs/specs/digital-chemistry/interactions.md`: common functional, profiles and derivatives.
- `docs/specs/digital-chemistry/transport.md`: spatial, membrane and motor response.
- `docs/specs/digital-chemistry/machinery.md`: engagement, reversible kinetics and barriers.
- `docs/specs/digital-chemistry/lifecycle.md`: embodied work and installed-state continuity.
- `docs/specs/digital-chemistry/numerics.md`: discretization assumptions and cost/stability bounds.
- `docs/specs/digital-chemistry/validation.md`: registered probes, observed mathematical results
  and the M0 closure record.
- `engine/tests/chemistry_contract.rs` and explicitly referenced modules under
  `engine/tests/chemistry_contract/`: bounded mathematical probes, discovered by Cargo's existing
  integration-test convention. Wire modules with explicit paths; add no crate or dependency.

These are specification documents for the accepted feature. Existing runtime guides and accepted
ADRs remain unchanged. If selecting a law exposes a genuine additional architectural tradeoff,
record it in a new ADR using repo-docs; ordinary numerical selections belong with their derivation.

Every automated verification below names a planned Rust test group and its acceptance properties.
Add assertions before their supporting mathematical implementation. Missing target/functions are
valid greenfield red results; an already passing production suite is not the red result. Avoid
dummy implementations or intentionally damaging unrelated code to manufacture a failure.

Use finite-difference derivatives, independently summed accounts, analytic solutions and explicit
limiting cases as oracles. A test that merely repeats the selected expression does not validate it.
If a candidate violates an invariant, retain that negative result and select a corrected law within
the accepted architecture. Do not widen tolerances to hide a sign, unit or conservation defect.

The probe evaluator is test-only and mathematically small. As selected functions enter the runtime
in subsequent milestones, connect these invariant tests to the production owner and remove duplicate
candidate evaluators. Keep independent derivative/accounting checks. No persistent second model is
an outcome of M0.

For all test commands, first inspect `--list` output and confirm a nonzero matching test count.
Cargo reports success for an empty filter; that is not verification. Register tolerances from
scale, conditioning and truncation/roundoff analysis before comparing results.

## Ordered steps

### 1. Inventory physical parameters and accounting owners

- **File(s):** Create `docs/specs/digital-chemistry/README.md` and `parameters.md`. Read-only
  references: `engine/src/config.rs`, `chemistry.rs`, `field.rs`, `transport.rs`, `movement.rs`,
  `metabolism.rs`, `organism.rs`, `sensing.rs`, `refitting.rs`, `lifecycle.rs`, `world.rs` and
  `controller.rs`. Include hardcoded physical coefficients and field/body unit conventions,
  not only configuration keys.
- **Reference behavior:** The root plan's confirmed decisions and Context / reuse map govern
  identity, local control, physical coupling and parameter retirement. Numerical settings are
  revisable; the 48-founder/two-colony workload and immutable sharing boundary are explicit intent.
- **Change:** For each current physical parameter or law coefficient, record its source owner,
  meaning, units, consumers and one disposition: retained independent assumption, derived from a
  selected law, or retired with a named replacement owner. Classify environmental inputs,
  inherited/installed properties, numerical choices and operating limits separately. Mark physical
  obligations that cannot yet have a selected formula with the resolving step number. Describe the
  planned material compartments and common conventions at the index level.
- **Verify:** Execute a source-to-contract coverage review. Red is the absence of a complete owner
  map; green requires every physical `Config` field and inspected hardcoded physical coefficient
  to have a meaningful disposition and resolving owner. Cross-check consumers, not just matching
  strings. Examples that must be accounted include `movement_impedance`, `diffusion_impedance`,
  `transport_energy`, `conversion_efficiency`, `thermal_energy`, `construction_energy`, exposure
  coefficients, reference-energy ranges, the spherical delivery prefactor and both clocks.
  Record the reviewed source scope and any unresolved item explicitly. This is a manual semantic
  acceptance test; an automated prose-presence test would provide no useful evidence.

### 2. Define units, material states and reservoir books [depends on #1]

- **File(s):** Create `docs/specs/digital-chemistry/accounting.md`,
  `engine/tests/chemistry_contract.rs`, `engine/tests/chemistry_contract/support.rs` and
  `engine/tests/chemistry_contract/accounting.rs`; update `parameters.md` and the new spec index.
  The integration target explicitly includes its support/accounting modules. Keep the live
  `Ledger`, `World::held` and checkpoint format unchanged in this step.
- **Reference behavior:** ADR 0021 requires common energetic driving forces and explicit material,
  energy and reservoir ownership. Read current `Ledger::heat`, `World::held`, `Field::totals`,
  `reaction_energy` and `assembly_cost` to identify exactly what their linear books omit.
- **Change:** Select base units and the effective field measure, body-volume convention,
  concentration/activity references and usable-energy representation. Define stored energy,
  entropy/free energy, work, dissipation and surrounding-reservoir exchange with signed balance
  equations. Define chemical, intracellular, built, source and external-sink compartments. Give
  event-accounting rules for transfers and mixing, with placeholders resolved by the later named
  law steps rather than hidden energy terms. Establish only the minimal bounded algebraic test
  helpers needed to evaluate states and compare independently calculated balances.
- **Verify:** Run `cargo test --manifest-path engine/Cargo.toml --test chemistry_contract accounting::`.
  Red: the target and shared accounting contract do not exist. Green: checks cover unit-consistent
  amount/concentration conversion, internal transfer conservation, explicit source/sink boundaries,
  unchanged reference-energy content during ideal mixing, and distinct mixing free-energy versus
  heat/reservoir terms. No event may infer heat by blindly summing every free-energy decrease.

### 3. Close the shared interaction functional and derivatives [depends on #2]

- **File(s):** Create `docs/specs/digital-chemistry/interactions.md` and
  `engine/tests/chemistry_contract/interactions.rs`; extend the integration target/support module
  only as needed. Resolve the associated parameter rows and accounting terms.
- **Reference behavior:** The root plan selects a smooth finite-range symmetric interaction-energy
  family, compact chemical/cellular profiles and bounded crowding. Re-read current field amount
  and stencil conventions; existing impedance/stress reductions are not a force model.
- **Change:** Select the common free-energy functional and its admissible parameter domain.
  Specify chemical and cellular contributions, spatial-kernel normalization, periodic handling,
  cell-interface extent, self-interaction convention and a coercive crowding/repulsion term.
  Derive chemical potentials and cell forces from this same functional, including how internal
  state affects an exposed interface. Define activity consistently with the chosen reference
  state. State which profile components are energetic and which describe kinetic resistance or
  injury, so they are not counted twice. Record the selected rank and range with their physical
  and cost rationale; later tuning must preserve the validated properties.
- **Verify:** Run `cargo test --manifest-path engine/Cargo.toml --test chemistry_contract interactions::`.
  Red: the functional and derivative checks are absent. Green: finite differences agree with
  analytical amount and position derivatives; mixed derivatives satisfy the chosen symmetry;
  uniform translation preserves interaction energy; an isolated symmetric body has no numerical
  self-propulsion; zero coupling recovers the ideal-mixture limit. Check kernel normalization and
  the stated density bound using explicit small configurations and an analytical coercivity
  argument. Treat zero concentration through a consistent limiting/discrete rule; an arbitrary
  logarithm floor must not create material or harvestable work.

### 4. Close transport, membrane delivery and motion laws [depends on #3]

- **File(s):** Create `docs/specs/digital-chemistry/transport.md` and
  `engine/tests/chemistry_contract/transport.rs`; update integration-test wiring and relevant
  parameter/accounting rows. Read `Field::advance`, `transport::diffusive_supply`,
  `transport::exchange`, `movement::motor_limits`, `move_cells` and `resolve` as references.
- **Reference behavior:** Chemical flux follows mobility times concentration times the negative
  chemical-potential gradient. Motor effort is paid; field forces and cellular responses share
  interaction energy. Physical reach comes from material moving through space to a finite local
  membrane interface. Preserve fair shared allocation and accounted supply.
- **Change:** Select positive mobility and medium-resistance laws with explicit size dependence.
  Derive the diffusion limit and passive relaxation identity. Select one consistent near-cell
  exchange approximation joining resolved field delivery to finite membrane exchange, with a
  clear disposition for the independent `4*pi*r*D*c` cap. Define powered inward/outward transport,
  equal-potential behavior, empty inventories and energy exhaustion. Specify paid motor power,
  force response, contact constraints and thermal-motion conventions. Account physical work when
  interface position or composition changes. Define what is recomputed when a moving cell changes
  the field it sources; complete integration is a later milestone.
- **Verify:** Run `cargo test --manifest-path engine/Cargo.toml --test chemistry_contract transport::`.
  Red: the joint flux/membrane/motion contract has no verified implementation. Green: two-compartment
  exchange conserves matter; passive flux has the expected sign and zero at equal potential;
  the uncoupled limit recovers the selected diffusion law; downhill passive motion dissipates
  free energy under positive mobility; uphill pumping/motion cannot exceed funded work. Compare
  small serial transport resistances against an independently solved steady flux so delivery is
  neither counted twice nor bypassed. Check empty-material, zero-effort, depleted-energy and
  high-resistance limits without advancing organisms.

### 5. Close engagement and energy-coupled reaction kinetics [depends on #3]

- **File(s):** Create `docs/specs/digital-chemistry/machinery.md` and
  `engine/tests/chemistry_contract/machinery.rs`; update test wiring, parameter dispositions and
  accounting definitions. Read `genetics::Enzyme`, `Edge`, `compile_affinity`, receptor readings,
  transport request formation and `metabolism::react` as reference behavior.
- **Reference behavior:** Four fixed slots per machinery class share finite engagement and fixed
  recognition width. Installed stock supplies capacity. Unary transformations conserve material,
  nearby parameters retain overlapping capability, and barrier height changes kinetics while
  combined chemical/usable-energy state determines the driving force.
- **Change:** Select the activity/occupancy rule with a common finite denominator and specify its
  rapid-engagement approximation. Separate engagement capacity from material storage. Define
  continuous substrate/product parameters, normalized weights over discrete products, and
  accounting for each reversible channel. Select a symmetric activation-barrier rule and
  energy-coupling stoichiometry; derive forward/reverse tendency constraints including the usable
  reservoir. Bound concurrent requests by substrates, products, installed capacity, storage and
  available work without changing the thermodynamic direction. Identify immutable topology,
  affinity and barrier caches versus state-dependent driving forces. Calculate direct versus
  staged-path capacity costs under a few specified conditions.
- **Verify:** Run `cargo test --manifest-path engine/Cargo.toml --test chemistry_contract machinery::`.
  Red: no shared verified occupancy/reversible-kinetics contract exists. Green: nonnegative
  occupancy sums to at most one; a competing low-productivity substrate displaces useful
  processing; product/energy conditions can stall or reverse the permitted reaction; the
  forward/reverse relation matches the selected total driving force. Product weights sum to one
  and vary continuously at interior and reflected boundaries. Independently sum material/work
  around closed reaction cycles, including attraction–conversion–release cycles; no closed cycle
  produces net usable work without an accounted source. Increasing a barrier changes rates without
  changing equilibrium or adding an unexplained energy debit. Record any direct/staged-path
  comparison that fails the predicted conditional opportunity.

### 6. Close body, damage, remodeling and birth work [depends on #4] [depends on #5]

- **File(s):** Create `docs/specs/digital-chemistry/lifecycle.md` and
  `engine/tests/chemistry_contract/lifecycle.rs`; update accounting and parameter dispositions.
  Read `Cell::volume`, `metabolism::assemble/develop`, `refitting::attempt`, `sensing::injure`,
  birth/death/transfer operations and private-learning payment as references.
- **Reference behavior:** Generic biomass is assembled from any internal species using usable
  energy. Actual installed material and inherited instructions differ. Small mutations have
  continuous funded expression; cells retain useful machinery during remodeling. Membrane
  compatibility affects internal and external exposure. Birth passes actual stocks and damage.
- **Change:** Specify embodied energy and material conversion, repair/replacement, maintenance,
  learning, storage overflow and death/decomposition. Define bounded installed machinery and
  membrane state with gradual paid remodeling and a response law that remains continuous as a
  target mutation tends to zero. Specify material recycling, stalled remodeling, successive target
  changes and partition at birth; no unbounded queue of historical installed genotypes is implied.
  Account changes in body extent, field/interface energy, fission displacement and optional
  genetic transfer. Define damage's physiological meaning and the cost/energetic destination of
  repair without assuming that thermodynamics determines the injury rate.
- **Verify:** Run `cargo test --manifest-path engine/Cargo.toml --test chemistry_contract lifecycle::`.
  Red: the coupled body/interface accounting and continuous remodeling contract are absent.
  Green: explicit event sequences cover assimilation from low/high-reference-energy inventory,
  growth, repair, death and return to chemical inventory; independently summed material/work
  closes. Partitioning preserves actual stocks and state; no parent/daughter construction target
  grants new material. Zero work stalls installed change, and nearby target changes yield nearby
  funded responses. Membrane transitions obey the same payment/continuity principle. Include
  interaction-energy changes during interface growth and fission; later milestones test these
  same obligations through actual organisms.

### 7. Derive numerical stability and complete-workload budgets [depends on #4] [depends on #5] [depends on #6]

- **File(s):** Create `docs/specs/digital-chemistry/numerics.md` and
  `engine/tests/chemistry_contract/numerics.rs`; finalize relevant parameter dispositions.
  Read `World::step_measured`, `Field::advance`, `numeric.rs`, `capacity.ts`, `performance.ts`,
  the immutable sharing contract and current save/history limits. Existing runtime code remains
  a reference in M0; no performance or controller scheduling patch belongs in this step.
- **Reference behavior:** Positivity, accounting and useful physical responses constrain numerical
  approximation. The existing diffusion-only CFL and multirate invalidation rules are insufficient
  evidence for coupled drift and reactions. All 256 chemical channels, actual birth activity,
  learning, rendering and diagnostics belong in the complete performance envelope.
- **Change:** Select an initial conservative discretization family and derive admissible timestep
  conditions for diffusion, drift, crowding and reaction/exchange work. Specify zero-density handling,
  nonlinear field refresh, operator order, coupled demand allocation and precision/roundoff accounts.
  State how body/cell motion and chemistry clocks interact without stale driving forces. Estimate
  live and scratch memory, field passes, per-cell operator cost, substep cost and GPU upload budget
  as functions of nodes, 256 species, field rank and active population. Pin a reference workload,
  timestep and effective model-time rate; register the existing 48/2,000/2,000-growth fixture for
  later measurement. Classify existing measured artifacts by binary/configuration and timing scope;
  reuse a matching baseline or explicitly record its absence. Complete performance remains a later
  gate, not a speed claim inferred from arithmetic.
- **Verify:** Run `cargo test --manifest-path engine/Cargo.toml --test chemistry_contract numerics::`.
  Red: the new admissibility/error checks are absent. Green: a few explicit conservative exchanges
  preserve positivity, material and the selected passive dissipation property inside the derived
  bounds; a deliberately excessive step is rejected or demonstrably falls outside the bound.
  Refinement on a fixed tiny fixture reduces the expected discretization error without changing
  the direction of transport/work. Demonstrate the chosen rounding-account tolerance independently
  of the physical effect scale. Check memory/work estimates manually against current shapes:
  320 × 240 at mesh 2 is 19,200 nodes; one 256-channel float32 field is 19,660,800 bytes before
  scratch buffers. Compare ticks and model seconds explicitly. No GPU or ecological throughput
  claim can become green through this mathematical test.

### 8. Register discriminating proof points and hand off contracts [depends on #7]

- **File(s):** Create `docs/specs/digital-chemistry/validation.md` and
  `engine/tests/chemistry_contract/closure.rs`; complete the new specification index, parameter
  table and root M0 progress references. Read existing mechanism registrations and evidence limits
  before specifying new cases. Existing historical reports and runtime guides stay intact.
- **Reference behavior:** M0's exit requires one closed contract and testable predictions. The root
  plan separates mathematical consistency, physical opportunity, RNN expression, actual offspring
  accessibility, evolved outcomes and operational readiness. Acceptance does not require a
  prescribed community or a long evolutionary campaign.
- **Change:** Reconcile symbols and parameter domains across all contract documents. Record selected
  equations and numerical results, rejected candidates with their actual failing observations,
  assumptions, and applicability limits. Resolve every #1 placeholder or give it an explicit later
  calibration owner without leaving the mathematical law undefined. Register the smallest later
  probes for passive field response, coupled delivery/processing, actual paid remodeling, supplied
  and depleted life cycles, transit, differential exposure and contextual pathway value. Each case
  includes prediction, competing explanation, fixture, controls, learning/mutation settings,
  measured quantities, horizon, wall cap, stopping reason and decision it can change. Register
  complete workload and recovery measurements separately. Add a composite algebraic closure test
  spanning field interaction, import, conversion, assembly, paid interface change and release.
- **Verify:** Run `cargo test --manifest-path engine/Cargo.toml --test chemistry_contract closure::`,
  then the full integration target and `make ci`. Red for the new closure test is a missing combined
  contract or a balance failure when independently composing events; green requires conserved
  material, correctly sourced usable work and consistent final state energy across all four laws.
  Perform a semantic review of the completed source/parameter and event-accounting tables. Every
  test group must execute at least one test; all selected formula limits and unresolved risks need
  an explicit result or bounded later proof registration. Record counts and numerical results.
  Existing CI passing alone is insufficient to close M0.

## Execution budgets and evidence

Mathematical probes use deterministic cases with at most 16 compartments, 256 discrete species,
eight synthetic interfaces and fixed small sets of parameter points. Derivative checks compare
several predetermined perturbation sizes; they are numerical checks, not seed or ecology sweeps.
Keep the complete contract target below 30 seconds after compilation on this environment. If it
exceeds that budget, reduce repeated calculations or investigate the cost before extending it.

M0 registers organism and full-workload assays without running them merely to choose a formula.
An observed limitation requiring a different bounded mechanism test must first get its own stated
question and budget under the existing experiment policy. Registration does not silently authorize
an expanded population campaign.

All new tests run through the existing Cargo/CI path. Reuse its numerical dependencies; the initial
contract probes require only the standard library and already available crate types. No dependency
download, server launch, browser population run, source default change or persistence migration is
needed to prepare or execute this mathematical phase.

Store mathematical evidence in the new validation specification with exact test names and source
identity. Generated detailed data, if useful, belongs under a fresh local harness artifact path;
link a compact retained report when needed. Distinguish hand derivation, computed algebraic checks,
current-engine measurements and future acceptance targets.

## Decisions needing your input

None in the current M0 scope. The user already confirmed the four-law architecture and delegated
formula selection and numerical decisions. Human visual acceptance remains in the root plan's
handoff milestone. A genuinely new change to core identity or immutable sharing would be surfaced
as `[DECISION]`; a difficult derivation is work to complete, not a reason to ask for routine tuning.

## Completion and handoff

Run `~/.claude/skills/plan-phase/EXECUTE-PHASE.md` against this file to execute M0. Keep each of
the eight published steps current as its work proceeds. A multi-step blocking prerequisite gets
its own nested Sulion branch, following the repository's planning rules.

After all steps and the M0 exit gate actually pass, use `sulion plan return --completed` to close
the expansion and return to the root. Verify the root M0 status and mark it completed with the
specific contract/evidence record if return has not already done so. Preparing this expansion or
passing CI on its prose does not complete M0. Expand the next milestone only when it is requested
for execution.
