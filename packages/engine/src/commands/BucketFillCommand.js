// packages/engine/src/commands/BucketFillCommand.js
import { Command } from './Command.js';

/**
 * Flood-fills a connected region of matching-color pixels with a new color,
 * starting from (x, y). Uses an iterative stack-based approach to avoid
 * recursion depth limits on large fills.
 */
class BucketFillCommand extends Command {
  /**
   * @param {object} layer
   * @param {number} startX
   * @param {number} startY
   * @param {number} width - layer width
   * @param {number} height - layer height
   * @param {[number, number, number, number]} newColor
   */
  constructor(layer, startX, startY, width, height, newColor) {
    super();
    this.layer = layer;
    this.startX = startX;
    this.startY = startY;
    this.width = width;
    this.height = height;
    this.newColor = newColor;
    this.changes = []; // [{ index, oldColor }] — filled in during execute()
  }

  getPixel(pixels, x, y) {
    const index = (y * this.width + x) * 4;
    return [pixels[index], pixels[index + 1], pixels[index + 2], pixels[index + 3]];
  }

  colorsMatch(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
  }

  execute(document) {
    const pixels = this.layer.pixels;
    const targetColor = this.getPixel(pixels, this.startX, this.startY);

    // if the clicked pixel is already the new color, there's nothing to do
    if (this.colorsMatch(targetColor, this.newColor)) return;

    this.changes = [];
    const visited = new Set();
    const stack = [[this.startX, this.startY]];

    while (stack.length > 0) {
      const [x, y] = stack.pop();
      if (x < 0 || y < 0 || x >= this.width || y >= this.height) continue;

      const key = `${x},${y}`;
      if (visited.has(key)) continue;
      visited.add(key);

      const currentColor = this.getPixel(pixels, x, y);
      if (!this.colorsMatch(currentColor, targetColor)) continue;

      const index = (y * this.width + x) * 4;
      this.changes.push({ index, oldColor: currentColor });

      pixels[index] = this.newColor[0];
      pixels[index + 1] = this.newColor[1];
      pixels[index + 2] = this.newColor[2];
      pixels[index + 3] = this.newColor[3];

      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
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

export { BucketFillCommand };