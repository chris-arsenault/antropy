# Numerical engine migration and retirement

September 14, 2026. This records the Rust/WASM cutover under plan
`cad67253-df16-4762-9c69-ec1a9121130b`. The previous [migration audit](migration-audit.md)
records the earlier TypeScript chemistry implementation and its evidence. Reusing an experiment
question does not repeat or re-certify its historical result.

The [diagnostic continuity correction](diagnostic-continuity.md) supersedes this audit's implication
that category-level data migration preserved every display. Genealogy charts and navigation are
restored. The [reliability revision](reliability-results.md) adds the missing aggregate and history
views, repairs the evolution stream reader, and records browser acceptance separately.

## Runtime responsibilities

| Previous responsibility | Current owner or explicit disposition |
| --- | --- |
| TypeScript physical kernel, Map mixtures and sparse 8×8 field blocks | Removed. `engine/src/` is the sole physical implementation; dense float32 field allocation is bounded by mesh geometry. |
| Gaussian affinity and squared non-core investment response | Replaced by compact smooth affinity and linear nonnegative investment. Original numeric trajectories are not preserved. |
| Numerical abundance cutoff and clone-based 128-cell benchmark | Retired. No concentration cutoff; registered varied 48/2000/2000-growth loads include all 256 channels, observation and rendering preparation. |
| Single-rate RNN/chemistry | Persisted multirate clock: movement 0.2 seconds, physiology/inference 0.8. Finer interval/mesh probes retain supplied-growth direction, with sensitivity recorded. |
| A/B, named toxins/matrix, light cycle, binding, prey reward and reserve sharing | No restored paths. Sources, unary chemistry, compatibility, export/import and death release supply supported opportunities. Binding and nonchemical energy remain deferred. |
| Complete cell lifecycle and evolutionary policies | Rust paid growth/fission/budding, clonal/selfing/haploid/diploid, mutation, private learning and birth-local assimilation. Mutation and optional whole-slot transfer retain installed identity until paid refitting is affordable. |
| DOM-free simulation boundary | Rust crate contains no React/DOM. Browser and headless runners load the same WASM. |
| Main-thread Canvas and direct mutable world access | Removed. OffscreenCanvas/WebGL2 borrows packed WASM views in the same worker. Only reduced status and explicit inspection cross to React. GPU uploads still transfer bytes. |
| V9 JSON, block codecs and compact-page checkpoint implementation | Removed. Strict v11 postcard physical bytes and version-11 gzip browser observation package; no earlier-save adapter. Existing older IndexedDB stores are untouched. |
| Parentage, override retention and exact continuation | Compact complete ancestry; strict body/ancestry consistency; last 512 ordinary events plus 4,096 durable manual interventions. Exact restore includes mid-physiology clocks. |
| Recovery and observation histories | Six automatic/two manual saves, serialized cold operations, transactional failure retention, paused restore; 240 thinned samples, 81 recent behavior samples and 2,048 recent spatial events. Local failure breadcrumbs and execution provenance remain independent of physics. |
| Browser three-centre strategy panel | Retired as a default interpretive grouping. Membrane distribution, trait histograms, ancestry/family tables and spatial histories remain. Explicit k-means partitions remain available to the invasion harness. |

Removed directories are `frontend/src/sim/`, `frontend/src/observe/`, and their coupled old
UI/persistence implementations. Retained outer helpers are `ui/pacing.ts`, `persist/identity.ts`
and `persist/recoveryPolicy.ts`. New application owners live in `frontend/src/engine/`.
The old implementation is available in Git history, not as executable compatibility code.

## Experiment and reporting consumers

