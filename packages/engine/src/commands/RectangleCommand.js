// packages/engine/src/commands/RectangleCommand.js
import { Command } from './Command.js';

/**
 * Draws a rectangle outline between two corner points.
 * Records every changed pixel so it can be undone as one action.
 */
class RectangleCommand extends Command {
  constructor(layer, x0, y0, x1, y1, width, height, color) {
    super();
    this.layer = layer;
    this.x0 = x0;
    this.y0 = y0;
    this.x1 = x1;
    this.y1 = y1;
    this.width = width;
    this.height = height;
    this.color = color;
    this.changes = [];
  }

  setPixel(pixels, x, y, visited) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const key = `${x},${y}`;
    if (visited.has(key)) return;
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

    const minX = Math.min(this.x0, this.x1);
    const maxX = Math.max(this.x0, this.x1);
    const minY = Math.min(this.y0, this.y1);
    const maxY = Math.max(this.y0, this.y1);

    // top and bottom edges
    for (let x = minX; x <= maxX; x++) {
      this.setPixel(pixels, x, minY, visited);
      this.setPixel(pixels, x, maxY, visited);
    }
    // left and right edges
    for (let y = minY; y <= maxY; y++) {
      this.setPixel(pixels, minX, y, visited);
      this.setPixel(pixels, maxX, y, visited);
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

export { RectangleCommand };