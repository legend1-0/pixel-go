# Pixel Art Studio — Architecture & Product Roadmap
### "Figma for Pixel Art" — Senior Architecture Document

---

## 1. Product Framing (read this before anything else)

The single biggest risk in a project like this is **treating it as a drawing app that grows features**, rather than **treating it as a rendering engine + command system that happens to expose drawing tools first**. Figma didn't win because it had a pen tool — it won because it had a rock-solid document model, a fast renderer, and a plugin ecosystem bolted onto a stable core.

So the architecture below is built around three permanent pillars that will never be rewritten, only extended:

1. **The Engine** — canvas/rendering, document model, command (undo/redo) system. Framework-agnostic. No React inside it.
2. **The Shell** — React UI: panels, toolbars, timeline, modals. Talks to the Engine through a well-defined API, never touches raw pixel buffers directly.
3. **The Persistence Layer** — local-first storage now (IndexedDB + file export), designed so cloud sync/multiplayer can be added later without touching the Engine.

If you keep these three layers strictly separated from day one, everything on your roadmap (tilemap editor, multiplayer, plugins, marketplace) becomes an *addition*, not a *rewrite*.

---

## 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| UI Framework | React 18+ (JavaScript, not TS — per your requirement) | Component model fits panel-based editor UI well |
| Build tool | Vite | Fast HMR, native ESM, easy multi-package setup |
| State (UI layer) | Zustand | Minimal boilerplate, avoids Redux ceremony, works well when most "real" state lives outside React anyway |
| Rendering | Canvas2D per-layer buffers + WebGL2 compositor (see §6) | Canvas2D is simplest for pixel-level editing; WebGL2 gives you GPU-accelerated zoom/pan/compositing needed at "Figma" scale |
| Local persistence | IndexedDB via `idb` (small wrapper lib) | Structured storage for big binary layer data + project metadata |
| File packaging | JSZip | `.pxls` project files as a zip of manifest + layer PNGs + palette JSON |
| GIF/APNG export | `gif.js` (or custom encoder) run in a Web Worker | Keep encoding off main thread |
| Testing | Vitest (unit) + Playwright (e2e/canvas pixel diffing) | |
| Linting/formatting | ESLint + Prettier | |
| CI | GitHub Actions | Lint, test, build on PR |
| Package management | npm workspaces (monorepo) | Enables clean separation of engine/ui/plugin-sdk packages now, without needing Nx/Turborepo yet |
| Hosting (Phase 1) | Static hosting (Vercel/Netlify/GitHub Pages) — 100% client-side, no backend | Matches "offline-first browser app" requirement |
| Future backend (Phase 6+) | Node.js + WebSocket server (e.g. `ws` or Socket.io) + Postgres | For multiplayer/cloud sync, added later, does not block Phases 0–5 |

**Important early decision:** no backend exists until multiplayer/cloud is actually being built. Everything through Phase 5 runs 100% in the browser, works offline, and stores everything locally. This is both a scope-control decision and a product decision (matches your "usable offline" requirement).

---

## 3. Monorepo / Folder Structure

Using npm workspaces from the start avoids a painful migration later when plugin-sdk and engine need to be independently versioned/tested.

