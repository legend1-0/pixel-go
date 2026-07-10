# Pixel Art Studio → Pixel Production Suite
### Architecture Document — Phase 2 Vision (Image/Video Conversion, Performance, Extensibility)

---

## 0. Before anything else: scope reality check

You asked me to challenge assumptions where appropriate, so I will — up front, not buried at the end.

**This document describes a 2-3 year product vision.** Cameras, lighting, particles, audio sync, a plugin marketplace, and a full pixel-video editor are each individually substantial products. If this document is treated as "the plan for what we build next," it will stall the project. If it's treated as "the shape of the mountain, so today's decisions don't paint us into a corner," it's exactly right.

**My recommendation on sequencing**, which the rest of this document assumes:
- **Phase 2 (next, real, buildable soon):** Image Conversion Pipeline. This is genuinely an extension of what exists — it produces a `Document`, nothing new conceptually.
- **Phase 3 (real, but bigger):** Video Conversion Pipeline. This is a different order of magnitude — it needs the performance/memory architecture in this doc *actually built*, not just designed, before it's viable.
- **Phase 4+ (vision, not roadmap):** cameras, lighting, particles, audio, multi-track timeline, plugin marketplace. These inform architecture decisions now (don't build a data model that can't grow toward them) but are not being scheduled.

I'll flag every place below where I'm designing *for* Phase 4+ without *building* Phase 4+.

---

## 1. Core Philosophy — assessment

Local-only, no backend, no cloud, no AI generation, no paid services: this is a coherent, defensible position and I'm not going to push back on it. It also happens to *simplify* the architecture significantly compared to a cloud-hybrid tool — you don't need auth, don't need to design for network latency/failure, don't need to worry about server costs scaling with usage. Worth stating explicitly: **this constraint is a feature, not a limitation**, and it should be treated as a hard boundary in every decision below, including ones where a cloud service would be the "easier" engineering choice (e.g., video transcoding).

---

## 2. System Design — the four-layer model, extended

The existing architecture already has the right bones: Engine (framework-agnostic) / Shell (React UI) / Persistence (IndexedDB). For this phase, split **Engine** into two sub-layers, because conversion pipelines are a genuinely different kind of code than drawing tools:

```
┌─────────────────────────────────────────────┐
│  Shell (React) — UI, panels, wizards          │
├─────────────────────────────────────────────┤
│  Application Layer — Document model,           │
│  Commands, HistoryManager, Tool Registry        │
│  (existing Engine, unchanged in spirit)         │
├─────────────────────────────────────────────┤
│  Media Pipeline Layer (NEW) — decoding,         │
│  quantization, dithering, conversion, encoding  │
│  Runs in Web Workers, framework + UI agnostic   │
├─────────────────────────────────────────────┤
│  Persistence Layer — IndexedDB, file I/O        │
└─────────────────────────────────────────────┘
```

**Why a separate Media Pipeline layer, not just "more Engine code":** the Application Layer's job is correctness and undoability of small, discrete edits (a pencil stroke, a fill). The Media Pipeline's job is throughput on large, one-shot, cancelable, progress-reportable operations (decode 10,000 video frames, quantize a 4K image). These have different performance profiles, different threading needs, and different failure modes (a pipeline job can be cancelled mid-way; a Command cannot). Conflating them would make both worse. This layer is intentionally new, not a rename.

**The critical design rule for this whole phase:** the Media Pipeline layer's *only* job is to produce a valid `Document` (or patch to one). It never bypasses the Document model to render something "flattened." This directly satisfies your requirement that converted results are "native project data," and it's the one rule everything below is built to protect.

---

## 3. Image Conversion Pipeline

### 3.1 Workflow (as you specified, with one addition)
```
Import Image → Decode → Preview (original) → Adjust Settings
  → Live Preview (debounced, downscaled proxy) → Convert (full-res, worker)
  → Create Editable Project (or Layer, if importing into an existing project)
```

**Addition:** the "Live Preview" step should run on a **downscaled proxy** (e.g., max 256px on the long edge), not the full image, recalculated on every settings change. Running full quantization/dithering on a 4000×3000 photo on every slider tick would make the UI feel broken. Convert the full-resolution image exactly once, on explicit confirmation.

### 3.2 Settings — module breakdown
Each setting category should be an independent, composable pure function operating on an `ImageData`-shaped buffer, not a monolithic "convert" function:

