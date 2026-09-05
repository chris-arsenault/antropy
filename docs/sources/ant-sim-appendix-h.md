# Appendix H: The Search Branch — What an Ant Does When It Smells Nothing

*September 2026. Companion to Appendices E–G, which are frozen. Status lives in
`docs/certifications.md`.*

**The problem:** the rewritten programmed worker is organized as goal branches over typed
carriers — carrying → home and deposit; touching food → eat or pick up; hungry inside →
follow stored-food scent; else → follow wild-food scent. It works, and it has one hole:
when no food scent is present, the ant has no behavior. Two of four test starts sit in that
hole and never leave the nest. Sweeping food-field evaporation across 0.98–0.995 did not
change this, which means those starts are outside the scent horizon and no field tuning
will reach them.

**The fix, at its core:** a fallback branch. When there is nothing to smell, search. Leave
the nest, walk, and let the existing branches take over the moment a scent appears or the
energy threshold trips. Everything below is that one branch, presented in order of
increasing complexity. Build level 0. Move down the list only when a measured failure at
the current level demands it.

---

## H.0 Level 0: the fallback branch (build this)

Replace the empty case with:

```text
ELSE (no food scent)
    IF energy below return threshold
        follow deep-nest odor home          # the homing that already works
    ELSE
        keep walking                        # hold a heading; go around obstacles
```

That is the entire mechanism. It uses only what the controller already does:

- Homing on deep-nest odor is the carrying branch's return path, already certified.
- Food-scent branches already preempt this one the moment a scent appears — search ends
  automatically on contact with any signal.
- Obstacle avoidance is already required for all movement; "go around" is not new.

The only new thing is *keep walking instead of standing still when there is nothing to
smell*. Persistence matters: an ant that re-randomizes its heading every tick performs a
diffusive random walk and covers distance proportional to the square root of time. An ant
that holds its heading and deflects around obstacles covers distance linearly. Hold the
heading.

**What done looks like:** the two dead starts leave the nest and find food across the seed
distribution; an ant that finds nothing turns home at the threshold and arrives with energy
to spare; no regression in the other branches.

**Calibration that comes with it:** the return threshold must cover the trip home from the
farthest point the search can reach — this is the foraging-radius arithmetic from Appendix
B applied to a blind walker. Derive it from trip cost at current speed. Do not hand-pick a
percentage. Note for later: how deep an ant runs its tank before turning back is a
personality trait; when genetic variation lands, this threshold belongs in the genome.

**One interaction to watch:** searching means holding a heading; casting means turning.
If both can fire in the same context they will fight, and the result looks like the
helicopter defect in a new form. Keep them separated by context: persist while there is no
signal at all; cast only when a signal was present and was lost.

## H.1 Level 1: fixes for measured search failures (build only on evidence)

If level 0 testing shows specific failures, these are the cheapest repairs, in order:

- **Ants re-enter the nest while searching.** The search heading happens to point back
  through the mouth. Cheapest fix: while inside and searching, bias the heading away from
  the deep-nest odor gradient (walk toward weaker colony signal). This is ordinary steering
  on an existing input. It is only a bias on the search heading, never the navigation
  mechanism itself.
- **Ants waste the search budget in dead-end galleries.** Wall-deflection: on hitting
  solid, keep the heading component that survives and slide along the face rather than
  reflecting or re-randomizing. This threads tunnel systems without any new sensing —
  local solidity is already in the sensor vector.
- **Exit times have a long tail that the energy budget cannot cover.** Widen the margin
  (threshold or tank) before adding mechanisms. A fatter reserve is cheaper than a new
  behavior.

## H.2 Level 2: directional exit cues (build only if level 1 is not enough)

If blind search measurably cannot get ants out — deep authored nests, repeated
dead-end losses that margins cannot absorb — the next step is giving the outbound leg a
gradient to follow. Candidates, cheapest first, each a physical fact with a carrier:

- **Light.** Sky-connected air is lit; light attenuates with depth and dies around
  corners; entrances are holes that let light in, and following brightness toward an exit
  is canonical insect behavior. The depth/darkness input already exists — the work is an
  audit that it is computed as an honest light field (attenuating through air from
  sky-connected voxels, blocked by material) rather than a coordinate lookup. If honest,
  the exit cue is one more taxis on an existing input.
- **Airflow.** Nest mouths breathe; a draft channel is an honest near-an-opening fact. It
  works in total darkness and stays correct through arbitrary future geometry (multiple
  entrances, sealed mouths, dug extensions). It costs a new field, a new sensor pair, and
  a sourcing computation tied to actual opening geometry — so that plugging the mouth
  kills the draft. Reserve it for the day nest geometry defeats light, which is a
  post-digging problem and possibly a never problem.

Either cue enters as a *bias* on the level-0 search heading, not as a replacement for the
branch. The search program is the mechanism; a cue only points it.

## H.3 Level 3: memory-based search (deferred; arrives with other work)

Recorded so the options are not re-derived, and so none of them are mistaken for a
bootstrap dependency:

- **Personal breadcrumb.** A seed that marks the blank pheromone channel while walking and
  avoids its own recent trail while searching gets "where have I been" from the world.
  Legitimate seed-level exploration once the basics work.
- **Path integration.** Real ant machinery, and expensive: it requires the precise
  recurrent dynamics this project has already measured as narrow. It remains a future
  evolutionary upgrade or training target, never the exit mechanism for a hand-written
  seed.

## H.4 The record of how this decision went wrong before it went right

Kept short, because the pattern is the useful part. The search branch was proposed early
and correctly. It then spent three review turns being displaced by progressively more
elaborate alternatives — an airflow carrier, a light-honesty audit, a wall-following
composition — each reasonable in isolation, each introduced by evaluating whatever menu
was currently on the table instead of the actual gap in the program. The gap was an empty
`ELSE` branch. The fix was a fallback behavior using mechanisms that already existed and
were already certified.

The lesson, for humans and agents both: **when a controller has a hole, the first
candidate is a branch that composes existing behaviors. Carriers, fields, and sensors are
level-2 answers, and reaching for them first is how an empty else-branch becomes a
three-mechanism project.** The complexity ladder in this appendix exists so the next hole
gets climbed from the bottom.