# Integrated default terrain display

**Status:** Delivered plan (archived) — integrated landscape display shipped at `fc016c7`; the
[display contract](../../design/bacterial-display.md#display-integrated-landscape) owns current behavior.

September 30, 2026. Implements the approved composition without changing physical rules or
checkpoint format. The ordinary view must show the landscape without display-setting changes.

## Principles and scope

Conductance supplies muted ground color; contours supply elevation/slope structure; received
light shades the ground; translucent chemistry remains above it; cells retain clear energy
colors and outlines. Reservoir markers distinguish existing stock from the local seasonal
release/refill multiplier. A permanent key explains these cues. Diagnostic maps remain optional.

Rust owns static terrain and dynamic fields. Local uploads borrow Rust projections synchronously.
Remote packets remain worker-local and bounded; no map or population frame crosses into React.
The terrain overview has at most 256 samples per axis, sampled at cell centers with the physical
periodic sampler. This display projection does not change physical resolution. Static terrain
uploads once per world; native viewers receive it once per connection/world. Camera changes
and seasonal updates do not rebuild it. Existing display windows still bound dynamic fields.

The implementation uses a separate terrain texture, an extended local display descriptor and
a separately identified static remote packet under the existing acknowledgement boundary.
Seasonal marker values follow source positions and model time, including empty reservoirs.
No artificial side illumination, grid texture, decorative biome or resource bonus is added.

Assumptions: the generated terrain's smallest retained wavelength remains readable in the bounded
overview; contour spacing and chemistry opacity can preserve both terrain and cell visibility.
These are rendering choices owned by implementation, not user-acceptance gates.

## Implementation phases

1. Shared terrain display data: cached projection and source-marker values, borrowed WASM
   descriptor, and native/browser static-packet ownership with reconnect/reset handling.
2. Integrated renderer and default interface: ground, antialiased contours, bounded darkness,
   translucent chemistry, seasonal source bands, ordinary defaults and permanent legend.

### Shared display data expansion

- Add the derived terrain owner beside render buffers. Cache by the immutable shade owner.
  Keep the source marker's ordinary radius and activity meaning; encode season in unused lanes.
- Extend the local render descriptor and native display version together. Share one encoded
  static packet across viewers, transmit it only when needed, and keep its borrowed view in the
  remote renderer worker. Reconnect and world replacement invalidate its identity.

Automatic ownership, continuation, transport and graphics checks run within implementation.
Local implementation is complete. The subsequent user request authorizes commit and push through
the existing deployment pipeline.

### Renderer and interface expansion

- Upload the cached terrain on its own texture; compose conductance, antialiased contours,
  received light and bounded chemical opacity. Keep organism contrast independent of darkness.
  Add seasonal source bands outside the existing stock markers.
- Select the integrated view at startup and keep its legend visible. Preserve optional diagnostic
  maps. Exercise real WebGL compilation and the display using an isolated, paused constructed
  world at overview and close zoom, with a two-minute wall cap and no user recovery storage.
  This checks rendering and readability; it makes no ecological prediction or physical changes.
  Render the already-saved live checkpoint without advancing it as a second density check,
  under the same two-minute wall cap. Keep screenshots and raw results in ignored harness artifacts.

Tracking: root `c6e3d1b6-2f4b-4a18-a860-a5cd1e9b00a4`; shared-data expansion
`fcd6edcb-c410-4632-bf29-a8b737ecebb6`; renderer/interface expansion
`c99d28e0-eb67-42e0-a0ed-872f283fd224`.

Both implementation phases are complete. The frontend and
native server must ship together because binary display packets now reference static terrain.
Physical v46 checkpoints remain compatible; no world reset is needed for this display change.