```
media-pipeline/image/
├── resize.js              # nearest-neighbor scaling to target output resolution
├── colorAdjust.js         # brightness, contrast, saturation, gamma
├── quantize/
│   ├── medianCut.js
│   ├── kMeans.js
│   ├── wu.js               # Wu's color quantization — good quality/speed tradeoff
│   └── index.js            # registry, so UI can list available algorithms
├── dither/
│   ├── floydSteinberg.js
│   ├── ordered.js          # Bayer matrix — classic retro look
│   ├── atkinson.js         # classic Mac dithering, distinct aesthetic
│   └── index.js
├── palette/
│   ├── extractPalette.js   # automatic extraction from source image
│   ├── retroPalettes.js    # NES, Game Boy, PICO-8, CGA, etc. — static data
│   └── lockPalette.js      # constrain quantization to a fixed set
├── edgeEnhance.js
├── alphaThreshold.js
└── pipeline.js             # composes the above into one configurable run
```

**Why this matters architecturally:** this is exactly the shape a plugin system needs later — each of these is already an independent, registrable unit. A future "custom dithering algorithm" plugin literally just adds another entry to `dither/index.js`'s registry. You don't need to build the plugin *system* to get this benefit now; you need to write the code *as if* plugins already existed, which costs nothing extra today.

### 3.3 Where this runs
Full-resolution conversion runs in a **Web Worker** (not the main thread), for a straightforward reason: quantization algorithms (especially k-means) are O(pixels × colors × iterations) and will visibly freeze the UI on anything larger than a thumbnail if run on the main thread. The worker receives the source `ImageData`'s buffer (transferred, not copied — see §6.2), runs the configured pipeline, and posts back the resulting pixel buffer plus the extracted/used palette.

### 3.4 Output → Document integration
The result becomes: a new `Document` (if "Import as new project") or a new `Layer` on the current frame (if "Import into current project"), using the **exact same `createLayer`/pixel-buffer format** already in the engine. No new data shape. This is what makes "behaves exactly like manually drawn artwork" true by construction, not by extra effort.

---

## 4. Video Conversion Pipeline

This is where I want to push back hardest, because "thousands of frames, browser stays responsive" as currently framed will not work if implemented literally. Let me explain why, then propose the fix.

### 4.1 The problem with "decode everything, then let the user edit everything"
A 10-second, 30fps clip is 300 frames. At even a modest 128×128 canvas with 2 layers, each frame's raw pixel data is `128×128×4 bytes × 2 layers ≈ 131KB`. 300 frames ≈ **39MB** just for pixels, before any undo history, before any UI overhead. A 2-minute clip at 60fps and a modest 256×256 canvas is **several GB**. Browsers *will* kill the tab. "Thousands of frames" as a stated goal, combined with "everything stays editable, nothing is locked," combined with the existing per-frame-full-layers Document model, is not simultaneously achievable without a real memory strategy — so let's design one.

### 4.2 The fix: video frames are a different kind of Frame — a lazy media reference

Introduce a second frame *source* type inside the same timeline, not a second timeline:

```
Frame {
  id, name, duration,
  source: 'drawn' | 'video',      // NEW
  layers: [...],                   // for 'drawn' frames — always fully in memory
  videoRef: {                      // for 'video' frames — lazy
    sourceMediaId,                  // which imported video this came from
    timestamp,                      // where in the source video
    cachedPixels: null | Uint8ClampedArray,  // populated on demand, evictable
  }
}
```

- **`drawn` frames** behave exactly as today — fully in memory, fully in the Command/undo system.
- **`video` frames** hold a *reference* (which video, which timestamp) plus an optional cache. Decoding happens on demand via `WebCodecs` (or the `<video>` + `drawImage` fallback, see §4.3) when a frame becomes visible/active, not upfront for all frames.
- **The moment a user paints on a `video` frame**, it converts to a real `drawn` frame (decode that one frame fully, bake it into a real layer, discard the lazy reference). This is the literal mechanism behind "everything remains editable" — editability is earned per-frame, on contact, not paid for upfront for frames nobody will ever touch.
- A bounded **LRU frame cache** (configurable, e.g. "keep the last 60 decoded frames in memory") evicts `cachedPixels` for `video` frames that haven't been viewed recently, re-decoding from the source video on demand if revisited. `drawn` frames are never evicted — they're the user's actual work.

This directly answers "thousands of frames" honestly: **you can have a timeline that represents thousands of frames without ever holding thousands of frames' pixel data in memory simultaneously.** That's the only way this goal is achievable in a browser tab. I'd treat this as a non-negotiable architectural requirement for Phase 3, not an optimization to add later — retrofitting it after building "frames are always fully materialized" would be a rewrite.

