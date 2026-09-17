# Physical coupling correction

September 17, 2026. Physical checkpoint v19. Plan
`595f305a-d0a7-4097-8267-542f9499d6b9` implements the user's request to fix the
[coupling audit](physical-coupling-audit.md). The audit and its v18 measurements remain historical.

## Shared rules

Repair still removes a bounded fraction of damage. Its material conversion and work expense now
multiply that fraction by **total installed body mass**. The existing repair coefficients express
cost per unit of repaired stock. Compatibility, injury response, chemical conversion, repair rate
and resource funding remain unchanged. Matter and reference-value accounting close for both uphill
and downhill repair mixtures.

Movement retains its stock/damage/drag-limited maximum speed. Requested work is now
`motorPower × (swim² + 0.25 × turn²) × dt`; the funded velocity multiplier is the square root of
the paid fraction. At fixed radius and actual speed, operating work no longer depends on installed
motor size. Additional motor still costs material, upkeep and space; its extra radius still adds
drag. Within the same body, half speed costs one-quarter of the work per time. Turning uses the
same rule. Growth/refitting reserves and analytical budgets call this same work-rate function.
This is a bounded arithmetic correction to the existing artificial law, not a new fluid solver.

Fission and budding price reserves from the actual body being split, rather than an absolute
starter-cell allowance. These renamed controls replace the old controls; none is added:

| Current setting | Default | Meaning |
| --- | ---: | --- |
| `protectedInventoryFraction` | 0.125 | Fraction of current storage capacity protected from growth |
| `daughterInventoryFraction` | 0.1875 | Fraction of combined daughter storage capacity required before division |
| `daughterEnergyFraction` | 0.125 | Fraction of combined daughter energy capacity retained after division |
| `divisionWorkPerCore` | 0.04 | Division operating work per unit of actual parent core |

For the ordinary fully grown founder body these retain 0.6 required material, 0.2 retained work
and 0.08 division expense. Each daughter receives half the actual stock and reserves. Retained
work must also cover both daughters' maintenance and configured learning through one physiology
interval plus one tick. This uses their actual half-bodies and the existing upkeep rates, including
the fixed controller overhead. It does not promise to fund any subsequently chosen action.
Core-dependent division work concerns the split operation; constructing every stock is already paid
through ordinary growth. Storage can still be too small to support effective feeding or growth,
but there is no universal 0.6-material birth barrier.

Refitting retains the common coordinate update and stock-weighted work charge. Only positive
installed stocks contribute to its maximum-distance rate limit. Empty-slot instructions cannot
delay funded machinery. If only empty slots differ, their coordinates can finish without work;
this grants no material or functioning capacity, and later construction remains paid.

The economy helper's construction ceiling now uses **finite-enzyme processing surplus**. Import-only
surplus remains an explicitly optimistic diagnostic. Product buildup, repair, learning, shared
delivery and extra uphill assembly expense can lower actual growth below this ceiling.

No chemical-yield gene, special-case species rule, new tunable coefficient, mutation change or
environmental retuning is introduced. The chemical tradeoffs found by the audit remain in place.

## Checkpoint and ownership boundary

The renamed capacity fractions and changed equations require physical checkpoint **v19**.
Earlier physical saves fail explicitly; no compatibility economy or silent continuation is added.
The old `daughterInventory`, `daughterEnergy`, `divisionCost` and `protectedReserve` configuration
keys are rejected. Browser package version 11 and chemical definition version 4 are unchanged.
Rust ownership, same-worker borrowed rendering, observation limits and sparse field execution remain.

## Bounded verification registration

Question: do these corrections remove the audited algebraic defects without breaking funding,
continuation or ordinary startup? They do not predict a particular evolved allocation or community.

- Deterministic Rust checks: matched composition across body scales; uphill/downhill repair value
  closure and work limitation; small-core/small-storage division and conservative split; growth
  below the old absolute reserve; equal-speed motor cost; partial-work speed; positive-stock-only
  refit scheduling; reserve pricing; and rejection of obsolete settings/checkpoints.
