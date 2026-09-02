# Phase 2 — An RNN ant digs a branched nest

Target: **an RNN ant, through the real sensors, digging a branched nest with a wide
spot.** Nothing else. Spec §13 Phase 2 ("balance the ecology with ants whose behavior
is known") before any evolution or later-phase liability returns.

Start state: a scripted oracle digs a ragged straight shaft; ants immortal; economy off
(`PHASE2` config, ADR-0013).

## Steps

1. **Fix the shaft.** Assertion, not eyeball: dug voxels == the intended column, spoil
   count == dug count. Resolve the 1-and-2-wide raggedness and lock it with a test.
2. **Turn on energy for the oracle.** Mortal ant, dig costs, metabolism. Assert: it
   completes the shaft with energy to spare. If it starves, tune dig cost / tank until it
   doesn't. (This is R6 — the constants must permit digging before any behavior can
   choose it.)
3. **Oracle rule 1 — amplify.** Mark channel A while digging; prefer the highest-A face.
   One ant. Assert the shaft still completes (the rule must not break solo digging).
4. **Oracle rule 2 — overflow.** Crowded → dig sideways instead of down. 5–10 ants, one
   config. Shape test: is the air network no longer a line? Any branch or widening =
   pass. Fail → tune the two rule constants within budget (3 configs / 10×) → still a
   line = finding report, stop.
5. **Name the seed spec.** The passing oracle is exactly three reflexes: dig-down bias,
   amplify, overflow. Write them as the target competence list. No additions.
6. **Write the seed weights.** Each reflex is 2–4 weights against existing sensors
   (vertical bias on dig/move outputs; channel-A stereo → dig-face preference; crowding →
   lateral bias). Hand-written; hidden layer stays zero.
7. **Assay each reflex in isolation (rung 3).** Synthetic stimuli in the test arena:
   given an A-gradient, does the seeded network prefer the right face? Given crowding,
   does lateral bias fire? Sign errors get fixed here, in seconds.
8. **One seeded ant, real controller, real sensors, energy on.** Assert: digs a shaft
   comparable to the step-2 oracle. First true Phase-2 moment — if the oracle could and
   the seed can't, the fault is between sensors and weights, and steps 6–7 localize it.
9. **5–10 seeded ants, same map as step 4.** The same shape test, now on the RNN. Pass =
   an ant colony's nest dug by the actual controller. Gap vs. the step-4 oracle shape is
   the measured shortfall; if hand-written reflexes cannot close it, then and only then
   CMA-ES on those same three reflexes — no new competences.

## Rules

- No feature outside this list gets added. Later-phase systems stay off by config.
- Every step's exit is an assertion in a test, not a screenshot.
- Tuning budget per constant: 3 configurations or 10×, then a finding report (Appendix C
  Rule 12).