### 4.3 Video decoding — API strategy
**Primary path: WebCodecs `VideoDecoder`.** Frame-accurate, efficient, gives raw `VideoFrame` objects convertible directly to canvas/`ImageData`. Support is good in Chromium browsers, improving elsewhere as of early 2026 — search for current Firefox/Safari status when this is actually built, since this changes fast.

**Fallback path: `<video>` element + `requestVideoFrameCallback` (or manual `currentTime` seeking) + `drawImage` to canvas.** Works everywhere, less frame-accurate, slower for bulk extraction, but it's the universal safety net.

**Design rule:** both paths implement the same internal interface (`getFrameAt(timestamp) → Promise<ImageBitmap>`), selected via capability detection at import time. The rest of the pipeline never knows which one is active. This is the same "design for swappable backends" discipline already used for the compositor (Canvas2D now, WebGL2 later) — apply it here too.

### 4.4 Pipeline
```
Import Video → Probe (duration, native fps/resolution via decoder metadata)
  → Choose target fps (may downsample from source — e.g. 30fps source → 12fps output)
  → Choose resolution/pixel size → Choose palette/dithering/quantization
     (reuses the ENTIRE image pipeline from §3 — one frame is just one image)
  → Convert: for each target-fps timestamp, decode → run image pipeline → store as
     a lazy `video` Frame (§4.2)
  → Result: a real Document with N frames on the timeline, decoded/cached lazily
```

Frame rate reduction (30fps source → 12fps output) is just "pick every Nth timestamp," computed once at import, not a separate feature.

---

## 5. Rendering Architecture — scaling toward Phase 4+ without building it now

### 5.1 The compositor should become a real render-graph, not a fixed loop
Today's `draw()` is a hardcoded sequence: checkerboard → onion skin → layers. That's correct for today's scope. For "cameras, lighting, particle systems, text, vector overlays, shader effects" to ever be possible *without a rewrite*, the compositor needs to become an ordered list of **render passes**, each an independent unit:

```js
// conceptual shape, not final API
compositor.render(scene, {
  passes: [checkerboardPass, layerCompositePass, onionSkinPass]
  // future: cameraTransformPass, lightingPass, particlePass, textPass, shaderPass
});
```

Each pass receives the current canvas state and scene data, and does its thing. This is a meaningfully different internal shape from today's `draw()`, but it's a refactor of *one function*, not the whole app — and it's the one piece of "future-proofing" in this document I'd actually recommend doing soon-ish (early Phase 3), specifically because video frames + onion skin + future overlays will otherwise keep tangling the same function further.

### 5.2 GPU acceleration — recommend WebGL2 now, WebGPU as progressive enhancement later
Your list includes "GPU acceleration when appropriate" and mentions WebAssembly/WebCodecs. My recommendation, concretely:
- **WebGL2** for the compositor once pixel-level Canvas2D compositing becomes a bottleneck (large canvases, many layers, real-time video-frame preview). Support is universal today. This was already the plan in the original architecture doc — Phase 3/4 video work is likely what finally forces this upgrade to actually happen.
- **WebGPU** is the better long-term target for shader effects, particles, and heavy filters (§7), but treat it as a **capability-detected enhancement**, not a requirement, until its cross-browser support is verified at the time you build it — this landscape moves quickly enough that I'd re-check rather than assume.
- **WebAssembly**: don't build a WASM module speculatively. Identify one real hot path once it's actually measured as slow (my bet: k-means quantization on large images, or per-frame dithering during video conversion), and consider a WASM implementation *behind the exact same function signature* as the JS version, so it's a swappable backend, not a rewrite. Premature WASM adoption adds build tooling complexity (a whole toolchain: Rust/C, wasm-pack, etc.) for a project that's currently 100% JS — that's a real cost, not a free performance win.

---

## 6. Performance Strategy

### 6.1 Web Workers — where they earn their keep
- Image conversion pipeline (§3.3) — always
- Video frame decode + per-frame conversion (§4) — always, this is the highest-volume work in the whole app
- GIF/APNG encoding — already true today, unchanged
- **Not** for individual pencil strokes or undo/redo — these need to feel instant and touch small data; worker message-passing overhead would make them feel *worse*, not better

### 6.2 Transferable objects, not copies
Every time a pixel buffer crosses a Worker boundary, use `postMessage(data, [data.buffer])` (transfer) rather than the default structured clone (copy). For a 4K image's `ImageData`, this is the difference between an instant handoff and a multi-hundred-millisecond stall. This is a small implementation detail with an outsized performance impact — flagging it now so it's not discovered painfully later.

