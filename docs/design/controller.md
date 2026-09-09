# Controller, sensors, and embodiment

The [autonomous construction extension](construction-pressures.md) exposes 132 inputs and 27
request kinds to programmed/LGP ants. Local climate and timestamped shared site/traffic/care
observations feed the mutable seed's work selection. The same expression compiles to 2,828 LGP
instructions. The kernel never chooses a build site or task. Brood transport and explicit work
proposals share the paid local resolver; manual orders are optional diagnostics.

This document owns what a creature senses, what it can attempt, and the boundary behind which a
future heritable controller lives. World physics and carriers belong in
[environment](environment.md); behavioral evidence belongs in
[experimentation](experimentation.md).

<a id="controller-goal"></a>

## Goal and boundary

Current controller work follows [colony knowledge and LGP](colony-knowledge.md): shared observed
locations, controller-selected route acquisition, direct/forward/backward movement, local physical
interactions and an opaque task byte. Programmed and linear-program ants share that interface.
The local-only interfaces and neural studies below remain historical comparisons, not restrictions
on the September 8 design. RNN-specific work is canceled. Next, establish the
[2,000-worker physical and runtime baseline](colony-scale.md) before genetics.

The previous controller is the [programmed colony policy](programmed-colony.md). Every worker uses
its own local frame to forage, eat, deposit and feed. It reports its current decision mode through
the user-authorized private task byte. Physical decisions retain their previous local logic without
coordinates, selected targets or world reference. Its additional contact observations and feeding
actions were explicitly authorized by the user.

The original 33-input stateless forager and map-aware oracle remain transport diagnostics. The
old recurrent comparison remains uncertified. A subsequent user-authorized
[full-colony training study](colony-training.md) added the feeding interface but failed its
closed-loop survival gates. Its artifacts are retained in the harness, not installed as defaults.
The [shared directional follow-up](directional-training.md) also fails survival. Its private
four-command ledger influences learned movement but does not prohibit oscillation or enable queen care.
The subsequent [outcome experiment](outcome-training.md) retains that architecture as initialization
and selects recurrent weight changes from physical colony outcomes. It uses no action targets or
programmed fallback. Global outcome measurements belong to the trainer, never to worker inputs.
The bounded study improves care after programmed preparation but its frozen candidate fails all
three fresh 48,000-tick worlds. Loaded workers never encounter recipients; matched programmed
controls pass. This establishes a failed learned return loop, not insufficient local sensing.

<a id="controller-contract"></a>

## Controller and body contract

