# Pixel Art Studio

An open-source, browser-based pixel art editor for indie game developers, pixel artists, and game jam participants — built to eventually be "the Figma of pixel art."

## Status
Core editor complete: drawing tools, layers, animation, and a full export/import pipeline are functional. See `docs/ARCHITECTURE.md` for implementation details and `docs/USER_GUIDE.md` for how to use it.

## Features
- Pixel-perfect canvas with zoom/pan
- Pencil, Eraser, Bucket Fill, Line, Rectangle, Circle tools
- Color Picker + Eyedropper, custom Palette Manager
- Diff-based Undo/Redo (effectively infinite history)
- Multi-layer support (opacity, visibility)
- Animation: multiple frames, duplication, onion skinning, playback
- Export: PNG, Sprite Sheet, GIF, APNG, full Project File (.pxls)
- Import: PNG, Project File (.pxls)
- Autosave (IndexedDB) with resume-on-load

## Getting Started
```bash
npm install
cd apps/web
npm run dev
```

**Note:** GIF export requires `gif.worker.js` to exist at `apps/web/public/gif.worker.js` (copied manually from `node_modules/gif.js/dist/gif.worker.js` at the project root after install — see `docs/ARCHITECTURE.md` section 6).

## Tech Stack
React, Vite, Canvas2D, npm workspaces monorepo, `idb` (IndexedDB), `gif.js`, `upng-js`, `JSZip`.

## Architecture
See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full design and [docs/ADRs/](docs/ADRs/) for individual decisions.

## Scope
Targets tablet-and-up viewports (≈768px minimum width). Phone support is explicitly out of scope for now — see ADR 0005.