| Consumer | Current behavior |
| --- | --- |
| `bacteria`, `populationRun`, `evolve` | Sole WASM world, actual 48-founder default, explicit mutation/learning policies, streamed population/genotype observations, source and executable provenance. Longer runs require a registration. |
| `bacteria-capacity`, `chemistry-performance` | Fixed varied capacity loads or actual saved/default state. No population reduction or cloned-genotype proxy. Save/restore is measured separately from stepping. |
| `continuation-check` | Browser package codec plus 100k/2M synthetic parentage, empty/patchy/widespread/dense fields and default startup; exact three-step continuation. Synthetic history is not an evolved population. |
| Food access, spatial probes and viability | Finite pulses or actual isolated default sources, authored ordinary RNNs, resident/transit/empty controls and applied costs. A compatibility intervention is labeled separately from an ordinary founder. |
| Capability screens/follow-ups/pilots | Common founder bodies or explicitly paid mature targets; whole machinery/target reversion, recurrence and learning ablations; saved checkpoint/candidate/ancestor inputs and fixed budgets. |
| Production/compatibility and family chemistry (`rps`) | Generic costly synthesis/export and membrane compatibility. Labels describe authored fixtures; no cyclic dominance is presumed. |
| Source zones and invasion | Explicit mixtures over chemical IDs; frozen inherited comparisons with common funded bodies and rare-start denominators. Invasion rejects fewer than two occupied descriptive clusters. |
| Epochs and pre/post cohorts | Finite source composition epochs, same physical chemistry, 24 individual-weighted draws per cohort, swapped assignment and private RNG for sampling. Descendants retain initial cohort membership through founder ancestry. |
| Ancestor/descendant comparison | Exact source checkpoint/genotype hashes, explicit or median representative, common bodies and swapped assignment. Missing pruned ancestry-genotype payloads fail clearly. The old arbitrary persistent/transient `--regime` loop is retired. |
| Chemical opportunities and analytical atlas | Rust-owned law/property analysis and constructed cross-feeding, emission, exposure, detox, corpse, barrier and degradation fixtures. TypeScript contains orchestration, not a second set of physical laws. |
| Study resume/counterfactual | Exact current source restoration; private state reset in both arms; selected inherited replacement follows ordinary paid refitting while retaining installed stock. No material grant. Injury/impedance ablations are explicit policy events. |
| Scheduled resource and motor study | Independent experimental source calendar supplies accounted finite sources; actual geometry and ordinary source expiry/renewal mechanisms. No route or future schedule enters RNNs. |
| Diagnostic knock-in/reversion catalogs | `study_variants.py` invokes WASM through TypeScript. Appends explicit diagnostic genomes and provenance without relabeling observed cells; writes current binary catalogs. |
| Quick/capability/RPS/population/evolution/epoch reports | Schema dispatch reads v3 typed observations and binary provenance. The evolution reader now consumes actual `samples.jsonl` and inherited genotype facts, with descriptive frequencies and chemical trait history. Historical readers remain read-only; mixed physical schemas are rejected. |
| Study/strategy SQL and reports | V3 tables include species/product flows, actual lifecycle, exposure and developed bodies. Slowed area uses world-area denominators. Local DuckDB import is transactional and rejects mixed schemas. |
| Batch scripts | Explicit seed/horizon/wall/registration inputs; registration passed to the long-run gate. No implicit campaign expansion. |
| `chemistry_fidelity.py` | Historical v9 quantization reader only. Its quantization sweep is OBE; v10 uses same-law interval/mesh sensitivity and exact binary continuation checks. |

All generated current evidence archives the loaded WASM binary. Population and study runners
stream observations; short quick probes retain sparse mixtures and local state without duplicating
full private RNN traces into every frame. Initial/final binaries retain exact physical state.
Diagnostic genomes never replace browser founders automatically.

## Verification scope

Rust invariants cover conservation, shared uptake, physical space, local mutation, funded birth,
learning, retooling, optional policies and exact continuation. New boundary tests retain the
old requirements for override durability, missing living bodies and inconsistent parentage.
TypeScript integration covers borrowed views, worker failures, independent controls, periodic
grouping, merge/split/founding/dissolution, camera bounds, recovery retention and failed writes.
Not every old implementation-specific assertion is retained: JSON/block layout, quantization and
the retired renderer are deliberately replaced.

Small command/report checks validate migrated artifact consumers. They do not repeat old campaigns
or establish new evolved advantages. Integrated performance and storage evidence belongs in
[numerical results](numerical-results.md). Human motion acceptance, GPU behavior on the user's
device, colonization, sustained diversity and days/weeks endurance remain unverified.
