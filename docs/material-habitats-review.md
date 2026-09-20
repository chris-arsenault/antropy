# User habitat checkpoint — tick83,980

Read-only review of local `antropy-27-83980.antropy.gz`, physical v32, seed27. No new evolutionary
run was used. Kernel source digest:
`5c29efb98d60feb457ca0655992213039a5d8d2fe533d8ae1f1be02408849d30`.
The package is55,419,868 bytes; the physical checkpoint is138,583,671 bytes. Local decoded
evidence remains in `frontend/harness/artifacts/user-83980-review/`. These findings describe the
current [material-habitat implementation](material-habitats.md), not the earlier v31 200k world.

## Dense colonies with differentiated chemistry

At83,980 there are3,774 living cells,1,355.44 body material,101,558 ancestry records and maximum
living generation244. The last spatial census is five ticks earlier. Three principal regions
contain2,669,754 and337 cells. Ninety percent of extracellular material occupies16.375% of the
world. Source nearest-neighbor median is2.63 units; RMS16.56 includes distant outliers and alone
would obscure the dense clusters. Eleven of48 finite reservoirs are actively releasing.

| Region center | Cells at60,200 | At70,000 | At80,000 | At83,975 |
| --- | ---: | ---: | ---: | ---: |
| Approximately164,187 | 169 | 518 | 2,323 | 2,669 |
| Approximately233,116 | 766 | 73 | 679 | 754 |
| Approximately147,113 | 46 | 170 | 319 | 337 |

Current members that can be intersected with that recent census show different installed
primary enzyme routes. In the largest region,37→69 and69→37 are common; in the eastern region,
81→97 and138→106; in the upper region,107→91 and108→92. Zero motor-target shares are20.9%,60.2%
and0.6% among2,656,751 and335 matched living cells respectively. Their nonseed import shares
are67.12%,68.35% and40.7%. Region identity is a spatial observation, not an inherited species.

All living cells descend from founder17, but they are not one phenotype. During the last3,975
retained ticks there are8,295 divisions and7,883 deaths, with population increasing412;97.5%
of living cells were born after80k. This establishes continuing turnover and differentiated
descendants. It does not establish that every difference is advantageous or that specialization
will persist indefinitely.

## Broader uptake, continued feedstock dependence

Living-cell lifetime imports total623.457 material. ID0 supplies33.55%, ID136 supplies5.11%,
and other chemicals61.34%. Of3,774 living cells,2,803 (74.27%) obtain a majority of their
recorded imports from chemicals other than0/136. These are survivor-lifetime accounts, not
whole-history flux or the fraction of energy supplied by cross-feeding.

Nonseed chemicals account for87.34% of recorded metabolic consumption, but intracellular
turnover can process material repeatedly. Net consumption minus production remains dominated
by0 (198.67) and136 (26.15); the next chemical140 contributes4.07. Mean reservoir renewal
composition is still87.193% initial0/136, with a range82.24–96.14%. Source type changes exist,
but seed feedstocks still anchor the material economy.

Standing field shares are13.85% for136,7.68% for0 and2.94% for140. ID186 is0.08254%; it is
not the old dominant terminal pool. Standing abundance, uptake and net conversion are different
quantities and should remain separate in the UI and later analysis.

## Limits and operational finding

The240 retained chart samples contain tick0 and then60,200 onward. They cannot reconstruct
the early transition or establish how many alternatives appeared and disappeared before60k.
This review supports the user's observation of dense differentiated colonies, without claiming
closed cycling or permanent diversity.

At roughly53MiB each, five recovery packages exceed256MiB. The old retention policy tried to
retain preferred counts before checking bytes and therefore paused a valid continuing world.
The corrected policy expires older points to fit; four packages of this size fit. The separate
[session performance investigation](session-runtime-review.md) records the reload speed change.
