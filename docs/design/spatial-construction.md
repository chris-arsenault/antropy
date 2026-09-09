# Construction after the failed spatial review

Plan `4338355c-15f6-493d-8ddf-cfcf1c4fe698` follows the user's rejection of the
[previous repair](colony-repair.md). The queen moved toward the entrance, excavation made scattered
one-cell pockets, and storage accumulated at the nest throat. Colony survival and completed work
counts did not establish useful construction. Human visual review remains failed until a changed
trajectory is reviewed.

## Diagnosis

The default added 16 degrees to every existing cavity, putting the initial queen at 40 degrees.
The first queen job in run 2778 moved from y=292 to y=308. Solid soil retained its cooler initial
temperature, and the policy treated that temperature as the benefit of digging without considering
the resulting space. Work enumeration and worker-distance penalties allowed independent cuts
around the moving queen.

Run 2779 changes only the initial cavity heat to zero. The queen stays at her original position
through 2,000 ticks with zero excavation, but three cache relocations still move food upward.
The storage rule treated a moisture reduction of 0.2 as sufficient benefit regardless of hauling
distance. It did not consider temperature-dependent spoilage or retain access around storage.

## Correction and ownership

The normal default now starts without an artificial cavity heat load. The initial-heat setting
remains available for explicit assays. Surface heating, daily exchange, moisture transport,
physiology and spoilage remain active. A comfortable queen need not relocate to make a counter rise.

The interface derives floor adjacency, headroom, outdoor neighbors and connected floor segments
from timestamped site observations. Unknown neighbors do not count as open space. Connections
use observed material and support, starting at the known queen or caches; no authored chamber
label, hidden material, target depth or recommended destination enters these observations.
They are rebuilt per decision and require no remote climate update. Checkpoint v16 identifies
the expanded controller interface; the task byte and individual decision memory remain.

The seed uses those observations to:

- Count nursery capacity on connected floor with worker headroom, excluding queen, brood and food.
  Passing workers do not permanently consume a nursery slot. Nearby disconnected ledges do not
  count as nursery capacity.
- Extend adjoining floor under actual nursery/storage shortage, and clear headroom above that
  extension before counting it as usable. Soil cells still require separate local excavation and
  physical spoil transport. Excavation cannot infer future air temperature from solid temperature.
- Keep placement away from observed outdoor neighbors and preserve open space above occupants.
  New storage extends the connected floor around existing caches rather than following the nearest
  returning worker toward the entrance.
- Compare the temperature/moisture factors in the spoilage law with a distance-dependent
  relocation margin. This is an editable seed heuristic, not an environment-assigned task.
- Prefer observed outdoor spoil disposal; the material resolver still allows independently
  programmed alternatives.

These are erasable programmed/LGP decision rules. The environment does not impose chamber shapes,
pick sites or execute multi-cell work automatically. Global fitness, genetics and neural training
remain deferred.

## Verification

The original policy fails bounded cases for an isolated floor pit, a cool portal next to outdoor
cells and a long cache move with modest preservation benefit. The corrected policy passes them.
A separate case verifies that floor created below a solid ceiling remains unavailable until
headroom is cleared. Existing physical construction, feeding and persistence tests remain required.

Run 2780 checks the first correction through 4,000 ticks: the queen stays in her chamber, storage
remains in the lower nest, and two adults emerge. No excavation occurs. Inspection then finds that
the radius-based nursery count still includes disconnected ledges; the connected-floor correction
is measured separately. Run 2780's decision trace is empty because the new spatial observer
replaced the sole observer slot. Its world summaries remain valid. The observer API now retains
independent subscriptions, with a detach regression test.

Runs record each excavated cell, subsequent worker traversal, stored food on cut cells,
remaining usable floor, queen distance from the entrance and actual cache coordinates/contents.
These observations accompany the energy, feeding, death and replacement ledgers. The spatial
observer does not measure brood occupation of excavated cells.

Run 2781 checks the connected-floor seed through 4,000 ticks. It excavates one usable floor cell
beside the queen chamber, with subsequent worker traversal and food storage. Two adults emerge;
the queen stays at (1027,292), and all three caches occupy adjoining cells at y=294. LGP run 2782
matches its sampled series, action counts, jobs and spatial evidence exactly. The shared seed has
3,030 instructions over 143 observation inputs; there is no controller-specific construction path.

The actual browser runs from tick zero to 4,001 using only Run/Pause, with no settings changes,
imports or manual orders. It records one excavation and spoil disposal, two additional caches
and four brood relocations. The inspected screenshot places the queen in the bottom chamber,
food in the lower nest and no stockpile at the throat. Queen and cache relocation remain zero
under these comfortable conditions. They are not required merely to make counters rise.

Browser evidence is under
`frontend/harness/artifacts/spatial-repair-2026-09-08/final-browser/`.

## Completed 18,000-tick comparison

Runs 2783 and 2784 use seed 101 and identical configuration except excavation enabled/disabled.
Both retain normal mortality, laying, food productivity and climate. Neither has manual
construction interventions or task overrides. The current programmed run's first 17 snapshots
match LGP run 2782 exactly through tick 4,000.

| Outcome at tick 18,000 | Excavation enabled, 2783 | Excavation disabled, 2784 |
| --- | ---: | ---: |
| Living workers / adult births | 19 / 19 | 19 / 19 |
| Remaining founders | 0 | 0 |
| Age deaths / starvation / brood deaths | 8 / 0 / 0 | 8 / 0 / 0 |
| Queen reserve | 23.625 | 21.332 |
| Queen feeding / brood feeding | 61.625 / 142.943 | 59.332 / 138.788 |
| Stored food energy | 10.750 | 0 |
| Excavation / spoil disposal | 3 / 3 | 0 / 0 |
| Additional caches / cache relocations | 3 / 0 | 2 / 0 |
| Queen relocations / brood relocations | 0 / 21 | 0 / 21 |

Both queens remain at (1027,292), Manhattan distance 27 from the entrance. All caches remain
on the lower storage floor, y=294. The enabled run cuts (1028,292) and (1029,292) as adjoining
queen-floor extensions, then (1015,294) adjoining storage. All three retain support and headroom.
Workers traverse the first cut, and food occupies the first and third cuts during the run.
The second cut has no recorded worker traversal or stored food; brood occupation was not traced.
The new storage-floor cut completes at tick 13,238 and becomes a cache at tick 13,375.
This is small floor growth, not evidence of a new chamber network or reliable long-term expansion.

The control also survives and replaces its founders. Excavation produces additional usable space
and higher food reserves in this pair, but it is not demonstrated to be necessary for survival
at this population. This single seed and horizon do not certify tiered survival, broad map
generalization or the roughly 2,000-worker goal. Peak absolute energy residual is below 1.044e-8
in both runs.

The endpoint checkpoint is separately imported by an agent diagnostic into the same application
and renderer. Its inspected screenshot confirms the queen in the bottom chamber, lower storage
and no throat stockpile. This endpoint diagnostic is explicitly distinct from the Run-only browser
check; the user's default still starts at tick zero. Artifacts are under `final/`, `final-control/`,
`final-lgp/` and `endpoint-browser/` in the same artifact root.

`make ci` passes 190 tests in 53 files, lint, formatting, typechecking, documentation and Terraform
formatting. The production build passes. Existing optional-property and bundle-size warnings remain.
Human review of the changed trajectory is pending. A screenshot and counters do not substitute
for that review; genetics, neural training and population scaling have not advanced.
