# Competing bacterial strategies: registered investigation

Plan: `817d1ab2-7291-401f-8d66-901d0f52f6f9`. Registration precedes the runs below.
The previous [export study](overnight-study.md) established an inherited reduction in toxin
expenditure. This study asks whether independent physical strategies can be favored in different
environments. No assay score controls reproduction or replaces browser founders.

## Registered comparisons

1. Repeat the single toxin-connection knock-in contests with damage rate zero, retaining
   secretion, maintenance, binding and all other costs. Seeds 201/202, both assignment swaps,
   6,000 ticks. Compare with the existing four damage-enabled contests. A retained advantage
   supports avoided expenditure; attenuation suggests injury contributed. This intervention
   removes all toxin injury, including self-exposure, so it cannot distinguish every injury path.
2. Compare half versus double founder motor targets, otherwise identical inherited controllers
   and physical genes. Common funded founder bodies develop the different targets through paid
   growth and fission. Seeds 301/302, both assignment swaps, 20,000 ticks. Four environments:
   deposit residence 100 versus 1,000 ticks, relocation distance 2 versus 24 cells. Eight finite
   deposits each release 0.3 material/second, equally A/B, with identical radius. An independent
   seeded calendar specifies positions before the run; it never observes cells. Source duration
   changes inventory per deposit, but integrated release and total inventory supplied over the
   complete horizon match. Environmental residue continues to diffuse and decay normally.
   Short distant opportunities predict an advantage for greater motor investment; long nearby
   opportunities predict the reverse. Report population share, reproduction, motor/maintenance
   expenditure and expressed body investment. Do not infer a speed advantage from gene labels.
3. If both variants win consistently in different contexts, combine the favorable opportunities
   with equal supply budgets and test reciprocal invasion from approximately 10% abundance,
   plus a balanced competition. Establish a mixed-world result separately from a crossover.
4. If the physical comparison supports a crossover, run mutation-enabled populations from the
   common founder in both contexts, then transfer observed descendants selected by a rule
   registered before examining transfer results. If it fails, record the physical limitation
   and identify the next mechanism for design review; do not engineer a favorable outcome.

Genotype comparisons freeze both random mutation and learned-weight retention. Private learning
remains active. Use final shares and population trajectories rather than founder dominance as
evidence; report ecological coverage as world-area or organism-time percentages. Two seeds and
paired swaps constitute a screening panel, not a universal statistical claim.

## Evidence contract

Each run records resolved configuration, source checkpoint/hash, source digests before and after,
the complete supply calendar where applicable, 100-tick typed flow/exposure/census tables,
lifecycle records, final checkpoint and conservation residuals. SQLite indexes runs; local DuckDB
supports attribution queries. Generated evidence is append-only. No browser run is necessary.
Conditional stages depend on their scientific prerequisite, not on finding a desirable answer.

## Motor result and conditional stop

All sixteen motor contests completed 20,000 ticks. Low-motor cells reached 100% of the surviving
population in every case; high-motor cells went extinct. Each context has two seeds and both
assignment swaps, starting at 50% per genotype.

| Deposit residence | Relocation | High-motor final share, all four runs |
| --- | --- | --- |
| 100 ticks | 2 cells | 0% |
| 100 ticks | 24 cells | 0% |
| 1,000 ticks | 2 cells | 0% |
| 1,000 ticks | 24 cells | 0% |

Actual motor stock developed to 4% versus 16% of core mass. At tick 5,000 in the first paired
case, high-motor survivors had approximately 1.85 times the movement ceiling. These are expressed
physical differences, not merely different genome labels. Across the complete panel's first
5,000 ticks, motors consumed 6.59–7.57% of absorbed food energy in low-motor cells versus
18.50–21.54% in high-motor cells. Both variants use identical inherited RNN weights; private
experience can diverge. These budgets support a substantial expenditure disadvantage, without
isolating every movement, exposure and growth consequence of changing motor stock.

Every motor run received the same integrated external nutrient supply. The run-level verification
found 20 complete manifests with matching before/after source digests: four toxin contests and
sixteen motor contests, 344,000 ticks total, SQLite rows 2923–2942. Maximum sampled energy/material
residuals were 2.95e-8/1.72e-9. Resource amounts remain in the query report for reconciliation;
the interpretation above uses shares with explicit denominators.