```
pixel-art-studio/
├── apps/
│   └── web/                        # The React application (the "Shell")
│       ├── src/
│       │   ├── app/                # App shell: routing, layout, providers
│       │   ├── components/
│       │   │   ├── canvas/         # <CanvasViewport>, zoom/pan controls
│       │   │   ├── toolbar/        # Tool selection UI
│       │   │   ├── layers-panel/
│       │   │   ├── palette-panel/
│       │   │   ├── timeline/       # Animation frames UI
│       │   │   ├── menu/           # File/Edit/View menus
│       │   │   └── shared/         # Buttons, modals, dropdowns, tooltips
│       │   ├── state/              # Zustand stores (UI-only state)
│       │   │   ├── useToolStore.js
│       │   │   ├── useUIStore.js   # dark mode, panel layout, modals
│       │   │   └── useProjectStore.js  # thin binding to Engine document
│       │   ├── hooks/              # useEngine(), useHistory(), useHotkeys()
│       │   ├── styles/
│       │   └── main.jsx
│       └── vite.config.js
│
├── packages/
│   ├── engine/                     # The "Engine" — framework-agnostic core
│   │   ├── src/
│   │   │   ├── document/           # Document model (Project, Layer, Frame)
│   │   │   ├── rendering/          # Canvas abstraction, compositor, renderer
│   │   │   ├── tools/              # Tool implementations (pencil, fill, etc.)
│   │   │   ├── commands/           # Command pattern classes + HistoryManager
│   │   │   ├── color/              # Palette management, color conversions
│   │   │   ├── io/                 # Import/export (PNG, GIF, APNG, project file)
│   │   │   └── index.js            # Public Engine API surface
│   │   └── package.json
│   │
│   ├── plugin-sdk/                 # Public API surface exposed to future plugins
│   │   └── src/index.js            # Stub for now — defines the contract early
│   │
│   ├── file-formats/               # .pxls project format read/write, versioning
│   │   └── src/index.js
│   │
│   └── shared-utils/               # Math, color, geometry helpers shared across packages
│
├── docs/
│   ├── ARCHITECTURE.md             # This document, kept living
│   ├── ADRs/                       # Architecture Decision Records (see §9)
│   └── PLUGIN_API.md               # Grows as plugin-sdk grows
│
├── .github/workflows/ci.yml
├── package.json                    # workspaces root
└── README.md
```

**Why split `engine` from `apps/web` even for a solo/early project?**
Because it forces you to never let a React component directly mutate pixel data. Every mutation goes through a Command object dispatched to the Engine. This one discipline is what makes undo/redo, autosave, multiplayer, and plugins all *possible* later instead of requiring a rewrite.

---

## 4. Core Architecture Decisions

### 4.1 Document Model
The Engine owns a plain-object (serializable) document tree:

```
Project
 ├── meta (name, canvasWidth, canvasHeight, createdAt, version)
 ├── palette[]                (shared across frames unless overridden)
 ├── frames[]                 (for animation)
 │    └── layers[]
 │         ├── id, name, opacity, visible, locked, blendMode
 │         └── pixelBuffer (Uint8ClampedArray / ImageData-backed)
 └── selectionState (not persisted — ephemeral UI state)
```

This is deliberately **framework-agnostic JSON + typed arrays** — the same structure will later serialize to IndexedDB, to a `.pxls` file, and eventually to CRDT operations for multiplayer, without redesign.

### 4.2 Command Pattern (Undo/Redo)
Every mutating action (draw stroke, fill, resize layer, add frame, delete layer) is a `Command` object:

```
Command {
  execute(document) → newDocumentPatch
  undo(document) → reverts patch
  merge(nextCommand) → optional, for stroke coalescing
}
```

A `HistoryManager` maintains an undo stack and redo stack of Commands (not full document snapshots — see §4.3 for why). React components never call engine mutation methods directly; they dispatch Commands through a single `engine.execute(command)` entry point. This is what makes "infinite history" tractable and what will make multiplayer (operation broadcasting) straightforward later.

### 4.3 Why Commands, Not Snapshots
Storing a full canvas snapshot per undo step is simple but memory-explosive for "infinite history" on large canvases with many layers/frames. Instead:
- Pixel-editing commands (pencil, fill, shapes) store **only the diff** — a sparse map of changed pixels (before/after value), not the whole layer.
- Structural commands (add layer, resize canvas, reorder frames) store minimal structural diffs.
- History is capped by a configurable **memory budget**, not a fixed step count — old diffs get compacted/dropped only when the budget is exceeded, giving you "infinite" history in practice for normal sessions.

### 4.4 Tool System (Extensible by Design)
Tools implement a common interface so adding a new tool never touches core canvas code:

```
Tool {
  id, name, icon, cursor
  onPointerDown(ctx, point)
  onPointerMove(ctx, point)
  onPointerUp(ctx, point)
  → returns Command(s) to dispatch, doesn't mutate directly
}
```

Tools are registered in a `ToolRegistry`. Pencil, Eraser, Bucket Fill, Line, Rectangle, Circle, Color Picker all implement this same interface. This registry is also the extension point plugins will hook into later (custom brushes, brush marketplace).

### 4.5 State Management Split
- **Engine state** (document, history, active tool logic) lives in plain JS objects/classes outside React, for performance — pixel operations should not trigger React reconciliation.
- **UI state** (which panel is open, dark mode, selected tool id, zoom level *display*) lives in Zustand stores.
- A thin subscription bridge (`useEngineSelector`) lets React components re-render only when the specific slice of engine state they care about changes (e.g., the Layers panel re-renders on layer list change, not on every pixel stroke).

