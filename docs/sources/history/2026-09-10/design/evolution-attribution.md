# Founder advantage and inherited adaptation

Plan `ea5aa160-3b74-4728-b117-4959140c919f` implements the approved observability and comparison
work. The user's September 9 screenshots show tick 30,507, generation 13, 342 living bacteria,
793 divisions and 499 starvation deaths. Founder 32 has 99 living descendants (28.95%). These
observations supersede the short panel as the longest reported run, but do not establish adaptation.
The browser's exact state/configuration is not available from screenshots alone.

## Competing explanations and observations

All default founders start with the same genotype. Founder abundance can reflect favorable initial
placement, early access to resources, demographic chance, private experience, inherited learning,
random genetic variation, and fixed-order numerical effects. Simultaneous uptake shares limited
nutrient proportionally; this does not eliminate spatial priority effects or establish ordering
independence of contact and reproduction.

Observation must separate actual body growth from genetic construction targets, exact sequence
identity from genome-record IDs, and genome change from demonstrated behavioral advantage.
The UI shows census-weighted target distributions, changes relative to each lineage's founder,
controller-genome distance, founder shares and their history. These are descriptions, never a
score used to choose parents. History begins when the view opens and retains bounded samples
covering that whole interval; it cannot reconstruct an earlier unobserved trajectory.

## Declared bounded comparison

Before inspecting new outcomes, use seed 101 at tick 30,507, both persistent and transient sources,
and this 2 × 2 intervention panel:

| Arm | Random mutation | Acquired-weight retention |
| --- | --- | ---: |
| Full | Default physical and behavioral rates | 1 |
| No mutation | Both rates zero | 1 |
| No transfer | Default rates | 0 |
| Frozen genome | Both rates zero | 0 |

All arms retain paid private plasticity and clonal fission. Starting locations, initial resources,
founder genotype and source RNG seed match within a regime. The frozen arm still permits individual
learning, local movement and demographic selection, but no inherited sequence changes. It isolates
non-genetic founder advantage as a combined effect; it does not by itself separate placement from
update-order effects. Compare leader share, concentration, turnover, inherited changes and resource
balances. This is one seed, not a general estimate across environments. No parameter tuning follows
merely because one arm has a larger census.

After that panel, select one representative from the full persistent arm: identify its most
abundant founder lineage (lowest founder ID breaks ties); sort its living descendants by birth
tick then organism ID and take the middle entry. This predeclared rule avoids trying many candidates
until one wins. Preserve the selected organism, genotype, ancestor, checkpoint hash and rule.

Compare that genotype against its original founder genotype on fresh seeds 201 and 202, both
source regimes, both assignments to the same starting positions, at 6,000 ticks. Each pair begins
with common funded founder bodies, empty private state, no random mutation and no learned-weight
transfer. Private learning remains active. Track both genotype censuses and sampled resolved
efforts, energy and stored nutrient. Changed genetic targets develop through ordinary paid growth.
The assay starts a diagnostic population; it never promotes a winner into the browser or selects
reproduction in the live ecosystem. A negative result for this one representative does not exclude
adaptation elsewhere in the population. A positive result supports a particular inherited advantage
under tested conditions, not proof that founder 32's entire historical dominance was adaptive.

## Verification boundary

Bounded tests cover exact sequence identity, founder-relative statistics and history semantics.
Ecological evidence belongs in the existing ledger, with source hashes and complete local checkpoints.
No browser simulation, offline training or new ecological mechanism is part of this work.

During the long panel, one UI-only guard was added: pre-update in-memory chart samples lack
founder shares, so the new lineage chart starts at the first available share sample. This avoids
inventing past shares or failing during a hot update. The broad source digest therefore changes
across this panel. Simulation and harness sources are unchanged during execution; the change
does not enter the assay's module graph. Final evidence must retain that provenance distinction.
The sorted SHA-256 manifest digest for simulation and harness files was
`faa4b54f305c3827689f4fcd29968c2719e554140fb3e01f761ffc3ab697dab2` before and after the UI guard.

## Long-panel results

All eight runs reached tick 30,507 with no original founder organisms alive. Their descendants
continued reproducing without rescue or an external selector. The full persistent run reaches
generation 13 with founder 32 dominant, matching the user's qualitative observation. It ends with
340 cells and 112 descendants of founder 32, versus the screenshot's 342 and 99. These are a
controlled fresh initialization, not an exact reconstruction of the unavailable browser state.
The difference is retained; its cause is not established.

