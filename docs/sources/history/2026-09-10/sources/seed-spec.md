# Seed spec — five digging reflexes plus transport

The Phase 2 seed contains exactly the competences needed to turn the step-4 scripted
oracle into a real-controller nest: marked-site dig-down, spoil haul/deposit, amplify,
overflow, and reacquisition by casting. Step 12 explicitly amends that base with a sixth
competence: local brood and food transport. Foraging, homing, and heat-escape behavior
remain outside this seed.

## Architecture constraint

The controller has no direct input→output path:
`W_in (H×I) | W_rec (H×H) | b_h (H) | W_out (O×H) | b_out (O) | physical`.
Sensor-driven terms therefore use dedicated hidden relays. All recurrence and hidden
biases stay zero. The five-reflex digger has 22 nonzero behavioral loci in six
memoryless relays. The step-12 functional seed has 54 nonzero behavioral loci in all 12
memoryless relays. Paired stereo, total-A, cancellation, and safe-temperature loci retain
equal magnitude where the predicate depends on their balance.

The old 2–4-locus guideline and ~20-locus target govern the step-6 digging seed. Step 12
is the appendix's explicit amendment point: material discrimination, contact handling,
and safe release add six relays rather than being hidden inside a procedural action.
The binding readability constraints remain unchanged—no hidden state, no recurrence,
no coordinates, and a linear-threshold decomposition checkable locus by locus.

## Reflex 1 — marked-site dig-down

Sink the founded shaft and do not dig quiet surface terrain.

| Relay/locus             |     Value | Effect                                |
| ----------------------- | --------: | ------------------------------------- |
| `b_out[VERTICAL_BIAS]`  | −2.000000 | unloaded movement and DIG target down |
| `b_out[FORWARD]`        | +0.700221 | thrust enters an opened voxel         |
| `W_in[h_site][A_LEFT]`  | +4.611572 | total local A raises the site relay   |
| `W_in[h_site][A_RIGHT]` | +4.611572 | symmetric half of the total-A gate    |
| `W_out[DIG][h_site]`    | +4.610979 | a marked site enables DIG             |

The step-8 O-layer fixture pre-marks the intended shaft mouth. With both A inputs quiet,
the site relay and DIG output are zero, so the unloaded ant casts instead of opening a
new surface hole.

## Reflex 2 — spoil haul/deposit

Load flips vertical bias upward. A second relay fires the shared DIG/deposit actuator
only when a loaded ant reaches low-A ground.

| Relay/locus                    |      Value | Effect                                             |
| ------------------------------ | ---------: | -------------------------------------------------- |
| `W_in[h_haul][CARRY_LOAD]`     |  +3.154215 | load raises the haul relay                         |
| `W_out[VERTICAL_BIAS][h_haul]` |  +6.702527 | loaded ant climbs                                  |
| `W_out[DIG][h_haul]`           |  −2.206419 | loaded ant does not dig/refill the marked shaft    |
| `W_in[h_dump][CARRY_LOAD]`     |  +4.190144 | load raises the dump relay                         |
| `W_in[h_dump][A_LEFT]`         | −11.808620 | channel A suppresses dumping at the shaft          |
| `W_in[h_dump][A_RIGHT]`        | −11.808620 | symmetric half of the anti-A gate                  |
| `W_out[DIG][h_dump]`           |  +2.901328 | low-A + loaded triggers deposit into an AIR target |

The site, haul, and dump contributions resolve four required cases through the ordinary
output threshold: quiet+empty off, marked+empty DIG, marked+loaded off, quiet+loaded
deposit. There is no ninth output and no oracle-only drop path.

## Reflex 3 — amplify

Reinforce the founded work site and steer toward the stronger forward A sample.

| Relay/locus                  |     Value | Effect                                    |
| ---------------------------- | --------: | ----------------------------------------- |
| `W_out[PHEROMONE_A][h_site]` | +0.446460 | high total A reinforces the existing mark |
| `W_in[h_amp][A_LEFT]`        | +3.098311 | left A raises the stereo relay            |
| `W_in[h_amp][A_RIGHT]`       | −3.098311 | right A lowers it                         |
| `W_out[TURN][h_amp]`         | +1.752951 | turn toward the stronger sample           |

The total-A site relay is shared with reflex 1. Quiet ground is not marked. Equal strong
A cancels in the stereo relay and releases control to straight taxis.

## Reflex 4 — overflow

A crowded digger works sideways instead of continuing the shaft.

