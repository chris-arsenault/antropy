# Mobile reservoirs: laws and short calibration

September 16, 2026. Ordinary World now moves resource reservoirs through the local chemical
medium and changes their released mixtures according to that medium. Defaults are
`sourceDrift=4`, `sourceProcessing=4`. **500 ticks is a useful first inspection window**;
1,500 ticks separates the tested settings. No ecological case exceeded 3,000 ticks.

The system remains open. Each deposit has finite inventory, but independent external renewal
continues indefinitely. No sun, external usable-work input or closed resource cycle is implemented.
The [source plan](../../plans/archive/MOBILE-SOURCES-PLAN.md) records authorization, selected laws and the
fixed experiment budget. The [environmental findings](environmental-results.md) remain separate
v14 evidence, including their negative inherited shelter-benefit result.

## Implemented rules and ownership

For inventory-weighted chemical profile `p`, local chemical gradient `G` and impedance `I`,
reservoir force is `F[k] = p[0]G[k][0] - p[1]G[k][1]`. Velocity is
`sourceDrift × F / ((1 + movementImpedance × I)(1 + |Fx| + |Fy|))`.
The source uses a bilinear center sample and persistent chemical signals. Empty reservoirs
use their incoming-mixture profile and continue drifting during the renewal wait. Passive
transport has no kinetic-energy store and grants no usable work. Empty uniform medium has
zero drift; trapping is possible.

The positive and negative components of two local material signals weight reflected offsets
`(4,0),(-4,0),(0,4),(0,-4)`. Channel fraction is
`sourceProcessing × weight / (1 + sourceProcessing × sum(weights))`.
Only lower-potential products are allowed; rejected fractions remain donor material. Processing
preserves matter and records potential loss as source-conversion heat. The medium acts as a
nonconsumed catalyst. Products cannot cascade within a release. Initial priming stays raw;
regular emission and expiration flushes use processing. Renewal retains the current location,
radius and richness; incoming species still follow the configured mixture, zone or epoch.

All sources sample their responses before any moves or releases. Moved Gaussian footprints
visit only their periodic bounding boxes, once per node. Tests compare them with a dense
reference, including seam crossings and radii larger than the world. Full mesh2 and sparse
chemical-group execution remain. Rust owns physics, and the same worker renders borrowed WASM
views. No full-field or population frame was added to browser messages. Existing source markers
follow actual positions; settings expose both constants and stats expose scalar travel,
converted material and conversion heat.

Physical checkpoint v15 persists the settings, source state and accounts and rejects older
physical saves. Source motion initially exposed a restore discrepancy from a transient body
signal cache; it now reads persistent chemical gradients only. Cell motion retains its existing
chemical/body response. Cold continuation tests exercise each physiology phase and source renewal.
History and recovery retention were not changed.

## Causal probes: six cases, 300 ticks each

Ledger 3938 uses production source/field operators in a cell-free 24×24 world, mesh2,
seed 27/chemistry101, drift 1/processing 1 except the named knockouts. A sinusoidal ID15 background
supplies the gradient; the dense case adds uniform ID15. Reservoirs do not renew within this
60-model-second assay. Actual inventory withdrawal supplies the emitted-material reconstruction.

| Medium or intervention | Travel | Converted material | Conversion heat |
| --- | ---: | ---: | ---: |
| Initially empty | 0.00253 | 0.2527 | 0.1033 |
| Gradient | 1.4406 | 1.3190 | 0.8866 |
| Reversed gradient | 1.4407 in opposite direction | 1.3191 | 0.8866 |
| Dense medium | 0.0752 | 3.3637 | 1.8827 |
| Drift disabled | 0 | 1.1920 | 0.8131 |
| Processing disabled | 1.4440 | 0 | 0 |

Every case releases 7.1507 material. Processing adds IDs64/84 to raw IDs0/80. Initial empty-medium
velocity and channels are zero; its subsequent plume produces a small response. Dense-medium
travel is 5.2% of the ordinary-gradient case. Material/work residuals stay below 4e-11.
These establish local mechanical causes, not controller behavior.

## Six ordinary comparisons and the choice

Seed 27, ordinary48 founders, two colonies, chemistry101, default inheritance/mutation and
private learning; transfer/disturbance disabled. No food rate, lifetime, gap, founder or field
resolution was changed. Samples every50 ticks; all cases reached1,500 ticks. Registered drift
comparison precedes two processing comparisons at drift 4. No seed sweep or horizon extension.
Converted-release fractions use cumulative release since tick zero, excluding bootstrap priming.
Construction and imports include the complete traced population, including ended organisms.

