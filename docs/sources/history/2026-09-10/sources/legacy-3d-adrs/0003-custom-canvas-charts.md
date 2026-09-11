# 0003 — Custom canvas charts instead of a charting library

- Status: Accepted
- Date: 2026-08-31

## Context

The instrumentation surface (selection-differential readout, per-gene mean/variance tracks,
population counts, lineage shares) streams time-series data continuously while the
simulation runs at up to charts-only speed. Chart updates must be cheap enough to redraw
every UI frame without fighting the simulation for the main thread (ADR-0001).

## Decision

Charts are small in-house canvas components: a shared time-series buffer type plus a thin
line/area renderer, styled with the app palette.

## Alternatives considered

- **Recharts / visx (React SVG charting)** — declarative and familiar, but re-renders
  SVG node trees per data push; streaming multi-series data at UI frame rate through React
  reconciliation is exactly the workload these libraries handle worst. Rejected.
- **uPlot** — genuinely fast streaming canvas charts, but adds a dependency and its own
  styling/lifecycle model for what the MVP needs from ~two small drawing routines.
  Rejected as not yet earned; revisit if chart requirements outgrow the in-house renderer.

## Consequences

- Chart code is owned code: axes, scales, and legends exist only insofar as the
  instrumentation needs them.
- The shared ring-buffer + renderer pair is the single canonical chart path; new charts
  compose it rather than introducing a second drawing approach.