| Relay/locus                     |     Value | Effect                                            |
| ------------------------------- | --------: | ------------------------------------------------- |
| `W_in[h_crowd][CROWDING]`       | +6.000000 | two neighbours raise the relay past its shoulder  |
| `W_out[VERTICAL_BIAS][h_crowd]` | +2.100000 | cancels the down bias into the neutral/faced band |

One neighbour leaves the ant digging down. Two or more move vertical bias into the
sideways band without switching off DIG.

## Reflex 5 — reacquisition by casting

When total A is low, turn at a constant rate until a forward sample reacquires the
trail. No accumulator, recurrence, last-choice state, or gradient memory is present.

| Relay/locus             |     Value | Effect                                         |
| ----------------------- | --------: | ---------------------------------------------- |
| `b_out[TURN]`           | +0.986716 | constant casting turn on quiet ground          |
| `W_in[h_cast][A_LEFT]`  | −5.601472 | total A drives the cancellation relay negative |
| `W_in[h_cast][A_RIGHT]` | −5.601472 | symmetric half of the total-A threshold        |
| `W_out[TURN][h_cast]`   | +0.986716 | saturated high A cancels the constant turn     |

Casting plus forward motion produces the predicted orbital/spiralling return, not a
beeline: the certified step-8 trace accumulated 25.3 full-turn equivalents and stayed
within radius 2.24 of the shaft.

## Reflex 6 — local cargo transport

The transport competence does not know a source, destination, route, nest shape, or
oracle waypoint. Contact chooses pickup. Carried type chooses vertical tendency. The
existing local liabilities choose release: low temperature for brood, low channel A for
food. Deterministic motor jitter varies headings by world seed, ant identity, and tick,
so colocated ants do not remain in behavioral lockstep.

### Contact and occupied mandibles

The contact relay is an unloaded-contact threshold. Its bias is compensated in the
output biases, so an ant with no contact behaves exactly like the five-reflex digger.

| Relay/locus                       | Value | Effect                                            |
| --------------------------------- | ----: | ------------------------------------------------- |
| `W_in[h_contact][CONTACT_EGG]`    |   +14 | grounded brood raises the relay                   |
| `W_in[h_contact][CONTACT_FOOD]`   |   +14 | grounded food raises the relay                    |
| `W_in[h_contact][CARRY_LOAD]`     |   −28 | occupied mandibles suppress another pickup        |
| `W_in[h_contact][BIAS]`           |    −7 | shifted unloaded-contact threshold                |
| `W_out[FORWARD][h_contact]`       |  −0.7 | arrest approach at contact                        |
| `W_out[VERTICAL_BIAS][h_contact]` |    +1 | move the inherited down aim into the faced band   |
| `W_out[DIG][h_contact]`           |    +2 | shared `DIG` actuator picks up the contacted item |
| `W_out[EAT][h_contact]`           |   −12 | handle contacted cargo instead of consuming it    |
| `W_out[EAT][h_haul]`              |    −8 | loaded mandibles cannot eat another item          |

`EAT` resolves before translation, at the pose represented by `CONTACT_*`. This shared
world ordering matters: resolving it after movement let an ant consume an item it had
not sensed, making contact-gated care inexpressible. `DIG` remains after motion because
that order drives the certified dig/descend and haul/deposit loop.

### Cargo direction

An egg has positive `CARRY_LOAD` and zero `CARRIED_MATERIAL`; FOOD is material code 4/8.
The food pair is a band-pass because loose fill is 5/8: a monotone "high material"
predicate would send stored spoil down with food.

| Relay/locus                           | Value | Effect                                    |
| ------------------------------------- | ----: | ----------------------------------------- |
| `W_in[h_egg][CARRY_LOAD]`             |   +10 | carried egg raises its relay              |
| `W_in[h_egg][CARRIED_MATERIAL]`       |   −64 | any voxel material excludes the egg relay |
| `W_in[h_egg][BIAS]`                   |    −7 | shifted egg threshold                     |
| `W_out[VERTICAL_BIAS][h_egg]`         |  −3.8 | egg descends                              |
| `W_out[DIG][h_egg]`                   |    −8 | hot egg stays loaded                      |
| `W_in[h_food_low][CARRIED_MATERIAL]`  |   +16 | lower edge of the FOOD band               |
| `W_in[h_food_low][BIAS]`              |    −6 | threshold below FOOD's 4/8 code           |
| `W_out[VERTICAL_BIAS][h_food_low]`    |    −6 | FOOD and higher codes descend             |
| `W_in[h_food_high][CARRIED_MATERIAL]` |   +24 | upper edge of the FOOD band               |
| `W_in[h_food_high][BIAS]`             | −13.5 | threshold between FOOD and loose fill     |
| `W_out[VERTICAL_BIAS][h_food_high]`   |    +7 | restore upward hauling above FOOD         |

