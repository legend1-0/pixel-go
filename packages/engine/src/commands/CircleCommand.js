// packages/engine/src/commands/CircleCommand.js
import { Command } from './Command.js';

/**
 * Draws a circle outline centered at (centerX, centerY) with the given
 * radius, using the midpoint circle algorithm. Records every changed
 * pixel so it can be undone as one action.
 */
class CircleCommand extends Command {
  constructor(layer, centerX, centerY, radius, width, height, color) {
    super();
    this.layer = layer;
    this.centerX = centerX;
    this.centerY = centerY;
    this.radius = radius;
    this.width = width;
    this.height = height;
    this.color = color;
    this.changes = [];
  }

  setPixel(pixels, x, y, visited) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const key = `${x},${y}`;
    if (visited.has(key)) return; // avoid double-recording the same pixel twice
    visited.add(key);

    const index = (y * this.width + x) * 4;
    this.changes.push({
      index,
      oldColor: [pixels[index], pixels[index + 1], pixels[index + 2], pixels[index + 3]],
    });
    pixels[index] = this.color[0];
    pixels[index + 1] = this.color[1];
    pixels[index + 2] = this.color[2];
    pixels[index + 3] = this.color[3];
  }

  execute(document) {
    const pixels = this.layer.pixels;
    this.changes = [];
    const visited = new Set();

    const cx = this.centerX;
    const cy = this.centerY;
    let x = this.radius;
    let y = 0;
    let err = 0;

    while (x >= y) {
      // 8-way symmetry: plot all 8 mirrored points for this (x, y)
      this.setPixel(pixels, cx + x, cy + y, visited);
      this.setPixel(pixels, cx + y, cy + x, visited);
      this.setPixel(pixels, cx - y, cy + x, visited);
      this.setPixel(pixels, cx - x, cy + y, visited);
      this.setPixel(pixels, cx - x, cy - y, visited);
      this.setPixel(pixels, cx - y, cy - x, visited);
      this.setPixel(pixels, cx + y, cy - x, visited);
      this.setPixel(pixels, cx + x, cy - y, visited);

      y += 1;
      if (err <= 0) {
        err += 2 * y + 1;
      }
      if (err > 0) {
        x -= 1;
        err -= 2 * x + 1;
      }
    }
  }

  undo(document) {
    const pixels = this.layer.pixels;
    for (const { index, oldColor } of this.changes) {
      pixels[index] = oldColor[0];
      pixels[index + 1] = oldColor[1];
      pixels[index + 2] = oldColor[2];
      pixels[index + 3] = oldColor[3];
    }
  }
}

export { CircleCommand };