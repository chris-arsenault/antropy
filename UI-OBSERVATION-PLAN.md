# Viewport-first observation UI

September 18, 2026. User authorizes implementation of a general UI reorganization before
future phenotype work. The deployed v23 run shows visible differentiation and acceptable
speed through 100,000 ticks by the user's review. That completes the math plan's human gate;
later long-run cleanup remains separate.

Sulion root: `927937d1-c673-4fdb-acc0-c3db707b2216`. All three phases complete locally.

## Scope and decisions

- Keep one full-screen worker-rendered canvas mounted throughout panel navigation. Rust/WASM,
  simulation mathematics, checkpoint format, observation payloads and retention stay unchanged.
- A compact HUD exposes running state, tick, living population and measured speed. A bottom
  toolbar opens Chemistry, Population, Lineage, Cell, Map, Saves and Settings.
- Use focused nonmodal dialogs with close/Escape and focus return, preserving interaction with
  the world. One information panel opens at a time. Settings drafts and independent map controls
  survive panel navigation; expensive charts mount only while needed.
- Chemical selection continues to change the field without resetting cell colors or overlays.
  Population highlights counts/trends; detailed accounting stays available behind disclosure.
- Lineage explains founder ancestry versus four-generation families. Selecting a group opens
  its root cell; children and living-descendant links support following the branch. Existing
  lineage charts/history stay available. No new phenotype categorization or inferred strategies.
- Preserve save, restore, export and failure-report access, including when the worker fails.
  New-world configuration clearly distinguishes changes that require a restart.
- Responsive panels fit within the screen and scroll internally. The map does not become a
  second sidebar when an information panel opens.

## Work and acceptance

1. Reorganize viewport/panels: persistent canvas, reusable dialog, HUD/dock and responsive CSS.
2. Clarify information: separate population/lineage/accounting, retain chemistry, make map and
   family selection navigable, and preserve configuration drafts.
3. Verify: integration tests cover panel navigation, canvas identity, independent display
   controls, selection, Escape/focus return and save/error access. Run `make ci`.

Browser registration: use the existing localhost:26000 server and an isolated Chromium profile.
Inspect desktop 1440×1000 and narrow 390×844 layouts, panel/dock bounds, map interactions, cell
selection, running controls and save access. At most 300 World ticks and 120 seconds; no long
ecological run, extra server, user storage access or external publication. Screenshots and
results remain under a new local `frontend/harness/artifacts/viewport-ui-*` directory.

## Deferred

Phenotype observability/analysis, long-run culling and performance changes, new telemetry,
history policy changes and environmental expansions belong to later work. This UI pass does
not imply that a lineage is a phenotype or a biological species.

## Implemented navigation

The world fills the browser viewport. Tick, population and execution controls remain at the
top; the bottom toolbar toggles one information window. Close or Escape returns to the world.
On narrow screens the toolbar scrolls horizontally and each window scrolls internally.

- **Chemistry:** abundance ranking, selected field species, physical properties and chemical atlas.
- **Population:** population history, totals and inherited-trait views; detailed accounting is folded.
- **Lineage:** founder/family guide, share histories and root selection. Selecting a root opens Cell;
  its Family and ancestry disclosure retains parents, children, living descendants and relatives.
- **Cell:** selection from the world or lineage, local chemistry, funded body and private inputs.
- **Map:** independent chemical layers, cell colors, source/region overlays and spatial samples.
- **Saves:** recovery status, save/restore/import/export and runtime report, accessible after faults.
- **Settings:** new-world configuration. Draft changes survive switching panels and apply on restart.

The canvas and worker remain mounted during navigation. Closed observation panels do not mount
their charts. Settings stays mounted to preserve its draft. No fields, population frames or
private-state arrays were added to messages; the existing worker render ownership is unchanged.
The old sidebar layout rules were removed. Existing operational browser scripts now open their
target panels explicitly.

## Verification

`make ci` passes: 130 Rust tests, 60 Vitest tests, Clippy, TypeScript, formatting, documentation
links and Terraform formatting. ESLint reports 12 warnings and no errors. The expanded application
test covers persistent canvas identity under StrictMode, independent map/chemical controls,
ancestor inspection, settings drafts, Escape/focus return, run controls and report access after
a worker fault. Initial focus and lint failures were fixed before the final pass. Switching
panels resets their scroll position, including lineage-to-cell navigation.

The isolated existing-server browser check passed 18 layouts at 1440×1000, 390×844 and 844×390.
The final check reached tick 17 in 4.61 seconds; it exercised stepping, run/pause, saving/restoring,
lineage inspection and keyboard closing without errors. Panels fit between the HUD and toolbar;
the full-screen canvas retained its identity across navigation and resizes. Desktop chemistry,
lineage, cell and narrow-screen screenshots were inspected during the pass.
Final local artifacts: `frontend/harness/artifacts/viewport-ui-20260918-handoff/`.
This is a short UI/operation check, not a new simulation-performance or long-run ecology result.
The changes are not committed or deployed.
