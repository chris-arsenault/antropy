# Genetic physiology without machinery construction

September 28, 2026. Authorized local implementation; publication and live-world reset are not
part of this request. Sulion root: `ea4b2307-f92a-4600-8c52-44c9e3071f4e`.

## Outcome and governing decision

Genes specify physiology directly. The controller operates that physiology; it does not
construct or retire capabilities. Continuous traits remain continuous. The user rejected
construction and equipment ownership costs as substitutes for physical tradeoffs. This
supersedes the machinery-development requirements in the earlier funded-body design.

The body has one authoritative biomass mixture, retaining chemical identities for material
and energy accounting. For inherited reference body vector b, B=sum(b), and actual biomass M:

`p_i = b_i / B; body_i = M * p_i`.

The component vector is a derived projection, not separately persisted inventory. The same
projection is used for sensing, motor power, transport, enzymes, optics, storage and energy
capacity. Zero genetic components are exactly absent. Genes retain the current continuous
expression and mutation operators. At fixed biomass, components share physical capacity;
increasing one changes the available proportions of the others. This is not a discrete point
allowance or a new per-feature penalty.

Automatic growth transfers free material into biomass and pays uniform growth work. The
increment is limited by the deficit to twice the genetic reference mass, whole-body growth
rate, free material above the existing protected reserve, and available energy above the
existing action reserve. All capacities grow proportionally. Basal metabolism is proportional
to total biomass plus the existing controller cost; remove category-specific ownership taxes.
Movement drag, action work, damage, repair, chemistry and optical environment keep their
ordinary equations. No new efficiency bonus, climate mechanism or ecological target is added.

Division requires twice the genetic reference biomass and the existing daughter reserves.
Both offspring receive half the actual biomass, free mixture and energy; their own genotype
immediately determines physiology. Budding halves the parent's biomass and refreshes its
projection too. Birth-local program duplication/deletion changes genes, never inventories.
Mutation cannot create matter or usable energy. New capacities may be smaller than inherited
inventories; ordinary headroom and overflow handling apply, without deleting material.

## Integration and evidence

Reuse `organism`, `genetics`, `metabolism`, `lifecycle`, `accounting`, the existing controller
ports, checkpoint codec, observation projections and harness. Remove `organization::remodel`,
construction/retirement controller outputs, and per-component development state. Keep biomass
growth visible with correctly named flows. Update current documentation and agent guidance;
historical experiments remain version-specific evidence.

Checkpoints advance from v42 to v43 without migration. Derived bodies reconstruct from the
genotype and biomass on restore. Local and native server share this path. No running world is
reset, stepped or deployed by this task. Full fields and private populations stay Rust-owned.

## Milestones

- M0: model and integration contract. Accept when ownership, equations, consumers and validation
  are explicit. Evidence: current source and the user's correction, not earlier design labels.
- M1 [depends on M0]: kernel, inheritance and persistence. Accept when newborns immediately
  express genetics, growth preserves proportions, division conserves matter/work, construction
  controls are absent and current checkpoints round-trip. Evidence: focused Rust tests.
- M2 [depends on M1]: observation and delivery validation. Accept when UI/harness describe
  genetic physiology and biomass growth, current governing docs agree, bounded real-kernel
  checks establish immediate motor expression and resource bounds, and `make ci` passes.
  No long evolution campaign or claim that dispersal is guaranteed.

## Current state

M0, M1 and M2 complete locally. M1 expansion: `f084f2f5-8928-4872-bdbc-5085dc5c8965`.

### M1 execution

1. Replace development and controller state. Files: `organism`, new `physiology`, `genetics`,
   `metabolism`, `lifecycle`, `accounting`, controller and checkpoint code. Remove independent
   development, derive body from genotype and biomass, remove ownership charges and ports.
   Verify by compilation and the focused behavioral checks in step 2. Complete.
2. Kernel contracts and checkpoint verification [depends on 1]. Update fixture consumers and
   obsolete development tests. Check proportional growth, immediate mutated motor expression,
   zero traits, repeated division, material/work accounting, action bounds and restore.
   Evidence: 332 kernel, 15 server and 17 definition tests passed; examples compiled. One
   ignored server operating test remains outside this local task. Derived floating-point
   body values use tolerance; persisted mixtures and accounting remain checked.

### M2 execution

Expansion: `8b921bc2-9c3b-4566-96a7-f83d74abc8c7`.

1. Observation and contract integration. Files: selected-cell and phenotype UI, flow types,
   diagnostic harness consumers, current math/controller/body docs, agent guide and changelog.
   Replace construction reports with biomass growth, remove obsolete actions and update
   analytical upkeep. Keep old measured evidence explicitly historical. Complete.
2. Integrated verification and review [depends on 1]. Run `make ci`, check kernel physical
   action behavior and projection/persistence boundaries, inspect the full diff and record
   evidence. No live reset, deployment, commit or push is included. Complete.

### Final verification and limits

`make ci` passed: 332 kernel tests, 15 native-server tests, 17 chemical-definition tests and
81 Vitest tests. The registered server publication benchmark remains ignored. Release Clippy,
TypeScript, formatting, serial/threaded WASM builds, documentation links/indexes, experiment
storage policy and Terraform formatting passed. ESLint reports 19 existing warnings and no
errors; the threaded compiler retains its existing unstable-atomics warning.

Focused kernel checks exercise immediate genetic motor capacity through ordinary paid movement,
exact absence for a zero trait, bounded proportional growth, mutated births in both division
modes, five repeated divisions without capability dilution, equal basal cost at equal biomass,
and reconstruction of derived capacities from checkpoints. UI and harness integration checks
cover the revised actions, flows and v43 producer/reader contract. Integration failures exposed
an old reader version list, exact comparison of derived floating-point capacities and an absent
documentation index entry; all were corrected before the final passing run.

These checks establish the implemented mechanism and accounts. They do not establish evolved
dispersal, long-run coexistence, visible motion quality or a new performance envelope. No live
world was stepped, reset or deployed. V43 requires a new world when deployed; earlier physical
checkpoints are rejected without migration.
