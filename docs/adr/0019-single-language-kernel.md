# 0019 — One TypeScript simulation kernel; reasoning outranks speed

- Status: Accepted
- Date: 2026-09-12

## Context

To use more of the viewing machine, a Rust WebAssembly kernel was built for batched RNN
inference with the Hebbian trace update, movement with contact resolution in porous mode, and
the twenty chemical reads per cell. It was loaded by both the browser and the Node harness and
raised throughput at the evolved population (about 1,300 cells) from 24 to 44 ticks/s, and by
about 20% at 450–550 cells. A worker pool was then measured to be worthless: the kernel had
removed exactly the parallelizable work, leaving about 15% of a tick parallelizable.

The cost was a split boundary. The RNN and its learning rule existed in `controller/rnn.ts` and
in Rust; the chemical reads in `sensors.ts` and in Rust; contact resolution in `movement.ts` and
in Rust; layout constants, flag bits and sentinels had to agree across two languages and three
adapters. Three defects during the build came from that boundary alone: the module's shadow
stack overlapping JavaScript-owned memory, two worlds in one process overwriting each other's
genome slots, and a test comparing states prepared by different paths. Every future change to a
sensor, an action or a learning rule would have needed edits in both languages plus an
agreement test to notice drift.

The user's criterion is explicit: adopt the code base that lets the agent reason about the
simulation effectively; speed is secondary.

## Decision

The simulation kernel is TypeScript only, one implementation per physical rule, with the
controller contract (`seed`, `createState`, `act`, `assimilate`, `mutate`, `recombine`,
`genomeDistance`) as the sole inference path. The wasm kernel, its loader, allocator and batch
adapters are removed. Retained from that work because they add no boundary: memoized
construction targets per immutable genotype, genotype-record pruning, a 30 frames per second
budget at maximum speed, and the per-operation float32 rounding removed from the RNN so that
weights, traces and hidden state are float32 storage with double arithmetic.

Exact cross-machine replay is not an invariant. The save state is the record; continuation on
one machine remains deterministic.

## Consequences

Throughput at 1,300 cells is about 25 ticks/s headless and somewhat less in the browser. Any
future acceleration must keep one implementation per rule: either the whole step moves to one
language behind the same module boundaries, or the world is made smaller. Piecemeal ports of
hot loops are rejected. A Web Worker that hosts the entire step is compatible with this decision
because it moves the boundary between simulation and view, not through the physics.
