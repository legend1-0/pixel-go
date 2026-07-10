# Pixel Art Studio — Architecture (Updated)

This document reflects the actual implemented state of the project, superseding the original planning document where they differ. See `docs/ADRs/` for the reasoning behind individual decisions.

---

## 1. Monorepo Structure (as built)

```
pixel-art-studio/
├── apps/
│   └── web/
│       ├── public/
│       │   └── gif.worker.js          # required static asset for gif.js encoding
│       └── src/
│           ├── App.jsx                 # renders <Editor />, nothing else
│           ├── components/
│           │   ├── editor/
│           │   │   └── Editor.jsx      # owns ALL state, refs, and logic
│           │   ├── canvas/
│           │   │   └── CanvasViewport.jsx   # presentational only
│           │   ├── layers-panel/
│           │   │   └── LayersPanel.jsx      # presentational only
│           │   ├── palette-panel/
│           │   │   └── PalettePanel.jsx     # presentational only
│           │   ├── timeline/
│           │   │   └── TimelinePanel.jsx    # presentational only
│           │   └── new-project/
│           │       └── NewProjectDialog.jsx # size picker, shown before a project exists
│           └── storage/
│               └── projectStorage.js   # IndexedDB (via idb) autosave wrapper
│
├── packages/
│   ├── engine/
│   │   └── src/
│   │       ├── document/
│   │       │   └── Document.js         # createDocument, createFrame, createLayer
│   │       ├── commands/
│   │       │   ├── Command.js          # base class: execute()/undo()
│   │       │   ├── HistoryManager.js   # undo/redo stacks
│   │       │   ├── DrawPixelCommand.js
│   │       │   ├── BucketFillCommand.js
│   │       │   ├── LineCommand.js
│   │       │   ├── CircleCommand.js
│   │       │   └── RectangleCommand.js
│   │       └── index.js                # public Engine API surface
│   └── shared-utils/
│       └── src/
│           └── generateId.js
│
└── docs/
    ├── ARCHITECTURE.md      (this file)
    ├── USER_GUIDE.md
    └── ADRs/
```

---

## 2. State Ownership

Contrary to the original plan's "Engine has zero React dependency" ideal, the actual implementation keeps the Engine (Document/Command classes) framework-agnostic as planned, but **all application state lives in one component: `Editor.jsx`**, not distributed across the tree. See ADR 0005.

`Editor` owns:
- `docRef` — the live Document (mutated directly, not via React state, for performance)
- `historyRef` — the HistoryManager instance
- All React state: `zoom`, `pan`, `activeTool`, `activeColor`, `activeLayerIndex`, `activeFrameIndex`, `layersState`, `framesState`, `paletteState`, `onionSkinEnabled`, `isPlaying`, `documentReady`

`CanvasViewport`, `LayersPanel`, `PalettePanel`, and `TimelinePanel` are all **presentational** — they receive data and callback props from `Editor` and contain no direct references to `docRef` or `historyRef`.

