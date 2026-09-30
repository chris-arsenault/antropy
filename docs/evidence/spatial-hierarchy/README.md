# Spatial hierarchy implementation

The [spatial-scale contract](../../design/spatial-scale.md) owns the design. Physical v47
implements it through the existing periodic generator and terrain owners; generation metadata
records version 2, derived region count and resolved local/seasonal/resource bands.

The boot preview uses seed27, default dimensions, ordinary founders and reservoirs, without
advancing ecology. Its map shows uneven resource neighborhoods, outliers and larger poor gaps.
Local terrain has finer variation than the seasonal field. This is a geographic result, not
evidence of dispersal adaptation or continuing colony separation. Centers are discarded boot
scaffolding; diagnostics assign sources to their nearest center only to describe the map.

The preview retains ordinary initial overlaps. Reservoir exclusion and motion remain responsible
for settling them. Neither the generator nor the analysis rejects a seed to obtain a preferred
arrangement. Existing travel and material-spreading laws are unchanged, so long unsupported
crossings still require reserves or encountered food.

Local reproduction, from the repository root:

```bash
cargo run --manifest-path engine/Cargo.toml --release --example terrain_preview -- frontend/harness/artifacts/spatial-hierarchy-20260930.json integrated
python3 frontend/harness/terrain_report.py frontend/harness/artifacts/spatial-hierarchy-20260930.json frontend/harness/artifacts/spatial-hierarchy-20260930
cargo run --manifest-path engine/Cargo.toml --release --example terrain_capacity -- integrated populated sources
make ci
```

Choose fresh output paths when repeating; preview and report refuse overwrites. Generated
maps, raw metrics and checkpoint bytes remain local and ignored. The scope and bounds are
recorded in the [terrain delivery plan](../../plans/TERRAIN-AND-SEASONS-PLAN.md).
