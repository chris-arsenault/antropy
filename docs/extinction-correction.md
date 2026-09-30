# September 30 extinction correction

**Status:** Current reference — bounded investigation of the v47 extinction and its correction.

The v47 seed27 server world ended at tick51,747. All 2,709 actual deaths were
recorded as starvation; division endings are excluded. Its maximum population was
291 at tick19,280. This establishes energy exhaustion, not its cause. The existing
terrain hierarchy remains the intended geometry.

## Question and registered comparison

Does the same average food supply, delivered in smaller and more frequent batches,
reduce local starvation? Competing explanations are interrupted access and excessive
expenses despite available food. Source motion, local terrain and inherited behavior
remain ordinary production laws. Mutation and private/inherited learning remain on.

For release rate r, batch duration T and mean empty wait G, mean supply is
r T/(T+G). Scaling both T and G by one quarter preserves this mean and the 20%
active duty fraction. It reduces the mean empty interval from 2,400 to 600 model
seconds and the renewing batch duration from 600 to 150. This is a timescale
candidate, not additional food or a guarantee that every reservoir remains viable.
Initial reservoir stocks, primed fields, cells and random streams are identical in
the paired comparison: change the two future-cycle parameters after boot. The
smaller initial stocks of a candidate fresh world require a separate startup check
if the comparison supports adoption.

Use one native production world, seed27, integrated terrain. First run a 1,000-tick
pilot with a 60-second wall cap. If throughput permits, resume that exact checkpoint
in two arms, unchanged and quarter-duration future cycles. Each ends at tick52,000,
extinction, a physical stop or a 600-second wall cap. The horizon is the known
extinction time, not a search for a preferred community. Do not extend capped arms
or sweep seeds. Record source positions/amount/wait, local material, cell energy,
maintenance budget, motion and cumulative typed flows every 500 ticks. Save initial
and final physical checkpoints locally. Compare access and expenses before interpreting
population differences. A failed or capped arm remains such.

The decision is whether to change the existing cycle defaults, investigate another
measured bottleneck, or report that the candidate did not resolve the collapse.
Generated reports and checkpoints remain in ignored harness artifacts and the
existing experiment ledger. No raw data is committed.

At approximately tick28,000 the paired comparison supports running the conditional
startup check: one fresh seed27 world with T=150 and G=600 from boot, including
the resulting smaller initial source stocks and priming. Stop at tick5,000,
extinction or 90 wall seconds. All other settings remain integrated defaults.
This checks early establishment with the proposed defaults; it does not add another
long-horizon arm or certify continued survival.

## Rejected priming correction

The first fresh short-cycle world fell from 48 to 18 cells by tick5,000. Its
reservoir-derived startup food was one quarter of the control. Investigation found
that `sourcePriming` meant a fraction of stored quantity in `World::new`, but a
concentration in `initial_ecology::prime`. Adjusting that setting to compensate
would also multiply the other initial pools. Use one concentration interpretation
instead, retaining the existing parameter and finite accounts.

For normalized reservoir footprint weights w and mesh area A, the existing
interface is I=A/sum(w²). Withdraw q=min(Q, C I) from the reservoir and deposit
q w in the field. Its own footprint-averaged concentration is q/I, hence C when
the tank can afford it. Nearby reservoirs add ordinarily. Initial secondary pools
retain their existing C/2 concentration each. No cell receives extra energy or
material, and no ongoing food source is added. Priming is now nonnegative
concentration, not a fraction bounded by one.

The registered repeat used only the fresh-start check with this unit correction: seed27, T=150,
G=600, C=0.1; tick5,000/extinction/90-second stopping limits. This is a new
causal change prompted by the failed startup, not an extension of its horizon.
The batch/wait law, terrain, genotypes and subsequent physical laws stay the same.

This concentration-priming trial ended with 20 cells at tick5,000 and continued
decline. It did not repair startup. The proposed priming semantic change was
removed; its passed finite-accounting test does not make it an ecological fix.

## Completed paired comparison

Both arms reached tick52,000 within their wall caps. The unchanged continuation
ended with 689 cells; the equal-average-supply candidate ended with 537. The
candidate supported greater population over the interval (approximately 236 versus
132 time-averaged cells using the 500-tick census), but its death rate per cell-time
was higher, not lower. The unchanged arm did not reproduce the live extinction.
Thus this comparison does not establish that timing alone caused the original
collapse or that equal-average shorter cycles prevent it. Checkpoint reconstruction
and numerical execution do not guarantee identical evolutionary trajectories.
The failed fresh-start checks are additional grounds for rejecting that candidate.

## Selected correction: shorter waits, full batches

Retain T=600 and the original priming; reduce only G from 2,400 to 600 model
seconds. This preserves the entire initial world and per-site active release rate.
It increases the nominal stocked fraction from 0.2 to 0.5 and ongoing mean supply
by 2.5 times. For this map the calculated mean goes from 9.113 to 22.783 material
per model second, before seasonal movement and finite-run variation. The probability
that an exponential empty interval exceeds 2,000 supply seconds falls from 43.46%
to 3.57%. The field's washout half-life is 693 model seconds.

The equal-average-supply constraint was an experimental control, not a user
requirement. Retaining it forced much smaller initial tanks and poorer startup.
Changing only the existing wait parameter is the supported next direction: full
finite batches and more dependable local replenishment. It does not guarantee
survival, remove costs or make all terrain habitable.

Run one fresh seed27 check to tick10,000, extinction or 120 wall seconds. This
covers initial depletion and renewed local feeding with the actual selected
configuration, rather than resuming a well-funded experimental checkpoint.
Mutation, learning, terrain and the original finite priming remain unchanged.

The full-batch check reached tick10,000 in 108.4 wall seconds with 327 cells,
1,124 divisions and 845 deaths. Population was 82 at tick5,000 and 188 at
tick7,500. This supports establishment and renewed growth with the selected
setting; it does not establish indefinite persistence or uniquely attribute the
earlier live extinction. The original wait remains configurable.

## Reproduction and delivery

The native example uses the ordinary World and records its exact initial/final
checkpoints, configuration, typed cumulative flows and 500-tick local samples.
The historical source times are explicit in the fixture so changed defaults do
not silently change the registered comparison. `gap` changes only the wait;
`fresh` scales both times before boot; a checkpoint path scales future cycles
while retaining its existing stock and elapsed waits.

```bash
cargo run --release --manifest-path engine/Cargo.toml --example supply_cycles -- NEW_DIRECTORY 10000 120 0.25 gap
cd frontend
pnpm exec tsx harness/numerical/supplyCyclesRecord.ts ../engine/target/release/examples/supply_cycles ../NEW_DIRECTORY
```

Local ledger entries 4424–4429 retain the pilot, paired continuations, two negative
startup trials and the selected full-batch trial. Historical binaries for the
rejected priming trial and original comparison remain alongside ignored artifacts.
The delivered runtime change is only `sourceGap=600`; initial priming, batch
quantity, chemistry and terrain implementation remain unchanged. Physical format
stays v47. Existing checkpoints retain their saved configuration; the empty live
world requires an explicit new-world restart to use the corrected wait.

The September30 live restart applied this configuration to seed27 through the
existing authenticated management API. A populated manual checkpoint preserves
the corrected configuration for deployment restore. The extinct world's local
checkpoint and the earlier populated server checkpoint remain available.
