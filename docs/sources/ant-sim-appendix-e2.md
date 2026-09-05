# Appendix E2: Pathing and Destinations — Where Navigation Lives

*September 2026. Companion to Appendix E. This settles a design question, in goal language:
should we build explicit pathing/destination machinery, or keep deriving navigation from
immediate senses? The answer is a division of labor — and one cheap fixture check E should
adopt. Status lives in `docs/certifications.md`, not here.*

---

## The reframe: the world already computes paths

The question "should ants have pathfinding" dissolves once you look at what a diffusing scent
field actually is. A field diffusing from a single source (the nest), through the air network,
with decay, produces values that decrease roughly monotonically with *path distance* from the
source — through the actual topology: around corners, up shafts, through branches, never
through walls. Gradient ascent on that field **is** pathfinding. It is potential-field
navigation in which the world performs the computation and the ant performs a four-weight
read. It does not get trapped in dead ends the way a naive "head toward the nest" bearing
would, because the field flows through the tunnels, not through the rock.

This is not a consolation prize for lacking real navigation — it is how the biology and the
ant-colony-optimization literature both say the real thing works: trail networks are a
distributed shortest-path computation, with reinforcement and evaporation doing the
optimizing. The transferable form of "pathing" was never an algorithm inside the ant. It is
**a field in the world plus taxis in the controller** — which is already the plan.

So the productive question is not "should we add pathfinding" but: **is our diffusion field
actually a good distance function?** Single source; diffusion range adequate against decay;
no spurious local maxima from multiple deposit sites or disconnected pockets. That is tunable
world physics, and it is checkable — see below.

## Where pathfinding algorithms belong: three jobs, none of them in ants

**1. Verifying the world's own navigation solution (adopt into E now).**
Before E step 3 runs any behavioral test, run a purely computational fixture check: from
every air voxel in the authored nest plus a surface radius, does greedy gradient ascent on
the *implemented* nest-scent field reach the nest? It's BFS-and-compare, instrumentation-side,
cheap, and it converts "homing works" from a behavioral hope into a verified world property.
If it fails anywhere, that is a carrier bug — diffusion range, decay rate, a sealed pocket —
caught *before* it can masquerade as a controller failure in step 9. This project's most
expensive recurring cost is misattribution; this check buys some of it back for the price of
a graph traversal.

**What done looks like:** a field-navigability assertion in the fixture suite (E step 1 or 3):
100% of reachable start voxels gradient-climb home on the implemented field. A failure names
the field, never the ant.

**2. Omniscient oracles for viability questions.**
"Is this world generous enough for *any* behavior?" is best answered by an agent that plans a
straight path to food and back. There is no transferability concern because rung-1 oracles
were never behavioral targets — they measure the world's generosity ceiling, nothing else.
Keep the pathing oracle in the drawer for exactly these questions.

**3. Grading behavior without steering it.**
Compute true shortest paths and log **path efficiency** — realized trip length ÷ optimal — as
a standing metric. It's a quality ledger that never touches the ants: watch the seeded
colony's efficiency approach the oracle's; later, watch evolution grind toward better
routing. A route is never asserted; its quality is always measured.

## Where pathing must not go, and the real reason why

Not into the sensor-limited oracle, and not into anything downstream of it. The reason is
sharper than rule-following: **the sensor-limited oracle's entire job is to prove the shipped
interface can support the behavior.** Hand it a waypoint API and the proof evaporates — and
the damage propagates:

- **Seed derivation poisons.** E step 7 derives Seed E weights by matching oracle-grade
  behavior on oracle-grade ledgers. If the oracle's competence rests on pathing the sensor
  vector cannot express, CMA-ES is asked to imitate the unimitable. It either fails (a wasted
  run) or converges to a degenerate approximation (worse — a plausible-looking controller
  that memorized fixture geometry and will die on the next seed).
- **The best diagnostic instrument breaks.** Today, "oracle succeeds + seed fails" provably
  means *controller pipeline fault* — everything else is shared. With a pathing oracle it
  could just mean "the oracle was doing something no controller ever could." That gap is the
  sharpest fault-isolator this project owns; a nicer-looking oracle demo is a bad trade for
  it.

## The transferability tiers, kept straight

- **Trail networks — fully transferable, already latent.** Channels A/B plus reinforcement
  and evaporation are the substrate; emergent food-trail routing is one of the marquee
  behaviors evolution might build. Nothing to do now except keep the channels unlabeled.
- **Path integration — representable, expensive, later.** The recurrent state can host the
  two accumulators (real *Cataglyphis* machinery), but it needs near-marginal eigenvalues —
  a hard dynamical regime, firmly not reflex-grade. A legitimate future CMA probe or
  evolutionary upgrade; never a bootstrap dependency.
- **Learned routes and place memory — arrives with plasticity.** Route knowledge passes all
  four learnability gates (within-lifetime feedback, many trials, survivable error, value
  signal); it is what the Appendix A plastic tier is *for*. It arrives with that tier, not
  before.
- **Algorithmic pathing in the controller — too abstract, permanently.** A ~550-weight RNN
  will not reinvent graph search; an oracle demonstrating it teaches the seed nothing
  expressible; and every hour making it work makes the oracle less like anything the sim can
  ever contain.

## The delta to Appendix E

Small, and all on the measurement side:

1. **Field-navigability assertion** added to the fixture work (step 1 or 3) — a world-property
   test, cheap and permanent.
2. **Path-efficiency metric** added to the standing instrumentation ledger.
3. **Omniscient pathing oracle** available for viability questions only.

The ants keep reading fields. The algorithms keep grading them.