---

## 5. Rendering Strategy

This is the part most pixel editors get wrong by treating it as "just draw on a canvas."

### 5.1 Per-Layer Offscreen Buffers
Each layer is backed by its own `OffscreenCanvas` (or `ImageData`) at the document's native pixel resolution — never scaled. Drawing tools mutate this buffer directly at 1:1 pixel resolution, so pixel-perfect editing is trivial (no fractional-pixel anti-aliasing issues).

### 5.2 Compositing
A **compositor** merges visible layers (respecting opacity, blend mode, visibility) into a single composite buffer. Two viable strategies, and I'd recommend starting with the first and upgrading if needed:

- **Phase 1–4: Canvas2D compositing.** `drawImage` each visible layer onto a composite canvas with `globalAlpha`/`globalCompositeOperation`. Simple, correct, plenty fast for typical pixel-art canvas sizes (16×16 up to ~1024×1024).
- **Phase 5+/scale-up: WebGL2 compositor.** Upload each layer buffer as a texture, composite via shader. Needed once you're targeting "Figma-scale" (huge canvases, real-time collaborative cursors, many layers, smooth GPU-accelerated zoom/pan). Because the document model and tools never touch the compositor directly, swapping Canvas2D → WebGL2 later is an internal Engine change, invisible to the Shell/UI.

### 5.3 Viewport (Zoom/Pan)
The on-screen `<canvas>` the user sees is **never the pixel buffer itself** — it's a viewport that renders the composite buffer scaled/panned via CSS transform or a draw call, with `image-rendering: pixelated` to preserve crisp pixel edges. This decouples "editing resolution" from "display resolution" cleanly, which also makes infinite zoom/pan performant since you're not re-rendering pixel data on every pan frame, only re-positioning the transform.

### 5.4 Dirty-Rectangle Rendering
Only re-composite the region that changed (tracked per-command as a bounding box), not the whole canvas, on every stroke update. Critical for performance once canvases/layers get large.

### 5.5 Animation Playback & Onion Skinning
The Timeline reads adjacent frames' composite buffers and renders the previous/next frame at reduced opacity beneath the active frame — purely a rendering-layer concern, doesn't touch the document model.

---

## 6. Persistence & "Database" Requirements

Since this is local-first and offline-capable, there is no server database in Phases 0–5. Persistence layers:

| Data | Where | Format |
|---|---|---|
| Active project autosave | IndexedDB | Serialized document (metadata as JSON, pixel buffers as compressed binary blobs) |
| Project library (recent/local projects) | IndexedDB | Index table: id, name, thumbnail, lastModified |
| Exported project file | Downloaded `.pxls` file | Zip (via JSZip): `manifest.json` + `palette.json` + one PNG per layer per frame |
| PNG/Sprite sheet export | Downloaded `.png` | Rendered composite, packed per your sprite-sheet layout options |
| GIF/APNG export | Downloaded file | Encoded in a Web Worker from frame composites |
| Imported PNG | Read into a new layer via File API | — |

**IndexedDB schema (via `idb`):**
```
DB: pixel-art-studio
 ├── projects        {id, name, thumbnailBlob, updatedAt, documentBlob}
 ├── autosaves        {projectId, timestamp, documentBlob}   // rolling, capped count
 └── settings         {key, value}   // dark mode, last used tools, etc.
```

Autosave runs on a debounced interval (e.g. 10s after last edit) and after every N commands, writing a compact snapshot — this is separate from undo history (which is in-memory only and cleared on reload, unless you later choose to persist it too).

**When cloud/backend eventually arrives (Phase 6+):** the exact same document schema gets versioned and synced via a backend (Postgres for project metadata + object storage for binary layer data, e.g. S3-compatible), with the local IndexedDB acting as an offline cache/source of truth when disconnected — a fairly standard local-first sync architecture (similar in spirit to how Figma/Linear handle offline mode).

---

## 7. Phased Roadmap

Each phase ends with something runnable and demoable — no phase should take more than a few weeks solo.

