# Appendix G: Floors — Homeostatic Pushback Against Colony Collapse

*September 2026. Companion to Appendices E and F. Status lives in `docs/certifications.md`.*

**The question this appendix answers:** long simulation runs can be destroyed by one bad
stretch — a wrong mutation, a food dip, an unlucky cohort — and months of simulated history
vanish. Checkpoints and restarts are explicitly not the answer wanted here. What mechanisms
inside the world push a failing colony back toward viability, buying time for ants to evolve
a solution or for the environment to stabilize?

The short answer: this has a strong real-world basis. Ecology is full of floors. Per-capita
conditions improve as populations shrink — food goes unconsumed, competition relaxes,
reserves get liquidated. The design work is not inventing a homeostat. It is making sure the
world's feedback loops run in both directions, and adding the few biological mechanisms
whose evolved purpose is surviving death valleys.

---

## G.1 The goal, and the two failure modes to design against

The goal is a **basin of attraction around viability**: below some low bar, the world's own
dynamics push the colony back up, without any targeting logic, subsidy counter, or scripted
rescue. The pushback must be strong near the bottom and fade to nothing near health.

Two ways a floor can go wrong, kept in view throughout:

- **The selection shadow.** If relief is too generous, selection stops working below the
  bar. Bad genomes persist in the subsidized zone and the sim becomes a hospice where
  evolution cannot operate. Every rescue mechanism must preserve *differential* survival:
  relief raises the water level; it never flattens the rankings.
- **The floor as attractor.** If subsidized-small is comfortable, lineages will evolve into
  the floor and park there. This is a real evolutionary outcome, not a hypothetical. Every
  relief state must be strictly worse than health on the reproduction ledger, so that
  recovery always dominates parking.

## G.2 The mechanisms

Ordered by which lever they pull. Each is a world fact with a carrier, not a rule that
detects distress.

### Resource: the two-sided governor

The population governor ties food spawn to carrying capacity. Check which half is built:
throttling abundance at high population is the easy half. The rescue half is that at low
population, **unconsumed food accumulates as standing crop**. A collapsed colony wakes up in
a world that has been quietly filling its larder. Per-capita abundance rises exactly as
headcount falls, automatically, and the relief fades to zero as the population recovers —
so it cannot become a permanent subsidy. Cap the standing crop (food rots, like corpses) so
the accumulator is not an infinite battery.

This is plain logistic resource dynamics, and it is probably the strongest single floor:
relief strength is proportional to how far below capacity the colony has fallen.

*Selection check:* standing crop still goes to whoever forages it. The best controller eats
first.

### Physiology: metabolic depression

Starving insects downregulate — activity drops, basal burn drops, some go torpid. Build it
as a body fact, not a behavior: below an energy fraction, an ant's basal metabolic rate
scales down (roughly half), at the cost of reduced speed and output. Slower and dimmer, but
burning half as fast. This converts "energy near zero" from a cliff into a ramp, which is
exactly the requested "time for solutions to evolve."

*Attractor check:* the cost term is mandatory. Depression must be worse than being fed —
slower foraging, worse everything — or torpor becomes the winning strategy and the colony
evolves into a monastery.

### Brood: the larder that walks

Real famine biology: colonies eat their brood, and many species lay trophic eggs —
non-viable eggs produced as food. The mechanics already half-exist (eggs are edible). The
homeostatic reading is that the brood pile *is* the colony's energy buffer, and collapse
becomes graceful by construction: a starving colony shrinks brood-first, workers-second,
queen-last. This arrives naturally with larval rearing — brood-as-capital and
brood-as-reserve are the same ledger read in opposite directions. The work is verification,
not construction: confirm the liquidation path runs (starving workers can and do eat eggs;
the seed's eat-gating must not accidentally forbid it).

### Queen: the recovery kernel

The claustral founding reserve generalizes. A queen with a deep reserve, fed preferentially
in good times, is the colony's persistent state: as long as she lives, the colony can
re-derive everything else. Real colonies bottleneck to a queen and a handful of workers and
rebuild. Deep queen reserve, preferential feeding, and brood liquidation together turn a
90% worker die-off into a severe recession instead of an extinction. This is the legitimate,
in-world answer to "months of sim disappearing": the simulation's memory lives in the
queen's fat body, not in a save file.

### Genetics: the portfolio

"One wrong mutation collapses the colony" is only possible if the brood is genetically
monolithic — which is what polyandry exists to prevent. Multiple stored sires make the brood
a portfolio: a broken patriline fails while its siblings carry on, and merit succession
routes around it. Two cheap hardenings:

- **Embryonic screening.** Catastrophically broken genomes die as eggs, at low cost, before
  the colony invests rearing energy. Real biology: most severe mutations are
  embryonic-lethal. Mechanically: a cheap sanity probe at hatch (zero output variance,
  saturated-everything, and similar breakage classes).
- **Asymmetric mutation.** Most eggs at conservative mutation scale; the hot-egg minority
  carries the exploration budget. The germ line defaults to fidelity, and variance is a
  deliberate side bet rather than a tax on every egg.

Small populations are where mutational meltdown is a real phenomenon, so the effective-
population monitoring from the earlier appendices matters most exactly here. The genetic
floor is diversity; worker-laid males are its pressure valve.

*This layer activates when genetic variation does. It is aimed at the exact failure mode
that motivated this appendix.*

### Threats (deferred): conspicuousness scaling

When predation and raids arrive, make threat attraction follow *activity* — trail traffic,
spoil heaps, forager flux — not existence. Loud colonies draw pressure; a collapsed colony
goes quiet and gets left alone. This is real predator ecology, and it makes the threat
system self-relieving at the floor with no explicit floor logic.

## G.3 The instrument: the resilience curve

Appendix F established the mutational-robustness curve for genome-level flatness. This is
its colony-level sibling.

**Build:** a harness scenario that perturbs a healthy colony to X% of its workers or energy
and measures recovery probability and time-to-recovery as a function of X, across the seed
distribution.

**Read:** the depth at which recovery probability crosses 50% is the measured size of the
basin of attraction. That number says whether the floor mechanisms are sufficient *before*
a months-long run bets on them. Do not argue about whether the sim is safe below the bar.
Drop a colony below the bar on purpose and watch.

Run the curve before and after each mechanism lands, so each floor's contribution to basin
depth is attributable.

## G.4 Build order

With ants still immortal and variation off, the buildable subset now:

1. Two-sided food governor (verify or build the standing-crop half; add the rot cap).
2. Metabolic depression with its cost term.
3. Queen reserve depth and preferential feeding.
4. The resilience-curve harness, run before/after each of the above.

Arriving with already-planned steps: brood liquidation verification (with larval rearing),
the genetic portfolio and embryonic screening (with genetic variation), conspicuousness
scaling (with threats).

## G.5 Failure modes to avoid

- **Detecting distress instead of building physics.** A `colonyInTrouble` flag that
  triggers relief is a scripted rescue with no carrier. Every mechanism here is a standing
  world fact whose effect happens to grow as things get worse.
- **Relief that flattens rankings.** Free energy distributed equally is a selection shadow.
  Relief must arrive through channels that still reward the better controller: food that
  must be foraged, reserves that must be defended, brood that must have been produced.
- **Comfortable floors.** If any relief state wins on the reproduction ledger, lineages
  will move in permanently. Price every floor below health, always.
- **Treating the floor as the feature.** The floor exists to protect long runs while the
  interesting dynamics develop. If runs spend most of their time at the floor, the world
  above it is miscalibrated — fix the ordinary economy, not the safety net.
