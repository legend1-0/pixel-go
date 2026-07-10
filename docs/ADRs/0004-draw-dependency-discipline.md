# ADR 0004: draw() Dependency Array Discipline & Onion Skin Approach

Date: 2026-07-08

## Context
`draw()` is memoized with `useCallback` for performance. Early in frame
implementation, `activeFrameIndex` was read inside `draw()` but omitted from
its dependency array. This caused React to hand out a stale, frozen version
of `draw()` after switching frames — drawing continued to render the
previously active frame's data until an unrelated dependency (zoom) happened
to change, which masked the bug during initial testing (zooming "fixed" it).

## Decision
Every value read inside `draw()` must be listed in its `useCallback`
dependency array, with no exceptions. Current array:
`[zoom, pan, activeFrameIndex, onionSkinEnabled]`.

Onion skinning was implemented as a flat-tint overlay (previous frame in
blue, next frame in orange, fixed ~35% opacity) drawn between the
checkerboard and the real layer composite — not a configurable-depth ghost
system. This was a deliberate scope decision for v1, not a limitation of the
approach; a depth/fade parameter can be added later without restructuring.

## Consequences
- Any future piece of render-affecting state must be added to this array or
  the canvas will silently show stale content.
- `drawCell()` (fast single-pixel redraw for undo/redo) does not currently
  respect onion skin state, since it's only used for `DrawPixelCommand`
  undo/redo where onion skin overlays are not being actively edited. This is
  an acceptable simplification, not a bug.
