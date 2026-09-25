# Light ecology implementation checks

September 25, 2026. Physical v42. These are constructed mechanism checks, not evolved
strategies or evidence of sustained coexistence. The
[plan registration](plans/LIGHT-ECOLOGY-PLAN.md#m4-execution) defines the questions and limits.

## Mechanics

Canonical terrain attenuation and optional clipping compose before interpolation. A funded
film column attenuates the cell plane while its own exposed material receives the column
average. A single chemical-table coefficient bound limits captured emitted work for every
recipient; sunlight remains external. Focused Rust checks cover contention, chemical identity,
material/work closure, restore between optical intervals, and observation purity. Public
chemistry stops in darkness, including downhill public conversions. Intracellular enzyme
kinetics retain their existing law. Ordinary funded photoreception and RNN outputs can gate
activity and emission with opposite responses to the same light reading.

The two added stock inputs exposed an old dense-neural assumption that input counts divide
by four. The contraction now handles remaining lanes in both native and WASM paths. This
keeps 58 real inputs instead of padding the controller with invented sensory channels.

## Bounded causal probes

The existing QuickScenario runner executed six probes, then four specifically registered
follow-ups after inspecting the initial results. All use seed 27, frozen mutation and learning,
ordinary inference and physical stepping, a 300-tick ceiling and a 30-second wall cap per case.
They stopped on finite-reserve extinction before their ceilings. Complete configurations,
initial and final checkpoints, source/binary hashes, traces and resource-flow records remain
local in `frontend/harness/artifacts/light-ecology-v42/`. Ledger rows are 4349–4358.

- **Terrain response:** opposite sensory connections produced opposite turns and divergence
  toward higher versus lower sensed illumination. Both paid motor work and depleted their
  initial reserves. This establishes local sensory agency, not a migration payoff.
- **Baseline builder:** construction transferred about 0.0216 material, but its small
  footprint/species deposits were removed by the existing public-material cutoff. They did
  not accumulate into shelter. This is a numerical participation limitation, not washout,
  metabolism or evidence that a thin film is physically unstable.
- **Funded higher-capacity builder:** setting the common builder locus to 3 gives four times
  baseline stock, paid from the same initial packet. Cover accumulated and reduced the
  ordinary light reading; about 0.026 material remained as film at extinction. It did not
  improve survival relative to its matched idle control. No rate or cutoff was tuned.
- **Emitter and receiver:** emission raised the receiver's light reading. The initial
  collinear fixture had zero transverse contrast and could not establish turning. Moving
  only the receiver off-axis produced an actual transverse cue and a corresponding paid
  turn, absent with emission disabled. The effect was small. Aggregate recovered optical
  work was far below emitter expenditure; this was not a profitable energy loop.

These fixtures provide no positive whole-cell shelter or lamp payback result. They support
the implementation's physical and controller opportunities while leaving ecological value
open. In particular, default isolated builders do not accumulate film at the current material
resolution; collective deposition or higher investment can cross that boundary. That does
not establish that evolution will find or retain either strategy. Do not hide this result by
extending horizons, changing seeds, increasing rates or reducing cutoffs without a new question.

Reproduce into new directories after `make engine-build`:

```sh
cd frontend
pnpm exec tsx harness/numerical/lightEcology.ts harness/artifacts/light-ecology-v42-recheck/probes
pnpm exec tsx harness/numerical/lightEcology.ts harness/artifacts/light-ecology-v42-recheck/followup followup
```

## Operating cost and continuation

The first operating run stopped at the harness's exact future-byte comparison after
restoring tick 110. Saved physical state round-tripped exactly. A causal native check rebuilt
only derived owners on an unserialized clone; its next cell positions/headings matched the
restored world exactly. The continuing warm world's maximum displacement difference was
0.00015631 world units, versus the existing 0.2-unit footprint refresh distance at mesh 2.
Prepared motion/medium coefficients intentionally retain numerical anchors; those caches
were already omitted from checkpoints before v42. This is not lost physical inventory or
new light-state corruption. No physical threshold or cache persistence was changed.

The storage harness now retains exact initial round-trip validation, reports future byte
equality as a measurement, and validates material/work accounts on both three-tick
continuations. Exact replay is explicitly outside the scaling contract. The failed first
run remains in its local `cost` directory; one retry uses `cost-validated` after this
diagnosed harness correction. This is not evidence of indefinite numerical agreement.

The registered retry completed all three cases at their 100 measured ticks (20 model
seconds), after ten warmup ticks. Serial WASM, seed 101, 720×540 at mesh 2, ordinary census,
inspection and packed render preparation; ledger rows 4359–4361. No GPU execution is timed.

| Workload | Ticks/s | Model seconds / wall second | Save size | Save / restore |
| --- | ---: | ---: | ---: | ---: |
| Default startup, 48 cells and 240 reservoirs | 61.6 | 12.32 | 22.6 MiB | 91 / 150 ms |
| Distributed 2,000 cells | 27.0 | 5.40 | 64.7 MiB | 85 / 174 ms |
| 96 dense cells, eight programs, full-map film | 26.8 | 5.35 | 103.3 MiB | 181 / 379 ms |

Both larger loads miss the 30-tick/s target. Physics stepping consumed 94–96% of the timed
intervals; packed render preparation consumed about 54, 103 and 144 ms across each case.
The measurement is an operating envelope, not a before/after speed comparison or a native
multicore certification. No additional tuning campaign followed.

Startup retained 48 cells, no film and no emitters. The distributed case ended with 1,982
cells, 934 last-paid emitters and 36,860 illuminated nodes, but no retained film. Its empty
film owner retained about 121 MiB of allocated regional capacity after transient deposits;
empty current support therefore does not imply negligible allocator memory. The stress
case retained all 97,200 film nodes, about 34,694 material, and only six living cells. Its
last optical boundary recorded nine emitters before subsequent deaths. It does not establish
a viable high-cover habitat or sustained 96-cell cost.

WASM linear memory after each save/restore was approximately 298, 906 and 1,194 MiB. These
are successive capacities of the same reused module, measured with original and restored
worlds present; they are not per-world resident-memory measurements. All saves stayed below
the 192 MiB raw-checkpoint limit. Physical round-trip equality and both continuation accounts
passed. Future byte equality was false in all three cases, consistent with the diagnosed
derived-cache distinction; long-term trajectory agreement remains untested.

Final `make ci` passed: 317 engine tests, 15 server tests (one registered benchmark ignored),
17 integration tests, 79 Vitest tests, the Python reader check and repository validation.
The existing 19 ESLint warnings and WASM atomics warning remain. Projection and observation
checks pass; visible motion and shelter/emission legibility still require human review.
The existing live v41 checkpoint has not been replaced or migrated. The server's current
startup policy starts a new seed when no compatible checkpoint exists, so publishing v42
requires an explicit continuing-world cutover decision.