| Ledger | Drift | Processing | Median displacement/radius | Converted releases | Cell imports | Built material | Living cells |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 3939 | 0 | 0 | 0 | 0% | 756.11 | 354.55 | 101 |
| 3940 | 0.25 | 1 | 0.091 | 14.94% | 708.90 | 331.90 | 83 |
| 3941 | 1 | 1 | 0.382 | 14.45% | 712.18 | 331.58 | 94 |
| 3942 | 4 | 1 | 1.585 | 12.84% | 681.86 | 322.25 | 81 |
| 3943 | 4 | 0.25 | 1.656 | 4.06% | 714.01 | 334.12 | 83 |
| 3944 | 4 | 4 | 1.704 | 28.98% | 597.49 | 286.53 | 73 |

Drift4 produces consequential movement within hundreds of ticks. Drift0.25 leaves most sites
close to their starting positions throughout this window. Processing4 changes a larger fraction
of supply while retaining79.0% of control imports and 80.8% of control construction. Motor work
also falls from 197.96 to 168.72; reduced construction is not explained by increased total motor
expense alone. This choice favors changing local opportunities with remaining food access,
not maximum population. It is not an optimum or a demonstrated adaptive tradeoff.

## Short horizon and confirmations

Two predetermined seeds run to 3,000 ticks, retaining exact initial/final checkpoints and kernels.
The default seed 27 confirmation reproduces the earlier1,500-tick trajectory after installing
defaults. Selected settings give these observations at 500 ticks:

| Seed | Sources beyond starting radius | Median displacement/radius | Converted releases | Cell imports | Built material | Divisions |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 27 | 16/48 | 0.542 | 29.77% | 227.72 | 144.59 | 41 |
| 101 | 15/48 | 0.707 | 30.84% | 182.96 | 125.37 | 29 |

Ten percent of cumulative releases are converted by the first50-tick sample. At least10% of
reservoirs pass their starting radius by tick200/350 in seeds27/101; median displacement reaches
a quarter radius by 250/200. These thresholds identify observable change, not biological success.
At requested30 ticks/s,500 ticks takes about 17 wall seconds if execution keeps pace.

At3,000 ticks, ledger 3945/3946 end with 39/113 cells,192/315 divisions and maximum generation6/9.
Median source displacement is 3.449/2.973 radii;42/48 and 45/48 sources are beyond a starting radius.
Converted release fractions are28.30%/28.57%. Seed 27 declines after its earlier population peak;
seed 101 remains larger. Neither result establishes long-term survival. Chemical IDs outside raw
feedstock account for 12.58%/20.35% of cumulative cell imports. Weathering, metabolism and death
also create those IDs, so these are not traced atoms or proof of source-product specialization.

The study executed16,800 physical/ecological ticks in total: six 300-tick probes, six 1,500-tick
comparisons and two 3,000-tick confirmations. Ordinary cases used103.76 seconds of recorded run
wall time combined. The optional paired-cell diagnostic was unnecessary for this setting choice
and was not run. No 100k or overnight run was launched.

## Operating evidence and limits

Confirmations measure136.0/131.1 ticks/s including recorded observations and final export, without
GPU rendering. Across ordinary cases, sampled process RSS peaks at 230.04 MiB and WASM at 128.31 MiB.
These are short-run samples, not an endurance guarantee. Maximum observed absolute material
residual is 1.94e-10 and work residual3.38e-8. Every case completes its horizon and retains unchanged
harness digests. Comparison and confirmation kernels differ because the selected defaults and
an analytical-report assumption were installed; each artifact carries its exact kernel and hashes.

The fixed capacity workload, ledger 3947–3949, measures 39.31/24.55/20.18 ticks/s for fully populated
chemical fields with 48/2,000/2,000-growth cells. It includes packed render preparation, census and
inspection, ten warmup and 100 measured ticks per case. It has no sources; ordinary-case timing
above includes reservoirs. The large saturated workloads still miss30 ticks/s, close to the prior
39.71/24.45/19.89 measurements. Local report generation briefly overlapped this capacity check;
do not interpret small differences as a measured speedup. All three cold storage checks pass.

[Generated evidence](../../evidence/digital-chemistry/mobile-sources/README.md) contains the
comparison table and plots; `report.json` retains configurations, source responses, probe outputs,
hashes, trajectories and stopping reasons. `capacity.json` retains the complete capacity record.
Large checkpoint/genotype archives remain local under
`frontend/harness/artifacts/mobile-sources-2026-09-16/` and are not published.

The final footprint guard handles extreme configured radii before integer conversion, with a
dense-reference test; ordinary source footprints are unchanged. Both 3,000-tick checkpoints
round-trip byte exactly under the final kernel, and four
continued ticks match their archived kernels byte for byte. The bounded suites pass 76 Rust
and 60 Vitest checks, including ownership and rendering invariants. Human motion review remains
pending. Pursuit, conditional diet changes, evolved specialization, replenishment over long
timescales and sustained diversity remain unresolved. Future sun-mediated uphill chemistry needs
an explicit external work account and locally mediated transformation rules.
