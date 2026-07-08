// packages/engine/src/commands/LineCommand.js
import { Command } from './Command.js';

/**
 * Draws a straight line between two points using Bresenham's algorithm,
 * recording every changed pixel so it can be undone as one action.
 */
class LineCommand extends Command {
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

  execute(document) {
    const pixels = this.layer.pixels;
    this.changes = [];

    const dx = Math.abs(this.x1 - this.x0);
    const dy = Math.abs(this.y1 - this.y0);
    const sx = this.x1 >= this.x0 ? 1 : -1;
    const sy = this.y1 >= this.y0 ? 1 : -1;
    let x = this.x0;
    let y = this.y0;
    let err = dx - dy;

    while (true) {
      if (x >= 0 && y >= 0 && x < this.width && y < this.height) {
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

      if (x === this.x1 && y === this.y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
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

export { LineCommand };