**Important nuance discovered during implementation:** `layersState`, `framesState`, and `paletteState` are *derived copies* of the real data in `docRef.current`, kept in React state purely to trigger re-renders (since mutating `docRef.current` directly doesn't). Every mutation function (`addLayer`, `toggleLayerVisibility`, `deleteFrame`, etc.) must mutate the real data on `docRef.current` **and then** call the matching `setXState([...newArray])` to sync the display. Forgetting the second half was the single most common bug category during development (see ADRs 0005 and 0006 for the specific incidents).

---

## 3. Rendering Pipeline (as built)

`draw()` (defined in `Editor.jsx`) does, in order, every time it runs:
1. Clear the canvas
2. Apply `ctx.translate(pan)` / `ctx.scale(zoom)` — all subsequent drawing happens in real document-pixel coordinates
3. Draw the checkerboard background
4. **If onion skinning is enabled:** draw the previous frame (tinted blue, ~35% opacity) and next frame (tinted orange, ~35% opacity) — see ADR 0004
5. Composite every visible layer of the **active frame only**, respecting each layer's `opacity`

`draw()` is memoized via `useCallback` with dependencies `[zoom, pan, activeFrameIndex, onionSkinEnabled]`. Any new piece of state that affects what gets rendered **must** be added to this dependency array, or the canvas will silently show stale content until an unrelated dependency happens to change. This exact bug occurred during frame-switching implementation and cost significant debugging time — see ADR 0004.

`drawCell(x, y)` is a fast-path partial redraw used only by undo/redo for single-pixel `DrawPixelCommand`s, avoiding a full 1000+ cell redraw for a one-pixel change. Multi-pixel commands (fill, line, shape) fall back to a full `draw()` since they lack a single `.x`/`.y` to target.

A known limitation, not yet fixed: `draw()`'s per-pixel double loop (nested `for` over width × height, per layer) does not use dirty-rectangle optimization as originally planned in the pre-implementation architecture doc. This is acceptable at current canvas sizes (tested up to 128×128) but should be revisited if larger canvases are supported later.

---

## 4. Command / Undo-Redo System (as built)

Matches the original plan closely — this is the one part of the pre-implementation design that survived unchanged:

- `Command` base class throws if `execute()`/`undo()` aren't overridden (enforced, verified in early testing)
- `HistoryManager` holds `undoStack`/`redoStack`, clears redo on new execute
- Every drawing command records **only the pixels it actually changed** (`{ index, oldColor }` pairs), not a full canvas snapshot — confirmed via direct testing that `BucketFillCommand` and shape commands correctly undo in a single step regardless of how many pixels they touched

**Structural actions (add/delete layer, add/delete/duplicate frame) are NOT run through the Command system** — they mutate `docRef.current` directly and are not undoable. This was a deliberate simplification (matches Aseprite/Photoshop convention of not undoing panel-level structural actions the same way as pixel edits), not an oversight — see ADR 0004.

---

## 5. Animation System (as built)

Each `Frame` has its own independent `layers[]` array with fully independent `Uint8ClampedArray` pixel buffers — confirmed via testing that editing a duplicated frame does not affect its source frame.

**Onion skinning** shows only the immediately adjacent frame in each direction (not a configurable depth) — previous frame in blue, next in orange, both at fixed ~35% opacity multiplier.

**Playback** uses chained `setTimeout` (not `setInterval`), rescheduling itself after each frame advance using that frame's own `duration` field, so frames with different durations play back correctly rather than at one fixed rate.

---

## 6. Export Pipeline (as built)

All raster exports share one core function, `renderFrameToCanvas(frame, width, height)`, which composites a frame's visible layers onto a clean offscreen canvas with no checkerboard, no zoom/pan, no onion skin — just the real pixel content. Every export format builds on this:

| Format | Library | Notes |
|---|---|---|
| PNG | native `canvas.toBlob` | single active frame only |
| Sprite Sheet | native `canvas.toBlob` | all frames composited via `renderFrameToCanvas`, laid out in one horizontal row |
| GIF | `gif.js` (Web Worker) | requires `gif.worker.js` copied to `apps/web/public/` manually — not bundled by Vite |
| APNG | `upng-js` | preserves full alpha; GIF cannot, since GIF transparency is binary per-pixel |

**Full project file (`.pxls`)** is a different kind of export — not a rendered image but the actual editable structure, built with `JSZip`:
- `manifest.json` — project metadata + per-frame/per-layer settings (name, opacity, visible, locked, duration)
- `palette.json` — saved palette colors
- `frame-{f}-layer-{l}.png` — one lossless PNG per layer per frame, storing raw (non-composited) pixel data

Import reverses this exactly, reconstructing a full `Document` object compatible with everything else in the Engine.

---

## 7. Persistence (as built)

**Autosave** uses IndexedDB via the `idb` wrapper library (`apps/web/src/storage/projectStorage.js`), with a single fixed slot (`'current'`) — not yet a multi-project library. Saves happen:
- Every 8 seconds while a document is active (`documentReady === true`)
- On `beforeunload` (best-effort — not guaranteed by browsers to complete, but a reasonable safety net)

On load, `Editor` checks for an existing autosave before showing `NewProjectDialog`; if found, offers a "Resume Previous Project" option alongside starting fresh.

`Uint8ClampedArray` pixel data is stored in IndexedDB **natively** with zero serialization — IndexedDB's structured clone algorithm supports typed arrays directly, unlike `JSON.stringify` (which was confirmed, via direct testing early in the project, to produce an unusable `{"0": 0, "1": 0, ...}` object instead).

**Not yet built:** a real multi-project library/browser (only a single autosave slot exists today). This is a natural next step if/when needed.

---

## 8. Supported Platforms / Viewport Scope

**Decision: tablet-and-up only.** Minimum supported viewport width is approximately 768px. Phone-sized viewports (< 768px) are explicitly out of scope for the foreseeable roadmap, to avoid constraining future feature density around a phone-sized layout. See ADR 0009.

---

## 9. Known Gaps vs. Original Pre-Implementation Plan

Documenting honestly, for future reference:
- No WebGL2 compositor — Canvas2D has been sufficient at tested canvas sizes; revisit if larger canvases become common
- No dirty-rectangle rendering optimization for full redraws
- No plugin system yet (Phase 6 in the original roadmap, not started)
- No multiplayer/cloud sync (future roadmap, not started)
- No tilemap editor (future roadmap, not started)
- Structural actions (layers/frames) are not undoable, by deliberate choice — documented above
