# Bound chemical material through the body cycle

September 17, 2026. Checkpoint v20 replaces the v19 compulsory body/repair output.
The [physical coupling correction](physical-coupling-correction.md) remains the reference for
mass-scaled work, capacity-scaled reserves and funded motor effort. Its fixed decomposition
accounting is superseded here.

## Question and selected rule

Does preserving the chemical identity of built material remove the compulsory return to #186
without creating work, granting capabilities or making the composed workload unaffordable?
The saved v18 50k run returned 10,214.12 units of body material as #186, compared with 2,760.85
units produced by enzymes. These are gross flows, including recirculated material. They do not
predict a corresponding reduction in standing #186 after this correction.

Each cell owns one bound mixture B alongside free inventory I. The fifteen funded body stocks
still determine capabilities; sum(B) equals their total mass. There are no new genes or controls.
Founders retain their explicitly supplied decomposition-species body material. Descendants inherit
actual mixtures; no birth resets their composition to the founder condition.

- Growth moves q I/sum(I) into B and pays q times the existing assembly-work constant.
- Repair exchanges equal amounts from the two frozen mixtures. For replacement q,
  I' = I - q I/sum(I) + q B/sum(B), and B' takes the opposite changes. Replacement is bounded
  by available inventory, bound mass and funded work. Returned material cannot fund that same repair.
- Fission and budding split B with the funded stocks. Death releases I+B locally.
- Bound reference value is B dot U. Transfers preserve that value and grant no usable work.
  Assembly and repair expenses become heat. Chemical processing retains its existing paid laws.
- Diagnostic resizing preserves bound proportions and explicitly accounts for grants/removals.
  A supplied diagnostic mixture must match funded mass. Mature fixtures return actual surplus
  material and pay ordinary assembly for replacements.

Checkpoint v20 persists B and validates its mass against the funded stocks. Earlier physical
checkpoints fail explicitly. Genotypes, mutation, field weathering and source rules are unchanged.
The same Rust owner and borrowed worker rendering remain in place; only selected-cell inspection
includes the additional mixture. No population or field copies are added to browser rendering.

## Cost and bounded verification registration

B reuses the owned 256-channel mixture and cached material total. It adds 2,048 bytes of numeric
amounts per cell, plus the vector header and cached reduction. Growth/repair update it only when
funded material moves; birth/death process their actual mixtures. No additional geographic field,
per-tick projection or per-species controller input is introduced.

Competing explanations are a universal body-return rule and ordinary evolved metabolic production.
Deterministic mixed-input growth/death and repeated-repair checks isolate the former. They check
every chemical, paid work, both reproductive modes, malformed bound mass and exact continuation.
They do not claim ecological diversity or waste-consumer evolution.

Run the existing capacity panel once on the retained v19 WASM and once on v20: 48, 2,000 and
2,000-growth fixtures, ten warmup ticks and at most 100 measured ticks/60 wall seconds per case.
Include census, selected inspection, five-layer render preparation, save/restore and continuation.
Record operating throughput, checkpoint size and WASM memory; GPU execution remains excluded.
The acceptance floor is 30 ticks/second on the composed workloads. No horizon or seed expansion.

Run one seed27 v20 startup for 600 ticks with a 120-second wall cap, using the ordinary controller,
mutation and learning settings. This checks integrated execution and accounting, not adaptation.
Use the existing v19 startup as historical context, not a paired ecological comparison. Stop at
the declared horizon, terminal outcome or wall cap. A failure requires diagnosis, not a longer run.

## Results

`make ci` passes: 104 Rust tests and 60 Vitest tests, including immutable ownership and
bounded observation guards. Thirteen existing lint warnings remain. The four added Rust checks
cover mixed construction/death, repeated paid repair, both division modes and v20 continuation
with malformed-bound-mass/old-schema rejection. No chemical IDs are created by those transfers.

The initial v19 capacity panel (ledger 3992–3994) overlapped compilation and is excluded from
the comparison. A single repeat with the captured old kernel, after builds finished, isolates
that execution confound; it adds no horizon or seed coverage. The harness can now accept a loaded
kernel for this comparison without replacing the development server's current WASM file.

| Constructed workload | Isolated v19 ticks/s | v20 ticks/s | v20 minimum 20-tick window |
| --- | ---: | ---: | ---: |
| 48 cells | 42.43 | 43.60 | 42.89 |
| 2,000 cells | 21.20 | 21.61 | 21.23 |
| 2,000 with growth | 15.80 | 16.02 | 15.27 |

The [isolated baseline](evidence/digital-chemistry/bound-material-v20/baseline-v19.json)
is ledger 3998–4000; [v20 capacity](evidence/digital-chemistry/bound-material-v20/capacity-v20.json)
is 3995–3997. Each completed 100 measured ticks and exact save/restore continuation. These single
comparisons show no observed throughput regression; the 1–3% difference is not an established
speedup. The dense 2,000-cell fixtures remain below the 30 ticks/s target in both versions.
That existing operating limit is unresolved; this change does not satisfy that target or justify
changing field resolution, material thresholds or ecology to improve the number.

The 2,000-cell fixture ends with 1,979 cells in both versions and adds 4,072,782 checkpoint bytes
(3.88 MiB). WASM high-water memory is 556.25 versus 567.94 MiB; the runner retains allocation
capacity and includes persistence/restore buffers, so this is not just the per-cell state delta.
The growth endpoints differ (950 versus 948), making their storage difference an imperfect
per-cell comparison. All three v20 final material/work residual magnitudes are below 4e-10.
GPU execution and unattended browser memory remain outside this measurement.

[Startup](evidence/digital-chemistry/bound-material-v20/startup.json), ledger 4001: seed27,
600 ticks/120 model seconds, 1.455 wall seconds (412.39 ticks/s), 76 living cells, 74 divisions,
46 deaths and maximum generation three. Final material residual is 5.24e-9 and work residual
3.79e-8. Initial supplied material and reference value match v19. This verifies integrated funded
execution; it does not establish later #186 abundance, sustained diversity or waste-consuming
evolution. No long run or browser simulation was launched.

Raw generated artifacts remain local under
`frontend/harness/artifacts/bound-material-v20-20260917/`. The former `decomposition` definition
field remains the declared founder material and seeded metabolic reference; the UI now labels
it as initial founder body material. It no longer dictates growth, repair or death products.
