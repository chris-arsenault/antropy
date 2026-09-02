# Seed spec — the three digging reflexes

The target competence list for the Phase 2 seed. It is exactly the rule set the scripted
oracle needed to dig a branched nest ([PHASE2-PLAN.md](../PHASE2-PLAN.md) steps 1–4) and
nothing else. Any behavior not on this list is out of scope for the seed.

## Architecture constraint

The controller has no direct input→output path: the genome is
`W_in (H×I) | W_rec (H×H) | b_h (H) | W_out (O×H) | b_out (O) | physical`. A constant
drive can therefore live in an output bias, but any sensor-driven reflex must relay
through a hidden unit. The seed uses **one dedicated hidden unit per sensor-driven
reflex** and leaves `W_rec` at zero — the hidden layer carries no memory, only relays.
Untouched loci stay zero; seed noise is applied on top by `seed()` as usual.

## Reflex 1 — dig-down bias

Sink a shaft with no sensory input at all.

| Locus | Value | Effect |
| ----- | ----- | ------ |
| `b_out[DIG]` | positive, past the action threshold | the terrain channel fires every tick |
| `b_out[VERTICAL_BIAS]` | negative, past −0.33 | dig and movement both target straight down |
| `b_out[FORWARD]` | positive | thrust to enter the hole just dug |

3 weights. Alone this reproduces the step-1/step-2 oracle: a clean one-voxel column.
The forward drive is not optional and was missing from the first draft of this spec: a
digger without thrust sinks exactly one voxel, cannot descend into it, and starves in
place (measured at step 8 — the pure seed reached depth 1 and died, while seed noise
that happened to be positive on this locus dug the full shaft).

## Reflex 2 — amplify

Mark the work site, and prefer the marked face.

| Locus | Value | Effect |
| ----- | ----- | ------ |
| `b_out[PHEROMONE_A]` | positive | marks channel A where the ant is working |
| `W_in[h_amp][PHEROMONE_A_LEFT]` | +g | left antenna raises the relay |
| `W_in[h_amp][PHEROMONE_A_RIGHT]` | −g | right antenna lowers it |
| `W_out[TURN][h_amp]` | +k | the ant turns toward the stronger mark |

4 weights, one hidden unit. Solo the rule is inert: an unexcavated neighbourhood carries
no marking, the stereo difference is zero, and reflex 1 carries.

## Reflex 3 — overflow

A crowded ant works sideways instead of down.

| Locus | Value | Effect |
| ----- | ----- | ------ |
| `W_in[h_crowd][CROWDING]` | +g | crowding raises the relay |
| `W_out[VERTICAL_BIAS][h_crowd]` | +k | cancels the down bias, so the dig targets the faced voxel |

2 weights, one hidden unit. This is what turns a queue on one shaft head into branches.

## Total

8 weights, 2 hidden units, `W_rec` zero. Nothing else is seeded — foraging, homing,
brood care, and heat response are explicitly **not** part of this seed.
