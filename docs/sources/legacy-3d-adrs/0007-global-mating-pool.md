# 0007 — Global mating pool abstracts the nuptial flight

- Status: Accepted
- Date: 2026-09-02

## Context

Release 2 introduces real gene flow: worker-laid haploid males (spec §7.1 channel 2) and
new queens that mate at founding. Real ants mix genes in nuptial flights — both sexes fly,
so mating range is effectively map-wide. Simulating male flight paths and midair encounters
is a physics project with no evolutionary payoff at this scale.

## Decision

Males are real walking ants (haploid genome, raw expression, short lifespan). Mating is
abstracted: a founding queen draws her stored sperm uniformly from all living males on the
map — "flight" is global mixing. Each drawn male dies after mating, as in biology. Founding
waits until males exist; a world with no males founds no colonies, loudly visible in the
colony count.

## Alternatives considered

- **Drone pool of non-walking male records** — cheaper, but males would never be
  behaviorally expressed, keeping the all-diploid dishonesty in different clothes and
  removing selection on male viability (a male must survive to mating). Rejected.
- **Spatial mating (queen meets males within radius after flight)** — more physical, but
  with tens of males on a 192² map the encounter rate makes founding vanishingly rare, and
  the spec's flight semantics already imply map-scale mixing. Rejected for Release 2;
  spatial encounter can replace the draw later without touching the genetic system.

## Consequences

- Male viability is under selection (die before mating → no gene flow); male behavior
  (foraging enough to survive) matters even though males do not work for the colony.
- The uniform draw makes every living male equally likely — no sexual selection yet; that
  is an open lever for later releases.
