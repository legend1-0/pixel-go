# Pixel Art Studio — User Guide

## Getting Started
When you open the app, you'll either see a **Resume Previous Project** option (if you have a recent autosaved session) or the **New Project** screen, where you pick a canvas size (quick presets: 16×16, 32×32, 64×64, 128×128, or a custom width/height).

## Tools & Keyboard Shortcuts

| Key | Tool |
|---|---|
| `P` | Pencil |
| `E` | Eraser |
| `I` | Eyedropper (Color Picker) |
| `B` | Bucket Fill |
| `L` | Line |
| `C` | Circle |
| `R` | Rectangle |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Y` or `Ctrl/Cmd + Shift + Z` | Redo |
| Scroll wheel / two-finger scroll | Zoom |
| `Shift` + drag | Pan |

## Drawing
Click and drag with Pencil or Eraser to draw or erase. Fast strokes are automatically connected (no gaps), even at high speed.

## Color & Palette
Click the color swatch to pick any color. Use the Eyedropper (`I`) to sample a color already on the canvas. Save colors you use often to your Palette with **+ Save Current Color** — click a saved swatch to use it, double-click to remove it.

## Layers
Each frame has its own independent set of layers.
- **+ Add Layer** — adds a new blank layer above the current one
- **✕** — deletes a layer (you can't delete the last one)
- **Visible checkbox** — toggle a layer on/off
- **Opacity slider** — blend a layer's transparency

## Animation
- **+ Add Frame** — adds a new blank frame
- **Duplicate** — copies a frame (and all its layers) exactly, as a new independent frame
- **Delete** — removes a frame (you can't delete the last one)
- **Onion Skin** — shows a faint blue ghost of the previous frame and orange ghost of the next frame, to help line up motion
- **▶ Play / ⏸ Pause** — plays back your frames in sequence, honoring each frame's timing

## Exporting
- **Export PNG** — the current frame as a single image
- **Export Sprite Sheet** — all frames laid out in one horizontal strip
- **Export GIF** — an animated GIF of all frames
- **Export APNG** — an animated PNG (preserves full transparency, unlike GIF)
- **Export Project File (.pxls)** — your entire project (all frames, layers, palette), fully re-editable when reimported

## Importing
- **Import PNG** — brings a PNG in as a new layer (must exactly match your canvas size)
- **Import Project File (.pxls)** — reopens a full project exactly as it was exported

## Autosave
Your work saves automatically every few seconds. If you close or refresh the browser, you'll be offered the chance to resume where you left off next time you open the app.
