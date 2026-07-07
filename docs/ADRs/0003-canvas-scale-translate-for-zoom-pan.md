# ADR 0003: Use ctx.scale()/ctx.translate() for Zoom/Pan

Date: 2026-07-07

## Context
Pixel data must stay at its real resolution (e.g. 32x32) regardless of how
zoomed in/out the user is, so editing stays pixel-perfect.

## Decision
The canvas viewport never resizes or recalculates pixel data for zoom/pan.
Instead, ctx.translate() and ctx.scale() are applied before drawing, so all
drawing code always works in real pixel coordinates (0 to width/height),
and the browser handles the visual scaling/positioning.

## Consequences
- Drawing logic (grid rendering, later: tools) never needs to know about
  zoom/pan state at all — it just draws at real coordinates.
- Converting screen mouse position to grid coordinates for tools will need
  to account for current zoom/pan (upcoming, for the Pencil tool).