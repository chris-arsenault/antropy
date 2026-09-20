# Phenotype and metabolic activity observation

The Web and Phenotypes windows answer different questions: which chemical conversions actually
ran recently, and how the cells occupying a chemical role or region differ from the population.
These views observe ordinary physical operations. They do not assign strategies, select parents,
alter inherited traits or supply controller inputs.

## Use

- **Web → Measured cellular flow** ranks accepted conversions by material per model second.
  Arrow widths use accepted amounts. Uptake and export list accepted transporter flow by chemical;
  they do not include material released by death. Primary and supported enzyme capability views
  remain available. Environmental pathways still show possibilities, not measured environmental flux.
- **Primary role** beside a Web route opens a comparison with cells whose strongest installed
  enzyme route matches that pair. A cell can execute other routes; this group is not the set of all
  contributors to the selected measured edge.
- **Phenotypes** compares the world, a selected primary role or spatial region, and one pinned
  descendant cohort. Tables show current built traits alongside inherited targets, local illumination,
  accepted material flow and recent work accounts per living-cell second. Traits show median and
  10th–90th percentiles. Membrane coordinate ranges are chart coordinates, not periodic distances.
- **Highlight selected group** adds outlines and dims other cells while preserving the selected
  cell-color and field mappings. Clear the highlight from the map without reopening the window.
- **Pin selected descendants** captures the complete selected group at that tick. Its descendants
  remain members through mutation, refitting and migration. An extinct cohort stays visible with
  zero living descendants. Remove a pin explicitly before replacing it.

The history chart tracks descendant count or a trait distribution. Pin samples use the existing
240-point chart history and thinning; they do not introduce a separate growing log. Save/export
retains pin identity, its original member IDs and those compact history samples. Restore rebuilds
membership from existing parentage. Recent activity starts fresh at restore, with its coverage
shown explicitly. Packages without optional pin/history data restore those observations empty when their physical
version is supported. This does not bypass physical checkpoint-version rejection.

## Measurement meaning and boundaries

Accepted reaction and transport commits feed an opt-in Rust observer. Windows cover 250 ticks;
the view displays the last completed interval, or the current partial interval until one completes.
Changing the selected group resets coverage. Window accounts include work by cells that died;
trait distributions and group counts describe current living cells. Start-of-tick installed role
and the latest 25-tick spatial census determine activity membership. Pin birth/death membership
updates during lifecycle processing.

Counter storage contains three aggregates, each with two bounded windows: world, selection and
pin. Route counters have 65,536 slots with touched-only clearing; transport has 256 input/output
counters. Closing measured views without a pin disables collection. A highlight alone does not
enable recording. A pin continues collection and compact history sampling while windows are closed.

The feature was introduced on physical v30. Current physical v32 still omits transient observer state. Rendering borrows the same
worker-owned WASM projection; an existing unused display lane carries selection membership.
Ordinary reduced replies retain the 16 KiB ceiling. Route pages contain at most 64 pairs, transport
tables eight species per direction with an explicit remainder, and original pin IDs travel only
in cold worker-local pages of 256. No member list reaches React. The existing observation delta
and backpressure protocol carries pin samples without retransmitting unchanged history.

The [delivery plan](plans/archive/PHENOTYPE-OBSERVATION-PLAN.md) registers bounded validation and cost checks.
The [results](evidence/digital-chemistry/phenotype-observation/README.md) record passing CI and
desktop/mobile save/restore checks. Closed-view throughput stays within 1% of baseline in the
registered loads; active observation costs about 9–12% at 2,000 cells.
These displays improve observation; neither measured conversions nor a changing trait chart alone
demonstrates producer-dependent feeding, adaptation or persistent coexistence.
