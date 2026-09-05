# Colony biology and survival

This document owns the colony's food, energy, brood, queen, reproduction, mortality, and recovery
loops. The immediate target is demographic closure inside the authored nest: gathered food funds
workers that replace deaths. That outcome is currently reopened at its food-loop locomotion base;
digging and genetic variation remain isolated until the repaired loop is measured.

<a id="colony-goal"></a>

## Functional goal

A living colony must leave the nest, gather physical food, store it, consume the store during
scarcity, feed the queen, rear brood from colony resources, and replace dead workers without
scripted replenishment. The colony ledger—not a particular cache, nursery, route, or population
trace—decides whether this loop works.

The authored nest removes construction as a confounder and becomes the later control arm for
evolved excavation. Certification worlds use one fixed genome and keep terrain digging, genetic
variation, new-colony founding, seasons, decay, and automatic continuation off.

<a id="colony-energy"></a>

## Energy and food economy

Energy is the common currency. Food, edible brood, and corpses supply it. Basal metabolism,
sensing, cognition, movement, carrying, signaling, digging, egg endowment, and rearing consume it.
Death at zero energy or age-out is the ordinary individual selection event when mortality is
enabled.

When mortality is enabled, the fast-forwarded founder cohort starts at evenly spaced fractions of
its expressed lifespan. This represents an established colony with mixed adult ages and prevents
the bootstrap fixture from creating forty simultaneous deaths. Mortality-off control worlds still
start every worker at age zero; later births always enter at age zero.

Physical food remains in the world. Workers eat it, carry it, deposit it, and retrieve marked
cached food through the shared mandible action. The colony balance over a fixed window is

`external food energy gathered - basal - sensing - cognition - movement - action costs`.

Calibration must support a broad controller population with substantial surplus. A programmed
policy barely above zero or one hand-selected controller does not establish a viable world.

<a id="colony-brood"></a>

## Queen, brood, and replacement

The queen converts colony resources into endowed eggs. Eggs are physical, edible, movable world
objects. The larval stage consumes stockpile feedings over time, can starve, and matures into a
worker; replacement therefore costs both energy and delay. Brood exposure depends on the local
microclimate. Brood transport uses ordinary contact, cargo, and mandible mechanics, with egg
capacity tunable per world and ultimately genome-owned.

This capital model gives food storage and safe brood placement selection value. It also makes the
brood pile a reserve: in famine, workers may liquidate brood before workers and the queen die. The
world must permit workers to eat eggs; the controller's eat gating must not accidentally remove
that path. No separately scripted trophic-egg rescue is planned while ordinary edible brood
already supplies the mechanism.

The queen is the recovery kernel. A deep reserve, filled preferentially in good conditions, lets a
colony survive severe worker loss and rebuild from a few workers. The reserve must be earned from
gathered food and must not make a small failing colony reproductively competitive with a healthy
one.

<a id="colony-floors"></a>

## Homeostatic floors

The target is a basin of attraction around viability. As population or energy falls, standing
world dynamics should buy recovery time and fade as health returns. They must not detect
`colonyInTrouble`, distribute free energy, equalize controller rankings, or make the floor an
attractive long-run state.

Three mechanisms remain conditional candidates rather than scheduled prerequisites:

1. **Two-sided food governor.** Low consumption lets unconsumed food accumulate as standing crop;
   a rot cap prevents an infinite battery. Better controllers still forage first.
2. **Metabolic depression.** Below an energy fraction, basal burn falls while speed and output
   also fall. Starvation becomes a ramp, but torpor is strictly worse than feeding.
3. **Queen reserve and preferential feeding.** Good times bank a persistent recovery reserve.
   Brood liquidation and worker attrition protect it without an external rescue counter.

