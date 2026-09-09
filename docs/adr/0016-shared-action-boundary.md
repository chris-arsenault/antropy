# 0016 — Shared physical action boundary

- Status: Superseded by [0018](0018-bacterial-runtime.md); body preserved as ant interface history
- Date: 2026-09-06

## Context

An omniscient diagnostic is useful only if its success proves that ordinary creature actions can
solve the world. A private move, pickup, or deposit path would invalidate that comparison.

## Decision

Map-aware and local controllers emit the same turn, move, mandible, and two pheromone-intensity
outputs. The world resolves exclusivity, collision, costs, pickup, carried state, capacity,
deposit, and chemical emission. Only the named oracle policy may inspect the map; production
policies receive local current-frame sensors.

## Consequences

The oracle measures a physical ceiling without defining the future genome. Privileged knowledge is
quarantined at policy choice rather than leaking into world actions.