### Phase 0 — Foundation (no user-facing features yet)
- Monorepo scaffold, npm workspaces, Vite app shell
- `engine` package skeleton: Document model, Command base class, HistoryManager
- Basic `CanvasViewport` component rendering a blank pixel grid, zoom/pan working
- CI pipeline, lint/test setup
- **Milestone:** empty canvas that zooms/pans smoothly and has a working (empty) undo stack

### Phase 1 — Core Drawing MVP
- Pencil, Eraser tools via Command pattern
- Single-layer editing only
- Undo/Redo wired end-to-end
- PNG export (single frame, single layer)
- **Milestone:** you can draw a pixel sprite and export it as PNG

### Phase 2 — Shape Tools, Color System, Layers
- Bucket Fill, Line, Rectangle, Circle tools
- Color Picker
- Palette Manager + custom palettes
- Multi-layer support: add/delete/reorder, opacity, visibility
- **Milestone:** full static single-frame editor, comparable to a basic pixel editor

### Phase 3 — Animation System
- Frame timeline: add/duplicate/delete/reorder frames
- Onion skinning
- Playback preview (scrub + play at set FPS)
- **Milestone:** you can animate a walk cycle and preview it

### Phase 4 — Export Pipeline & Import
- Sprite sheet export (configurable grid/packing)
- GIF export, APNG export (via Web Worker)
- Import PNG (as new layer or new project)
- Export/import full `.pxls` project file
- **Milestone:** end-to-end: import reference PNG → animate → export sprite sheet + GIF

### Phase 5 — Polish, Persistence, Performance
- Autosave + local project library (IndexedDB), "recent projects" screen
- Full keyboard shortcut system (configurable)
- Dark mode, responsive layout for smaller screens/tablets
- Dirty-rectangle rendering optimization pass
- Performance profiling on large canvases (256×256+, 20+ layers)
- **Milestone:** feels like a "real app" — reload-safe, fast, no data loss

### Phase 6 — Plugin Foundation
- Finalize `plugin-sdk` public API (tool registration, panel injection, export hooks)
- Sandbox execution model (likely Web Worker or iframe-isolated plugin runtime)
- Internal dogfooding: rebuild one existing tool as a "plugin" to prove the API works
- **Milestone:** a third-party could write a custom brush/tool without touching core code

### Phase 7+ — Roadmap (each is its own multi-phase project)
- **Tilemap editor** — new document type reusing the layer/rendering engine, adds grid/tile-snapping and a tileset panel
- **Cloud sync** — backend + auth, sync engine using the existing document schema
- **Multiplayer collaboration** — CRDT or OT layer over the Command system (this is *why* commands were designed as serializable diffs from day one), presence/cursors
- **Community palette library / brush marketplace** — content platform on top of cloud backend
- **Online project sharing** — read-only shareable links, rendering the document in a lightweight viewer

---

## 8. Non-Functional Requirements & Targets

- **Performance:** 60fps drawing feedback at canvas sizes up to at least 512×512 with 10+ layers on mid-range hardware
- **Offline-first:** fully functional with no network connection from Phase 1 onward
- **Data safety:** no data loss on tab close/crash (autosave), export always available even if IndexedDB fails
- **Accessibility:** keyboard-navigable UI, sufficient contrast in both light/dark themes
- **Testing:** unit tests for Engine (document model, commands, tools) are non-negotiable since bugs here corrupt user artwork; Playwright pixel-diff tests for rendering regressions

---

## 9. Architecture Decision Records (recommend starting this now)

Keep a `docs/ADRs/` folder with one short markdown file per major decision (e.g. `0001-canvas2d-vs-webgl-compositor.md`, `0002-command-pattern-for-history.md`). This costs 10 minutes per decision and saves you (or future contributors) from re-litigating settled architecture questions six months in — especially valuable for an open-source project where contributors will ask "why is it built this way?"

---

## 10. What to Build First, Literally

If you want a concrete next step: **Phase 0**, specifically the `engine` package's `Document`, `Command`, and `HistoryManager` classes, plus a minimal `CanvasViewport` that can zoom/pan an empty grid. Get undo/redo working on *nothing* before you let it draw a single pixel — it's much easier to bolt drawing onto a working command system than to bolt a command system onto working drawing code.

I'm happy to go deeper into any single section next — for example, fully speccing the `Command`/`HistoryManager` classes, the `.pxls` file format spec, or the WebGL2 compositor design — whichever you want to tackle first.