The registered crossover hypothesis is rejected for this controller/body pair and panel.
Reciprocal invasion in a mixed world and mutation-led discovery of these two proposed strategies
were **not run**, because the prerequisite of two context-dependent winners failed. This does not
invalidate the previously measured toxin-reducing adaptation or establish that high-motor bodies
can never be useful. The older movement-effort comparison changed behavior with common machinery;
its fast winner and this low-motor winner answer different questions.

The next recommended diagnostic is a matched test of **edible-food lifetime**, using the existing
decay law and unchanged input budget. Register one short half-life against the current long
half-life, measure uptake versus decay losses, and test whether the high-motor disadvantage
changes. This tests the missing deadline hypothesis below without adding a new biological system.
If it fails, controller/body coordination remains a separate candidate explanation. Neither a
production parameter change nor a new controller was implemented to force a crossover.

## Toxin attribution result

All four injury-disabled knock-in contests completed. The negative connection remains beneficial
or neutral, but its advantage is substantially attenuated in every matched comparison.

| Seed / assignment swap | Variant share with injury | Variant share without injury |
| --- | --- | --- |
| 201 / false | 65.16% | 51.70% |
| 201 / true | 64.67% | 54.55% |
| 202 / false | 60.92% | 56.15% |
| 202 / true | 66.48% | 50.00% |

Both genotypes start at 50%. With injury disabled, variant toxin release consumes 0.60–0.77%
of absorbed nutrient material, compared with 2.32–2.62% for the founder. Injury and repair
expenditure are zero. Therefore secretion savings persist, but they alone do not reproduce the
larger advantage observed with injury enabled. Avoided injury and its downstream ecological
consequences contribute; this whole-world ablation does not separate self-harm, neighbor harm,
repair, spatial sorting and feedback. It is not evidence that offensive toxin production pays.

Artifacts: `frontend/harness/artifacts/strategies-2026-09-10/toxin-off-*`.
The generated `report.json` retains SQL, results and the analysis-source digest. Existing
`causal-knockin-*` artifacts in the adaptation directory supply the injury-enabled comparisons.

## Execution provenance

Browser exports identify their exporter separately from execution history, including exports made
before pressing Run. Browser execution records source segments by tick in optional v5 metadata. Imports
without metadata retain an unknown earlier history; current execution never retroactively stamps
that history. Production builds hash browser source, lockfile and build configuration. Development
hot reloads are labeled `mixed-hmr` with the current source digest because a running page can
contain modules from different source versions. Headless studies record their harness source hash.
This metadata records execution identity, not proof that a browser and headless trajectory match.
History survives development module replacement. Historical checkpoint comparisons exclude these
metadata fields when comparing physical state. No browser assay was launched.
The final production build and `make ci` pass, including 72 bounded tests in 17 files.

## Interpretation constraints identified during the panel

Deposit residence is not dissolved-food lifetime. With nutrient decay 0.001/second and a
0.2-second tick, released food has a decay-only half-life of approximately 3,466 ticks; uptake
can remove it sooner. The 100-tick residence fixture relocates the supply, but old locations can
remain edible. A failure of faster cells therefore does not show that fast travel can never pay
under genuinely perishable food.

Both body variants use the same inherited RNN. Its founder weights do not connect the built motor
sensor to hidden units. It adjusts effort from other local cues, but does not explicitly compensate
for installed motor capacity. The assay tests this controller/body combination, not the optimal
controller for every body. A physical-target change still alters actual speed, turning, energetic
expenditure, growth and encountered cues. Results must not be generalized to all possible brains.

## Later browser observation

The user's screenshot at tick 187,804 shows founder 1 at 70.9% and founder 18 at 29.1%, with
203 living cells and 9.4% slowed at least 20% by matrix. It records a reversal of the earlier
lineage ranking, not the responsible genotype or mechanism. Two remaining lineages do not yet
establish stable coexistence. A contemporary checkpoint is needed to select and transfer actual
descendants; no reconstruction of their genomes from the chart is attempted.