The [resilience curve](experimentation.md#experimentation-resilience) must identify a specific
mortality or replacement failure before any candidate is admitted. A focused plan branch then
measures that one mechanism; unused floors never enter the evolving world.

<a id="colony-selection"></a>

## Reproduction and selection channels

The full design uses polyandrous queens, haploid worker-laid males, and multiple stored sires to
maintain within-colony genetic diversity. A queen egg may use merit-weighted lineage information,
but merit must count net new nest energy, not gross deposit events. Otherwise withdrawal and
redeposit can manufacture fitness.

Merit concentrates the signal of many workers and can raise effective heritability, but
reproductive skew lowers effective population size. Worker-laid male gene flux and the succession
weighting exponent must be measured together. The fixed-genome colony has closed its first
replacement window in historical runs, but that admission is suspended pending food-loop
recertification. New-colony founding, mating, and genetic variation remain off through the renewed
long-horizon continuity gate.

<a id="colony-order"></a>

## Linear implementation order

| ID     | Status      | Work and finish                                                                                                                                                                                               |
| ------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BIO-01 | Backlog, reopened | Recertify physical gathering, carrying, underground deposit, marked-cache retrieval, and conservation through the repaired programmed policy and RNN cohort.                                              |
| BIO-02 | Backlog, reopened | Re-establish that the current economy supports the programmed reference and a broad predetermined RNN cohort after credible physical food trips are restored.                                              |
| BIO-03 | Delivered instrument; recertification pending | The matched resilience harness records worker and energy shocks, demographic time series, and source-attributed energy. Rerun its untreated baseline after BIO-01–BIO-02.                   |
| BIO-04 | Conditional | If mortality or replacement fails because low consumption cannot leave a standing crop, branch the plan to test bounded accumulation and rot against both shocked and healthy ledgers.                        |
| BIO-05 | Conditional | If measured energy depletion kills otherwise recovering colonies, branch the plan to test metabolically priced depression with reduced movement and output. Torpor must remain inferior to health.            |
| BIO-06 | Conditional | If measured queen starvation prevents worker replacement, branch the plan to test a deeper earned reserve and preferential feeding without making weak colonies reproductively competitive.                   |
| BIO-07 | Delivered mechanism; recertification pending | Mortality and queen-upkeep mechanics exist. Repeat the isolated admission gate after BIO-01–BIO-03; runs 1927–1935 remain historical evidence.                                                 |
| BIO-08 | Backlog     | Impose a surface-food gap and compare caching with a no-cache policy control. Caching must extend colony survival; storage location remains descriptive.                                                      |
| BIO-09 | Delivered   | Worker-egg, incubation, larval transition, hatching, brood transport, microclimate, exposure, and larval-rearing mechanics have bounded tests. Transport, climate, and exposure remain isolated.              |
| BIO-10 | Delivered mechanism; recertification pending | Queen-laid worker reproduction, egg endowment, and laying-cost attribution exist. Repeat the replacement gate after the repaired baseline.                                                    |
| BIO-11 | Backlog     | Re-admit brood transport in the authored nest and verify pickup, carriage, putdown, persistence, and carrier death before judging placement.                                                                  |
| BIO-12 | Backlog     | Admit microclimate alone and measure adult cost; then admit egg exposure and measure brood survival. Do not bundle the two gates.                                                                             |
| BIO-13 | Delivered mechanism; recertification pending | Feed investment and metamorphosis cost are attributable, and bounded tests cover starvation and edible brood. Repeat the live rearing outcome after the repaired baseline.                     |
| BIO-14 | Backlog, reopened | Re-establish demographic continuity after controller recertification. Runs 1957 and 1959–1963 retain historical founder-turnover measurements but do not admit the new baseline.                         |
| BIO-15 | Backlog     | Make the certified loop observable: caches and withdrawals, brood stages, queen reserve, births, deaths, effective config, checkpoints, and replay visible in the web app.                                    |
| BIO-16 | Backlog     | After fixed-genome continuity, admit genetic variation and the portfolio safeguards in [advanced systems](advanced.md); then admit colony founding as a separate gate.                                        |

<a id="colony-delivered-later"></a>

## Delivered but currently isolated systems

The full-world scenario already contains queen aging and starvation, colony collapse, haploid
males, mating, queen dispersal, founding chambers, nest decay, seasons, weather, larval rearing,
and automatic continuation. “Delivered” here means the mechanism exists and bounded mechanics are
covered. It does not certify the current authored-nest colony loop or authorize bundling these
systems into its measurements. Each returns in the order above or in
[advanced systems](advanced.md).

<a id="colony-obe"></a>

## OBE and rejected directions

| Direction                                                                      | Status and reason                                                                                                                                                            |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Building excavation before the food-brood-replacement loop                     | **OBE.** It produced structure without a living colony and confounded the organism with its architecture. Construction now follows demographic closure.                      |
| Free workers or eggs hatching directly to costless adults as the final economy | **OBE.** Larval rearing makes workers capital and gives famine, storage, and exposure consequences on the colony ledger. Direct hatch may remain a narrow mechanics fixture. |
| A positive median near zero as economy acceptance                              | **OBE.** The world now requires substantial programmed surplus and broad controller support across unseen worlds.                                                            |
| Automatic continuation, checkpoints, or external restarts as a viability floor | **Rejected.** Automatic continuation may remain an operational full-world feature, but it stays off in scientific measurements and does not answer collapse resistance.      |
| A `colonyInTrouble` flag or equal free-energy subsidy                          | **Rejected.** Relief must arise from standing physics and preserve differential survival.                                                                                    |
| Comfortable torpor or permanently subsidized small colonies                    | **Rejected.** Every floor state must reproduce more poorly than health, or it becomes an evolutionary attractor.                                                             |
| Named storage rooms, brood vaults, or mandatory egg destinations               | **Rejected.** Their locations are observations. Famine survival, brood survival, and replacement are the gates.                                                              |
| Gross delivery events as germ-line merit                                       | **OBE.** Merit must represent conservation-accounted net new nest energy before it influences later evolution.                                                               |

<a id="colony-sources"></a>

## Source provenance

Primary source sections: [design specification §§6–9](../sources/design-spec.md),
[Appendix A §§A.3, A.7, and A.9](../sources/ant-sim-appendix-a.md),
[Appendix B §§B.3 and B.7–B.8](../sources/ant-sim-appendix-b.md),
[Appendix D steps 10–12](../sources/ant-sim-appendix-d.md),
[Appendix E](../sources/ant-sim-appendix-e.md), and
[Appendix G](../sources/ant-sim-appendix-g.md).