### 6.3 OffscreenCanvas
Use `OffscreenCanvas` inside Workers for any conversion step that benefits from canvas drawing primitives (e.g. the resize/nearest-neighbor step) without needing to hop back to the main thread just to get a canvas context. This was already planned in the original architecture doc for per-layer buffers; extend the same idea into the Media Pipeline layer.

### 6.4 Frame caching & lazy decoding
Covered in depth in §4.2 — this is the single most important performance decision in this entire document. Restating briefly: bounded LRU cache for lazy video frames, real materialization only on edit, eviction re-decodes from source rather than from a "everything held in RAM" assumption.

### 6.5 Chunked processing + progress reporting
Video conversion of a long clip should process in chunks (e.g. 30 frames at a time), yielding control back and reporting progress (`onProgress(current, total)`), with a **cancel** affordance. A user should never be stuck watching a frozen "Converting..." with no way out. This also naturally enables the worker to be interrupted between chunks rather than needing to abort mid-frame.

### 6.6 Memory management summary
| Data | Strategy |
|---|---|
| `drawn` frame pixels | Always in memory (this is the user's actual work) |
| `video` frame pixels | LRU-cached, evictable, re-decodable from source |
| Undo history | Already diff-based (existing architecture) — keep this discipline, it matters more as canvases grow |
| Source video/image files | Keep the original file (or an `ImageBitmap`/decoder handle) only as long as needed for re-decoding lazy frames; consider allowing the user to explicitly "detach" a video source (bake everything, discard the original) to reclaim memory once they're done referencing it |

### 6.7 History optimization for large operations
A "convert 300 video frames" action should be **one undoable step** (add/remove the whole batch of frames), not 300 individual Commands. Structural batch operations like this should get a `BatchCommand` wrapper — a Command whose `execute()`/`undo()` operate on a list of frame insertions/removals as one atomic unit. This is a natural, small extension of the existing Command pattern, not a new system.

---

## 7. File Format — versioned, and honest about its limits

### 7.1 Extend `.pxls`, don't replace it
The existing zip-based format (`manifest.json` + `palette.json` + per-layer-per-frame PNGs) is the right foundation — it's inspectable, debuggable, and already works. Extend it:
```
project.pxls (zip)
├── manifest.json       # add: schemaVersion, tool settings, groups, media refs
├── palette.json
├── history.json        # OPTIONAL — see 7.3
├── media/
│   └── source-video-1.mp4   # original source, if user chooses to keep it embedded
└── frames/
    └── frame-{f}-layer-{l}.png
```

Add a `schemaVersion` field to `manifest.json` from day one, even though there's only one version today — this is the cheapest possible future-proofing move, and its absence is the single most common regret in every versioned file format's history (PSD, and even early SQLite, both had version-detection pain that a version field from day one would have avoided).

### 7.2 The honest limitation: this format does not scale to video-derived projects
A project with 1,000 lazy video frames, if every one gets materialized into a PNG for export, produces a 1,000-file zip — this works but is unwieldy (large, slow to write/read). Recommended approach: **for lazy `video` frames, the exported file stores the media reference + timestamp, not a baked PNG**, and re-decodes on import (assuming the source video is embedded or re-linked). Only `drawn` frames (including ones "baked" from video by editing) get the PNG treatment. This keeps exported files small for the common case and only grows for frames the user actually touched.

### 7.3 History serialization — recommend NOT persisting undo history in the file, for now
PSD/Krita don't reliably persist infinite undo across save/load either, for good reason: it's a lot of data for uncertain value, and it couples your file format tightly to your exact Command implementation (making future Command changes a compatibility hazard). Recommend: undo history lives only in the live session (as today). Revisit only if real user demand shows up.

### 7.4 Groups
Not built today. When they are, they're a straightforward extension: a `Group` is a named collection of layer ids with its own opacity/visibility, and the compositor treats a group as "composite these layers together first, then treat the result like a single layer." Mentioning this now only so the manifest's `layers` array should probably become `layers: [...], groups: [...]` (flat list + membership) rather than a nested tree, since flat-with-membership is easier to reason about for undo/redo later than a nested tree structure would be.

---

## 8. Plugin System — lock the contracts now, defer the sandbox

### 8.1 What to do now: formalize interfaces that already exist informally
You already have exactly the right shape from the original build: a `Tool` interface (`onPointerDown/Move/Up`), a `Command` interface (`execute/undo`), and now (§3.2) a registrable algorithm pattern for quantization/dithering. Formalize these as documented, stable contracts:
```
PluginAPI (conceptual, v0 — no runtime yet)
├── registerTool(toolDefinition)
├── registerCommand(commandClass)         // rare — most plugins won't need this
├── registerImageFilter(filterFn)
├── registerImporter(mimeTypes, importFn)
├── registerExporter(format, exportFn)
├── registerPaletteGenerator(generatorFn)
└── registerTimelineAction(actionDefinition)
```
None of this needs a plugin *runtime* (sandboxing, permissions, marketplace) to be valuable right now — writing your *own* built-in features against these same interfaces (which §3.2 already does for image filters) is what proves the contracts are right, cheaply, before any third party ever touches them.

### 8.2 What to defer: sandboxing and distribution
When real third-party plugins are actually being built, the sandboxing decision (Web Worker isolation vs. iframe isolation vs. a restricted-capability JS subset) deserves its own dedicated design pass informed by what plugins people actually want to write. Deciding it now, speculatively, is more likely to guess wrong than to save time.

---

## 9. Module / Folder Organization (extending the existing monorepo)

```
packages/
├── engine/                      # unchanged in spirit — Document, Command, HistoryManager
├── media-pipeline/               # NEW
│   └── src/
│       ├── image/                # §3.2 breakdown
│       ├── video/
│       │   ├── decode/
│       │   │   ├── webcodecs.js
│       │   │   └── videoElementFallback.js
│       │   ├── frameCache.js      # LRU cache, §4.2/§6.4
│       │   └── pipeline.js
│       └── workers/
│           ├── imageConvert.worker.js
│           └── videoConvert.worker.js
├── file-formats/                 # extend existing .pxls read/write (§7)
├── plugin-sdk/                   # formalize contracts (§8), no runtime yet
└── shared-utils/
```

`apps/web` gains wizard-style UI components for the conversion flows (`ImageImportWizard`, `VideoImportWizard`), following the same presentational-component-plus-Editor-owns-state pattern already established.

---

## 10. State Management Strategy for Conversion Flows

Conversion wizards are inherently multi-step, stateful, and cancelable — a good fit for a small dedicated state machine per wizard (even a simple hand-rolled one: `states = ['selecting-file', 'previewing', 'adjusting', 'converting', 'done', 'error']`), rather than folding this into `Editor`'s already-large state. Recommend: each wizard is a **self-contained component with its own local state**, which only calls up into `Editor` once, at the very end, with a finished `Document` (or layer/frames) to insert — exactly mirroring how `NewProjectDialog` already hands off a finished decision to `Editor` today. Don't grow `Editor`'s state surface for multi-step wizard internals.

---

## 11. Risks — stated plainly

- **Memory/performance risk (video pipeline):** the single biggest technical risk in this whole document. §4.2's lazy-frame design is my strong recommendation specifically because the naive approach *will* fail on real footage.
- **Browser API maturity risk:** WebCodecs, WebGPU support varies and moves quickly. Building capability-detected fallbacks (§4.3, §5.2) is the mitigation, but it's real ongoing maintenance surface, not a one-time cost.
- **Scope risk:** the full vision (§0) is large enough that indefinite feature-creep is a bigger threat to shipping than any technical unknown. Recommend treating this document's phase boundaries as real gates.
- **File format lock-in risk:** shipping `.pxls` v1 publicly before adding `schemaVersion` (§7.1) means real user files exist that are harder to migrate later. Add the version field before or during Phase 2, not after.

---

## 12. Summary Roadmap (informed by this document)

| Phase | Scope | Depends on |
|---|---|---|
| 2 | Image Conversion Pipeline (§3) | Existing engine only |
| 2.5 | `schemaVersion` + manifest extensions (§7.1) | Nothing — do this early, it's cheap |
| 3 | Video Conversion Pipeline + lazy frame architecture (§4) | Phase 2's image pipeline (reused per-frame), Web Worker + OffscreenCanvas discipline (§6) |
| 3.5 | Render-pass compositor refactor (§5.1) | Motivated by, but not strictly blocking, Phase 3 |
| 4+ | Cameras, lighting, particles, audio, plugin runtime, marketplace | Vision only — not scheduled |

This is a genuinely ambitious, coherent direction, and the existing engine's discipline (Command pattern, diff-based undo, presentational components) will carry forward cleanly into it. The one design decision I'd treat as truly load-bearing and worth getting right *before* writing video-pipeline code is §4.2 — lazy frame references with bounded caching. Everything else in this document can be adjusted later without a rewrite; that one can't.
