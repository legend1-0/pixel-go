// packages/engine/src/commands/DrawPixelCommand.js
import { Command } from './Command.js';

/**
 * Sets a single pixel's color in a layer, and remembers the previous
 * color so it can be undone.
 */
class DrawPixelCommand extends Command {
  /**
   * @param {object} layer - the layer whose pixels array will be modified
   * @param {number} x - grid x coordinate
   * @param {number} y - grid y coordinate
   * @param {number} width - layer width, needed to compute the pixel index
   * @param {[number, number, number, number]} color - [r, g, b, a]
   */
  constructor(layer, x, y, width, color) {
    super();
    this.layer = layer;
    this.index = (y * width + x) * 4;
    this.newColor = color;
    this.oldColor = null; // captured at execute() time
  }

  execute(document) {
    const pixels = this.layer.pixels;
    this.oldColor = [
      pixels[this.index],
      pixels[this.index + 1],
      pixels[this.index + 2],
      pixels[this.index + 3],
    ];
    pixels[this.index] = this.newColor[0];
    pixels[this.index + 1] = this.newColor[1];
    pixels[this.index + 2] = this.newColor[2];
    pixels[this.index + 3] = this.newColor[3];
  }

  undo(document) {
    const pixels = this.layer.pixels;
    pixels[this.index] = this.oldColor[0];
    pixels[this.index + 1] = this.oldColor[1];
    pixels[this.index + 2] = this.oldColor[2];
    pixels[this.index + 3] = this.oldColor[3];
  }
}

export { DrawPixelCommand };