The result is categorical under the implemented v1 bands: eggs and FOOD descend;
TOPSOIL, CLAY, and LOOSE_FILL retain the inherited upward haul.

### Brood release and stable storage

Two balanced relays compare the loaded-egg predicate with the grounded-contact
predicate. At safe temperature, the carried half enables putdown and the grounded half
prevents immediate pickup. At hot temperature their contributions cancel, so brood
remains loaded and continues downward. FOOD release reuses the inherited low-A dump
rule; safe grounded food is likewise not immediately re-picked.

| Relay/locus                          | Value | Effect                                    |
| ------------------------------------ | ----: | ----------------------------------------- |
| `W_in[h_safe_egg][CARRY_LOAD]`       |   +10 | loaded half of the safe-release predicate |
| `W_in[h_safe_egg][CARRIED_MATERIAL]` |   −64 | restrict it to eggs                       |
| `W_in[h_safe_egg][TEMPERATURE]`      |   −20 | only the cool band raises the relay       |
| `W_in[h_safe_egg][BIAS]`             |    −5 | safe-temperature threshold                |
| `W_out[DIG][h_safe_egg]`             |   +10 | put down carried brood                    |
| `W_in[h_safe_contact][CONTACT_EGG]`  |   +10 | grounded brood half                       |
| `W_in[h_safe_contact][CONTACT_FOOD]` |   +10 | grounded stored-food half                 |
| `W_in[h_safe_contact][TEMPERATURE]`  |   −20 | same temperature threshold                |
| `W_in[h_safe_contact][BIAS]`         |    −5 | balanced with the carried half            |
| `W_out[DIG][h_safe_contact]`         |   −10 | prevent immediate re-pickup               |

Resting-activation compensation produces final functional-seed output biases of
`FORWARD=0.000222`, `VERTICAL_BIAS=−3.799922`, `EAT=−11.999980`, and
`DIG=−5.999990`. The relays' resting projections restore the five-reflex outputs when no
transport stimulus is present; the biases are not extra modes.

## Total and certification

The digging base has 22 nonzero behavioral loci and 6 hidden relays. The functional
step-12 vector has 54 nonzero behavioral loci and 12 hidden relays. Both have no hidden
bias and `W_rec` entirely zero. The digging weights were derived only by magnitude
changes inside their topology. An early
unconstrained ES candidate was rejected because it split paired stereo weights and
replaced balanced taxis with a constant turn.

The claim that amplify could also reacquire a trail directly aft is falsified. With the
channel-A maximum at bearing π, both forward antennae sample the same concentration;
`A_LEFT − A_RIGHT = 0`, so a pure stereo relay emits no turn. This geometry caused the
old four-reflex seed to complete nine spoil cycles away from the intended column while
deepening it by one voxel.

Three hand-written casting drives (0.25, 0.5, 1.0) did not pass step 8. The constrained
diagonal-ES escalation retained the authorized signs, tied pairs, zero recurrence, and
22-locus topology. Ledger run 50 produced the certified exact vector:

- step 7: all isolated reflex assays and the 23-input loopback pass;
- step 8, world seed 9950: depth 8, 16 final excavated voxels, 2 mouth-widening voxels,
  0 off-mouth surface divots, 6 completed spoil round trips, completion at tick 280,
  energy 0.532631, alive;
- step 9, world seed 9900: seeded crew volume 70, 9 levels, maximum width 22, and
  25 branch voxels; the dig-down-only control remains a 17-level, width-1 line;
- step 12 construction retention with motor jitter active: the noisy functional crew
  produces volume 92, 10 levels, maximum width 35, and 26 branch voxels;
- step 12 brood ledger: three noisy eight-ant crews pick up and deliver all six fixed
  eggs; RNN and oracle survival are both 6/6 after 600 ticks;
- step 12 storage ledger: one noisy functional-seed crew constructs the route with motor
  jitter active, then three fresh noisy crews are scored on food transport and storm
  retention through cloned copies of that construction scenario; all 3/3 caches survive,
  at recorded depths 1, 0, and 1 relative to the original local surface.

`seed()` noise does not guarantee competence in every individual founder: in the fixed
three-founder sample, two excavated at least four voxels and the sample excavated 38 in
aggregate. The ladder's noisy-population claim is step 9, which passes with eight
founders; step 8 certifies the exact hand-written vector.
