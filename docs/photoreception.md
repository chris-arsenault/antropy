# Funded local photoreception

## Design

One photoreceptor investment locus and actual body stock occupy index 15. Its reference
mass is the existing receptor ratio times core mass. The ordinary investment law, mutation,
inheritance, proportional assembly, maintenance, occupied area and death accounting apply.
Chemical machinery keeps its four existing receptor channels and their installed identities.

The optical stimulus is the single scalar illumination used by
the environment and display. V34 removes the former independent chemical light components;
the [light ecology design](design/light-ecology.md) records why. Sample the same body footprint and four perimeter
points as chemical receptors. For each sample, response is `gain * L / (1 + L)` where
`gain = photoreceptorStock / (photoreceptorStock + receptorRatio * coreStock)`.
Illumination is dimensionless with unit mean; its saturation reference is therefore one.
The shared receptor adaptation time produces recent change. No additional sensing radius,
direction oracle, temporal clock, harvesting process or response policy is introduced.

Inputs 39–42 are brightness, change, front-minus-back and left-minus-right; input 43 is
built photoreceptor stock relative to the inherited target. Existing input indices stay fixed.
The current controller has 56 inputs, 24 recurrent units and 38 outputs. At introduction, new founder weights started at
zero; mutation can connect the new cues to behavior. Sensing does not establish evolved use.
Photoreception introduced checkpoint v31; current physical semantics require v34.

## Verification registration

Question: can paid local light sensing reach ordinary neural actions, with no cue from an
unbuilt receptor and no change to the imposed illumination or chemical laws?

Mechanics checks cover zero stock, saturation, rotation of the body frame, periodic seams,
adaptation initialization/decay, funded growth and inheritance, and checkpoint continuation.
A short diagnostic assay uses a single cell, static learning, zero mutation/contact transfer,
fixed diagnostic RNN weights and a 300-tick ceiling. Compare funded and unbuilt receptors
and reversed neural response signs in otherwise matching worlds. Record local light,
input, action, displacement and motor expense; do not infer evolutionary adaptation or
fitness benefit. Stop on death or the horizon; no horizon extension or seed sweep.

Cost check reuses the existing fixed-load harness: seed 101, 48/2,000 cells, 10 warmup and 100
measured ticks, 60-second wall cap per load, observer closed. Compare saved pre-change WASM
with the new build. This checks added sensing/inference overhead, not long-run ecology.

## Original v31 results

Sulion plan `95a342c0-2fe5-4003-b6d9-83d0eb19c798` tracks the completed implementation.
Five Rust tests cover funded sensitivity, rotation/seams, opposite neural responses,
paid construction and inheritance, and checkpoint continuation/validation. The existing
application navigation test checks the visible photoreceptor readings and stock labels.
`make ci` passes: 153 Rust unit tests, 17 integration tests and 66 Vitest tests;
17 existing lint warnings remain. The first CI attempt found the Python evolution report's
version allowlist still stopped at v30; it now accepts v31 and its producer contract passes.

The four registered probes used seed 27 in a 24×24 world, one cell at (7.4, 9.2), heading
zero, zero sources, no import effort, static learning, zero mutation and zero contact transfer.
The RNN had swim bias .08 and one left-minus-right light input connected to turning with
gain +16 or −16. The unbuilt control set physical locus 15 to −1; the uniform control used
illumination contrast zero. Fixture assembly preserved the shared material packet and paid
construction. The default metabolic/body rules remained active.

At tick 10, the positive connection received −.01197 and turned −.18950; the negative
connection received −.00573 and turned +.09148. Their headings at tick 80 were 3.8689 and
.3281 radians, respectively. Both controls retained heading zero. The unbuilt control's
optical inputs remained zero; uniform light produced a tonic response .25 and directional
differences no larger than floating-point roundoff. These results establish sensory access
and ordinary controller expression, not evolved behavior or a fitness advantage.

All four finite-reserve probes ended on extinction before the 300-tick ceiling: toward at
91, away/unbuilt at 87, uniform at 99. None imported material. Motor expense was .00507,
.00231, .00216 and .00246 respectively; maintenance and construction consumed most work.
No longer follow-up was run. Worst accounting residual was below 6e-14% of supplied-plus-
initial material/energy. Ledger rows 4209–4212 and the retained results preserve the outcomes:
[toward](evidence/digital-chemistry/photoreception/toward.json),
[away](evidence/digital-chemistry/photoreception/away.json),
[unbuilt](evidence/digital-chemistry/photoreception/unbuilt.json),
[uniform](evidence/digital-chemistry/photoreception/uniform.json).

| Fixed population | Before ticks/s | Photoreception ticks/s | Throughput decrease |
| --- | ---: | ---: | ---: |
| 48 | 85.01 | 83.41 | 1.9% |
| 2,000 | 36.82 | 36.68 | 0.4% |

These are single short samples, including census, inspection and packed render preparation,
without GPU execution. They establish bounded cost, not a precise long-run regression estimate.
The 2,000-cell WASM high-water allocation increased from 242,417,664 to 245,366,784 bytes.
Ledger rows 4207–4208/4213–4214 retain the
[before](evidence/digital-chemistry/photoreception/before-cost.json) and
[after](evidence/digital-chemistry/photoreception/after-cost.json) reports with binary hashes.
Full checkpoints, engine binaries and traces remain local in
`frontend/harness/artifacts/photoreception/`. Uniform checks and the 24-unit diagnostic world
do not establish that every light cue is strong enough to evolve a useful response at the
default 320×240 scale; body-scale gradients naturally weaken as the illumination varies
over longer distances. Tonic and temporal inputs remain available.

## Viewing and rerunning

Start a new world with the rebuilt local application. Selecting a cell shows photoreceptor
readings directly, with all five inputs under **Local inputs and private recurrent state**.
**Funded body and inherited genes** shows built stock separately from its newborn target.
The population's developed-body table includes photoreceptor investment. This feature introduced physical v31. Current v34 accepts its own body/controller and habitat
state; older physical versions are rejected rather than migrated or reseeded.

From `frontend`, rerun the registered probes with a new output directory:

```bash
pnpm exec tsx harness/numerical/photoreception.ts harness/artifacts/photoreception-new
```