| Run | Food patches | Arm | Living | Highest generation | Leading founder | Leader share |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| 2836 | Fixed | Full | 340 | 13 | 32 | 32.9% |
| 2833 | Fixed | No mutation | 318 | 7 | 34 | 4.4% |
| 2838 | Fixed | No transfer | 338 | 14 | 38 | 45.6% |
| 2832 | Fixed | Frozen | 308 | 7 | 17 | 5.5% |
| 2839 | Relocating | Full | 302 | 11 | 48 | 24.5% |
| 2835 | Relocating | No mutation | 315 | 8 | 42 | 5.1% |
| 2837 | Relocating | No transfer | 321 | 10 | 48 | 9.7% |
| 2834 | Relocating | Frozen | 319 | 7 | 8 | 5.0% |

The large concentration appears in the mutating arms, after a broadly dispersed early population.
The full persistent leader has 13 cells at tick 10,000, 34 at 20,000 and 112 at the endpoint.
Frozen genomes retain some demographic/spatial imbalance but do not approach that concentration
in this seed. This supports a contribution from inherited variation; it does not alone prove
adaptive improvement, exclude genetic drift, or identify the responsible loci.

Learning transfer alone creates 211 distinct sequences among 318 living genome records in fixed
patches, and 205 among 315 in relocating patches. Both frozen arms have exactly one sequence.
The duplicate-record correction therefore matters for interpreting learning-only diversity.
The full fixed-patch median controller-genome distance from the founder is 0.0222, compared with
0.000131 in its no-mutation arm. These distances describe inherited information, not behavioral merit.
The direction of the full/no-transfer concentration difference reverses between regimes, so this
panel supplies no consistent claim that inherited learning increases dominance or fitness.

The largest sampled energy residual is below `3.49e-7`; material residual is below `3.21e-8`.
All runs have the same broad initial source digest
`1a07f090e91121042d33828592d3c223c9f4f993d1baebddd0e0d4dc27412f4d` and final digest
`592dc742cf9a5dd018ae9c92c6f21a72fd09b1cc18babbe928abd59e5b1ba011`; the UI-only exception above
explains the difference. The simulation/harness manifest digest also agrees after the completed panel.
Complete snapshots, spatial samples and the generated `founder-concentration.png` figure are local
under `frontend/harness/artifacts/attribution-2026-09-09/`. Ledger rows retain the measurements.

## Declared representative

The rule selects organism 1557, genotype 1510, from founder lineage 32 in run 2836. It was born at
tick 28,564 in generation seven. No alternate candidate was tried. Its core, motor and storage
target genes equal the founder's; its transporter target is approximately 6.49% larger. Its RNN
also differs, so transporter investment is not an isolated explanation of any competitive result.

## Fresh-world comparison

Seeds 201 and 202, runs 2840 and 2841, complete all eight declared comparisons. Counts are living descendants
of each competing genotype at tick 6,000; both begin with 24 organisms and identical funded bodies.

| Seed | Food patches | Starting assignments swapped | Ancestor | Descendant |
| ---: | --- | --- | ---: | ---: |
| 201 | Fixed | No | 160 | 130 |
| 201 | Fixed | Yes | 157 | 141 |
| 201 | Relocating | No | 150 | 149 |
| 201 | Relocating | Yes | 146 | 156 |
| 202 | Fixed | No | 172 | 122 |
| 202 | Fixed | Yes | 149 | 143 |
| 202 | Relocating | No | 163 | 155 |
| 202 | Relocating | Yes | 151 | 155 |

The selected descendant loses all four fixed-patch comparisons and splits the four relocating
comparisons. No seed/regime pair favors it under both assignments. In seed 201, its endpoint mean
swim effort is higher in all four worlds, while stored nutrient is lower in three. These are census
snapshots, not per-cell lifetime efficiencies or isolated causal effects. Changed inherited behavior
is observable; a repeatable competitive advantage is not established by these results.

This assay measures competition from a fresh start through tick 6,000. It does not test invasion
of an established crowded population or preserve the candidate's original neighborhood. A founder
lineage contains many distinct genotypes; one median-age member need not carry every advantageous
variant in that lineage. Those limits prevent interpreting a failed transfer as proof that the
source population contains no adaptation.

Both competition runs have identical broad source digests before and after execution. The first seed-202 process
ended without a ledger row or artifact, and its failure output was unavailable. The same declared
command was rerun; no candidate, parameter, seed or stopping horizon was changed.

## Disposition

The study is complete without changing the simulation or promoting a genotype. The user's
observation establishes sustained turnover. The matched panel links increased founder concentration
to random inherited variation in this seed, while the representative competition does not establish
a transferable advantage. Pure early resource capture, genetic drift and context-dependent selection
are not interchangeable explanations; these results narrow the question without deciding among
all of them. Further mechanism experiments require a separate choice, not an automatic search for
a winning descendant.

Final `make ci` passes lint, formatting, TypeScript, 60 tests in 13 files, documentation checks
and Terraform formatting. The production build passes. No browser simulation was run, and these
observations do not certify motion. Physics, startup configuration and checkpoint schema are unchanged.
