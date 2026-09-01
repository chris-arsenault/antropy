# Appendix B: Bootstrap Viability — Controller Capacity, World Calibration, and Incentive Construction

*Supplement to the Ant Evolution Simulation Design Specification — August 2026, Rev. A.
Appendix A (evolutionary dynamics and within-lifetime learning) is frozen; this appendix does not
amend it.*

> **Abstract.** The evolutionary machinery of Appendix A presumes a starting condition it does not
> itself provide: a world in which at least one expressible behavior is viable, a seeded
> population that actually expresses it, and an incentive structure under which the target
> behaviors (provisioning, excavation, defensible architecture) dominate their alternatives. The
> observed failure mode — seeded ants wander in circles and die, across all seeds — is
> characteristic of a fault in this layer, not in evolutionary dynamics or controller capacity.
> This appendix provides: (i) a capacity-auditing method for the behavioral controller, replacing
> the nonexistent "formula for hidden units"; (ii) a nondimensionalization of the world parameters
> into viability ratios with derivable bands; (iii) an **oracle ladder** of scripted cheat-agents
> that bisects faults between world, sensory interface, seed, and evolvability; (iv) an automated
> calibration harness; (v) the **liability principle** of incentive design, with the per-behavior
> selection-channel map; and (vi) a comparative **oracle tournament** protocol for tuning the
> world so that underground colony construction dominates surface living, together with the
> seeded-construction pipeline. Design Rules continue Appendix A's numbering.

---

## B.1 Scope and Diagnostic Posture

Appendix A answers *"will the population evolve?"*; Appendix B answers *"will the population
boot?"* The layers are strictly ordered, and faults must be attacked bottom-up:

$$\text{world viability} \;\to\; \text{interface sufficiency} \;\to\; \text{seed correctness} \;\to\; \text{incentive ordering} \;\to\; \text{evolvability (App. A)}.$$

A symptom note that governs this appendix: **"wanders in circles, then dies, across all seeds" is
not a capacity symptom.** Chemotaxis requires zero hidden units (§B.2.2); if seeded ants are not
even gradient-climbing, the fault is upstream — no climbable gradient exists (§B.3, §B.6), the
seed does not implement what it is believed to implement (§B.4 rung 3), or the energy economy is
unviable for *any* behavior (§B.3, §B.4 rung 1).

---

## B.2 Controller Capacity: Auditing Instead of Formulas

### B.2.1 Why the theory you'd want doesn't exist