This section records the historical local action interface. Current programmed/LGP requests,
candidate inputs, persistent registers and task writes are specified in
[colony knowledge](colony-knowledge.md#programmed-controller-and-lgp).
The [construction extension](construction.md) adds work requests and local digging, spoil,
queen transport and cache actions to both the programmed policy and compiled LGP seed.

The embodied action is:

```ts
{ turn: -1 | 0 | 1, move: boolean, mandible: boolean,
  pheromoneA: number, pheromoneB: number, eat: boolean, feed: boolean, release: boolean,
  task: number | null }
```

Turning, moving, and operating the mandible are mutually exclusive at resolution time. A turn
changes one of eight headings and consumes the tick. A move attempts the adjacent cell in the
current heading. The mandible acts on the directly forward cell: it picks up a food object when
unloaded or deposits a carried load when facing the CACHE. Bounded pheromone output is applied at
the new cell only after successful translation. The world applies every precondition and cost.

The generic controller boundary exposes `seed`, `createState`, `act`, `mutate`, `recombine`,
`genomeDistance`, and state inspection. Genome and controller-state types are opaque outside the
controller. The programmed policy implements only `act` over one sensor frame and has no
controller state.

<a id="controller-senses"></a>

## Sensory surface

The retained navigation vector has 33 values:

- open forward, left, and right;
- food odor, deep nest odor, pheromone A, and pheromone B, each represented by center concentration
  and signed relative contrast at forward, left, right, wide-left, and wide-right adjacent cells;
- forward antennal contact with food and cache material in the immediately adjacent cell;
- carried-load state;
- vertically occluded and depth-attenuated light;
- deterministic per-tick motor jitter; and
- deterministic individual handedness.

The colony additionally receives eight occluded two-cell contact samples for food, queen presence
and hungry recipients, one-cell occupancy, crop quantity and internal reserve fraction. Pickup
and release still act one cell forward; feeding has two-cell reach. These facts are sampled for
each worker independently.

The [matched sensory contract](colony-sensory-contract.md) rounds observations to float32 before
either programmed decisions or neural contrast normalization. New directional artifacts retain
the explicit carrying Boolean. Physical energy storage keeps its existing precision. The corrected
interface sustains three programmed worlds, but both old and new controls have long turn sequences
that remain a motion-review concern.

All directional values are relative to embodied heading and derive only from current adjacent
cells. Relative chemical contrast is receptor transduction, not a path solution: it can be flat,
misleading, or absent as fields diffuse and decay. The interface exposes neither X/Y coordinates
nor a selected source. Deterministic variation lets equal local choices differ between creatures
without sacrificing reproducibility.

Future sensors must represent a local physical carrier, have a cost when appropriate, pose a
question rather than return a desired action, and leave the behavior available to evolution.

<a id="controller-policies"></a>

## Current policies

The map-aware oracle performs breadth-first search across legal cells toward food or the cache. It
knows the map and all food locations but can only turn, move, and operate the mandible through the
shared resolver.

The programmed forager is a pure function of the 33 inputs. When unloaded underground it follows
the pre-impregnated blank pheromone A field toward the entrance; when sufficiently exposed it
follows food odor; when loaded it follows deep nest odor and emits pheromone B after successful
return moves. Immediate food or cache contact triggers the mandible. Blocked or flat fields use
local openness and deterministic individual variation. It does not retain a route, timer, wall
side, previous sensor frame, coordinate, or world reference.

The current recurrent comparison uses 32 recurrent units, 32 decision units, a 3,399-locus genome, and explicit
competing idle/left/right/move/mandible motor outputs plus both pheromone outputs. It receives the
same vector and resolver. Historical RNN panels through run 2500 completed zero of eight worlds;
there is no programmed-policy fallback.

<a id="controller-initialization"></a>

## Initialization and future evolvable controllers

Historical recurrent seed experiments used balanced-frame imitation with counterfactual individual
signals and true dataset aggregation over its own rollout errors. The trainer originally paired a
stale sensor frame with the next teacher action and later discarded previous off-policy states;
both procedures are invalid and have been removed. Even with corrected training and a wider hidden
layer, the current RNN fails closed loop. That is evidence, not permission to add privileged
inputs or a hidden second controller.

The bounded imitation studies are complete and failed. The authorized outcome experiment tests
whether direct colony selection can improve care that imitation failed to sustain. Adding ecology
is not a remedy for failed local motor control. Any future representation must establish both viability and tolerance of small
perturbations. The programmed policy remains a readable capability reference, not a sequence every
future genome must imitate exactly.

<a id="controller-memory"></a>

## Memory and navigation

The programmed reference now writes its existing decision mode to a private byte for monitoring.
Its physical action choices still depend on the current local frame. The [registered RNN](task-memory.md)
reads its own byte, uses a learned projection or sensory gates, and chooses keep/write alongside
physical actions. Runtime values have no enforced names, routes, task allocator or dwell times.

Later memory remains ordered by timescale: controller state for immediate context, environmental
marks for shared memory, plastic state for within-lifetime learning, and genomes for inherited
regularities. Path integration, learned routes, personal breadcrumbs, and evolved plasticity are
backlog, not bootstrap dependencies.

<a id="controller-search"></a>

## Search and return logic

At the current abstraction level:

```text
IF carrying food
    deposit when physically facing the cache
    otherwise move up the locally sensed nest carrier
ELSE
    pick up food when physically facing it
    if underground, move up the locally sensed entrance carrier
    if exposed, move up the locally sensed food carrier
    otherwise continue through locally open space with stable tie-breaking
```

This is a policy over physical signals, not privileged semantics embedded in an action. The world
may reshape carrier geometry if measured behavior shows a physical affordance is missing; it may
not add a home coordinate or selected-food bearing.

<a id="controller-order"></a>

## Linear implementation order

| ID      | Status                           | Finish                                                                                        |
| ------- | -------------------------------- | --------------------------------------------------------------------------------------------- |
| CTRL-01 | Delivered                        | Opaque controller interface and one shared local action resolver                              |
| CTRL-02 | Delivered                        | 33-value local sensor tuple and browser inspector                                             |
| CTRL-03 | Delivered diagnostic             | Map-aware shortest-path ceiling using ordinary actions                                        |
| CTRL-04 | Numerically passed               | Stateless local-sensor policy completes run 2492 at 9.988% median overhead                    |
| CTRL-05 | Needs human review               | Visible trajectory has directed travel, detours, pickup, return, and deposit without circling |
| CTRL-06 | Failed                           | Historical recurrent comparison completes 0/8 worlds; retain as a visible comparison          |
| CTRL-07 | Delivered                        | Chose and implemented linear GP; unfinished RNN repair plans canceled                        |
| CTRL-08 | Delivered; visual review pending | Programmed multiple-worker physical colony                                                    |
| CTRL-09 | Backlog                          | Compare plasticity, development, or other substrates only after basic evolution works         |
| CTRL-10 | Delivered                        | Shared colony knowledge, explicit routes, task byte and compiled LGP seed                     |
| CTRL-11 | Next milestone                   | Resolve storage/care failures and measure both controllers at roughly 2,000 workers before genetics |

<a id="controller-obe"></a>

## OBE and rejected directions

- The former programmed colony, sensor-limited spatial teacher, and construction seeds are OBE as
  executable baselines. They remain historical evidence.
- The historical local-only interface rejected coordinates and routes. Colony-known destination
  metadata and explicit terrain routing are now permitted for programmed/LGP ants; unseen food
  discovery and hidden task dispatch remain prohibited.
- Passing on one seed, selecting one perfect genome, or cloning a visibly broken teacher does not
  establish a viable controller class.
- A new sensor, field, state variable, or wall-following mode is not justified until existing
  inputs fail with a named, measured information gap.

<a id="controller-sources"></a>

## Source provenance

The original RNN, genome, sensory, oracle, seed, navigation, plasticity, and controller-capacity
ideas remain indexed in [the source archive](../sources/README.md). Their current dispositions are
mapped in [source coverage](source-coverage.md). The 2D policy and contract supersede their old
runtime shapes without erasing the future questions they posed.
