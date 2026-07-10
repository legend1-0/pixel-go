# ADR 0005: State Ownership, Autosave Strategy, Export Pipeline Sharing, and Viewport Scope

Date: 2026-07-08

## 1. State Ownership — Editor as single source of truth
### Context
Panels (Layers, Palette, Timeline) all need to read and mutate the same
underlying Document. Distributing state across sibling components would
require complex prop-drilling or context just to keep them in sync.
### Decision
`Editor.jsx` owns all refs (`docRef`, `historyRef`) and all React state.
`CanvasViewport`, `LayersPanel`, `PalettePanel`, `TimelinePanel` are pure
presentational components, receiving data + callback props only.
### Consequences
Adding a new panel means adding props to pass down from Editor — no new
context/store needed at this scale. If the component tree grows much
larger, revisit with a proper store (Zustand) rather than continuing to
prop-drill.

## 2. Autosave — single IndexedDB slot, not a project library (yet)
### Context
Needed a low-risk way to avoid losing work on refresh, without building the
full multi-project library up front.
### Decision
`projectStorage.js` uses `idb` with one fixed key (`'current'`). Saves every
8s while active, plus best-effort on `beforeunload`. On load, Editor checks
for a saved snapshot and offers Resume before showing New Project.
### Consequences
This does NOT support multiple named projects — only "your one most recent
session." A real project library (multiple named entries, thumbnails) is a
planned upgrade, not yet built as of this ADR.

## 3. Export pipeline built on one shared compositor function
### Context
PNG, Sprite Sheet, GIF, and APNG export all need the same thing: a frame's
visible layers composited onto a clean canvas with no checkerboard/zoom/pan.
### Decision
`renderFrameToCanvas(frame, width, height)` is the single implementation
every export format calls. GIF uses `gif.js` (Web Worker, requires
`gif.worker.js` manually copied to `apps/web/public/`). APNG uses `upng-js`
for full alpha fidelity, which GIF cannot provide (GIF alpha is binary only).
### Consequences
Any future export format should call `renderFrameToCanvas` rather than
reimplementing compositing. Known current gap: exported raster images are
rendered at native document resolution (e.g. 32×32px), which is correct data
but impractical to view/use directly in other tools without upscaling —
flagged for a follow-up ADR once an export-scale option is added.

## 4. Viewport scope — tablet and up only
### Context
Product decision to prioritize feature depth over phone support, given the
intended user (indie devs, pixel artists at a desk/tablet, not on-the-go
phone editing).
### Decision
Minimum supported viewport width ≈ 768px. No phone-specific layout, touch
targets, or breakpoint work planned. This is a deliberate, documented scope
boundary, not an oversight.
### Consequences
UI density, panel layout, and interaction design can assume a tablet-or-larger
canvas without compromise. Revisit only if user demand for phone support
becomes explicit and significant.