- Repeat the existing zero-World-tick coupling diagnostic once, using its same seed27/chemistry101
  fixtures and a new output path. Build/execution budget: 60 seconds. Predict repair work per mass
  is constant; equal-speed motor cost differs only through radius; chemistry rows are unchanged.
- One ordinary seed27 startup with unchanged founders, mutation, learning, source settings and
  full mesh2: **600 ticks**, **120-second wall cap**, stop earlier on extinction or a runtime limit.
  Use the existing startup runner and ledger, registering this document. Save initial/final
  checkpoints and bounded observations. This checks usable startup, funded reproduction and work
  closure; it does not establish long-run evolution, browser motion quality or saturated performance.
- Run `make ci`, including supported exact checkpoint continuation and borrowed rendering checks.
  No horizon/seed expansion or tuning follows automatically from the result.

## Results

All registered checks completed without extending a horizon or tuning the world.

- [Operator results](evidence/digital-chemistry/physical-coupling-v19/operators.json): full-effort
  repair work per unit body mass is **0.0064** at every tested scale (0.25 through 4). Total work
  rises from 0.002432 to 0.038912 across the sixteenfold mass range. The earlier flat absolute
  repair expense is gone. The release build and diagnostic completed in 37.74 seconds.
- At the same 0.79974 speed, fourfold motor stock spends **0.016971** work/second versus **0.016**
  for the reference motor, a **6.07%** difference from its larger radius. Previously the difference
  was 106%. The equal-radius regression obtains exactly equal operating work while retaining
  higher upkeep. Half-throttle and quarter-funded checks both produce the expected half speed.
- Reaction and internal-exposure rows are identical to the retained v18 audit. The biological
  cost corrections do not change chemical yields, product inhibition or compatibility.
- Small-parent and low-storage regression fixtures divide at capacities below the former
  0.6-material threshold, but refuse division with insufficient material or work. They conserve
  material/value and leave funded daughter upkeep. Small bodies also grow below the former
  0.2 protected-material threshold. Zero-stock targets cannot slow a funded refit or grant stock.
- [Ordinary startup](evidence/digital-chemistry/physical-coupling-v19/startup.json), ledger **3990**:
  seed27 completed **600 ticks / 120 model seconds** in **1.467 wall seconds**, approximately
  **409 ticks/second** including bounded observations. It ended with **64 cells**, **67 divisions**,
  **51 deaths** and maximum living generation **3**. Final material residual was **5.48e-9** and
  reference-value/work residual **3.58e-8**. This is viable short startup, not a long-run ecological
  or browser-performance result. Both initial and final checkpoints remain in the local archive.
- `make ci` passes **100 Rust tests and 60 Vitest tests**, including eight new coupling checks,
  v19 exact continuation, rejection of v18/retired controls, borrowed rendering and the current
  producer/Python-reader contract. The same **13 existing ESLint warnings** remain.
  The offline capacity reader retains the old interpretation for old reports and uses the new
  fractions/upkeep for v19. Its healthy full-growth calculation is an optimistic capacity bound,
  not a forecast that a cell will divide.

Division reserve calculations run only after installed stocks meet the inherited double-body
targets; unfunded/nonready cells do not pay for that extra reduction each movement tick. No new
field pass or per-species runtime work was added. The operator diagnostic preceded this equivalent
short-circuit refactor; its direct repair/motion/chemistry calls are unaffected. The startup and
final CI use the final kernel. Current human motion review and long-run consequences remain open.

Local archive: `frontend/harness/artifacts/physical-coupling-v19-20260917/`. Reproduce the
registered startup from `frontend` using a fresh directory:

```bash
pnpm exec tsx harness/numerical/startup.ts harness/artifacts/coupling-review-new 600 on docs/physical-coupling-correction.md
```
