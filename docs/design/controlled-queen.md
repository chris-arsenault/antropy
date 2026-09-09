# Queen as a controlled ant

The September 9 decision replaces the passive queen and automatic egg-placement routine.
Plan `1abb253c-b511-46e2-9424-f4f2e0b03da7` is a prerequisite branch of surplus-driven growth.

## Shared actor contract

The queen extends `Ant`: identity, heading, food crop, reserves, task byte, private registers,
action history, route and worksite memory. Her reproductive body adds caste, egg maturation age,
survival state and carrier reference. `world.queen` owns that body once; `world.ants` continues
to count workers. `adultBodies` enumerates both for shared actor and transport operations.

Programmed and LGP worlds run both castes through the same candidate interface, seed program and
action resolver, with separate private memory. Reproductive capability and readiness are body
inputs, independent of the task byte. Reproductive preferences are part of the shared program.
Historical worker-only comparison interfaces have no egg output; their queen uses the common
programmed seed. Those comparisons do not certify current colony behavior.

The queen uses ordinary movement, routing, eating, food pickup, feeding, pheromone and work actions.
Shared accounting respects her reserve capacity and added body movement cost. Both adult castes
grip backing and fall when support is lost. Queen motion updates her colony landmark and invalidates
routes toward its old position. Worker extinction does not disable her decision turn.

A carried queen retains her controller and can eat, feed or signal, but cannot independently move,
lay or construct. Transport invalidates her route. Self-carrying is rejected. Brood and spoil load
accounting includes her, with physical release on death. Her reserve and crop return to food once.

## Reproduction

Metabolism, aging and egg maturation remain physiology. Delivered nutrition funds reproduction;
remote stockpiles do not. The controller chooses `lay-egg` with a heading. The resolver checks that
one adjacent cell for support, openness, occupancy and food, charges mandible work and transfers
egg energy from the queen. Failure does not search elsewhere. Automatic radius-three placement
has been removed from the lifecycle.

The shared seed eats when reserves are low, routes toward observed food, prefers sheltered local
laying sites and can seek observed floor space or leave local climate stress. Bounded nearby and
rotating habitat observations are route candidates for both castes. Enumeration provides no
suitability ranking, chosen destination or unseen food; selection remains in the controller.
Reproductive caste development, daughter queens, mating and new colonies remain separate work.

The resumed growth experiment exposed a missing return phase: a well-fed queen could remain on
the surface and stop laying. The seed now reserves exterior foraging for reserves below 60%,
while still eating locally or seeking observed sheltered food below 90%. Outside with adequate
reserves, she can route to observed nursery locations. Route commitment suppresses small climate
detours, blocked routes can be discarded, and local laying-space search favors sheltered floor.
These preferences remain in the common editable program, not in the action resolver.

## Persistence, observability and verification

Checkpoint v18 serializes the queen through the same typed-array and private-memory handling as
workers, plus reproductive state. Older passive-queen checkpoints are rejected. The default Growth
panel shows her task, attempted action/result, carried food and egg state. The inspector can select
her; decision traces include caste and identity. Worker return totals remain worker-only.

`App.initialSettings` passes `withReviewPressures` to `createWorld`; that establishes the default
controller without a browser run. The unfinished growth settings remain experimental: an 80-tick
minimum laying interval and 120/600/240 development durations. The interrupted previous run stopped
at tick 2,000 with ten workers and three births. This refactor does not certify population doubling,
replacement, trajectory quality or substantial chamber construction.

Bounded tests cover selected food travel/eating and laying for both controllers, absence of
automatic/substituted egg placement, transport restrictions, independent memory, conservation,
worker extinction and exact checkpoint continuation. Constant and identity folding keep the shared
seed under the existing 4,096-instruction bound. Full CI is the handoff gate; population
experiments remain in the parent growth plan. No browser simulation or training is required here.
