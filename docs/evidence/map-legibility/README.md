# Default map legibility

**Status:** Presentation refinement, September 30, 2026.

The user found shade, chemistry and resistance hard to distinguish in the integrated map.
The initial renderer mixed chemical color into colored ground, then darkened the entire
mixture. That made reduced illumination resemble lower concentration and weakened the
chemical colors. Conductance had no independent texture cue.

## Design basis

[Axis Maps: visual variables](https://www.axismaps.com/guide/visual-variables) distinguishes
hue, lightness, texture and other graphic channels, including their different ordering and
grouping properties. [Esri: primary cartographic principles](https://www.esri.com/arcgis-blog/products/arcgis-pro/mapping/primary-design-principles-for-cartography)
recommends legible contrast and a hierarchy that keeps thematic information above its base map.
These support the following application-specific choices; neither source specifies our palette.

- Substrate conductance retains an earth-to-teal base with more contrast. Short irregularly
  placed diagonal marks independently indicate resistant substrate, strengthening with `1-q`.
  They are anchored to world positions, antialiased, and visually distinct from cell circles.
  They do not claim to show directional uphill resistance or chemical drag.
- Received light changes the ground's brightness before chemistry is composited. Chemical
  hue and visibility therefore remain readable through shade. This is an observation palette,
  not emitted light or a change to the photochemical law.
- Chemistry uses a stronger blue-to-amber ramp with bounded opacity; material concentration
  still supplies opacity and energy per material still supplies hue. No normalization by the
  current world, changed exposure control or physical threshold is introduced.
- Height contours, source-season bands and cells retain their separate shapes. The permanent
  legend describes the texture as well as the color mapping.

## Bounded rendering check

Render the saved 41,230-tick checkpoint and a paused seed27 world at overview and close zoom,
without advancing either. Compare before/after screenshots and a grayscale display preview;
check actual WebGL compilation, ordinary defaults and texture stability through zoom. Each
browser check has a two-minute wall cap, uses an isolated context and never opens the user's
tab or recovery storage. Screenshots and generated results remain in ignored harness artifacts.
This establishes rendering behavior, not ecological effects or universal perceptual accuracy.

The saved-world and seed27 checks completed without advancing either world or reporting
WebGL errors. Overview, close-up and grayscale inspection distinguished the short substrate
marks from height contours and circular organisms. The ordinary paused application displayed
the revised permanent key. An initial texture artifact was corrected by calculating stroke
antialiasing from continuous world coordinates, rather than discontinuous tile coordinates.
Chemical clouds remain translucent, so the ground still contributes to their final brightness;
only their own color contribution is independent of received light.

Reproduce with `node frontend/harness/artifacts/map-legibility-20260930/check.mjs` against the
temporary local test server described in that ignored script; `CHECKPOINT=1` selects the saved
world. The local script, checkpoint and images are optional artifacts, not fresh-checkout inputs.
