# Toxin immunity and the producer / resistant / sensitive contest

Registered September 11, 2026 as phase 2 of the
[roadmap to strategic differentiation](design/README.md#design-roadmap). Sulion plan
`ac1df944-ed66-4d21-8461-9e7f4ab19509`. Artifacts: `frontend/harness/artifacts/rps-2026-09-11/`,
ledger rows from 3081. All cases are constructed physical genotypes on the founder brain; no
winner enters the browser default and no assay score selects parents.

## Question and mechanism

Before this study, toxin injured its producer as much as any neighbour, so the only adaptive
response was to stop producing it, which is what lineage 18 evolved. The colicin system in
bacteria bundles toxin and immunity on one plasmid, and three strategies then form an
intransitive cycle: producers kill sensitives, resistants outgrow producers because resistance
is cheaper than production, sensitives outgrow resistants because they pay nothing. Kerr and
colleagues (2002) showed all three coexist on a plate, where interactions are local, and collapse
to the resistant type in a shaken flask, where they are not.

Two mechanisms were added, both off in old saves (absence resolves to zero):

- **Immunity.** The injury divisor becomes `1 + defenseStrength×defense/core + immunityStrength×weapon/core`.
  Installed toxin machinery protects against every producer's toxin; there is no ownership.
- **Contact injury** (`contactDamageRate`). A cell touching a neighbour with toxin machinery is
  exposed at `contactDamageRate × Σ weapon/core` of touching neighbours, divided by the same
  protection. It has no field, cannot be sensed at a distance and needs no diffusion.

The three constructed strategies share the founder brain, core and every other target:

| Strategy | Toxin effort | Toxin machinery target | Defense target |
| --- | --- | --- | --- |
| Producer | constant, `--toxin-effort` | founder × `--producer-weapon` | e⁻³ × founder |
| Resistant | off | e⁻³ × founder | founder × `--resistant-defense` |
| Sensitive | off | e⁻³ × founder | e⁻³ × founder |

`pnpm harness rps --case pairwise` runs the three pairs at 3,000 ticks in both placements on a
32-cell world with three replenishing deposits and 24 founders. `three-way` and `invade-<strategy>`
are 10,000–20,000-tick pilots; `--size 64 --founders 64 --sources 8` selects the larger world.
Mutation and learning are off. Gate: all three strategies persist together with spatial mosaics
or cycling frequencies.

## Pairwise results

Living cells at 3,000 ticks, first and swapped placement. Bold marks the predicted winner.

| Set | Change from previous | Producer v sensitive | Resistant v producer | Sensitive v resistant |
| --- | --- | --- | --- | --- |
| 1 | effort 0.02, K 0.025, defense strength 80, matrix on | 23 v **28**; 25 v **31** | **38** v 25; **35** v 24 | **44** v 31; **40** v 39 |
| 2 | effort 0.005, K 0.003, defense strength 400, resistant defense ×4 | 28 v **43**; 26 v **42** | **42** v 27; **36** v 28 | **44** v 31; **40** v 39 |
| 3 | matrix off | **48** v 0; **48** v 0 | **29** v 19; **27** v 22 | **46** v 36; **46** v 41 |
| 4 | resistant defense ×6 | **48** v 0; **48** v 0 | **33** v 18; **29** v 21 | **46** v 35; **47** v 34 |
| 5 | K 0.01 | **46** v 0; **48** v 0 | **34** v 27; **32** v 29 | **46** v 36; **46** v 41 |
| 7 | toxin diffusion 0.03, decay 0.2 | 31 v **40**; 27 v **42** | **44** v 26; **40** v 31 | **46** v 36; **46** v 41 |
| 8 | injury rate 0.1 instead of range change | 32 v **39**; 33 v **41** | **38** v 31; **40** v 33 | **46** v 36; **46** v 41 |
| 9 | matrix on again at K 0.01 | 29 v **45**; 29 v **43** | **39** v 29; **38** v 32 | **44** v 31; **40** v 39 |
| 10 | defaults plus contact injury 5, matrix on | **23** v 0; **12** v 7 | 30 v 29; 27 v 30 | **39** v 34; **38** v 37 |
| 11 | contact injury 3 | **40** v 9; **44** v 6 | 37 v 28; 28 v 33 | **44** v 31; **41** v 34 |
| 12 | toxin effort 0.01 | **32** v 7; **34** v 9 | **34** v 25; **34** v 28 | **44** v 31; **41** v 34 |

Set 6 repeated set 5 in the 64-cell world for pilots only. Diffusive toxin never produced the
cycle. In sets 1, 2 and 9 the founder's matrix bound about ten times more toxin than remained
free, and sensitive cells took no lethal damage. With matrix off (sets 3–5) the same toxin
exterminated sensitives within 3,000 ticks: sensitive cells sense toxin at the concentration that
injures them, flee from deposits that producers occupy, and starve, so the plume acts as global
area denial rather than local killing. Weakening the plume (sets 7 and 8) removed the kills
entirely. Contact injury with the diffusive toxin left at its default finally produced all three
dominances in both placements at set 12, with sensitives surviving the producer contest.

## Three-way and invasion pilots

Counts producer/resistant/sensitive at 2,000-tick intervals on the 64-cell world.

| Set | Case | Trajectory |
| --- | --- | --- |
| 5 | three-way | 22/21/21 → 66/71/78 → 73/81/63 → 66/82/3 → 62/90/0 → 42/86/0 … 21/123/0 at 10k |
| 5 | invade-producer | 7/38/19 → producers extinct at 10k; 0/101/52 |
| 7 | three-way | 22/21/21 → 11/80/64 at 10k with producers declining and no toxin deaths |
| 10 | three-way | 22/21/21 → 76/74/34 at 2k → 80/73/1 at 4k → 52/71/0 at 10k |
| 11 | three-way | 22/21/21 → 72/76/57 → 75/77/3 at 4k → 39/99/0 at 10k |
| 12 | invade-resistant, 20k | 19/7/38 → 53/33/42 at 4k → 52/71/0 at 10k → 3/164/0 at 20k |
| 12 | three-way, 20k | 22/21/21 → 55/84/13 at 4k → 17/129/0 at 10k → 2/164/0 at 20k |
| 12 | invade-sensitive, 20k | 38/19/7 → 75/67/0 at 4k → 31/104/0 at 10k → 3/168/0 at 20k |
| 12 | invade-producer, 20k | 7/38/19 → 0/129/22 at 10k → 0/149/27 at 18k (wall cap at 19,953) |

Every three-way run with producers at a fifth or more of the start lost the sensitive type
within 3,000–10,000 ticks and then lost producers to resistants over the next 10,000. Sensitives
persisted only when producers started rare and went extinct first, and even then resistants
outnumbered them five to one by 18,000 ticks, so the 3,000-tick sensitive-over-resistant margin
does not hold at carrying capacity on the larger world. This is the flask outcome. The first
set 12 pilot attempt failed to serialize 520 MB traces at the ten-tick cadence; pilots now trace
every 100 ticks, and the failed directory is retained without a ledger row.

## Finding

The producer/resistant/sensitive cycle exists pairwise but does not coexist in these worlds. The
structural reason is mobility: cells cross the 64-cell world in a few hundred ticks, so a
producer front reaches every sensitive refuge within one generation, and the sensitive-beats-
resistant advantage (about 30% more cells at 3,000 ticks) is far slower than producer-kills-
sensitive. Spatially structured coexistence needs a replacement rate slow relative to dispersal,
which swimming chemotactic cells do not provide. The gate for this phase is not met.

What the phase did establish:

- Immunity and contact injury are implemented, tested and accounted; toxin can now be an
  offensive trait with a real cost/benefit rather than a pure self-harm to remove.
- All three pairwise dominances hold at set 12 settings; the world can support each
  interaction, which the roadmap's later evolved runs can exploit locally even without a
  stable three-way cycle.
- The founder's matrix is a complete shield against diffusive toxin; matrix production and
  toxin production interact strongly and are not independent strategies.

Recommended follow-up, not executed here: reduce dispersal relative to replacement, either by
larger worlds with sparser deposits so that local patches persist for several generations, or by
letting evolution find sessile matrix-bound strategies. Phase 3 (persistent spatial A/B regions)
is a resource-partitioning route to coexistence that does not depend on this cycle and is next.