Universal-approximation results [[1]](#references) and the Turing-completeness of rational-weight
RNNs [[2]](#references) certify that the $20 \to 12 \to 8$ recurrent controller is *expressively*
sufficient by an enormous margin — and are useless for sizing, because they answer "does a weight
setting exist," not "will search find it," and give no practical bound on hidden width for a given
task. VC-style capacity bounds scale with weight count and are equally silent on the practical
question. There is no formula. There are three methods, in increasing order of effort, that
together give a real answer.

### B.2.2 Method 1 — state-variable audit

Hidden units are the ant's only memory; recurrence is spent exclusively on quantities that must be
*tracked across ticks*. Audit the target behavior for its independent state variables:

| Competence | State variables | Hidden-unit demand |
|---|---|---|
| Chemotaxis (climb scent gradient) | 0 — pure reflex | 0 |
| Scent-loss persistence ("recently smelled food, continue") | 1 leaky accumulator | 1–2 |
| Behavioral mode (forage / carry / return as de facto states) | $\log_2(\text{modes})$ bits | 1–2 bistables |
| Give-up timer | 1 per timer | 1 |
| Path integration (dead-reckoned home vector) | 2 continuous accumulators | 2, **but** requires near-marginal recurrent eigenvalues $\lambda \approx 1$ — trivially representable, hard to evolve |

Sum for a competent basic forager: **4–7 state variables**. Sizing rule of thumb: hidden width
$\ge 2$–$3\times$ the audit sum (redundancy; evolved solutions are sloppy). The specified 10–12
units clears the basic-colony repertoire. The same audit applies to linear-GP persistent
registers; required effective-code length for these competences is tens of instructions, also
within spec. **Capacity is not the observed problem.**

### B.2.3 Method 2 — constructive proof (hand-derive the weights)

For each competence required at bootstrap, write the implementing weights explicitly. Success is a
proof-by-construction of sufficiency *and* yields the seed and its unit test simultaneously.
Chemotaxis: $\text{turn} \propto (s_L - s_R)$, thrust constant — four weights.

The exercise surfaces a load-bearing design fact: **homing needs memory only if the world
withholds the memory.** If the nest emits a scent field (or a colony pheromone channel is seeded
to that use), homing is a second taxis — zero hidden units — and the capacity demand of the whole
bootstrap repertoire collapses to near-reflex. This is the Appendix A memory hierarchy applied in
reverse: hard state (*where is home?*) moved out of the brain into the world. Real ants hedge the
same way (nest odor and landmarks alongside path integration [[3]](#references)). A build that
expects homing without a home gradient produces ants that find food and cannot deliver it — a
sufficient explanation of colony death on its own.

> **Design Rule 4 (Reflexive bootstrap).** Every behavior required for colony viability at
> $t = 0$ must be expressible *reflexively* (zero hidden state) against the shipped sensor set.
> Memory-requiring competences are permitted as evolutionary upgrades, never as bootstrap
> requirements.

### B.2.4 Method 3 — trainability probe (the empirical capacity ruler)

When a competence cannot be hand-constructed, measure whether the architecture can host it: lift
the network out of the simulation and optimize it directly — CMA-ES [[4]](#references) on the
weights, or backprop on a differentiable copy — against a supervised/episodic probe version of the
task (follow a gradient; hold heading after scent loss; return to origin; switch modes on cue).
Direct optimization strictly dominates in-world evolution, giving a one-way test:

- CMA-ES **fails** to fit the probe at hidden width $n$ ⇒ in-world evolution never will; widen or
  restructure.
- CMA-ES **fits easily** ⇒ capacity is cleared; any in-world failure is a selection/ecology
  problem, not architecture.

Run the probe ladder once per architecture decision; the result is the empirical answer to "how
many hidden units," with confidence intervals, in minutes. Byproduct: optimized weights per
competence — inputs to the seed pipeline (§B.9.3).

---

## B.3 Viability Ratios: Nondimensionalize Before Tuning

Raw parameters (food energy, decay rates, carry capacity, metabolism, speed, …) do not act
independently; viability depends on a small set of **dimensionless ratios**, each with a
derivable band. Tune ratios, not knobs.

| # | Ratio | Definition | Band / condition | Failure mode outside band |
|---|---|---|---|---|
| R1 | Trip profitability | $V = \dfrac{E_{\text{food}}}{m \cdot T_{\text{trip}}}$, $T_{\text{trip}} \approx 2d/v$ | $V \ge 3$–$5$ at typical food distance | $V \le 1$: foraging is net-loss; **no behavior survives** (the "too low" edge, computable in advance) |
| R2 | Satiation | $E_{\text{food}} / E_{\text{tank}}$ | $\approx 0.1$–$0.3$ | $\to 1$: one item fills the tank, individual loses its foraging gradient (the "too high" edge). Surplus demand must route through the colony sink (queen + stockpile drawdown); absent that loop, "got one piece and stopped caring" is correct behavior, not mistuning |
| R3 | Scent horizon | $R_{\text{detect}} / \bar d_{\text{food}}$ | comfortably $> 1$ at bootstrap | $< 1$: search is blind random walk; discovery time races starvation; **prime suspect for circles-until-death** — an ant outside every gradient has no signal, and its motion is whatever its output biases dictate (§B.6) |
| R4 | Foraging radius | $R_{\max} = \dfrac{E_{\text{tank}} \cdot v}{2m}$ | food spawned within $R_{\max}$ | food beyond $R_{\max}$ is decorative |
| R5 | Trail persistence | $T_{\text{trip}} \ll t_{1/2} \ll T_{\text{patch}}$; $\lambda^{T_{\text{trip}}}$ above sensory floor; $k$ reinforcing trips accumulate above threshold | both inequalities strict | violated either way looks identical from outside: "pheromones seem useless" |
| R6 | Dig economics | founding-chamber cost / worker lifetime energy budget | $\lesssim 0.1$ at v1 | above: digging correctly ignored by any sane controller |
| R7 | Ecosystem closure | $K = F_{\text{in}} / \bar m$ vs. minimum viable colony size | $K \ge$ min viable | below: the run is dead at the spreadsheet stage — no simulation needed |

**Procedure:** derive bands analytically where possible; set defaults at band *centers* (maximum
margin — evolution will push toward edges on its own); log every ratio live so drift out-of-band
is visible at a glance.

---

## B.4 The Oracle Ladder: Fault Bisection by Scripted Cheat-Agents

Ratios bound the space; oracles *localize the fault*. An oracle is a scripted policy that bypasses
the neural controller entirely and drives the same body through the same world API — a state
machine, not a network. (This is the deferred Braitenberg controller-#0 scaffold
[[5]](#references) returning at lower cost: the price of having skipped it is exactly "cannot
tell world bugs from brain bugs.")

| Rung | Oracle | Knows / uses | Question answered | If it fails here |
|---|---|---|---|---|
| 1 | **Omniscient** | all food positions; beelines and returns | Is the world generous enough for *any* behavior? | Fix the world (R1, R4, R7). Touch nothing else. |
| 2 | **Sensor-limited** | *only the shipped ant sensors*: climbs strongest visible gradient, homes on nest scent, wanders when blind | Is the **sensory interface** sufficient? | Fault is in the perception contract (R3, stereo baseline, missing home signal). **No controller — evolved or hand-built — can fix it.** |
| 3 | **Seed unit test** (assay arena) | the actual seeded network vs. synthetic stimuli: does it turn toward a gradient? | Is the seed what we think it is? | Fix the seed mapping (§B.6 item 5). |
| 4 | **Degraded** | rung 2 + sensor noise and actuation lag | How much margin does the world leave for the sloppy behavior early evolution will produce? | Widen margins (recentre ratios) before blaming evolution. |

Only after rung 4 passes is Appendix A's machinery even in play. The current all-seeds failure
should be attacked bottom-up through this ladder; the prior is a fault at rung 1 or 2.

---

## B.5 The Calibration Harness

With parameters as ratios and oracles as agents, tuning is automatable:

1. Headless batch runs short simulations over a Latin-hypercube [[6]](#references) or grid sample
   of ratio vectors, populated with **rung-2 oracle** colonies.
2. Record colony survival time, delivery rate, and the colony ledgers of §B.8.2.
3. Bisect along each ratio axis for the viability edges; characterize the viable polytope; plant
   defaults at its Chebyshev center.
4. **Rerun the identical harness with seeded-RNN ants.** The gap between the oracle polytope and
   the seeded polytope **is the behavioral shortfall, quantified** — the precise, ongoing answer
   to "is it the behavior or the parameters."

Hundreds of short runs is an unattended batch at Appendix A §A.2 tick rates.

---

## B.6 Diagnostic: The Circling Checklist

Five causes account for nearly all "circles then dies" in steering agents; check in order:

1. **Nonzero output bias.** $\tanh(b) \ne 0$ at zero input is a constant turn rate — a perfect
   circle. Seeds must zero all output biases; verify the turn output is antisymmetric under
   left/right sensor swap.
2. **No gradient reaching the ant.** Log sensor histograms; food-scent inputs ~always zero means
   the ant has never seen food in its life, and circling is just its bias term (R3). Maintain a
   **gradient-visibility map** — fraction of map area where $\lVert \nabla s \rVert$ exceeds
   sensory resolution — to make this glance-diagnosable.
3. **Stereo baseline too small.** Antenna separation vs. gradient length-scale: if the $s_L - s_R$
   difference is below numeric/sensory resolution, chemotaxis weights multiply zero.
4. **Input normalization.** Unscaled inputs saturating $\tanh$ kill differential response.
5. **Sign error in the seed mapping.** Caught in seconds by the rung-3 assay unit test; never by
   post-hoc staring.

---

## B.7 Incentive Architecture: The Liability Principle

> **Design Rule 5 (Liability principle).** In a fitness-function-free system, behaviors are not
> incentivized by rewards; they are incentivized by liabilities. A behavior is selected for if
> and only if the world **charges for its absence**, through some selection channel, at that
> channel's speed. A world that charges for nothing selects for nothing but wandering.

### B.7.1 Per-behavior channel map

| Behavior | Liability charged for its absence | Selection channel | Relative speed |
|---|---|---|---|
| Provisioning (bring food back) | starvation of self, brood, and patriline; loss of succession weight | individual survival + merit succession + worker-laid sons ($rb > c$ kin logic [[7]](#references)) | **fast** (highest-$h^2$ channels, App. A §A.3.4) |
| Digging / shelter | surface metabolic surcharge; egg exposure mortality; weather losses (§B.7.3) | individual (microclimate: within-lifetime payback) + reproductive (egg placement) | **medium**, once liabilities exist |
| Defensible architecture | colony death by raid; egg predation; stockpile theft | **colony channel only** — payoff spans many lifetimes; fails every individual gate of App. A §A.7 | **slow, least reliable**; requires inter-colony contact era |

The predicted emergence order — provisioning, then excavation, then (possibly, late) defensive
architecture — follows from channel speed and is to be treated as a testable expectation, not a
promise.

### B.7.2 The merit counter is a smuggled fitness function — Goodhart accounting required

Merit-weighted succession (spec §7) is an authored objective on the colony's germ-line channel,
and it scores *delivery only*. Two mandated consequences:

1. **Anti-Goodhart accounting** [[8]](#references): the succession counter must credit **net new
   energy into the nest**, conservation-accounted — never gross deposits, which select for
   withdraw-and-redeposit fraud and single-item shuttling.
2. **Metric narrowness is a real force.** A delivery-only metric *penalizes* excavation and
   defense on the fastest channel (every digging tick is a non-delivering tick). Either broaden
   the counter (authored relative values — honest, but designer-flavored) or accept that
   non-provisioning behaviors are carried entirely by the slower channels of §B.7.1. The default
   is the latter, revisited if excavation fails to emerge under correctly tuned liabilities.

### B.7.3 Required liability features (world additions)

- **Microclimate stratification:** metabolic cost multiplier as a function of depth ×
  season/diurnal phase; surface expensive at extremes, depth stable. Passes all four App. A
  learnability/selectability gates *individually* — the fast-selecting shelter incentive.
- **Egg exposure:** surface incubation mortality $p_s >$ buried mortality $p_b$ (weather,
  temperature; predation later).
- **Weather events:** rain destroys surface stockpiles and washes surface pheromone; above-ground
  storage loses its first monsoon.
- **Raid pressure** (staged later, with inter-colony contact): egg predation, stockpile theft,
  worker combat — all already latent in existing mechanics (eat-egg, edible corpses, shared map).
- Note the scripted founding chamber already shelters early colonies minimally; these features
  price the *elaboration* — deeper brood vaults, storage galleries — as marginal-value decisions,
  the right shape for evolution to act on.

---

## B.8 Comparative Calibration: Tuning the World So Underground Construction Wins

Viability oracles (§B.4) answer an absolute question. Making ants *build* is comparative: the
target is a **dominance ordering among strategies**, tuned by tournament.

### B.8.1 The strategy-spectrum oracles

Scripted state machines on the same body/motor API:

- **O-surface** — competent forager (reuse rung-2 policy); never digs; rests, lays, stores on the
  surface.
- **O-shelter** — identical, plus retreats to the scripted founding chamber during thermal
  extremes and lays eggs inside.
- **O-architect** — additionally excavates a brood chamber and storage gallery to fixed
  dimensions, hauls spoil out, relocates stockpile and eggs underground.
- **O-fortress** — all of the above, deep placement, constricted entrance; prices the far end of
  the depth/defense economics.

### B.8.2 Tournament protocol and target ordering

Run each policy as a full colony over **at least one complete seasonal cycle** (the liabilities
are event-shaped; averages hide them). Score on colony ledgers: worker-days lived, net nest
energy, egg survival fraction, stockpile retained across weather events.

> **Design Rule 6 (Dominance tuning).** The world is correctly tuned for construction when
> $$\text{O-surface} \;\prec\; \text{O-shelter} \;\prec\; \text{O-architect}$$
> holds strictly, with margin, in **every** season phase — and O-fortress lands wherever the
> intended depth economics place it. If O-surface wins, the liabilities are decorative. If
> O-surface simply dies, the world is overtuned: founding queens begin with nothing but a
> scripted chamber, so surface life must be **survivable-but-inferior, never lethal**.

**Ablation worlds:** rerun the tuned world with each liability switched off. Microclimate off ⇒
O-shelter's edge over O-surface must collapse; rain off ⇒ underground storage's edge must
collapse. An edge that survives its ablation means the tuning rests on something unintended.

### B.8.3 Payback inequalities (the construction ratios)

- **Shelter payback:** a chamber costing $E_{\text{dig}}$ saving metabolic differential
  $\Delta m$ per occupied tick at occupancy $u$ pays back in
  $$T_{pb} = \frac{E_{\text{dig}}}{\Delta m \cdot u}.$$
  Require $T_{pb} \ll$ worker lifespan for personal shelter (individually selectable) and
  $\ll$ colony generation for brood vaults (colony channel). This couples thermal amplitude,
  per-material dig cost, and lifespan into one number per chamber type.
- **Egg relocation:** burying pays when
  $(p_s - p_b) \cdot E_{\text{endowment}} > E_{\text{dig+carry}}$ per egg.
- **Storage insurance:** expected rain loss per surface stockpile-tick vs. amortized gallery
  excavation.
- **Depth setpoint:** make the stability benefit **saturate** with depth while dig cost **rises**
  through material layers; the intersection *is* the intended nest depth. O-fortress vs.
  O-architect measures whether it sits where designed.

Harness: identical machinery to §B.5, with response variable the **dominance gap**
(O-architect ledger − O-surface ledger); map the polytope where the gap is robustly positive;
defaults at its center.

### B.8.4 The gradient must be smooth: the increment series

A world where the *finished* nest beats the surface can still be unclimbable if a half-dug nest is
pure cost — neither lifetime learning nor evolution crosses a payoff valley to reach a payoff
peak.

> **Design Rule 7 (Concave construction payoff).** Marginal shelter benefit must be positive from
> the first voxel: one divot shaves some exposure, three shave more, a chamber more still — no
> thresholds where value switches on only at completion. Verify with the **increment series**
> O-dig(1), O-dig(5), O-dig(20), O-dig(chamber): colony ledgers must improve monotonically along
> the series. A plateau or dip is a flat spot where digging behavior will stall; the fix is the
> **shape** of the microclimate/exposure functions, not their magnitude.

---

## B.9 From Tuned World to Building Behavior: The Seeded-Construction Pipeline

### B.9.1 Reflexive dig triggers

Per Design Rule 4, bootstrap construction is reflex-expressible: "exposed + thermal stress → dig
downward," "crowded + inside → dig laterally" are 2–3-weight mappings against the shipped sensor
set (depth/darkness, local solidity, crowding, thermal stress via energy-drain rate), seedable and
verifiable by the rung-3 assay and the §B.2.4 probe.

### B.9.2 Stigmergic amplification

Bias digging toward faces adjacent to existing air; optionally deposit a dig-site marker on one of
the unlabeled pheromone channels. Local rules plus environmental traces and templates are the
established mechanism by which social-insect construction yields chambers and galleries with no
blueprint anywhere [[9]](#references), [[10]](#references), [[11]](#references): individually
shaped divots, collectively coherent architecture.

### B.9.3 Seed derivation and portfolio integration

Hand-writing seeds is unnecessary and error-prone (§B.6 item 5). Derive them: run CMA-ES against
the probe ladder — or against short assay-arena episodes with the rung-2 / O-shelter oracle as
the behavioral target — and let optimization produce founder weights. This does not violate the
no-fitness-function principle: **the run has no fitness function; initialization is allowed to be
smart.** "Optimized instinct, evolved thereafter" is the structured-init philosophy with the
hand-tuning replaced by something that works. It composes directly with the Appendix A §A.5 seed
portfolio: optimizing several seeds against different probe subsets (forager-forward,
digger-forward, wanderer, pheromone-reactive) yields the behavioral-hypothesis diversity for
free. Add the **digger seed** (B.9.1 reflexes) to the portfolio and validate it against the
tournament: it should land between O-surface and O-shelter on the ledgers — a sloppy version of
the latter.

Acceptance gate for the whole pipeline: liabilities tuned by tournament (Rule 6) → smooth
marginal payoffs verified by increment series (Rule 7) → reflexive-plus-stigmergic digging seeded
and unit-tested (rung 3) — evolution then free to *elaborate* rather than obligated to *invent*.

---

## B.10 Constraint Summary

| Quantity | Constraint | Source |
|---|---|---|
| Bootstrap repertoire | reflex-expressible against shipped sensors; memory competences are upgrades only | Rule 4 |
| Home signal | nest scent field (or seeded channel) present at $t=0$ | §B.2.3 |
| Hidden width | $\ge 2$–$3\times$ state-variable audit; confirmed by CMA-ES probe | §B.2.2, §B.2.4 |
| Trip profitability $V$ | $\ge 3$–$5$ at typical food distance | R1 |
| Satiation $E_{\text{food}}/E_{\text{tank}}$ | $0.1$–$0.3$; colony sink loop functional | R2 |
| Scent horizon | $R_{\text{detect}}/\bar d_{\text{food}} > 1$ at bootstrap | R3 |
| Trail persistence | $T_{\text{trip}} \ll t_{1/2} \ll T_{\text{patch}}$ | R5 |
| Ecosystem closure | $K \ge$ minimum viable colony size, checked pre-run | R7 |
| Succession counter | net new nest energy, conservation-accounted | §B.7.2 |
| Liability set | microclimate × depth × season, egg exposure, weather events; raids staged later | §B.7.3 |
| Dominance ordering | O-surface ≺ O-shelter ≺ O-architect, every season phase, with margin; surface survivable-but-inferior | Rule 6 |
| Ablation check | each liability's removal collapses its corresponding edge | §B.8.2 |
| Construction payoff | concave from first voxel; increment series monotone | Rule 7 |
| Shelter payback $T_{pb}$ | $\ll$ worker lifespan (personal), $\ll$ colony generation (brood) | §B.8.3 |
| Seeds | derived by probe/oracle-targeted optimization; portfolio-diverse; rung-3 unit-tested | §B.9.3 |

---

## References

1. G. Cybenko, "Approximation by superpositions of a sigmoidal function," *Math. Control Signals
   Systems* 2, 303–314, 1989; K. Hornik, M. Stinchcombe, and H. White, "Multilayer feedforward
   networks are universal approximators," *Neural Networks* 2(5), 359–366, 1989.
2. H. T. Siegelmann and E. D. Sontag, "On the computational power of neural nets," *J. Computer
   and System Sciences* 50(1), 132–150, 1995.
3. R. Wehner, "Desert ant navigation: how miniature brains solve complex tasks," *J. Comparative
   Physiology A* 189, 579–588, 2003. (Path integration alongside nest odor and landmark cues in
   *Cataglyphis*.)
4. N. Hansen and A. Ostermeier, "Completely derandomized self-adaptation in evolution
   strategies," *Evolutionary Computation* 9(2), 159–195, 2001. (CMA-ES.)
5. V. Braitenberg, *Vehicles: Experiments in Synthetic Psychology*. MIT Press, 1984.
6. M. D. McKay, R. J. Beckman, and W. J. Conover, "A comparison of three methods for selecting
   values of input variables in the analysis of output from a computer code," *Technometrics*
   21(2), 239–245, 1979. (Latin hypercube sampling.)
7. W. D. Hamilton, "The genetical evolution of social behaviour, I & II," *J. Theoretical
   Biology* 7, 1–52, 1964. (Inclusive fitness; $rb > c$.)
8. M. Strathern, "'Improving ratings': audit in the British university system," *European
   Review* 5(3), 305–321, 1997. (Goodhart's law formulation: a measure that becomes a target
   ceases to be a good measure.)
9. P.-P. Grassé, "La reconstruction du nid et les coordinations interindividuelles chez
   *Bellicositermes natalensis* et *Cubitermes* sp. La théorie de la stigmergie," *Insectes
   Sociaux* 6, 41–80, 1959.
10. G. Theraulaz and E. Bonabeau, "Coordination in distributed building," *Science* 269(5224),
    686–688, 1995. (Local stigmergic rules producing coherent insect architecture.)
11. A. Khuong, J. Gautrais, A. Perna, C. Sbaï, M. Combe, P. Kuntz, C. Jost, and G. Theraulaz,
    "Stigmergic construction and topochemical information shape ant nest architecture," *PNAS*
    113(5), 1303–1308, 2016.
